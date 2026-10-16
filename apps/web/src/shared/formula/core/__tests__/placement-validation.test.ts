import { describe, expect, it } from "vitest";

import {
  FormulaSourceType,
  type PlacementValidationOptions,
  type ResolvedFormulaPlacement,
} from "../binding-contracts";
import {
  FORMULA_LANGUAGE_V1,
  FormulaDataType,
  FormulaIssueCode,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaScope,
  FormulaValueShape,
} from "../contracts";
import { compileFormulaDefinitionV1 } from "../definition";
import { validateResolvedFormulaPlacements } from "../placement-validation";
import { formulaResultReference } from "../source-reference";

const limits = {
  maxTokens: 100,
  maxAstNodes: 100,
  maxDepth: 20,
  maxVariableReferences: 20,
  maxVariables: 20,
  maxResults: 10,
  maxKeyLength: 80,
  maxExpressionLength: 1_000,
};

const options: PlacementValidationOptions = {
  requireMethodReference: () => true,
  maxPlacements: 20,
  maxDependencyEdges: 50,
  maxPlacementKeyLength: 80,
  maxBindingsPerPlacement: 20,
  maxTargetsPerPlacement: 10,
  maxReferenceLength: 120,
  maxMethodReferenceLength: 120,
};

const definition = (scope: FormulaScope) => {
  const compiled = compileFormulaDefinitionV1(
    {
      formulaLanguageVersion: FORMULA_LANGUAGE_V1,
      numericPolicyVersion: "oryx-decimal-v1-draft",
      variables: [
        {
          key: "input",
          label: "Input",
          dataType: FormulaDataType.Decimal,
          valueShape: FormulaValueShape.Scalar,
          scope,
          unit: "%",
          required: true,
        },
      ],
      results: [
        {
          key: "result",
          label: "Result",
          expression: ":input",
          unit: "%",
          numericScale: FormulaNumericScale.PercentagePoints,
          rounding: { kind: FormulaRoundingKind.DecimalPlaces, digits: 2 },
        },
      ],
    },
    limits,
  );
  if (!compiled.ok) throw new Error("Test formula did not compile.");
  return compiled.definition;
};

const placement = (
  placementKey: string,
  sourceType: FormulaSourceType,
  dependency?: { placementKey: string; resultKey: string },
): ResolvedFormulaPlacement => {
  const formulaSource = sourceType === FormulaSourceType.FormulaResult;
  return {
    placementKey,
    definitionHash: "a".repeat(64),
    definition: definition(
      formulaSource ? FormulaScope.Form : FormulaScope.Placement,
    ),
    methodReference: "SOP-QC-001",
    displayPolicy: {
      policyVersion: "oryx-formula-display-v1",
      showResult: true,
      showUnit: true,
      showTrace: false,
    },
    bindings: [
      {
        variableKey: "input",
        source: {
          sourceType,
          reference:
            formulaSource && dependency
              ? formulaResultReference(
                  dependency.placementKey,
                  dependency.resultKey,
                )
              : "local:input",
          dataType: FormulaDataType.Decimal,
          valueShape: FormulaValueShape.Scalar,
          scope: formulaSource ? FormulaScope.Form : FormulaScope.Placement,
          unit: "%",
          ...(dependency ? { dependencies: [dependency] } : {}),
        },
      },
    ],
    resultTargets: [
      {
        resultKey: "result",
        targetKey: `${placementKey}:result`,
        dataType: FormulaDataType.Decimal,
        valueShape: FormulaValueShape.Scalar,
        unit: "%",
      },
    ],
  };
};

describe("validateResolvedFormulaPlacements", () => {
  it("accepts compatible local and cross-formula bindings", () => {
    const first = placement("assay", FormulaSourceType.LocalInput);
    const second = placement("release", FormulaSourceType.FormulaResult, {
      placementKey: "assay",
      resultKey: "result",
    });

    expect(validateResolvedFormulaPlacements([first, second], options)).toEqual(
      [],
    );
  });

  it("rejects missing bindings, result targets, and method evidence", () => {
    const item = placement("assay", FormulaSourceType.LocalInput);
    item.bindings = [];
    item.resultTargets = [];
    item.methodReference = "";

    const codes = validateResolvedFormulaPlacements([item], options).map(
      (issue) => issue.code,
    );
    expect(codes).toEqual(
      expect.arrayContaining([
        FormulaIssueCode.MissingBinding,
        FormulaIssueCode.MissingTarget,
        FormulaIssueCode.MethodReferenceRequired,
      ]),
    );
  });

  it("rejects incompatible source and target contracts", () => {
    const item = placement("assay", FormulaSourceType.LocalInput);
    item.bindings[0]!.source.unit = "mg";
    item.bindings[0]!.source.valueShape = FormulaValueShape.TableColumn;
    item.resultTargets[0]!.unit = null;

    const codes = validateResolvedFormulaPlacements([item], options).map(
      (issue) => issue.code,
    );
    expect(codes).toEqual(
      expect.arrayContaining([
        FormulaIssueCode.UnitMismatch,
        FormulaIssueCode.ShapeMismatch,
      ]),
    );
  });

  it("rejects missing dependency results and formula cycles", () => {
    const first = placement("first", FormulaSourceType.FormulaResult, {
      placementKey: "second",
      resultKey: "result",
    });
    const second = placement("second", FormulaSourceType.FormulaResult, {
      placementKey: "first",
      resultKey: "result",
    });
    const third = placement("third", FormulaSourceType.FormulaResult, {
      placementKey: "first",
      resultKey: "missing",
    });

    const codes = validateResolvedFormulaPlacements(
      [first, second, third],
      options,
    ).map((issue) => issue.code);
    expect(codes).toContain(FormulaIssueCode.UnknownResult);
    expect(codes).toContain(FormulaIssueCode.CyclicDependency);
  });

  it("rejects unknown placements and illegal dependency metadata", () => {
    const item = placement("assay", FormulaSourceType.LocalInput);
    item.bindings[0]!.source.dependencies = [
      { placementKey: "unknown", resultKey: "result" },
    ];

    const codes = validateResolvedFormulaPlacements([item], options).map(
      (issue) => issue.code,
    );
    expect(codes).toContain(FormulaIssueCode.InvalidDefinition);
    expect(codes).toContain(FormulaIssueCode.UnknownDependency);
  });

  it("rejects a formula-result reference that disagrees with its dependency", () => {
    const source = placement("source", FormulaSourceType.LocalInput);
    const target = placement("target", FormulaSourceType.FormulaResult, {
      placementKey: "source",
      resultKey: "result",
    });
    target.bindings[0]!.source.reference = formulaResultReference(
      "different-source",
      "result",
    );

    const issues = validateResolvedFormulaPlacements([source, target], options);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: FormulaIssueCode.InvalidDefinition,
          message: expect.stringContaining("does not match"),
        }),
      ]),
    );
  });
});
