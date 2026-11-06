import type { FormulaInput } from "../input";
import type {
  FormulaEvaluation,
  FormulaIssue,
  FormulaTestCaseV1,
  FormulaTestOutcomeV1,
} from "../../../apps/web/src/shared/formula/core";

export const FORMULA_VALIDATE_REQUEST_V1 =
  "oryx-formula-service-validate-request-v1" as const;
export const FORMULA_EVALUATE_REQUEST_V1 =
  "oryx-formula-service-evaluate-request-v1" as const;
export const FORMULA_SERVICE_RESPONSE_V1 =
  "oryx-formula-service-response-v1" as const;

export enum FormulaServiceOperation {
  Validate = 0,
  Evaluate = 1,
}

export enum FormulaServiceStatus {
  Disabled = 0,
  InvalidRequest = 1,
  InvalidDefinition = 2,
  DefinitionHashMismatch = 3,
  UnsupportedNumericPolicy = 4,
  Completed = 5,
  InvalidConfiguration = 6,
  ConfigurationHashMismatch = 7,
}

export const formulaServiceStatusNames: Record<FormulaServiceStatus, string> = {
  [FormulaServiceStatus.Disabled]: "DISABLED",
  [FormulaServiceStatus.InvalidRequest]: "INVALID_REQUEST",
  [FormulaServiceStatus.InvalidDefinition]: "INVALID_DEFINITION",
  [FormulaServiceStatus.DefinitionHashMismatch]: "DEFINITION_HASH_MISMATCH",
  [FormulaServiceStatus.UnsupportedNumericPolicy]: "UNSUPPORTED_NUMERIC_POLICY",
  [FormulaServiceStatus.Completed]: "COMPLETED",
  [FormulaServiceStatus.InvalidConfiguration]: "INVALID_CONFIGURATION",
  [FormulaServiceStatus.ConfigurationHashMismatch]:
    "CONFIGURATION_HASH_MISMATCH",
};

export interface FormulaValidateRequestV1 {
  schemaVersion: typeof FORMULA_VALIDATE_REQUEST_V1;
  requestId: string;
  formulaLanguageVersion: "oryx-formula-v1";
  numericPolicyVersion: string;
  definitionHash: string;
  definition: FormulaInput;
  testCases: FormulaTestCaseV1[];
}

export interface FormulaEvaluateRequestV1 {
  schemaVersion: typeof FORMULA_EVALUATE_REQUEST_V1;
  requestId: string;
  formulaLanguageVersion: "oryx-formula-v1";
  numericPolicyVersion: string;
  definitionHash: string;
  definition: FormulaInput;
  configurationHash: string;
  configuration: FormulaInput;
  resolvedInputs: Readonly<Record<string, string | null>>;
}

export interface FormulaServiceDependency {
  resultKey: string;
  variableKeys: string[];
}

export interface FormulaServiceResponseV1 {
  schemaVersion: typeof FORMULA_SERVICE_RESPONSE_V1;
  operation: FormulaServiceOperation;
  requestId: string | null;
  status: FormulaServiceStatus;
  statusName: string;
  evaluatorVersion: string;
  engineBuildHash: string;
  claimedDefinitionHash: string | null;
  computedDefinitionHash: string | null;
  claimedConfigurationHash: string | null;
  computedConfigurationHash: string | null;
  computedInputHash: string | null;
  placementKey: string | null;
  canonicalDefinition: string | null;
  dependencies: FormulaServiceDependency[];
  definitionIssues: FormulaIssue[];
  configurationIssues: FormulaIssue[];
  requestIssues: FormulaServiceRequestIssue[];
  evaluation: FormulaEvaluation | null;
  testOutcomes: FormulaTestOutcomeV1[];
}

export interface FormulaServiceRequestIssue {
  path: string;
  message: string;
}

export interface FormulaCalculationServiceMetrics {
  cache: {
    entries: number;
    maximumEntries: number;
    hits: number;
    misses: number;
  };
}

export interface FormulaCalculationService {
  validate(input: FormulaInput): Promise<FormulaServiceResponseV1>;
  evaluate(input: FormulaInput): Promise<FormulaServiceResponseV1>;
  metrics(): FormulaCalculationServiceMetrics;
}
