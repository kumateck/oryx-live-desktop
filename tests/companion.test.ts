import test from "node:test";
import assert from "node:assert/strict";
import { clampPlacement, validSummary, visiblePanelHeight } from "../apps/desktop/src/companion/placement.ts";

test("keeps the companion inside negative-origin and small display work areas", () => {
  assert.deepEqual(clampPlacement({ x: -3000, y: 900 }, { x: -1920, y: 0, width: 1920, height: 1080 }), { x: -1920, y: 872 });
  assert.deepEqual(clampPlacement({ x: 3000, y: 2000 }, { x: 0, y: 0, width: 1280, height: 720 }), { x: 1104, y: 512 });
  assert.deepEqual(clampPlacement({ x: 0, y: 0 }, { x: 20, y: 30, width: 100, height: 100 }), { x: 20, y: 30 });
});
test("alert card starts compact and expands to a bounded feed", () => {
  assert.equal(visiblePanelHeight(22, false), 32);
  assert.equal(visiblePanelHeight(22, true), 200);
  assert.equal(visiblePanelHeight(0, true), 90);
});
test("summary validation rejects invalid counts and missing states", () => {
  assert.equal(validSummary({ unread: 12, connected: true, signedIn: true }), true);
  for (const unread of [-1, 1.5, NaN, Infinity, 1000001, "3"]) assert.equal(validSummary({ unread, connected: true, signedIn: true }), false);
  assert.equal(validSummary({ unread: 0, connected: true }), false);
  assert.equal(validSummary({ unread: 0, connected: "yes", signedIn: true }), false);
});

test("caption metadata is bounded and cannot smuggle invalid priorities", () => {
  const summary = { unread: 2, connected: true, signedIn: true };
  assert.equal(validSummary({ ...summary, alerts: [{ id: "n1", label: "Expired material", message: "Expired", type: 15, priority: 3 }] }), true);
  for (const priority of [-1, 1.2, 5, "High"]) assert.equal(validSummary({ ...summary, alerts: [{ id: "n1", label: "Expired material", message: "Expired", type: 15, priority }] }), false);
  assert.equal(validSummary({ ...summary, alerts: [{ id: "n1", label: "x".repeat(81), message: "x", type: 15, priority: 0 }] }), false);
});
