// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFormulaRevisionDraft } from "../definition-adapter";
import { concentrationUnitForEditing, weightInputPresentation } from "../universal-variable-keys";
import { compileFormulaDefinitionV1 } from "../../core/definition";
import { evaluateCompiledFormulaV1 } from "../../core/evaluate";
import { FORMULA_V1_EVALUATION_LIMITS, FORMULA_V1_RUNTIME_LIMITS } from "../../core/runtime-limits";
import { buildInputVariables, computeFormulaResults, isManualVarKey } from "../../compute/formula-compute";
import { WorksheetInputs } from "../../ui/types/expression/universal/authorized-evaluate/worksheet-inputs";
import type { ExpressionExtract } from "../../ui/types/expression/universal/types";
import TheAduseiFormula from "../../ui/types/expression";
import { FormulaType } from "@/shared/questions/question-types";

const input = (value = "") => ({ key: "wt", label: "Weight (g)", value });
const config = (expression: string): ExpressionExtract => ({
  expression, variableKeyFormat: 1, concentrationUnit: "mg/mL",
  standardInTable: true, standardInput: true, sampleInput: true,
  noOfSamples: 2, numberOfSamples: 2, firstColumnPurpose: "standard",
  standardInputs: [input()], sampleInputs: [[input()], [input()]],
  headers: ["Standard", "Sample 1", "Sample 2"],
});
afterEach(cleanup);

