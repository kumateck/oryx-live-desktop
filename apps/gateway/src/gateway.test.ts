import assert from "node:assert/strict";
import { test } from "node:test";
import { createVerifier } from "./auth.ts";
import { readConfig } from "./config.ts";
import { readBoardUpdate, readNotification, userRoom } from "./messages.ts";

const user = "01A080C6-876A-74CA-BEDA-6C3DFBDC053C";
const other = "01a080c6-87a4-76b7-bf17-80f89f184ad6";

test("a notification goes only to its recipients, and never without them", () => {
  const envelope = JSON.stringify({ messageId: "x", message: { id: "n1", message: " Shipment SD-1 has arrived ", type: 2, sentAt: "2026-10-02T09:00:00Z", recipients: [{ id: user, email: "a@b.c" }, other, { id: "not-a-guid" }, { id: user }] } });
  assert.deepEqual(readNotification(envelope), { recipients: [user.toLowerCase(), other], payload: { message: "Shipment SD-1 has arrived", type: 2, sentAt: "2026-10-02T09:00:00Z" } });
  // The recipients' details are not passed on to clients.
  assert.equal(JSON.stringify(readNotification(envelope)?.payload).includes("a@b.c"), false);
  assert.equal(readNotification(JSON.stringify({ message: { message: "For nobody", recipients: [] } })), null);
  assert.equal(readNotification(JSON.stringify({ message: { message: "No list" } })), null);
  assert.equal(readNotification(JSON.stringify({ message: { recipients: [user] } })), null);
  assert.equal(readNotification("not json"), null);
  // A message published without the envelope is read the same way.
  assert.deepEqual(readNotification(Buffer.from(JSON.stringify({ message: "Plain", recipients: [user] })))?.recipients, [user.toLowerCase()]);
  assert.equal(userRoom(user), `user:${user.toLowerCase()}`);
});

test("a board update carries identifiers only", () => {
  assert.deepEqual(readBoardUpdate(JSON.stringify({ message: { productionActivityId: user, productionActivityStepId: other, status: 2, changedAt: "2026-10-02T09:00:00Z", updatedByUserId: other } })),
    { activityId: user.toLowerCase(), stepId: other, status: 2, changedAt: "2026-10-02T09:00:00Z" });
  assert.equal(readBoardUpdate(JSON.stringify({ message: { productionActivityId: "nope" } })), null);
});

test("the backend decides who a token belongs to", async () => {
  const token = "t".repeat(40);
  let calls = 0;
  let clock = 0;
  const respond = (status: number, body: unknown) => async (input: string, init: RequestInit) => {
    calls += 1;
    assert.equal(input, "https://erp.example.com/api/v1/user/authenticated");
    assert.equal((init.headers as Record<string, string>).Authorization, `Bearer ${token}`);
    return new Response(JSON.stringify(body), { status });
  };
  const verify = createVerifier({ apiOrigin: "https://erp.example.com", fetcher: respond(200, { id: user }), now: () => clock, rememberMs: 1000 });
  assert.deepEqual(await verify(token), { ok: true, userId: user.toLowerCase() });
  assert.deepEqual(await verify(token), { ok: true, userId: user.toLowerCase() });
  assert.equal(calls, 1, "a second check within the window does not ask the backend again");
  clock = 2000;
  await verify(token);
  assert.equal(calls, 2, "after the window the backend is asked again");
  assert.deepEqual(await createVerifier({ apiOrigin: "https://erp.example.com", fetcher: respond(401, {}) })(token), { ok: false, reason: "rejected" });
  assert.deepEqual(await createVerifier({ apiOrigin: "https://erp.example.com", fetcher: respond(500, {}) })(token), { ok: false, reason: "unavailable" });
  assert.deepEqual(await createVerifier({ apiOrigin: "https://erp.example.com", fetcher: async () => { throw new Error("offline"); } })(token), { ok: false, reason: "unavailable" });
  assert.deepEqual(await createVerifier({ apiOrigin: "https://erp.example.com", fetcher: respond(200, {}) })(token), { ok: false, reason: "rejected" });
  for (const bad of [undefined, 42, "", "short"]) assert.deepEqual(await verify(bad), { ok: false, reason: "rejected" });
});

test("the gateway refuses to start half-configured or open to every origin", () => {
  const env = { ORYX_API_ORIGIN: "https://erp.example.com", ORYX_GATEWAY_ALLOWED_ORIGINS: "https://erp.example.com, http://127.0.0.1:5173", RABBITMQ_HOST: "broker", RABBITMQ_DEFAULT_USER: "svc", RABBITMQ_DEFAULT_PASS: "p@ss/word" };
  const config = readConfig(env);
  assert.equal(config.port, 4100);
  assert.throws(() => readConfig({ ...env, RABBITMQ_HOST: "http://broker" }), /must be a host name/);
  assert.equal(readConfig({ ...env, SOCKET_PORT: "3002" }).port, 3002);
  assert.equal(readConfig({ ...env, SOCKET_PORT: "3002", ORYX_GATEWAY_PORT: "4200" }).port, 4200);
  assert.deepEqual(config.allowedOrigins, ["https://erp.example.com", "http://127.0.0.1:5173"]);
  assert.equal(config.brokerUrl, "amqp://svc:p%40ss%2Fword@broker");
  assert.throws(() => readConfig({ ...env, ORYX_GATEWAY_ALLOWED_ORIGINS: "*" }), /cannot be \*/);
  assert.throws(() => readConfig({ ...env, ORYX_API_ORIGIN: "http://10.0.0.5:8086" }), /must use HTTPS/);
  assert.equal(readConfig({ ...env, ORYX_API_ORIGIN: "http://10.0.0.5:8086", ORYX_GATEWAY_ALLOW_INSECURE: "1" }).apiOrigin, "http://10.0.0.5:8086");
  assert.throws(() => readConfig({ ...env, RABBITMQ_HOST: "" }), /RABBITMQ_HOST is not set/);
  assert.throws(() => readConfig({ ...env, ORYX_API_ORIGIN: undefined }), /ORYX_API_ORIGIN is not set/);
});

test("retains the persisted notification id for replay deduplication", () => {
  const id = "01a080c6-876a-74ca-beda-6c3dfbdc053c";
  const item = readNotification(JSON.stringify({ message: { id, message: "Review required", type: 13, recipients: [id] } }));
  assert.equal(item?.payload.id, id);
});
