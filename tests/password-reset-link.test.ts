import assert from "node:assert/strict";
import test from "node:test";
import { desktopPasswordResetLink, parseDesktopPasswordReset, passwordResetPage } from "../shared/password-reset-link.ts";
import { desktopInput } from "../scripts/testing-desktop-changes.ts";

const key = "6f9619ff-8b86-4011-b42d-00c04fc964ff";

test("reset handoffs round-trip HTTPS and intranet HTTP without accepting arbitrary navigation", () => {
  for (const origin of ["https://erp.example", "http://10.0.0.5:3001"]) {
    const address = desktopPasswordResetLink(origin, key);
    assert.ok(address);
    const parsed = parseDesktopPasswordReset(address);
    assert.deepEqual(parsed, { origin, key });
    assert.ok(parsed);
    const page = passwordResetPage(parsed, origin);
    assert.ok(page);
    assert.equal(new URL(page).origin, origin);
    assert.equal(new URL(page).pathname, "/reset-password");
    assert.equal(new URL(page).searchParams.get("key"), key);
    assert.equal(new URL(page).searchParams.get("desktop"), "1");
    assert.equal(passwordResetPage(parsed, "https://another.example"), null);
    assert.equal(passwordResetPage(parsed, ""), null);
  }
  assert.ok(desktopInput("shared/password-reset-link.ts"));
});

test("malformed, ambiguous and credential-bearing protocol links are refused", () => {
  const valid = desktopPasswordResetLink("https://erp.example", key);
  assert.ok(valid);
  for (const address of [valid.replace("oryx-live:", "https:"), valid.replace("reset-password?", "arbitrary-command?"),
    `${valid}&key=${key}`, `${valid}&site=https%3A%2F%2Fother.example`, `${valid}&path=/settings`, `${valid}#fragment`,
    valid.replace("reset-password?", "user:pass@reset-password?"), valid.replace("reset-password?", "reset-password:99?"),
    valid.replace(key, "bad"), valid.replace("reset-password?", "reset-password/other?"), "x".repeat(4097)]) {
    assert.equal(parseDesktopPasswordReset(address), null);
  }
  for (const site of ["file:///tmp/site", "javascript:alert(1)", "https://user:pass@erp.example", "https://erp.example/path",
    "https://erp.example?url=https://other.example", "https://erp.example/#fragment"]) {
    assert.equal(desktopPasswordResetLink(site, key), null);
  }
  assert.equal(desktopPasswordResetLink("https://erp.example", "bad-key"), null);
});
