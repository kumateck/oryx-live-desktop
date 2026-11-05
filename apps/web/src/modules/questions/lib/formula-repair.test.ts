import { describe, expect, it } from "vitest";
import { canAccess } from "@/shared/auth/access";
import { anyFormulaRepairPermission } from "@/shared/formula/repairs/access";
import { formulaRepairDefaults, manualRepairVariables, repairedFormulaDefinition } from "./formula-repair";

const expression = "(:sampleAvg/:standardAvg)*(:standardInput.wt/:sampleInput.wt)*(:wt/:ml*5*1000/:cl)*:purity";
const settings = { type: 3, expression: ":sampleAvg/:standardAvg", decimalPlaces: 2, headers: ["Standard", "Sample 1", "Sample 2"],
  standardInputs: [{ key: "wt", label: "Weight", value: "" }], sampleInputs: [[{ key: "wt" }], [{ key: "wt" }]], manualVarLabels: { wt: "Weight per ml", cl: "Claim" } };

describe("formula repair", () => {
  it("preserves nested wrapping and all fixed settings while changing the expression and manual labels", () => {
    const raw = JSON.stringify({ type: 3, expression: JSON.stringify(settings) });
    expect(formulaRepairDefaults(raw).expression).toBe(settings.expression);
    expect(manualRepairVariables(raw, expression)).toEqual(["wt", "ml", "cl", "purity"]);
    const changed = JSON.parse(repairedFormulaDefinition(raw, expression, { wt: "Weight per ml", ml: "Volume", cl: "Claim", purity: "Purity" }));
    expect(typeof changed.expression).toBe("string");
    expect(JSON.parse(changed.expression)).toEqual({ ...settings, expression, manualVarLabels: { wt: "Weight per ml", ml: "Volume", cl: "Claim", purity: "Purity" } });
  });
  it("never turns table statistics or per-sample weights into manual inputs", () => {
    expect(manualRepairVariables(JSON.stringify(settings), ":sampleAvg/:standardAvg+:sample2SD+:R1sample+:sampleInput.wt+:standardInput.wt")).toEqual([]);
  });
  const incomplete: { permissions: string[] }[] = [[], ["CanViewQuestions"], ["CanEditQuestions"], ["CanRepairQuestionFormula"], ["CanRepairTestFormula"]]
    .map(permissions => ({ permissions }));
  it.each(incomplete)("denies incomplete repair access: $permissions", ({ permissions }) => {
    expect(canAccess(anyFormulaRepairPermission, { state: "authenticated", permissions: new Set(permissions) })).toBe(false);
  });
  it.each(["CanRepairQuestionFormula", "CanRepairTestFormula"])("allows question visibility plus the independent repair permission %s", permission => {
    expect(canAccess(anyFormulaRepairPermission, { state: "authenticated", permissions: new Set(["CanViewQuestions", permission]) })).toBe(true);
  });
});
