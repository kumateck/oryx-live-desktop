import { describe, expect, it } from "vitest";

import {
  FormulaSourceType,
  type ResolvedFormulaPlacement,
} from "../binding-contracts";
import { hashResolvedFormulaConfiguration } from "../configuration-hash";
import {
  FORMULA_LANGUAGE_V1,
  FormulaDataType,
  FormulaScope,
  FormulaValueShape,
} from "../contracts";

const placement = (): ResolvedFormulaPlacement => ({
  placementKey: "assay",
  definitionHash: "a".repeat(64),
  definition: {
    formulaLanguageVersion: FORMULA_LANGUAGE_V1,
    numericPolicyVersion: "oryx-decimal-v1-draft",
    variables: [],
    results: [],
  },
  methodReference: "SOP-QC-001",
  displayPolicy: {
    policyVersion: "oryx-formula-display-v1",
    showResult: true,
    showUnit: true,
    showTrace: false,
  },
  bindings: ["b", "a"].map((variableKey) => ({
    variableKey,
    source: {
      sourceType: FormulaSourceType.LocalInput,
      reference: `local:${variableKey}`,
      dataType: FormulaDataType.Decimal,
      valueShape: FormulaValueShape.Scalar,
      scope: FormulaScope.Placement,
      unit: null,
    },
  })),
  resultTargets: ["z", "x"].map((resultKey) => ({
    resultKey,
    targetKey: `target:${resultKey}`,
    dataType: FormulaDataType.Decimal,
    valueShape: FormulaValueShape.Scalar,
    unit: null,
  })),
});

describe("hashResolvedFormulaConfiguration", () => {
  it("is independent of binding and target array order", async () => {
    const first = placement();
    const second = placement();
    second.bindings.reverse();
    second.resultTargets.reverse();

    expect(await hashResolvedFormulaConfiguration(first)).toBe(
      await hashResolvedFormulaConfiguration(second),
    );
  });

  it("changes when an executable binding changes", async () => {
    const first = placement();
    const second = placement();
    second.bindings[0]!.source.reference = "local:changed";

    expect(await hashResolvedFormulaConfiguration(first)).not.toBe(
      await hashResolvedFormulaConfiguration(second),
    );
  });

  it("changes when a source precision control changes", async () => {
    const first = placement();
    const second = placement();
    first.bindings[0]!.source.inputDecimalPlaces = 2;
    second.bindings[0]!.source.inputDecimalPlaces = 3;

    expect(await hashResolvedFormulaConfiguration(first)).not.toBe(
      await hashResolvedFormulaConfiguration(second),
    );
  });

  it("changes when the controlled display policy changes", async () => {
    const first = placement();
    const second = placement();
    second.displayPolicy.showTrace = true;

    expect(await hashResolvedFormulaConfiguration(first)).not.toBe(
      await hashResolvedFormulaConfiguration(second),
    );
  });

  it("does not duplicate the compiled definition in the configuration hash", async () => {
    const first = placement();
    const second = placement();
    second.definition.numericPolicyVersion =
      "changed-only-in-embedded-definition";

    expect(await hashResolvedFormulaConfiguration(first)).toBe(
      await hashResolvedFormulaConfiguration(second),
    );
  });
});
