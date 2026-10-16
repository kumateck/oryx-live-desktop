export const FORMULA_LANGUAGE_V1 = "oryx-formula-v1" as const;

export enum FormulaDataType {
  Decimal = 0,
}

export enum FormulaValueShape {
  Scalar = 0,
  TableColumn = 1,
  Table = 2,
}

export enum FormulaScope {
  Placement = 0,
  Form = 1,
  ResponseContext = 2,
}

export enum FormulaNumericScale {
  Absolute = 0,
  Ratio = 1,
  PercentagePoints = 2,
}

export enum FormulaRoundingKind {
  DecimalPlaces = 0,
  SignificantFigures = 1,
}

export enum FormulaIssueCode {
  InvalidDefinition = 0,
  UnknownToken = 1,
  DuplicateKey = 2,
  UnknownVariable = 3,
  ResourceLimit = 4,
  MissingBinding = 5,
  UnexpectedBinding = 6,
  TypeMismatch = 7,
  ShapeMismatch = 8,
  UnitMismatch = 9,
  ScopeMismatch = 10,
  CyclicDependency = 11,
  MissingTarget = 12,
  UnknownResult = 13,
  MethodReferenceRequired = 14,
  UnknownDependency = 15,
  UnknownDefinition = 16,
}

export enum FormulaIssueSeverity {
  Error = 0,
  Warning = 1,
}

export const formulaIssueNames: Record<FormulaIssueCode, string> = {
  [FormulaIssueCode.InvalidDefinition]: "INVALID_DEFINITION",
  [FormulaIssueCode.UnknownToken]: "UNKNOWN_TOKEN",
  [FormulaIssueCode.DuplicateKey]: "DUPLICATE_KEY",
  [FormulaIssueCode.UnknownVariable]: "UNKNOWN_VARIABLE",
  [FormulaIssueCode.ResourceLimit]: "RESOURCE_LIMIT",
  [FormulaIssueCode.MissingBinding]: "MISSING_BINDING",
  [FormulaIssueCode.UnexpectedBinding]: "UNEXPECTED_BINDING",
  [FormulaIssueCode.TypeMismatch]: "TYPE_MISMATCH",
  [FormulaIssueCode.ShapeMismatch]: "SHAPE_MISMATCH",
  [FormulaIssueCode.UnitMismatch]: "UNIT_MISMATCH",
  [FormulaIssueCode.ScopeMismatch]: "SCOPE_MISMATCH",
  [FormulaIssueCode.CyclicDependency]: "CYCLIC_DEPENDENCY",
  [FormulaIssueCode.MissingTarget]: "MISSING_TARGET",
  [FormulaIssueCode.UnknownResult]: "UNKNOWN_RESULT",
  [FormulaIssueCode.MethodReferenceRequired]: "METHOD_REFERENCE_REQUIRED",
  [FormulaIssueCode.UnknownDependency]: "UNKNOWN_DEPENDENCY",
  [FormulaIssueCode.UnknownDefinition]: "UNKNOWN_DEFINITION",
};

export interface FormulaIssue {
  code: FormulaIssueCode;
  severity: FormulaIssueSeverity;
  path: string;
  message: string;
  position?: number | undefined;
  variableKey?: string | undefined;
}

export interface FormulaVariableValidation {
  minimum?: string;
  maximum?: string;
}

export interface FormulaVariableDefinition {
  key: string;
  label: string;
  dataType: FormulaDataType;
  valueShape: FormulaValueShape;
  scope: FormulaScope;
  unit: string | null;
  required: boolean;
  validation?: FormulaVariableValidation;
}

export interface FormulaResultRounding {
  kind: FormulaRoundingKind;
  digits: number;
}

export interface FormulaResultDefinition {
  key: string;
  label: string;
  expression: string;
  unit: string | null;
  numericScale: FormulaNumericScale;
  rounding: FormulaResultRounding;
}

export interface FormulaDerivedExpressionDefinition {
  key: string;
  label: string;
  expression: string;
  unit: string | null;
}

export interface FormulaDefinitionV1 {
  formulaLanguageVersion: typeof FORMULA_LANGUAGE_V1;
  numericPolicyVersion: string;
  precisionPolicy?: {
    inputDecimalPlaces: number;
    tableCalculationDecimalPlaces: number;
  };
  worksheetPolicy?: {
    standardInTable: boolean;
    preprocessor?: FormulaWorksheetPreprocessorV1;
  };
  variables: FormulaVariableDefinition[];
  derivedExpressions?: FormulaDerivedExpressionDefinition[];
  results: FormulaResultDefinition[];
}

export interface FormulaWorksheetPreprocessorV1 {
  definitionHash: string;
  definition: FormulaDefinitionV1;
  validationCaseHash: string;
  configurationHash: string;
  configuration: unknown;
  inputs: Array<{ variableKey: string; row: number; column: number }>;
  outputs: Array<{ resultKey: string; row: number; column: number }>;
}

export interface ExpressionLimits {
  maxTokens: number;
  maxAstNodes: number;
  maxDepth: number;
  maxVariableReferences: number;
}

export interface FormulaLimits extends ExpressionLimits {
  maxVariables: number;
  maxResults: number;
  maxKeyLength: number;
  maxExpressionLength: number;
}
