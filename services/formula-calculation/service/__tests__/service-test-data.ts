import {
  FORMULA_LANGUAGE_V1,
  FormulaDataType,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaScope,
  FormulaSourceType,
  FormulaValueShape,
  buildDefaultFormulaTestCasesV1,
  compileFormulaDefinitionV1,
  hashCompiledFormulaDefinitionV1,
  hashResolvedFormulaConfiguration,
  type FormulaDefinitionV1,
} from "../../../../apps/web/src/shared/formula/core";
import { createFormulaCalculationService } from "../calculation-service";
import {
  FORMULA_EVALUATE_REQUEST_V1,
  FORMULA_VALIDATE_REQUEST_V1,
} from "../contracts";

export const buildHash = "a".repeat(64);
export const policy = "oryx-decimal-v1-half-up";
export const limits = {
  maxTokens: 100,
  maxAstNodes: 100,
  maxDepth: 20,
  maxVariableReferences: 20,
  maxVariables: 20,
  maxResults: 10,
  maxKeyLength: 80,
  maxExpressionLength: 1_000,
};

const definition: FormulaDefinitionV1 = {
  formulaLanguageVersion: FORMULA_LANGUAGE_V1,
  numericPolicyVersion: policy,
  variables: ["a", "b"].map((key) => ({
    key,
    label: key,
    dataType: FormulaDataType.Decimal,
    valueShape: FormulaValueShape.Scalar,
    scope: FormulaScope.Placement,
    unit: null,
    required: true,
  })),
  results: [
    {
      key: "result",
      label: "Result",
      expression: ":a/:b",
      unit: null,
      numericScale: FormulaNumericScale.Absolute,
      rounding: { kind: FormulaRoundingKind.DecimalPlaces, digits: 2 },
    },
  ],
};

export const definitionHash = async () => {
  const compiled = compileFormulaDefinitionV1(definition, limits);
  if (!compiled.ok) throw new Error("Fixture definition did not compile.");
  return hashCompiledFormulaDefinitionV1(compiled.definition);
};

const compiledDefinition = () => {
  const compiled = compileFormulaDefinitionV1(definition, limits);
  if (!compiled.ok) throw new Error("Fixture definition did not compile.");
  return compiled.definition;
};

const placementConfiguration = async () => {
  const compiled = compileFormulaDefinitionV1(definition, limits);
  if (!compiled.ok) throw new Error("Fixture definition did not compile.");
  const raw = {
    placementKey: "assay",
    definitionHash: await hashCompiledFormulaDefinitionV1(compiled.definition),
    methodReference: null,
    displayPolicy: {
      policyVersion: "oryx-formula-display-v1" as const,
      showResult: true,
      showUnit: true,
      showTrace: false,
    },
    bindings: compiled.definition.variables.map((variable) => ({
      variableKey: variable.key,
      source: {
        sourceType: FormulaSourceType.LocalInput,
        reference: `local:${variable.key}`,
        dataType: variable.dataType,
        valueShape: variable.valueShape,
        scope: variable.scope,
        unit: variable.unit,
      },
    })),
    resultTargets: compiled.definition.results.map((result) => ({
      resultKey: result.key,
      targetKey: `assay:${result.key}`,
      dataType: FormulaDataType.Decimal,
      valueShape: FormulaValueShape.Scalar,
      unit: result.unit,
    })),
  };
  const hash = await hashResolvedFormulaConfiguration({
    ...raw,
    definition: compiled.definition,
  });
  return { raw, hash };
};

export const service = (enabled = true) =>
  createFormulaCalculationService({
    enabled,
    engineBuildHash: buildHash,
    supportedNumericPolicyVersion: policy,
    formulaLimits: limits,
  });

export const validateRequest = async () => ({
  schemaVersion: FORMULA_VALIDATE_REQUEST_V1,
  requestId: "request-1",
  formulaLanguageVersion: FORMULA_LANGUAGE_V1,
  numericPolicyVersion: policy,
  definitionHash: await definitionHash(),
  definition,
  testCases: buildDefaultFormulaTestCasesV1(compiledDefinition(), {
    maxOperations: 100,
    maxTraceSteps: 10,
    maxInputDigits: 100,
    maxResultDigits: 1_000,
  }),
});

export const evaluateRequest = async () => {
  const configuration = await placementConfiguration();
  const { testCases: _testCases, ...request } = await validateRequest();
  return {
    ...request,
    schemaVersion: FORMULA_EVALUATE_REQUEST_V1,
    configurationHash: configuration.hash,
    configuration: configuration.raw,
    resolvedInputs: { a: "1", b: "2" },
  };
};
