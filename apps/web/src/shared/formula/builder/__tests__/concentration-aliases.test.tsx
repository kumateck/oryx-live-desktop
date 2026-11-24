// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFormulaRevisionDraft } from "../definition-adapter";
import { concentrationUnitForEditing, measurementAliasesForEditing, weightInputPresentation } from "../universal-variable-keys";
import { compileFormulaDefinitionV1 } from "../../core/definition";
import { evaluateCompiledFormulaV1 } from "../../core/evaluate";
import { FORMULA_V1_EVALUATION_LIMITS, FORMULA_V1_RUNTIME_LIMITS } from "../../core/runtime-limits";
import { buildInputVariables, computeFormulaResults, isManualVarKey } from "../../compute/formula-compute";
import { WorksheetInputs } from "../../ui/types/expression/universal/authorized-evaluate/worksheet-inputs";
import type { ExpressionExtract } from "../../ui/types/expression/universal/types";
import TheAduseiFormula from "../../ui/types/expression";
import { FormulaType } from "@/shared/questions/question-types";

// These pure editor tests insert tokens locally; save authorization is tested by the owning form.
vi.mock("@/shared/auth/use-access", () => ({ useAccess: () => ({ allows: () => true, allowsNow: () => true }) }));

const input = (value = "") => ({ key: "wt", label: "Weight (g)", value });
const config = (expression: string): ExpressionExtract => ({
  expression, variableKeyFormat: 1, concentrationUnit: "mg/mL",
  standardInTable: true, standardInput: true, sampleInput: true,
  noOfSamples: 2, numberOfSamples: 2, firstColumnPurpose: "standard",
  standardInputs: [input()], sampleInputs: [[input()], [input()]],
  headers: ["Standard", "Sample 1", "Sample 2"],
});
afterEach(cleanup);

describe("aliases for the shared standard and sample inputs", () => {
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

  it("evaluates all five spellings with a single input per standard and sample", async () => {
    const suffixes = ["Weight", "Conc", "Absorbance", "PeakAreas", "TitreValue"];
    const sum = (prefix: string) => suffixes.map(suffix => `:${prefix}${suffix}`).join("+");
    const expression = `(${sum("standard")})/(${sum("sample")})`;
    const parsed = { ...config(expression), measurementAliases: measurementAliasesForEditing({}) };
    const equivalent = config("(:standardWeight+:standardWeight+:standardWeight+:standardWeight+:standardWeight)/(:sampleWeight+:sampleWeight+:sampleWeight+:sampleWeight+:sampleWeight)");
    const draft = await buildFormulaRevisionDraft(JSON.stringify(parsed), "Universal");
    const weight = await buildFormulaRevisionDraft(JSON.stringify(equivalent), "Universal");
    expect(draft.definitionHash).toBe(weight.definitionHash);
    expect(draft.definition.variables.map(({ key }) => key)).toEqual(["sample1Weight", "sample2Weight", "standardWeight"]);
    const inputs = buildInputVariables(parsed, [input("8")], [[input("2")], [input("4")]]);
    for (const suffix of suffixes) {
      expect(inputs[`standard${suffix}`]).toBe(8);
      expect(inputs[`sample1${suffix}`]).toBe(2);
      expect(inputs[`sample2${suffix}`]).toBe(4);
    }
    const preview = computeFormulaResults({ parsed, inputVariables: inputs, headers: parsed.headers ?? [], data: [], tableVars: {}, manualVars: {} });
    expect(preview.map(({ result }) => result)).toEqual([4, 2]);
    render(<WorksheetInputs parsed={parsed} headers={parsed.headers ?? []} standardInputs={[input()]} sampleInputs={[[input()], [input()]]}
      manualVars={{}} manualVarKeys={[]} onManualVarChange={vi.fn()} onStandardInputChange={vi.fn()} onSampleInputChange={vi.fn()} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    expect(screen.getByRole("textbox", { name: /Sample 2 Weight \/ Concentration \/ Absorbance \/ Peak Areas \/ Titre Value/ })).toBeTruthy();
  });

  it("keeps an older measurement variable independent when the editor opens it", async () => {
    const parsed = { ...config(":standardWeight/:sampleAbsorbance"), manualVarLabels: { sampleAbsorbance: "Blank-adjusted absorbance" } };
    expect(measurementAliasesForEditing(parsed)).toEqual(["peakAreas", "titreValue"]);
    const draft = await buildFormulaRevisionDraft(JSON.stringify(parsed), "Universal");
    expect(draft.definition.variables.map(({ key }) => key)).toContain("sampleAbsorbance");
  });

  it("resolves measurement aliases inside per-sample named expressions", async () => {
    const parsed = { ...config(":ratio"), measurementAliases: measurementAliasesForEditing({}),
      namedExpressionsEnabled: true, namedExpressions: [
        { key: "ratio", label: "Ratio", expression: ":standardAbsorbance/:samplePeakAreas", scope: 1 },
      ] };
    const draft = await buildFormulaRevisionDraft(JSON.stringify(parsed), "Universal");
    expect(draft.definition.derivedExpressions?.map(({ expression }) => expression)).toEqual([":standardWeight/:sample1Weight", ":standardWeight/:sample2Weight"]);
    expect(draft.definition.variables.map(({ label }) => label)).toEqual(["Sample 1 Peak Areas", "Sample 2 Peak Areas", "Standard Absorbance"]);
  });

  it("offers all five aliases and persists an alias inserted from the real editor menu", async () => {
    const saved = vi.fn<(value: string) => void>();
    const user = userEvent.setup();
    render(<TheAduseiFormula type={FormulaType.Universal} value={JSON.stringify(config(":standardWeight/:sampleWeight"))} onChange={saved} />);
    await user.click(screen.getByRole("button", { name: "Standard variable (5 aliases)" }));
    expect(screen.getAllByRole("menuitem")).toHaveLength(5);
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Sample variable (5 aliases)" }));
    expect(screen.getAllByRole("menuitem")).toHaveLength(5);
    const expression = screen.getByPlaceholderText(/Use :variables/);
    if (!(expression instanceof HTMLTextAreaElement)) throw new Error("Expected the expression editor");
    expression.setSelectionRange(":standardWeight/".length, expression.value.length);
    await user.click(screen.getByRole("menuitem", { name: /:samplePeakAreas/ }));
    expect(expression.value).toBe(":standardWeight/:samplePeakAreas");
    await waitFor(() => {
      const raw = saved.mock.lastCall?.[0];
      if (!raw) throw new Error("The builder did not emit its saved configuration");
      const payload: ExpressionExtract = JSON.parse(raw);
      expect(payload.expression).toContain(":samplePeakAreas");
      expect(payload.measurementAliases).toEqual(["peakAreas"]);
      expect(payload.manualVarLabels).not.toHaveProperty("samplePeakAreas");
    });
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
    await user.click(screen.getByRole("button", { name: /Standard variable/ }));
    expect(screen.getByRole("menuitem", { name: /:standardConc/ })).toBeTruthy();
    expect(screen.getByText(/^Standard Concentration \(mg\/mL\)/)).toBeTruthy();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: /Sample variable/ }));
    expect(screen.getByRole("menuitem", { name: /:sampleConc/ })).toBeTruthy();
    expect(screen.getByText("Sample Concentration (mg/mL)")).toBeTruthy();
    await user.keyboard("{Escape}");
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
