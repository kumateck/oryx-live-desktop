import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { AlertPriority, CompanionCommand, type CompanionView } from "../src/companion/contract";
import { CompanionPreferenceStore, parsePreferences } from "../src/companion/preferences";
import { baseline, presentation } from "../src/companion/renderer/presentation";
import { alertCategory, alertSummary, groupAlerts, priorityChip, since } from "../src/companion/renderer/alerts";
import { windowSize } from "../src/companion/placement";
import { Clip } from "../src/companion/renderer/animation";
const view: CompanionView = { unread: 0, connected: true, signedIn: true, quiet: false, focused: false, roaming: true };
test("quiet and reduced-motion hold a still pose and suppress roaming", () => {
  for (const reduced of [true, false]) {
    const pose = presentation({ ...view, quiet: !reduced }, Clip.HappyHop, 25000, 24000, 0, false, false, reduced);
    expect(pose.x).toBe(0); expect(pose.y).toBe(0);
  }
});
test("playful roams within bounds even with unread alerts, focus or a dropped connection, and stops for interaction", () => {
  let walked = 0;
  for (let now = 15001; now < 30000; now += 111) {
    for (const state of [view, { ...view, unread: 3 }, { ...view, focused: true }, { ...view, connected: false }]) {
      const pose = presentation(state, Clip.Idle, now, 0, -200000, false, false, false);
      expect(Math.abs(pose.x)).toBeLessThanOrEqual(18);
      expect([8, 9, 10, 11]).toContain(pose.frame);
      if (Math.abs(pose.x) > 1) walked++;
    }
    expect(presentation(view, Clip.Idle, now, 0, 0, true, false, false).x).toBe(0);
    expect(presentation({ ...view, roaming: false }, Clip.Idle, now, 0, 0, false, false, false).x).toBe(0);
  }
  expect(walked).toBeGreaterThan(0);
});
test("still is quiet, disconnected is explicit, and only subtle lies down to rest", () => {
  expect(baseline({ ...view, signedIn: false, connected: false })).toBe(Clip.Idle);
  expect(baseline({ ...view, connected: false })).toBe(Clip.Offline);
  expect(baseline({ ...view, focused: true })).toBe(Clip.Idle);
  expect(baseline({ ...view, quiet: true })).toBe(Clip.Focus);
  const subtle = { ...view, roaming: false };
  expect(presentation(subtle, Clip.Idle, 180000, 0, 0, false, false, false).frame).toBe(14);
  expect(presentation(subtle, Clip.Idle, 180000, 0, 0, true, false, false).frame).toBe(0);
  expect(presentation(view, Clip.Idle, 180000, 0, 0, false, false, false).frame).not.toBe(14);
});
test("device preferences survive reload and concurrent commands do not overwrite each other", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "oryx-prefs-"));
  try {
    const file = path.join(folder, "settings.json"), store = new CompanionPreferenceStore(file);
    await store.load(true);
    await Promise.all([store.change(CompanionCommand.QuietOn), store.change(CompanionCommand.RoamingOff)]);
    await store.change(CompanionCommand.Hide);
    expect(await new CompanionPreferenceStore(file).load(true)).toEqual({ visible: false, quiet: true, roaming: false, showIndicators: true, size: "medium" });
  } finally { await rm(folder, { recursive: true, force: true }); }
});
test("malformed preference fields retain defaults", () => {
  expect(parsePreferences({ visible: false, quiet: "yes", roaming: null, size: "huge" }, { visible: true, quiet: false, roaming: true, showIndicators: true })).toEqual({ visible: false, quiet: false, roaming: true, showIndicators: true, size: "medium" });
});

test("quiet mode preserves label, backend priority, and unread count while all movement stops", () => {
  const quiet = { ...view, quiet: true, unread: 7, alerts: [{ id: "event", label: "Expired material", message: "Expired lot", type: 15, priority: AlertPriority.High }] };
  const text = alertSummary(quiet);
  expect(text.alerts[0]?.label).toBe("Expired material"); expect(text.priority).toBe("High priority"); expect(text.count).toBe("7 unread");
  for (const now of [1000, 25000, 140000]) {
    const pose = presentation(quiet, Clip.Urgent, now, 0, 0, false, false, false);
    expect(pose.x).toBe(0); expect(pose.y).toBe(0);
  }
});
test("legacy alerts explicitly display missing priority, and signed-out hides stale alert details", () => {
  expect(alertSummary({ ...view, unread: 4 }).priority).toBe("Priority not set");
  const text = alertSummary({ ...view, signedIn: false, unread: 4, alerts: [{ id: "old", label: "Old alert", message: "Private old alert", type: 15, priority: AlertPriority.Critical }] });
  expect(text.empty).toBe("Sign in to Oryx to see your alerts"); expect(text.count).toBe("0 unread"); expect(text.alerts).toEqual([]);
});
test("the Appearance alert-details preference persists across restarts", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "oryx-indicators-"));
  try {
    const file = path.join(folder, "prefs.json"), store = new CompanionPreferenceStore(file);
    await store.load(true); await store.change(CompanionCommand.IndicatorsOff);
    expect((await new CompanionPreferenceStore(file).load(true)).showIndicators).toBe(false);
  } finally { await rm(folder, { recursive: true, force: true }); }
});

test("sizes keep the medium proportions and persist", async () => {
  expect([windowSize("small"), windowSize("medium"), windowSize("large")]).toEqual([138, 176, 214]);
  const folder = await mkdtemp(path.join(tmpdir(), "oryx-size-"));
  try {
    const file = path.join(folder, "prefs.json"), store = new CompanionPreferenceStore(file);
    await store.load(true); await store.change(CompanionCommand.SizeLarge);
    expect((await new CompanionPreferenceStore(file).load(true)).size).toBe("large");
  } finally { await rm(folder, { recursive: true, force: true }); }
});
test("alerts are grouped by day, labelled by area, and priority chips appear only when supplied", () => {
  const now = Date.parse("2026-10-31T15:00:00Z");
  const alert = (id: string, at: string | undefined, type: number, priority = AlertPriority.Unspecified) => ({ id, label: id, message: id, type, priority, ...(at ? { at } : {}) });
  const groups = groupAlerts([alert("a", "2026-10-31T14:55:00Z", 13), alert("b", "2026-10-29T10:00:00Z", 4), alert("c", undefined, 99)], now);
  expect(groups.map((group) => group.title)).toEqual(["Today", "Earlier", "Other"]);
  expect([alertCategory(13), alertCategory(4), alertCategory(10), alertCategory(99)]).toEqual(["production", "stock", "people", "general"]);
  expect(since("2026-10-31T14:55:00Z", now)).toBe("5m");
  expect(since(undefined, now)).toBe("");
  expect(priorityChip(AlertPriority.Unspecified)).toBeNull();
  expect(priorityChip(AlertPriority.Medium)).toBeNull();
  expect(priorityChip(AlertPriority.Critical)?.tone).toBe("critical");
});
