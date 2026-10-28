// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { publishCompanion, onCompanionOpen } from "./desktop-companion";
afterEach(() => { delete window.oryxCompanion; });
it("supports browsers and older shells without a companion", () => {
  expect(() => publishCompanion({ unread: 1, connected: true, signedIn: true })).not.toThrow();
  expect(() => onCompanionOpen(() => {})()).not.toThrow();
});
it("publishes summary only and cleans up the open listener", async () => {
  const summary = vi.fn(async () => {}), cleanup = vi.fn(), listener = vi.fn();
  const onOpen = vi.fn(() => cleanup);
  window.oryxCompanion = { summary, onOpen };
  publishCompanion({ unread: 4, connected: false, signedIn: true });
  expect(summary).toHaveBeenCalledWith({ unread: 4, connected: false, signedIn: true });
  onCompanionOpen(listener)();
  expect(onOpen).toHaveBeenCalledWith(listener);
  expect(cleanup).toHaveBeenCalledOnce();
});
it("a rejected native summary does not break notifications", async () => {
  window.oryxCompanion = { summary: vi.fn(async () => { throw new Error("shell unavailable"); }), onOpen: () => () => {} };
  publishCompanion({ unread: 0, connected: false, signedIn: false });
  await Promise.resolve();
});

it("deduplicates replay by stable id without suppressing different same-text events", async () => {
  const { createAnnouncedLog } = await import("./arrivals");
  const log = createAnnouncedLog();
  expect(log.claim("Review required", "first")).toBe(true);
  expect(log.claim("Review required", "first")).toBe(false);
  expect(log.claim("Review required", "second")).toBe(true);
  expect(log.claim("Legacy event")).toBe(true);
  expect(log.claim("Legacy event", "legacy-id")).toBe(false);
});
