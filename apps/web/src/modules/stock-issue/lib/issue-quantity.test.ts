import { expect, it } from "vitest";
import { issueDifference, suggestedIssue, toIssue } from "./issue-quantity";

const line = (quantity: number, sizes: (number | null)[], kind: 0 | 1 = 1) => ({ kind, quantity, issuedQuantity: null, batches: sizes.map((containerSize) => ({ containerSize })) });

it("suggests the nearest whole packs of a known pack size", () => {
  expect(suggestedIssue(line(18.75, [10]))).toBe(20);
  expect(suggestedIssue(line(18.75, [9]))).toBe(18);
  expect(suggestedIssue(line(14, [10, 10]))).toBe(10);
  // At least one pack, and nothing when the requirement is already whole packs.
  expect(suggestedIssue(line(3, [10]))).toBe(10);
  expect(suggestedIssue(line(20, [10]))).toBeNull();
});

it("suggests nothing for raw materials, unknown or mixed pack sizes", () => {
  expect(suggestedIssue(line(18.75, [10], 0))).toBeNull();
  expect(suggestedIssue(line(18.75, [null]))).toBeNull();
  expect(suggestedIssue(line(18.75, [10, 9]))).toBeNull();
});

it("measures what is issued against the requirement", () => {
  expect(toIssue({ quantity: 18.75, issuedQuantity: null })).toBe(18.75);
  expect(issueDifference({ quantity: 18.75, issuedQuantity: 20 })).toBe(1.25);
  expect(issueDifference({ quantity: 18.75, issuedQuantity: 18 })).toBe(-0.75);
});
