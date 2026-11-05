// @vitest-environment jsdom
import { zodResolver } from "@hookform/resolvers/zod";
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";
import TheAduseiFormula from "@/shared/formula/ui/types/expression";
import { buildFormulaRevisionDraft } from "@/shared/formula/builder/definition-adapter";
import { parseUniversalNamedExpressions } from "@/shared/formula/builder/universal-named-expressions";
import { FormulaType, QuestionType } from "@/shared/questions/question-types";
import { formulaDefaults, formulaScopeOptions, questionFormulaSchema, type QuestionFormulaValues } from "../schemas/formula-question-schema";
import { buildFormulaOptionValue, canonicalVariableKey, scopeFieldName, toFormulaValues, universalEditorDefinition } from "./formula-question";

const universal = (extra: Record<string, unknown> = {}) => JSON.stringify({
  type: 3, expression: "(:sampleAvg/:standardAvg)*(:sampleInput.wt/:standardInput.wt)*:wt",
  standardInTable: true, noOfSamples: 2, numberOfSamples: 2, manualVars: { wt: "" },
  standardInputs: [{ label: "Weight (g)", value: "", key: "wt" }],
  sampleInputs: [[{ label: "Weight (g)", value: "", key: "wt" }], [{ label: "Weight (g)", value: "", key: "wt" }]],
  ...extra,
});
const formScope = formulaScopeOptions[1];
const question = { id: "q1", label: "Assay", type: QuestionType.Formula, isMultiSelect: false, reference: null, description: null, options: [] };
afterEach(cleanup);

describe("formula variable keys", () => {
  it("escapes dots in form field names and restores them", () => {
    expect(scopeFieldName("sampleInput1.wt")).toBe("sampleInput1%2Ewt");
    expect(decodeURIComponent(scopeFieldName("sampleInput1.wt"))).toBe("sampleInput1.wt");
  });

  it("maps legacy table input keys to dot-free names", () => {
    expect(canonicalVariableKey("standardInput.wt")).toBe("standardWeight");
    expect(canonicalVariableKey("sampleInput1.wt")).toBe("sample1Weight");
    expect(canonicalVariableKey("spl.wt")).toBe("sampleWeight");
    expect(canonicalVariableKey("cl")).toBe("cl");
  });

  it("saves Universal formulas with dot-free variables and carries form scopes over", async () => {
    const saved = buildFormulaOptionValue(universal(), 3, "", { [scopeFieldName("sampleInput1.wt")]: formScope });
    const option = JSON.parse(saved) as Record<string, unknown>;
    expect(option.variableKeyFormat).toBe(1);
    expect(option.variableScopes).toEqual({ sample1Weight: 1 });
    const draft = await buildFormulaRevisionDraft(saved, "Universal");
    const keys = draft.definition.variables.map((variable) => variable.key);
    expect(keys).toEqual(expect.arrayContaining(["standardWeight", "sample1Weight", "sample2Weight", "wt"]));
    expect(keys.some((key) => key.includes("."))).toBe(false);
  });

  it("keeps the legacy format when the formula's own keys cannot be dot-free", () => {
    const option = JSON.parse(buildFormulaOptionValue(universal({ manualVars: { wt_1: "" } }), 3, "", {})) as Record<string, unknown>;
    expect(option.variableKeyFormat).toBeUndefined();
  });

  it("checks the editor's live definition in the format it will be saved in", () => {
    expect(JSON.parse(universalEditorDefinition(universal())).variableKeyFormat).toBe(1);
  });

  it("loads a stored legacy form scope under its new name", () => {
    const values = toFormulaValues(question, universal({ variableScopes: { "sampleInput2.wt": 1 } }));
    expect(values.variableScopes).toEqual({ sample2Weight: formScope });
  });

  it("opens a stored dotted formula with dot-free names in its expressions", () => {
    const stored = universal({
      manualVarExpressions: { purity: ":standardInput.wt*2" },
      namedExpressions: [{ key: "ratio", label: "Ratio", expression: ":spl.wt/:std.wt", scope: 1 }],
    });
    const option = JSON.parse(toFormulaValues(question, stored).expression) as Record<string, unknown>;
    expect(option.variableKeyFormat).toBe(1);
    expect(option.expression).toBe("(:sampleAvg/:standardAvg)*(:sampleWeight/:standardWeight)*:wt");
    expect(option.manualVarExpressions).toEqual({ purity: ":standardWeight*2" });
    expect((option.namedExpressions as { expression: string }[])[0]?.expression).toBe(":sampleWeight/:standardWeight");
    expect(option.standardInputs).toEqual([{ label: "Weight (g)", value: "", key: "wt" }]);
  });

  it("shows dot-free names in the builder's available variables", () => {
    const stored = universal({ headers: ["Standard", "Sample 1", "Sample 2"], firstColumnPurpose: "standard", standardInput: true, sampleInput: true });
    render(<TheAduseiFormula type={FormulaType.Universal} value={toFormulaValues(question, stored).expression} onChange={() => {}} />);
    expect(screen.getByText(":standardWeight")).toBeTruthy();
    expect(screen.getByText(":sampleWeight")).toBeTruthy();
    expect(screen.queryByText(":standardInput.wt")).toBeNull();
    expect(screen.queryByText(":sampleInput.wt")).toBeNull();
  });

  it("lets the form hold and validate a dotted key", async () => {
    const { result } = renderHook(() => useForm<QuestionFormulaValues>({ resolver: zodResolver(questionFormulaSchema), defaultValues: { ...formulaDefaults, label: "Assay", expression: ":a+1" } }));
    act(() => result.current.setValue(`variableScopes.${scopeFieldName("sampleInput1.wt")}`, formScope));
    expect(result.current.getValues("variableScopes")).toEqual({ "sampleInput1%2Ewt": formScope });
    let valid = false;
    await act(async () => { valid = await result.current.trigger(); });
    expect(valid).toBe(true);
  });

  it("refuses a per-sample named expression that would take an input's name", () => {
    const config = JSON.parse(universal({ variableKeyFormat: 1, namedExpressionsEnabled: true,
      namedExpressions: [{ key: "weight", label: "Weight", expression: ":sampleAvg*2", scope: 1 }] })) as Record<string, unknown>;
    expect(() => parseUniversalNamedExpressions(config)).toThrow(/would become “sample1Weight”/);
  });
});
