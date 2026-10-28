import { afterEach, expect, it, vi } from "vitest";
import { isStaleBuildError, reloadForNewRelease } from "./stale-build";

afterEach(() => { vi.unstubAllGlobals(); });

it("recognises a page's code failing to load, in each browser's words, and nothing else", () => {
  expect(isStaleBuildError(new TypeError("Failed to fetch dynamically imported module: http://site/assets/page-abc.js"))).toBe(true);
  expect(isStaleBuildError(new TypeError("Importing a module script failed."))).toBe(true);
  expect(isStaleBuildError(new TypeError("error loading dynamically imported module"))).toBe(true);
  expect(isStaleBuildError(new TypeError("Failed to fetch"))).toBe(false);
  expect(isStaleBuildError(new Error("Cannot read properties of undefined"))).toBe(false);
  expect(isStaleBuildError(null)).toBe(false);
});

it("reloads once, and not again within a minute, so a broken release cannot loop", () => {
  const reload = vi.fn();
  const stored = new Map<string, string>();
  vi.stubGlobal("window", { location: { reload } });
  vi.stubGlobal("sessionStorage", { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => { stored.set(key, value); } });
  expect(reloadForNewRelease(1_000_000)).toBe(true);
  expect(reloadForNewRelease(1_030_000)).toBe(false);
  expect(reloadForNewRelease(1_070_000)).toBe(true);
  expect(reload).toHaveBeenCalledTimes(2);
});
