import test from "node:test";
import assert from "node:assert/strict";
import { isSitePage, reconnectSite } from "../apps/desktop/src/site-navigation.ts";

test("reconnect reloads the current customer page without navigating home", () => {
  const address = "https://oryx.example/production/activities/a1/final-packing?tab=yield#results";
  let reloads = 0;
  let opens = 0;
  reconnectSite("https://oryx.example", { getURL: () => address, reload: () => { reloads += 1; } }, () => { opens += 1; });
  assert.equal(reloads, 1);
  assert.equal(opens, 0);
});

test("reconnect opens the configured site from setup or a failed load", () => {
  for (const address of ["file:///app/connection.html", "chrome-error://chromewebdata/", "", "http://localhost:4000/connection"]) {
    let reloads = 0;
    let opens = 0;
    reconnectSite("https://oryx.example", { getURL: () => address, reload: () => { reloads += 1; } }, () => { opens += 1; });
    assert.equal(reloads, 0);
    assert.equal(opens, 1);
  }
});

test("matches the exact connected origin rather than a URL prefix", () => {
  assert.equal(isSitePage("http://oryx-server:8080", "http://oryx-server:8080/settings/users?search=Ada"), true);
  for (const address of ["https://oryx.example.evil/", "https://oryx.example@evil.example/", "https://user:password@oryx.example/",
    "http://oryx.example/home", "https://oryx.example:8443/home", "javascript:alert(1)"]) {
    assert.equal(isSitePage("https://oryx.example", address), false);
  }
  assert.equal(isSitePage("", "https://oryx.example/"), false);
});
