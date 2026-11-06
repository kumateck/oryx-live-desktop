import {
  FORMULA_EVALUATOR_VERSION,
  type CompiledFormulaDefinitionV1,
} from "../../../apps/web/src/shared/formula/core";
import {
  FORMULA_SERVICE_RESPONSE_V1,
  FormulaServiceOperation,
  FormulaServiceStatus,
  formulaServiceStatusNames,
  type FormulaServiceResponseV1,
} from "./contracts";

export interface PreparedFormulaRequest<T> {
  request: T & { requestId: string; definitionHash: string };
  definition: CompiledFormulaDefinitionV1;
  hash: string;
  canonical: string;
}

export const createServiceResponseFactory = (engineBuildHash: string) => {
  const response = (
    operation: FormulaServiceOperation,
    status: FormulaServiceStatus,
    values: Partial<FormulaServiceResponseV1> = {},
  ): FormulaServiceResponseV1 => ({
    schemaVersion: FORMULA_SERVICE_RESPONSE_V1,
    operation,
    requestId: null,
    status,
    statusName: formulaServiceStatusNames[status],
    evaluatorVersion: FORMULA_EVALUATOR_VERSION,
    engineBuildHash,
    claimedDefinitionHash: null,
    computedDefinitionHash: null,
    claimedConfigurationHash: null,
    computedConfigurationHash: null,
    computedInputHash: null,
    placementKey: null,
    canonicalDefinition: null,
    dependencies: [],
    definitionIssues: [],
    configurationIssues: [],
    requestIssues: [],
    evaluation: null,
    testOutcomes: [],
    ...values,
  });

  const completed = <T>(
    operation: FormulaServiceOperation,
    prepared: PreparedFormulaRequest<T>,
    values: Partial<FormulaServiceResponseV1> = {},
    status = FormulaServiceStatus.Completed,
  ): FormulaServiceResponseV1 =>
    response(operation, status, {
      requestId: prepared.request.requestId,
      claimedDefinitionHash: prepared.request.definitionHash,
      computedDefinitionHash: prepared.hash,
      canonicalDefinition: prepared.canonical,
      dependencies: prepared.definition.results.map((result) => ({
        resultKey: result.key,
        variableKeys: result.dependencies,
      })),
      ...values,
    });

  return { completed, response };
};
