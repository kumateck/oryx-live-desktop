import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { contractDigest } from "../deploy/customer-server/data.ts";
import { localSwaggerOrigin, verifyApiConnectivity, verifySwaggerContract } from "../deploy/customer-docker/probe-checks.ts";

const contract = { openapi: "3.0.1", paths: {} };
const policy = { deploymentProtocol: 1, minimumShellVersion: "0.1.0", backendContracts: [contractDigest(contract)] };

test("application API connectivity accepts expected authorization responses without requesting Swagger", async () => {
  for (const status of [200, 401, 403]) {
    const calls: string[] = [];
    await verifyApiConnectivity("http://oryx_api:5001", { fetcher: async (input, init) => {
      calls.push(String(input)); assert.equal(init?.headers, undefined);
      return Response.json({}, { status });
    } });
    assert.deepEqual(calls, ["http://oryx_api:5001/api/v1/user/authenticated"]);
  }
});

test("Swagger uses a genuine configured loopback URL with no Host spoofing and a 60-second timeout", async (context) => {
  const original = AbortSignal.timeout;
  const deadlines: number[] = [];
  context.mock.method(AbortSignal, "timeout", (duration: number) => { deadlines.push(duration); return original(duration); });
  await verifySwaggerContract("http://127.0.0.1:8080", policy, { fetcher: async (input, init) => {
    assert.equal(String(input), "http://127.0.0.1:8080/swagger/v1/swagger.json");
    assert.equal(init?.headers, undefined); assert.equal(init?.redirect, "manual");
    return Response.json(contract);
  } });
  assert.deepEqual(deadlines, [60_000]);
});

test("API readiness and a denied Docker Swagger URL remain independent checks", async () => {
  await verifyApiConnectivity("http://oryx_api:5001", { fetcher: async () => new Response(null, { status: 401 }) });
  await assert.rejects(verifySwaggerContract("http://127.0.0.1:8080", policy, { fetcher: async () => new Response(null, { status: 401 }) }), /\[Swagger:http\].*HTTP 401/);
  await assert.rejects(verifySwaggerContract("http://127.0.0.1:8080", policy, { fetcher: async () => new Response(null, { status: 302, headers: { Location: "http://elsewhere.test" } }) }), /\[Swagger:http\].*HTTP 302/);
});

test("Swagger rejects nonlocal origins and credentials before making a request", async () => {
  assert.equal(localSwaggerOrigin("http://127.0.0.1:8080"), "http://127.0.0.1:8080");
  assert.equal(localSwaggerOrigin("https://localhost:8443"), "https://localhost:8443");
  assert.equal(localSwaggerOrigin("http://[::1]:8080"), "http://[::1]:8080");
  for (const origin of ["http://oryx_api:5001", "http://example.test", "http://user:password@127.0.0.1:8080", "http://127.0.0.1:8080/swagger"]) {
    let called = false;
    await assert.rejects(verifySwaggerContract(origin, policy, { fetcher: async () => { called = true; return Response.json(contract); } }));
    assert.equal(called, false);
  }
});

test("Swagger connection, JSON and fingerprint failures retain distinct actionable diagnostics", async () => {
  await assert.rejects(verifySwaggerContract("http://127.0.0.1:8080", policy, { fetcher: async () => { throw new TypeError("fetch failed", { cause: { code: "ECONNREFUSED" } }); } }), /\[Swagger:connection\].*ECONNREFUSED/);
  for (const body of ["<html>Sign in</html>", "{", "[]", '{"openapi":"3.0.1"}']) {
    await assert.rejects(verifySwaggerContract("http://127.0.0.1:8080", policy, { fetcher: async () => new Response(body) }), /\[Swagger:json\]/);
  }
  await assert.rejects(verifySwaggerContract("http://127.0.0.1:8080", { ...policy, backendContracts: ["0".repeat(64)] }, { fetcher: async () => Response.json(contract) }), new RegExp(`\\[Swagger:fingerprint\\].*${contractDigest(contract)}.*not approved`));
});

function stalledFetch(body: boolean): typeof fetch {
  return async (_input, init) => {
    const signal = init?.signal;
    if (!signal) throw new Error("Timeout signal missing");
    if (!body) return new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => resolve(Response.json(contract)), 1000);
      signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Request aborted", "AbortError")); }, { once: true });
    });
    return new Response(new ReadableStream<Uint8Array>({ start(controller) {
      const timer = setTimeout(() => { controller.enqueue(new TextEncoder().encode(JSON.stringify(contract))); controller.close(); }, 1000);
      signal.addEventListener("abort", () => { clearTimeout(timer); controller.error(new DOMException("Body aborted", "AbortError")); }, { once: true });
    } }));
  };
}

test("the Swagger timeout covers both connection/header wait and the full response body", async () => {
  for (const body of [false, true]) {
    await assert.rejects(verifySwaggerContract("http://127.0.0.1:8080", policy, { fetcher: stalledFetch(body), timeoutMs: 10 }), /\[Swagger:timeout\].*exceeded 0.01s/);
  }
});

test("a local HTTP fixture observes the real loopback Host while the API can remain protected", async () => {
  const seen: { path: string; host: string | undefined }[] = [];
  const server = createServer((request, response) => {
    seen.push({ path: request.url ?? "", host: request.headers.host });
    response.setHeader("Content-Type", "application/json");
    response.statusCode = request.url?.startsWith("/api/") ? 401 : 200;
    response.end(JSON.stringify(contract));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("HTTP fixture did not bind");
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    await verifyApiConnectivity(origin);
    await verifySwaggerContract(origin, policy);
    assert.deepEqual(seen, [
      { path: "/api/v1/user/authenticated", host: `127.0.0.1:${address.port}` },
      { path: "/swagger/v1/swagger.json", host: `127.0.0.1:${address.port}` },
    ]);
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
});
