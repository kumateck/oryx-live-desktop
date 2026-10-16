import type {
  ColumnStats,
  ExpressionExtract,
  LabeledInputField,
  ManualVarsMap,
} from "./types";
import { WorksheetCalculations } from "./worksheet-calculations";
import { WorksheetInputs } from "./worksheet-inputs";
import { WorksheetTable } from "./worksheet-table";
import { normalizeFormulaExpressionText } from "@/shared/formula/compute/formula-compute";

interface WorksheetProps {
  averageResult: number | null;
  data: string[][];
  formatNumber: (
    value: number | null,
    asPercentage?: boolean,
    digitsOverride?: number,
  ) => string;
  headers: string[];
  manualVarKeys: string[];
  manualVars: ManualVarsMap;
  onCellChange: (row: number, column: number, value: string) => void;
  onManualVarChange: (key: string, value: string) => void;
  onSampleInputChange: (
    sampleIndex: number,
    inputIndex: number,
    value: string,
  ) => void;
  onStandardInputChange: (index: number, value: string) => void;
  parsed: ExpressionExtract;
  results: Array<{
    result: number | null;
    sample: string;
    substitutedExpression: string;
  }>;
  sampleInputs: LabeledInputField[][];
  standardInputs: LabeledInputField[];
  stats: ColumnStats[];
}

export const Worksheet = (props: WorksheetProps) => (
  <div className="space-y-6">
    <WorksheetInputs {...props} />
    <WorksheetTable {...props} />
    <WorksheetCalculations
      averageResult={props.averageResult}
      expression={normalizeFormulaExpressionText(props.parsed.expression)}
      formatNumber={props.formatNumber}
      percentageResults={props.parsed.percentageResults}
      results={props.results}
    />
  </div>
);
