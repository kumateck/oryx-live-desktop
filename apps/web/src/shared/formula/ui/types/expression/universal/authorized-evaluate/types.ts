/* Core enums and primitives */

import { FormulaTypes } from "@/shared/formula/ui/legacy";
import type { NamedExpressionDefinition } from "../types";

export type FirstColumnPurpose = "standard" | "blank" | "titre" | "control";

/* Table and stats */

export type CellData = string[][];

export interface ColumnStats {
  avg: number | null;
  sd: number | null;
  rsd: number | null;
}

/* Inputs */

export interface LabeledInputField {
  label: string;
  value: string; // raw string as typed/entered
  key: string; // variable key (e.g., "wt")
}

/* Manual variables (new structure) */

export interface ManualVarEntry {
  label: string; // display label
  raw: string; // user-entered literal or expression (kept verbatim)
  evaluated: number | null; // evaluated numeric result (null if invalid/unresolved)
}

export type ManualVarsMap = Record<string, ManualVarEntry>;

/* Backward-compatible variable maps (used by useVariableExtraction) */

export type VarMap = Record<string, string>;

export type VarMapWithLabels = Record<
  string,
  {
    value?: string | number | undefined;
    label: string;
  }
>;

/* Column expressions */

export interface ColumnExpressionEntry {
  enabled: boolean;
  expression: string; // textual expression referencing other column headers
  error: string | null; // validation error (if any)
}

export type ColumnExpressionMap = Record<number, ColumnExpressionEntry>;

/* Expression configuration snapshot (builder/expression/evaluate) */

export interface ExpressionExtract {
  // Core formula
  expression: string;

  // Headers
  headers?: string[] | undefined; // final column headers; Evaluate prefers these when present
  rowHeaders?: { id: string; label: string }[];

  // Constants used in expression
  constants?: Record<string, number> | undefined;

  // Inputs (per standard or per-sample)
  standardInputs?: LabeledInputField[] | undefined;
  sampleInputs?: LabeledInputField[][] | undefined;

  // Input feature flags (used by Evaluate UI visibility)
  standardInput?: boolean | undefined; // whether standard inputs are enabled
  sampleInput?: boolean | undefined; // whether sample inputs are enabled

  // Derived column expressions (row-wise)
  columnExpressions?: ColumnExpressionMap | undefined;

  // Manual variables
  // Supports new shape (ManualVarsMap) and legacy { label, value } shape
  manualVars?:
    ManualVarsMap | Record<string, { label: string; value: string | number }>;

  // Optional metadata from earlier versions (still supported)
  manualVarLabels?: Record<string, string> | undefined;
  manualVarExpressions?: Record<string, string> | undefined;
  namedExpressionsEnabled?: boolean | undefined;
  namedExpressions?: NamedExpressionDefinition[] | undefined;

  // Display and calculation settings
  average?: boolean | undefined; // legacy alias for averageAllResults
  averageAllResults?: boolean | undefined;
  calculateAvgInTable?: boolean | undefined;
  calculateSdInTable?: boolean | undefined;
  calculateRsdInTable?: boolean | undefined;
  formulaInTable?: boolean | undefined;

  // Percentage rendering: support both legacy and canonical
  percent?: boolean | undefined; // legacy
  percentageResults?: boolean | undefined; // canonical

  // Decimal places: fixed number or "" for auto
  decimalPlaces?: number | "" | undefined;
  inputDecimalPlaces?: number | undefined;
  tableCalculationDecimalPlaces?: number | undefined;
  finalResultDecimalPlaces?: number | undefined;

  // Counts: canonical and legacy (both accepted during hydrate)
  numberOfSamples?: number | undefined;
  noOfSamples?: number | undefined; // legacy
  numberOfReadings?: number | undefined;
  noOfReadings?: number | undefined; // legacy

  // Table shape flags
  standardInTable?: boolean | undefined;
  firstColumnPurpose?: FirstColumnPurpose | undefined;