describe("the two concentration aliases", () => {
  it.each([
    [":standardConc/:sampleConc", ":standardWeight/:sampleWeight", [4, 2]],
    ["(:standardConc+:standardWeight)/(:sampleConc+:sampleWeight)", "(:standardWeight+:standardWeight)/(:sampleWeight+:sampleWeight)", [4, 2]],
    [":standardWeight/:sampleWeight", ":standardWeight/:sampleWeight", [4, 2]],
  ])("compiles and evaluates %s with one value per pair and separate samples", async (expression, weightExpression, expected) => {
    const parsed = config(expression);
    const draft = await buildFormulaRevisionDraft(JSON.stringify(parsed), "Universal");
    const weight = await buildFormulaRevisionDraft(JSON.stringify(config(weightExpression)), "Universal");
    expect(draft.definitionHash).toBe(weight.definitionHash);
    expect(draft.definition.variables.map(({ key }) => key)).toEqual(["sample1Weight", "sample2Weight", "standardWeight"]);
    const inputs = buildInputVariables(parsed, [input("8")], [[input("2")], [input("4")]]);
    expect(inputs.standardConc).toBe(inputs.standardWeight);
    expect(inputs.sample1Conc).toBe(inputs.sample1Weight);
    expect(inputs.sample2Conc).toBe(inputs.sample2Weight);
    const preview = computeFormulaResults({ parsed, inputVariables: inputs, headers: parsed.headers ?? [], data: [], tableVars: {}, manualVars: {} });
    expect(preview.map(({ result }) => result)).toEqual(expected);
    const compiled = compileFormulaDefinitionV1(draft.definition, FORMULA_V1_RUNTIME_LIMITS);
    if (!compiled.ok) throw new Error("Alias fixture did not compile");
    const evaluated = evaluateCompiledFormulaV1(compiled.definition, { standardWeight: "8", sample1Weight: "2", sample2Weight: "4" }, FORMULA_V1_EVALUATION_LIMITS);
    expect(evaluated.results.map(({ roundedResult }) => Number(roundedResult))).toEqual(expected);
    expect(isManualVarKey("standardConc", {}, new Set(), parsed)).toBe(false);
    expect(isManualVarKey("sample2Conc", {}, new Set(), parsed)).toBe(false);
  });

  it("resolves aliases inside per-sample named expressions", async () => {
    const parsed = { ...config(":ratio*100"), namedExpressionsEnabled: true,
      namedExpressions: [{ key: "ratio", label: "Ratio", expression: ":standardConc/:sampleConc", scope: 1 }] };
    const draft = await buildFormulaRevisionDraft(JSON.stringify(parsed), "Universal");
    expect(draft.definition.derivedExpressions?.map(({ expression }) => expression)).toEqual([":standardWeight/:sample1Weight", ":standardWeight/:sample2Weight"]);
  });

  it("refuses a shared expression that would collapse sample concentrations into one value", async () => {
    const parsed = { ...config(":ratio"), namedExpressionsEnabled: true,
      namedExpressions: [{ key: "ratio", label: "Ratio", expression: ":standardConc/:sampleConc", scope: 0 }] };
    await expect(buildFormulaRevisionDraft(JSON.stringify(parsed), "Universal")).rejects.toThrow("cannot use sample-scoped variables");
  });

  it.each([
    [":standardConc/:sampleConc", "Standard Concentration (mg/mL)", "Concentration (mg/mL)"],
    [":standardWeight/:sampleWeight", "Weight (g)", "Weight (g)"],
    [":standardConc+:standardWeight+:sampleConc+:sampleWeight", "Standard Weight / Concentration (g or mg/mL)", "Weight / Concentration (g or mg/mL)"],
  ])("labels the single input according to %s", (expression, standard, sample) => {
    const parsed = config(expression);
    expect(weightInputPresentation(parsed, "standard", input()).label).toBe(standard);
    expect(weightInputPresentation(parsed, "sample", input()).label).toBe(sample);
  });

  it("renders one standard input and one input for each sample and preserves typed decimals", () => {
    const parsed = config(":standardConc+:standardWeight+:sampleConc+:sampleWeight");
    const change = vi.fn();
    render(<WorksheetInputs parsed={parsed} headers={parsed.headers ?? []} standardInputs={[input()]} sampleInputs={[[input()], [input()]]}
      manualVars={{}} manualVarKeys={[]} onManualVarChange={vi.fn()} onStandardInputChange={vi.fn()} onSampleInputChange={change} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    fireEvent.change(screen.getByRole("textbox", { name: /Sample 2 Weight \/ Concentration/ }), { target: { value: "0.000123456" } });
    expect(change).toHaveBeenCalledWith(1, 0, "0.000123456");
  });

  it("offers both keys in the builder and saves the selected concentration unit", async () => {
    const saved = vi.fn<(value: string) => void>();
    const user = userEvent.setup();
    render(<TheAduseiFormula type={FormulaType.Universal} value={JSON.stringify(config(":standardConc/:sampleConc"))} onChange={saved} />);
    expect(screen.getByText(":standardConc")).toBeTruthy();
    expect(screen.getByText(":sampleConc")).toBeTruthy();
    expect(screen.getByText("Standard Concentration (mg/mL)")).toBeTruthy();
    expect(screen.getByText("Sample Concentration (mg/mL) (auto)")).toBeTruthy();
    const unitField = screen.getByRole("combobox", { name: "Concentration unit" });
    unitField.focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("option", { name: /^%$/ });
    await user.keyboard("{End}{Enter}");
    await waitFor(() => {
      const raw = saved.mock.lastCall?.[0];
      expect(raw).toBeDefined();
      if (!raw) throw new Error("The builder did not emit its saved configuration");
      const payload: ExpressionExtract = JSON.parse(raw);
      expect(payload.concentrationUnit).toBe("%");
      expect(payload.manualVarLabels).not.toHaveProperty("standardConc");
      expect(payload.manualVarLabels).not.toHaveProperty("sampleConc");
    });
  });

  it("preserves old manual concentration variables unless the configuration enables aliases", async () => {
    const { concentrationUnit: _unit, ...old } = config(":standardConc/:sampleConc");
    expect(concentrationUnitForEditing(old)).toBeUndefined();
    expect(isManualVarKey("standardConc", {}, new Set(), old)).toBe(true);
    const draft = await buildFormulaRevisionDraft(JSON.stringify(old), "Universal");
    expect(draft.definition.variables.map(({ key }) => key)).toEqual(["sampleConc", "standardConc"]);
  });

  it("refuses manual variables or named expressions that claim an enabled alias", async () => {
    await expect(buildFormulaRevisionDraft(JSON.stringify({ ...config(":sampleConc"), manualVarLabels: { sampleConc: "Another value" } }), "Universal")).rejects.toThrow("already used by an input");
  });
});
