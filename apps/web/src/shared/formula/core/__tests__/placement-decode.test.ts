import { describe, expect, it } from "vitest";

import {
  FormulaSourceType,
  type PlacementValidationOptions,
} from "../binding-contracts";
import {
  FORMULA_LANGUAGE_V1,
  FormulaDataType,
  FormulaIssueCode,
  FormulaScope,
  FormulaValueShape,
} from "../contracts";
import { decodeResolvedFormulaPlacements } from "../placement-decode";

const hash = "a".repeat(64);
const options: PlacementValidationOptions = {
  requireMethodReference: () => false,
  maxPlacements: 5,
  maxDependencyEdges: 10,
  maxPlacementKeyLength: 80,
  maxBindingsPerPlacement: 5,
  maxTargetsPerPlacement: 5,
  maxReferenceLength: 120,
  maxMethodReferenceLength: 120,
};
const definition = {
  formulaLanguageVersion: FORMULA_LANGUAGE_V1,
  numericPolicyVersion: "oryx-decimal-v1-draft",
  variables: [
    {
      key: "input",
      label: "Input",
      dataType: FormulaDataType.Decimal,
      valueShape: FormulaValueShape.Scalar,
      scope: FormulaScope.Placement,
      unit: null,
      required: true,
    },
  ],
  results: [
    {
      key: "result",
      label: "Result",
      expression: { kind: 1 as const, key: "input" },
      dependencies: ["input"],
      unit: null,
      numericScale: 0,
      rounding: { kind: 0, digits: 2 },
    },
  ],
};
const payload = () => [
  {
    placementKey: "assay",
    definitionHash: hash,
    methodReference: null,
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
          sourceType: FormulaSourceType.LocalInput,
          reference: "local:input",
          dataType: FormulaDataType.Decimal,
          valueShape: FormulaValueShape.Scalar,
          scope: FormulaScope.Placement,
          unit: null,
        },
      },
    ],
    resultTargets: [
      {
        resultKey: "result",
        targetKey: "assay:result",
        dataType: FormulaDataType.Decimal,
        valueShape: FormulaValueShape.Scalar,
        unit: null,
      },
    ],
  },
];

describe("decodeResolvedFormulaPlacements", () => {
  it("attaches only a definition from the validated hash registry", () => {
    const result = decodeResolvedFormulaPlacements(
      payload(),
      new Map([[hash, definition]]),
      options,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.placements[0]?.definition).toBe(definition);
  });

  it("rejects an unavailable definition hash", () => {
    const result = decodeResolvedFormulaPlacements(
      payload(),
      new Map(),
      options,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe(FormulaIssueCode.UnknownDefinition);
  });

  it("rejects unknown fields and oversized untrusted payloads", () => {
    const unknown = payload();
    Object.assign(unknown[0]!, { definition: { injected: true } });
    const first = decodeResolvedFormulaPlacements(
      unknown,
      new Map([[hash, definition]]),
      options,
    );
    const second = decodeResolvedFormulaPlacements(
      [
        ...payload(),
        ...payload(),
        ...payload(),
        ...payload(),
        ...payload(),
        ...payload(),
      ],
      new Map([[hash, definition]]),
      options,
    );

    expect(first.ok).toBe(false);
    expect(second.ok).toBe(false);
  });
});
