import { setTimeout as settleTimers } from "node:timers/promises";
import { afterAll } from "vitest";
import { configure } from "@testing-library/react";

// Lazy field chunks can take longer when several suites run together; preserve
// lazy loading in tests while allowing controls to settle under full-suite load.
configure({ asyncUtilTimeout: 10000 });

// jsdom has no layout, so it does not provide ResizeObserver; some controls (the switch) need it to exist.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

// jsdom has no layout, so it does not provide scrollIntoView; the command list calls it to keep the highlighted option in view.
if (typeof Element !== "undefined" && typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {};
}

// RTK's animation-frame batcher also schedules a 100 ms fallback. Let that
// callback settle while jsdom still exists; tearing down its globals first
// leaves a late callback trying to call the removed cancelAnimationFrame.
afterAll(async () => {
  if (typeof window !== "undefined") await settleTimers(120);
});
