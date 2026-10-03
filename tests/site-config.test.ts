import test from "node:test";
import assert from "node:assert/strict";
import { parseSiteUrl } from "../apps/desktop/src/site-config.ts";

test("normalizes a trusted customer server origin", () => {
  assert.equal(parseSiteUrl(" https://192.0.2.10:8443/ "), "https://192.0.2.10:8443");
});

test("rejects malformed addresses and unsupported protocols", () => {
  assert.throws(() => parseSiteUrl("192.0.2.10"), /complete server address/);
  assert.throws(() => parseSiteUrl("https://user:pass@192.0.2.10"), /only the server origin/);
  assert.throws(() => parseSiteUrl("https://192.0.2.10/app"), /only the server origin/);
  assert.throws(() => parseSiteUrl("https://192.0.2.10?token=secret"), /only the server origin/);
  assert.throws(() => parseSiteUrl("http://oryx-server/#home"), /only the server origin/);
  assert.throws(() => parseSiteUrl("ftp://oryx-server"), /HTTP or HTTPS/);
  assert.throws(() => parseSiteUrl("javascript:alert(1)"), /HTTP or HTTPS/);
  assert.throws(() => parseSiteUrl("file:///etc/passwd"), /HTTP or HTTPS/);
});

test("supports customer intranet HTTP origins without a development exception", () => {
  assert.equal(parseSiteUrl(" http://192.168.1.20:8080/ "), "http://192.168.1.20:8080");
  assert.equal(parseSiteUrl("http://10.0.0.20"), "http://10.0.0.20");
  assert.equal(parseSiteUrl("http://oryx-server/"), "http://oryx-server");
  assert.equal(parseSiteUrl("http://[fd00::1]:8080/"), "http://[fd00::1]:8080");
});

test("supports local frontend development and normalizes default ports", () => {
  assert.equal(parseSiteUrl("http://127.0.0.1:5173"), "http://127.0.0.1:5173");
  assert.equal(parseSiteUrl("http://localhost:80/"), "http://localhost");
  assert.equal(parseSiteUrl("https://oryx-server:443/"), "https://oryx-server");
});
