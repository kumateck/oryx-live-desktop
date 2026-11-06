import { describe, expect, it } from "vitest";

import { createFormulaCalculationService } from "../calculation-service";
import { FormulaServiceStatus } from "../contracts";
import { isFormulaV2InternalServiceEnabled } from "../feature-flags";
import {
  buildHash,
  evaluateRequest,
  limits,
  policy,
  service,
} from "./service-test-data";

describe("formula configuration service boundary", () => {
  it("reuses a bounded compiled-definition cache without changing results", async () => {
    const calculator = service();
    const request = await evaluateRequest();
    const first = await calculator.evaluate(request);
    const second = await calculator.evaluate(request);

    expect(second.evaluation).toEqual(first.evaluation);
    expect(calculator.metrics().cache).toEqual({
      entries: 1,
      maximumEntries: 256,
      hits: 1,
      misses: 1,
    });
  });

  it("rejects invalid configurations and configuration hash drift", async () => {
    const request = await evaluateRequest();
    const invalid = await service().evaluate({
      ...request,
      configuration: { ...request.configuration, bindings: [] },
    });
    const mismatched = await service().evaluate({
      ...request,
      configurationHash: "c".repeat(64),
    });

    expect(invalid.status).toBe(FormulaServiceStatus.InvalidConfiguration);
    expect(invalid.configurationIssues.length).toBeGreaterThan(0);
    expect(mismatched.status).toBe(
      FormulaServiceStatus.ConfigurationHashMismatch,
    );
    expect(mismatched.computedConfigurationHash).toBe(
      request.configurationHash,
    );
    expect(mismatched.computedInputHash).toBeNull();
  });

  it("rejects invalid provenance and unsafe limit values", () => {
    expect(() =>
      createFormulaCalculationService({
        engineBuildHash: "not-a-hash",
        supportedNumericPolicyVersion: policy,
      }),
    ).toThrow(/engineBuildHash/);
    expect(() =>
      createFormulaCalculationService({
        engineBuildHash: buildHash,
        supportedNumericPolicyVersion: policy,
        formulaLimits: { ...limits, maxDepth: 0 },
      }),
    ).toThrow(/limits/);
    expect(() =>
      createFormulaCalculationService({
        engineBuildHash: buildHash,
        supportedNumericPolicyVersion: policy,
        formulaLimits: { ...limits, maxDepth: 101 },
      }),
    ).toThrow(/hard safety maximum/);
    expect(() =>
      createFormulaCalculationService({
        engineBuildHash: buildHash,
        supportedNumericPolicyVersion: policy,
        maxCompiledDefinitions: 2_049,
      }),
    ).toThrow(/cache size/);
    const incompleteLimits = { ...limits };
    Reflect.deleteProperty(incompleteLimits, "maxDepth");
    expect(() =>
      createFormulaCalculationService({
        engineBuildHash: buildHash,
        supportedNumericPolicyVersion: policy,
        formulaLimits: incompleteLimits,
      }),
    ).toThrow(/hard safety maximum/);
  });
});

describe("formula service feature flag", () => {
  it.each([
    [undefined, false],
    ["false", false],
    ["TRUE", true],
    [" true ", true],
  ])("maps %o to %o", (value, expected) => {
    expect(isFormulaV2InternalServiceEnabled(value)).toBe(expected);
  });
});
