import { expect, it } from "vitest";
import { evaluationSettings } from "./settings";

it("preserves legacy formula metadata across nested JSON and settings envelopes", () => {
  const payload = { type: 3, expression: ":W2 - :W1", manualVarLabels: { W2: "Before drying" }, inputDecimalPlaces: 12 };
  for (const raw of [JSON.stringify(payload), JSON.stringify(JSON.stringify(payload)), JSON.stringify({ type: 3, settings: payload })]) {
    const parsed = evaluationSettings(raw);
    expect(parsed?.type).toBe(3);
    expect(JSON.parse(parsed?.settings ?? "{}")).toMatchObject(payload);
  }
});

it("rejects missing and unreadable definitions instead of rendering an empty evaluator", () => {
  for (const raw of ["", "broken", "null", "{}", '{"type":3,"expression":""}']) expect(evaluationSettings(raw)).toBeNull();
  expect(evaluationSettings('{"type":2,"mode":"tablet","sampleCount":20}')?.type).toBe(2);
});
