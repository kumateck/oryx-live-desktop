import { expect, it } from "vitest";
import { formulaPreview, normalizeFormulaSettings } from "./formula-preview";

it("reads the type and expression of stored formula definitions", () => {
  expect(formulaPreview(JSON.stringify({ type: 0, expression: ":a * :b" }))).toEqual({ type: 0, expression: ":a * :b" });
  expect(formulaPreview(JSON.stringify(JSON.stringify({ type: 3, expression: JSON.stringify({ expression: ":x / 2" }) })))).toEqual({ type: 3, expression: ":x / 2" });
  expect(formulaPreview(JSON.stringify({ settings: { mode: "tablet" } })).type).toBe(2);
  expect(formulaPreview('{"type":"2","expression":":w*100", broken')).toEqual({ type: 2, expression: ":w*100" });
  expect(formulaPreview(":a + 1")).toEqual({ type: 0, expression: ":a + 1" });
  expect(JSON.parse(normalizeFormulaSettings(JSON.stringify({ mode: "capsule" })))).toEqual({ mode: "capsule", type: 2 });
});

it("shows the same percentage multiplier as the approved formula editor", () => {
  for (const config of [
    { percentageResults: true },
    { percent: true },
  ]) {
    expect(formulaPreview(JSON.stringify({ type: 3, expression: ":sampleAvg/:standardAvg", ...config })).expression)
      .toBe("(:sampleAvg/:standardAvg) * 100");
  }
  expect(formulaPreview(JSON.stringify({ type: 0, expression: ":a/:b", percent: true })).expression).toBe("(:a/:b) * 100");
  expect(formulaPreview(JSON.stringify({ type: 3, expression: ":a/:b", percentageResults: false, percent: true })).expression).toBe(":a/:b");
  expect(formulaPreview(JSON.stringify({ settings: { type: 3, expression: ":a/:b", percentageResults: true } })).expression).toBe("(:a/:b) * 100");
});
