import { FormulaTypes } from "@/shared/formula/ui/legacy";

export type VarMap = Record<string, number | "">;

interface VarWithLabel {
  value: string;
  label: string;
}

export type VarMapWithLabels = Record<string, VarWithLabel>;

export type CellData = string[][];

export interface ColumnStats {
  avg: number | null;
  sd: number | null;
  rsd: number | null;
}

export interface TheAduseiFormulaProps {
  value?: string | undefined; // JSON string containing expression and fields
  onChange?: ((value: string) => void) | undefined; // Callback with JSON string
  onUniversalPayloadChange?: ((value: string) => void) | undefined;
  disabled?: boolean | undefined;
  onBack?: (() => void) | undefined;
  testMode?: boolean | undefined;
  className?: string | undefined;
}

export interface TheAduseiEvaluateProps extends TheAduseiFormulaProps {
  option: string; // Serialized ExpressionExtract from Complex builder
  showMetaPanels?: boolean | undefined;
}
export interface LabeledInputField {
  label: string;
  value: string;
  key: string;
}
export interface ColumnExpression {
  enabled: boolean;
  expression: string;
  error: string | null;
}
export interface ConfigSettings {
  standardInTable: boolean;
  standardInput: boolean;
  sampleInput: boolean;
  sampleInTable: boolean;
  formulaInTable: boolean;
  calculateAvgInTable: boolean;
  calculateSdInTable: boolean;
  calculateRsdInTable: boolean;
  percentageResults: boolean;
  averageAllResults: boolean;
  noOfSamples: number;
  noOfReadings: number;
  decimalPlaces: number | "";
  constants?: Record<string, number> | undefined;
  expression: string;
  headers?: string[] | undefined;
  standardInputs?: LabeledInputField[] | undefined;
  sampleInputs?: LabeledInputField[][] | undefined;
  manualVarLabels?: Record<string, string> | undefined;
  manualVarExpressions?: Record<string, string> | undefined;
  columnExpressions?: Record<number, ColumnExpression> | undefined;
  rowHeaders?: LabeledInputField[] | undefined;
  manualVars?: VarMapWithLabels | undefined;
}

export type UniformityMode = "capsule" | "tablet" | "tube";
export type Decimals = number | "";
export interface ExpressionExtract extends ConfigSettings {
  expression: string;
  decimalPlaces: Decimals;
  percent: boolean;
  type: FormulaTypes;
  variables?: VarMapWithLabels | undefined;
  // New: constants defined at build-time, directly usable in expressions
  // Example: { A: 2.5, B: 100 }
  constants?: Record<string, number> | undefined;

  // Table Structure
  average?: boolean | undefined;
  numberOfSamples?: number | undefined; // How many sample columns (excluding Standard)
  numberOfReadings?: number | undefined; // How many reading rows
  headers?: string[] | undefined;
  standardInputs?: LabeledInputField[] | undefined;
  sampleInputs?: LabeledInputField[][] | undefined;
  // New: whether sample weights are being picked (used) or not
  // If false, evaluator/builder will disable sample input fields visually.
  pickSampleWeights?: boolean | undefined;

  mode?: UniformityMode | undefined;

  sampleCount?: number | undefined;
  nominal?: number | null | undefined;
}
// Controlled payload for ComplexEvaluate
// - Every field is optional so the parent can choose what to control.
export interface ComplexEvaluateValue {
  // Map of standard input values by key. Example: { wt: "12.5", vol: "30" }
  standardInputs?: Record<string, string> | undefined;
  // Per-sample array of maps, aligned to samples in headers (excluding "Standard" column).
  // Example: [ { wt: "23" }, { wt: "25" } ]
  sampleInputs?: Array<Record<string, string>> | undefined;
  // Table grid values (stringified numeric-like or empty)
  tableData?: CellData | undefined;
  // Manual variable raw expressions. Example: { dilution: "(100-13.1)" }
  manualVars?: VarMapWithLabels | undefined;
}
