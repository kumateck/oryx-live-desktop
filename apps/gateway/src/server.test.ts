import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { io, type Socket } from "socket.io-client";
import type { Verified } from "./auth.ts";
import { createGateway } from "./server.ts";

const ama = "01a080c6-876a-74ca-beda-6c3dfbdc053c";
const kofi = "01a080c6-87a4-76b7-bf17-80f89f184ad6";
const path = "/realtime/socket.io";
const tokens: Record<string, string> = { "token-for-ama-000000000": ama, "token-for-kofi-00000000": kofi };

async function start(verify: (token: unknown) => Promise<Verified> = async (token) => typeof token === "string" && tokens[token] ? { ok: true, userId: tokens[token] } : { ok: false, reason: "rejected" }, recheckMs = 60_000) {
  const gateway = createGateway({ verify, allowedOrigins: ["http://127.0.0.1"], socketPath: path, healthy: () => true, recheckMs });
  await new Promise<void>((resolve) => gateway.http.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(gateway.http.address() as AddressInfo).port}`;
  const sockets: Socket[] = [];
  const connect = (token?: string, listen?: (socket: Socket) => void) => new Promise<Socket>((resolve, reject) => {
    const socket = io(url, { path, transports: ["websocket"], reconnection: false, auth: token ? { token } : {} });
    sockets.push(socket);
    listen?.(socket);
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  });
  return { gateway, url, connect, stop: async () => { for (const socket of sockets) socket.close(); await gateway.close(); } };
}
const received = (socket: Socket, event: string) => { const seen: unknown[] = []; socket.on(event, (payload) => seen.push(payload)); return seen; };
const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

test("a notification reaches every session of its recipient and nobody else", async () => {
  const { gateway, connect, stop } = await start();
  try {
    const [first, second, other] = await Promise.all([connect("token-for-ama-000000000"), connect("token-for-ama-000000000"), connect("token-for-kofi-00000000")]);
    const seen = [received(first, "notification"), received(second, "notification"), received(other, "notification")];
    const payload = { message: "Shipment SD-1 has arrived", type: 2, sentAt: "2026-10-02T09:00:00Z" };
    gateway.deliver({ recipients: [ama], payload });
    await settle();
    assert.deepEqual(seen, [[payload], [payload], []]);
  } finally { await stop(); }
});

test("a board update reaches every signed-in client", async () => {
  const { gateway, connect, stop } = await start();
  try {
    const [first, other] = await Promise.all([connect("token-for-ama-000000000"), connect("token-for-kofi-00000000")]);
    const seen = [received(first, "activity-updated"), received(other, "activity-updated")];
    const update = { activityId: ama, stepId: null, status: 2, changedAt: null };
    gateway.announce(update);
    await settle();
    assert.deepEqual(seen, [[update], [update]]);
  } finally { await stop(); }
});

test("a client without a token the backend accepts is not connected", async () => {
  const { gateway, connect, url, stop } = await start();
  try {
    await assert.rejects(connect(), /unauthorized/);
    await assert.rejects(connect("a-token-nobody-issued-00"), /unauthorized/);
    assert.equal((await fetch(`${url}/realtime/health`)).status, 200);
    // Nothing is delivered to a socket that never got in.
    gateway.deliver({ recipients: [ama], payload: { message: "x", type: null, sentAt: null } });
  } finally { await stop(); }
});

test("a backend that cannot be reached is reported as unavailable, not as a bad sign-in", async () => {
  const { connect, stop } = await start(async () => ({ ok: false, reason: "unavailable" }));
  try { await assert.rejects(connect("token-for-ama-000000000"), /unavailable/); } finally { await stop(); }
});

test("a client whose token stops being accepted is disconnected", async () => {
  let accepted = true;
  const { connect, stop } = await start(async () => accepted ? { ok: true, userId: ama } : { ok: false, reason: "rejected" }, 50);
  try {
    const socket = await connect("token-for-ama-000000000");
    const gone = new Promise<string>((resolve) => socket.once("disconnect", resolve));
    accepted = false;
    assert.equal(await gone, "io server disconnect");
  } finally { await stop(); }
});

test("broker availability is synchronized to connected authenticated sessions", async () => {
  const { gateway, connect, stop } = await start();
  try {
    const states: unknown[] = [];
    const socket = await connect("token-for-ama-000000000", (opened) => opened.on("delivery-state", (payload) => states.push(payload)));
    gateway.availability(false); gateway.availability(true);
    await settle();
    assert.deepEqual(states, [{ connected: true }, { connected: false }, { connected: true }]);
  } finally { await stop(); }
});

test("read state refreshes only the recipient's sessions", async () => {
  const { gateway, connect, stop } = await start();
  try {
    const first = await connect("token-for-ama-000000000"), other = await connect("token-for-kofi-00000000");
    const own = received(first, "notification-read"), theirs = received(other, "notification-read");
    gateway.read({ userId: ama, notificationId: kofi }); await settle();
    assert.deepEqual(own, [{ notificationId: kofi }]); assert.deepEqual(theirs, []);
  } finally { await stop(); }
});
