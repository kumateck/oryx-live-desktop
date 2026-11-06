import { describe, expect, it } from "vitest";

import {
  FormulaEvaluationStatus,
  FormulaTestCategory,
  buildDefaultFormulaTestCasesV1,
  compileFormulaDefinitionV1,
  hashCompiledFormulaDefinitionV1,
} from "../../../../apps/web/src/shared/formula/core";
import { FormulaServiceStatus } from "../contracts";
import {
  definitionHash,
  evaluateRequest,
  limits,
  service,
  validateRequest,
} from "./service-test-data";

describe("formula calculation service boundary", () => {
  it("does not trust a client that labels divide-by-zero as nominal success", async () => {
    const request = await validateRequest();
    const nominal = request.testCases.find(
      ({ category }) => category === FormulaTestCategory.Nominal,
    )!;
    nominal.resolvedInputs = { a: "1", b: "0" };
    nominal.expectedStatus = FormulaEvaluationStatus.DivideByZero;
    nominal.expectedResults = {};
    const result = await service().validate(request);
    expect(result.status).toBe(FormulaServiceStatus.Completed);
    expect(
      result.testOutcomes.find(({ id }) => id === nominal.id),
    ).toMatchObject({ passed: false });
  });
  it("is disabled by default and does not inspect the request", async () => {
    const result = await service(false).validate({ secret: "not-returned" });

    expect(result.status).toBe(FormulaServiceStatus.Disabled);
    expect(result.requestId).toBeNull();
    expect(JSON.stringify(result)).not.toContain("not-returned");
  });

  it("strictly validates and independently hashes a definition", async () => {
    const result = await service().validate(await validateRequest());

    expect(result.status).toBe(FormulaServiceStatus.Completed);
    expect(result.computedDefinitionHash).toBe(result.claimedDefinitionHash);
    expect(result.dependencies).toEqual([
      { resultKey: "result", variableKeys: ["a", "b"] },
    ]);
    expect(result.canonicalDefinition).toBeTruthy();
    expect(result.testOutcomes.length).toBeGreaterThanOrEqual(5);
    expect(result.testOutcomes.every(({ passed }) => passed)).toBe(true);
  });

  it("validates governed intermediate expressions through the service boundary", async () => {
    const request = await validateRequest();
    request.definition = structuredClone(request.definition);
    request.definition.derivedExpressions = [
      {
        key: "ratio",
        label: "Ratio",
        expression: ":a/:b",
        unit: null,
      },
    ];
    first(request.definition.results).expression = ":ratio*2";
    const compiled = compileFormulaDefinitionV1(request.definition, limits);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    request.definitionHash = await hashCompiledFormulaDefinitionV1(
      compiled.definition,
    );
    request.testCases = buildDefaultFormulaTestCasesV1(compiled.definition, {
      maxOperations: 100,
      maxTraceSteps: 20,
      maxInputDigits: 100,
      maxResultDigits: 1_000,
    });

    const result = await service().validate(request);

    expect(result.status).toBe(FormulaServiceStatus.Completed);
    expect(result.testOutcomes.every(({ passed }) => passed)).toBe(true);
  });

  it("fails a frozen test expectation without changing the definition result", async () => {
    const request = await validateRequest();
    first(request.testCases).expectedResults.result = "999.00";

    const result = await service().validate(request);

    expect(result.status).toBe(FormulaServiceStatus.Completed);
    expect(result.testOutcomes[0]?.passed).toBe(false);
  });

  it("rejects unknown request properties and hash mismatches", async () => {
    const request = await validateRequest();
    const malformed = await service().validate({ ...request, authority: 1 });
    const mismatched = await service().validate({
      ...request,
      definitionHash: "b".repeat(64),
    });

    expect(malformed.status).toBe(FormulaServiceStatus.InvalidRequest);
    expect(malformed.requestIssues[0]?.path).toBe("");
    expect(mismatched.status).toBe(FormulaServiceStatus.DefinitionHashMismatch);
    expect(mismatched.computedDefinitionHash).toBe(await definitionHash());
  });

  it("treats an omitted definition as an invalid request", async () => {
    const { definition: _definition, ...request } = await validateRequest();
    const result = await service().validate(request);

    expect(result.status).toBe(FormulaServiceStatus.InvalidRequest);
    expect(result.requestIssues[0]?.path).toBe("definition");
  });

  it("evaluates deterministically and hashes canonical resolved inputs", async () => {
    const request = await evaluateRequest();
    const first = await service().evaluate(request);
    const reordered = await service().evaluate({
      ...request,
      resolvedInputs: { b: "2", a: "1" },
    });

    expect(first.status).toBe(FormulaServiceStatus.Completed);
    expect(first.computedConfigurationHash).toBe(
      first.claimedConfigurationHash,
    );
    expect(first.placementKey).toBe("assay");
    expect(first.evaluation?.status).toBe(FormulaEvaluationStatus.Valid);
    expect(first.evaluation?.results[0]?.roundedResult).toBe("0.50");
    expect(first.computedInputHash).toBe(reordered.computedInputHash);
    expect(first.evaluation).toEqual(reordered.evaluation);
    expect(first).not.toHaveProperty("authority");
  });

  it("returns typed evaluation failures without transport failure", async () => {
    const request = await evaluateRequest();
    const result = await service().evaluate({
      ...request,
      resolvedInputs: { a: "1", b: "0" },
    });

    expect(result.status).toBe(FormulaServiceStatus.Completed);
    expect(result.evaluation?.status).toBe(
      FormulaEvaluationStatus.DivideByZero,
    );
  });

  it("fails closed for an unsupported numeric policy", async () => {
    const request = await validateRequest();
    const result = await service().validate({
      ...request,
      numericPolicyVersion: "unknown-policy-v1",
    });

    expect(result.status).toBe(FormulaServiceStatus.UnsupportedNumericPolicy);
  });
});

function first<T>(values: readonly T[]): T {
  const value = values[0];
  if (value === undefined) throw new Error("Expected fixture value");
  return value;
}
