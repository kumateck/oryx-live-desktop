import { expect, it } from "vitest";
import { fitSelectedLabels } from "./select-option";

it("keeps only labels that fit alongside the remaining count", () => {
  expect(fitSelectedLabels([40, 40, 40], 100)).toBe(1);
  expect(fitSelectedLabels([40, 40], 100)).toBe(2);
  expect(fitSelectedLabels([40, 40], 60)).toBe(0);
  expect(fitSelectedLabels([], 100)).toBe(0);
});
