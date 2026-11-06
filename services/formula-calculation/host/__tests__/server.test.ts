import { request as httpRequest } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import type { FormulaHostConfig } from "../config";
import type { FormulaHostExecutor } from "../contracts";
import { createFormulaHttpServer } from "../server";

const token = "t".repeat(32);
const config: FormulaHostConfig = {
  enabled: true, hostname: "127.0.0.1", port: 0, workloadToken: token,
  engineBuildHash: "a".repeat(64), numericPolicyVersion: "oryx-decimal-v1-half-up",
  maxRequestBytes: 1_024, concurrency: 1, deadlineMs: 1_000, maxCompiledDefinitions: 1,
};
let executed = 0;
const executor: FormulaHostExecutor = {
  execute: async () => { executed += 1; throw new Error("not used"); },
  isReady: () => true,
  metrics: () => ({ active: 0, capacity: 1 }),
  close: async () => undefined,
};

const servers: ReturnType<typeof createFormulaHttpServer>[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

const post = async (authorization: string | undefined, bytes: number): Promise<number> => {
  const server = createFormulaHttpServer(config, executor, () => undefined);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return new Promise((resolve, reject) => {
    const call = httpRequest({ host: "127.0.0.1", port, method: "POST", path: "/internal/formula/v1/validate",
      headers: { "content-type": "application/json", "content-length": bytes, ...(authorization ? { authorization } : {}) } },
    (response) => { response.resume(); resolve(response.statusCode ?? 0); });
    call.on("error", reject);
    call.end("x".repeat(bytes));
  });
};

describe("formula HTTP server", () => {
  it("rejects unauthenticated requests from headers without buffering an oversized body", async () => {
    expect(await post(undefined, 4_096)).toBe(401);
    expect(await post("Bearer wrong", 4_096)).toBe(401);
    expect(executed).toBe(0);
  });

  it("applies the size limit to authorized requests", async () => {
    expect(await post(`Bearer ${token}`, 4_096)).toBe(413);
  });
});
