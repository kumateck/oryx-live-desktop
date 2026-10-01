import test from "node:test";
import assert from "node:assert/strict";
import { parseSiteUrl } from "../apps/desktop/src/site-config.ts";

test("normalizes a trusted customer server origin", () => {
  assert.equal(parseSiteUrl(" https://192.0.2.10:8443/ "), "https://192.0.2.10:8443");
});

test("rejects insecure and malformed customer addresses", () => {
  assert.throws(() => parseSiteUrl("http://192.0.2.10"), /trusted HTTPS/);
  assert.throws(() => parseSiteUrl("192.0.2.10"), /complete server address/);
  assert.throws(() => parseSiteUrl("https://user:pass@192.0.2.10"), /only the server origin/);
  assert.throws(() => parseSiteUrl("https://192.0.2.10/app"), /only the server origin/);
});

test("permits localhost HTTP only in development", () => {
  assert.equal(parseSiteUrl("http://127.0.0.1:5173", true), "http://127.0.0.1:5173");
  assert.throws(() => parseSiteUrl("http://127.0.0.1:5173"), /trusted HTTPS/);
  assert.throws(() => parseSiteUrl("http://192.0.2.10", true), /trusted HTTPS/);
});