  // Optional persisted table (rare; Evaluate primarily uses its own hook state)
  tableData?: CellData | undefined;
}

export interface FrozenSnapshot {
  settings: ConfigSettings;
  headers: string[];
  rowHeaders: { id: string; label: string }[];
  standardInputs: LabeledInputField[];
  sampleInputs: LabeledInputField[][];
  columnExpressions: ColumnExpressionMap;
  constants: Record<string, number>;
  manualVars: ManualVarsMap;
  tableData?: string[][] | undefined; // NEW: persisted table cells for Evaluate/Test
}

/* Component props shared across modules */

export interface TheAduseiFormulaProps {
  value?: string | undefined; // serialized state/value
  onChange?: ((v: string) => void) | undefined; // serializer callback
  disabled?: boolean | undefined;
  className?: string | undefined;

  // Evaluate/Test support
  testMode?: boolean | undefined;
  onBack?: (() => void) | undefined;
}

/* Evaluate value envelope (emitted from Evaluate when not in test mode) */

export interface ComplexEvaluateValue {
  standardInputs: Record<string, string>; // by key
  sampleInputs: Record<string, string>[]; // array per-sample (by key)
  tableData: CellData;
  manualVars: ManualVarsMap; // new structure (raw + evaluated)
}

/* Builder/Settings configuration (live, pre-freeze) */

export interface ConfigSettings {
  // Table structure
  standardInTable: boolean;
  firstColumnPurpose: FirstColumnPurpose;

  // Inputs flags
  standardInput: boolean;
  sampleInput: boolean;
  sampleInTable: boolean; // maintained for compatibility with existing code

  // Column statistics toggles
  calculateAvgInTable: boolean;
  calculateSdInTable: boolean;
  calculateRsdInTable: boolean;

  // Rendering options
  percentageResults: boolean;
  averageAllResults: boolean;
  decimalPlaces: number | "";
  inputDecimalPlaces: number;
  tableCalculationDecimalPlaces: number;
  finalResultDecimalPlaces: number;

  // Derived columns
  formulaInTable: boolean;

  // Counts (live in builder)
  noOfSamples: number; // live field in builder (freeze as numberOfSamples externally if needed)
  noOfReadings: number; // live field in builder (freeze as numberOfReadings externally if needed)

  // Data and metadata caches (builder context)
  constants: Record<string, number>;
  expression: string;
  headers: string[];
  standardInputs: LabeledInputField[];
  sampleInputs: LabeledInputField[][];
  manualVars: ManualVarsMap; // builder may initialize labels only; raw/evaluated filled later
  manualVarLabels: Record<string, string>;
  manualVarExpressions: Record<string, string>;
  columnExpressions: ColumnExpressionMap;
  rowHeaders: { id: string; label: string }[];
  type: FormulaTypes; // added to live settings for easier access during freeze and Evaluate
}

/* ─── New unified schema types ─── */

export interface ColumnExpression {
  columnIndex: number;
  expression: string;
  dependsOn: number[];
}

export interface ManualVariable {
  label: string;
  expression: string;
}

export interface UniversalFormulaSchema {
  firstColumnInTable: boolean;
  firstColumnPurpose: FirstColumnPurpose;
  noOfCols: number;
  noOfRows: number;
  calculateAvgInTable: boolean;
  calculateSdInTable: boolean;
  calculateRsdInTable: boolean;
  formulaInTable: boolean;

  percentageResults: boolean;
  averageAllResults: boolean;
  autoCalculationDecimals: number;
  expressionResultDecimals: number;

  constants: Record<string, number>;

  // Column expressions
  columnExpressions: ColumnExpression[];

  // Master expression
  masterExpression: string;

  // Manual variables
  manualVariables: ManualVariable[];
}

export interface UniversalFormulauntime {
  table: {
    cells: (number | null)[][];
  };
  columnInputs: Record<string, number>;
  firstColumnInputs: Record<string, number>;
  manualVars: Record<string, string>;
  results: Record<string, number | null>;
}
