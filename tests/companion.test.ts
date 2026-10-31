import test from "node:test";
import assert from "node:assert/strict";
import { clampPlacement, panelPosition, validSummary } from "../apps/desktop/src/companion/placement.ts";

test("keeps the companion inside negative-origin and small display work areas", () => {
  assert.deepEqual(clampPlacement({ x: -3000, y: 900 }, { x: -1920, y: 0, width: 1920, height: 1080 }), { x: -1920, y: 900 });
  assert.deepEqual(clampPlacement({ x: 3000, y: 2000 }, { x: 0, y: 0, width: 1280, height: 720 }), { x: 1104, y: 544 });
  assert.deepEqual(clampPlacement({ x: 0, y: 0 }, { x: 20, y: 30, width: 100, height: 100 }), { x: 20, y: 30 });
});
test("the alerts panel opens beside the companion and stays on screen", () => {
  const area = { x: 0, y: 0, width: 1440, height: 900 };
  // Bottom-right companion: panel above it, right-aligned.
  assert.deepEqual(panelPosition({ x: 1244, y: 704, width: 176, height: 176 }, { width: 376, height: 520 }, area), { x: 1044, y: 180 });
  // Top-left companion: panel below it, left-aligned.
  assert.deepEqual(panelPosition({ x: 10, y: 10, width: 176, height: 176 }, { width: 376, height: 520 }, area), { x: 10, y: 190 });
  // A panel taller than the room above is pushed back inside the work area.
  assert.deepEqual(panelPosition({ x: 1244, y: 460, width: 176, height: 176 }, { width: 376, height: 520 }, { ...area, height: 640 }), { x: 1044, y: 0 });
});
test("alert send time is optional but must be a real date", () => {
  const summary = { unread: 1, connected: true, signedIn: true };
  const alert = { id: "n1", label: "Expired material", message: "Expired", type: 15, priority: 0 };
  assert.equal(validSummary({ ...summary, alerts: [{ ...alert, at: "2026-10-31T10:00:00Z" }] }), true);
  assert.equal(validSummary({ ...summary, alerts: [{ ...alert, at: "yesterday" }] }), false);
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
