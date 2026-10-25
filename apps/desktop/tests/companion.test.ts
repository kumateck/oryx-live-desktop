import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { AlertPriority, CompanionCommand, type CompanionView } from "../src/companion/contract";
import { CompanionPreferenceStore, parsePreferences } from "../src/companion/preferences";
import { baseline, presentation } from "../src/companion/renderer/presentation";
import { indicatorText } from "../src/companion/renderer/indicators";
import { Clip } from "../src/companion/renderer/animation";
const view: CompanionView = { unread: 0, connected: true, signedIn: true, quiet: false, focused: false, roaming: true };
test("quiet and reduced-motion hold a still pose and suppress roaming", () => {
  for (const reduced of [true, false]) {
    const pose = presentation({ ...view, quiet: !reduced }, Clip.HappyHop, 25000, 24000, 0, false, false, reduced);
    expect(pose.x).toBe(0); expect(pose.y).toBe(0);
  }
});
test("roaming stays bounded, uses walking poses, and stops for unread alerts or interaction", () => {
  for (let now = 20001; now < 30000; now += 111) {
    const pose = presentation(view, Clip.Idle, now, 0, -200000, false, false, false);
    expect(Math.abs(pose.x)).toBeLessThanOrEqual(18);
    expect([8, 9, 10, 11]).toContain(pose.frame);
    expect(presentation({ ...view, unread: 3 }, Clip.Idle, now, 0, 0, false, false, false).x).toBe(0);
    expect(presentation(view, Clip.Idle, now, 0, 0, true, false, false).x).toBe(0);
  }
});
test("signed-out is calm, disconnected is explicit, and rest ends on interaction", () => {
  expect(baseline({ ...view, signedIn: false, connected: false })).toBe(Clip.Idle);
  expect(baseline({ ...view, connected: false })).toBe(Clip.Offline);
  expect(presentation(view, Clip.Idle, 180000, 0, 0, false, false, false).frame).toBe(14);
  expect(presentation(view, Clip.Idle, 180000, 0, 0, true, false, false).frame).toBe(0);
});
test("device preferences survive reload and concurrent commands do not overwrite each other", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "oryx-prefs-"));
  try {
    const file = path.join(folder, "settings.json"), store = new CompanionPreferenceStore(file);
    await store.load(true);
    await Promise.all([store.change(CompanionCommand.QuietOn), store.change(CompanionCommand.RoamingOff)]);
    await store.change(CompanionCommand.Hide);
    expect(await new CompanionPreferenceStore(file).load(true)).toEqual({ visible: false, quiet: true, roaming: false, showIndicators: true });
  } finally { await rm(folder, { recursive: true, force: true }); }
});
test("malformed preference fields retain defaults", () => {
  expect(parsePreferences({ visible: false, quiet: "yes", roaming: null }, { visible: true, quiet: false, roaming: true, showIndicators: true })).toEqual({ visible: false, quiet: false, roaming: true, showIndicators: true });
});

test("quiet mode preserves label, backend priority, and unread count while all movement stops", () => {
  const quiet = { ...view, quiet: true, unread: 7, alerts: [{ id: "event", label: "Expired material", message: "Expired lot", type: 15, priority: AlertPriority.High }] };
  const text = indicatorText(quiet);
  expect(text.alerts[0]?.label).toBe("Expired material"); expect(text.priority).toBe("High priority"); expect(text.count).toBe("7 unread");
  expect(text.status).toContain("Quiet");
  for (const now of [1000, 25000, 140000]) {
    const pose = presentation(quiet, Clip.Urgent, now, 0, 0, false, false, false);
    expect(pose.x).toBe(0); expect(pose.y).toBe(0);
  }
});
test("legacy alerts explicitly display missing priority, and signed-out hides stale alert details", () => {
  expect(indicatorText({ ...view, unread: 4 }).priority).toBe("Priority not set");
  const text = indicatorText({ ...view, signedIn: false, unread: 4, alerts: [{ id: "old", label: "Old alert", message: "Private old alert", type: 15, priority: AlertPriority.Critical }] });
  expect(text.empty).toBe("Sign in to view alerts"); expect(text.count).toBe("0 unread");
});
test("the Appearance alert-details preference persists across restarts", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "oryx-indicators-"));
  try {
    const file = path.join(folder, "prefs.json"), store = new CompanionPreferenceStore(file);
    await store.load(true); await store.change(CompanionCommand.IndicatorsOff);
    expect((await new CompanionPreferenceStore(file).load(true)).showIndicators).toBe(false);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
