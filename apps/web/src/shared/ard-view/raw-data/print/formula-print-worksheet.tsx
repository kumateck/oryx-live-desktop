import { sanitizeString } from "@/shared/ard-view/legacy";
import type {
  ColumnStats,
  ExpressionExtract,
} from "@/shared/formula/ui/types/expression/universal/types";
import ExpressionRenderer from "@/shared/formula/ui/math/expression-view";
import {
  normalizeFormulaExpressionText,
  type FormulaComputedResult,
} from "@/shared/formula/compute/formula-compute";

import { formatFormulaEquationResult } from "./formula-result-display";

type FormulaPrintWorksheetProps = {
  averageResult: number | null;
  data: string[][];
  formatNumber: (
    value: number | null | string | undefined,
    asPercentage?: boolean,
  ) => string;
  hasFormulaValues: boolean;
  headers: string[];
  parsed: ExpressionExtract;
  readingLabels: string[];
  results: FormulaComputedResult[];
  stats: ColumnStats[];
};

const StatsRow = ({
  formatNumber,
  headers,
  label,
  values,
}: {
  formatNumber: FormulaPrintWorksheetProps["formatNumber"];
  headers: string[];
  label: string;
  values: Array<number | null>;
}) => (
  <tr>
    <td className="border border-border print:border-slate-300 px-1 py-1 font-semibold">
      {label}
    </td>
    {headers.map((_header, index) => (
      <td
        key={`${label}-${index}`}
        className="border border-border print:border-slate-300 px-1 py-1 font-semibold"
      >
        {formatNumber(values[index], false)}
      </td>
    ))}
  </tr>
);

const FormulaPrintWorksheet = ({
  averageResult,
  data,
  formatNumber,
  hasFormulaValues,
  headers,
  parsed,
  readingLabels,
  results,
  stats,
}: FormulaPrintWorksheetProps) => (
  <>
    {(headers.length > 0 || data.length > 0) && (
      <div className="space-y-1">
        <div className="font-semibold uppercase tracking-wide">Data Table</div>
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="border border-border print:border-slate-300 px-1 py-1 text-left">
                Reading
              </th>
              {headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className="border border-border print:border-slate-300 px-1 py-1 text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {readingLabels.map((label, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                <td className="border border-border print:border-slate-300 px-1 py-1">
                  {label}
                </td>
                {headers.map((_header, colIndex) => (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="border border-border print:border-slate-300 px-1 py-1"
                  >
                    {sanitizeString(data[rowIndex]?.[colIndex]) || "-"}
                  </td>
                ))}
              </tr>
            ))}
            {parsed.calculateAvgInTable === true && (
              <StatsRow
                formatNumber={formatNumber}
                headers={headers}
                label="Average"
                values={stats.map((entry) => entry.avg)}
              />
            )}
            {parsed.calculateSdInTable === true && (
              <StatsRow
                formatNumber={formatNumber}
                headers={headers}
                label="SD"
                values={stats.map((entry) => entry.sd)}
              />
            )}
            {parsed.calculateRsdInTable === true && (
              <StatsRow
                formatNumber={formatNumber}
                headers={headers}
                label="RSD (%)"
                values={stats.map((entry) => entry.rsd)}
              />
            )}
          </tbody>
        </table>
      </div>
    )}
    <div className="space-y-0.5">
      <div className="flex items-center justify-between space-y-0.5 px-2 print:border-slate-300">
        <div className="font-semibold tracking-wide">Calculations:</div>
        {averageResult !== null && (
          <div className="text-sm font-semibold text-blue-600 print:text-black">
            Average {parsed.percentageResults ? "% " : ""} content:{" "}
            {formatNumber(averageResult)}
          </div>
        )}
      </div>
      <div className="px-2 print:border-slate-300">
        <ExpressionRenderer
          print
          className="text-sm"
          expression={normalizeFormulaExpressionText(parsed.expression)}
          option={{ append100: parsed.percentageResults, result: null }}
        />
      </div>
      {hasFormulaValues &&
        results.map((entry, index) => (
          <div
            key={`${entry.sample}-${index}`}
            className="flex items-center gap-2 p-1.5 print:border-slate-300"
          >
            <div className="whitespace-nowrap text-sm font-semibold">
              {entry.sample || `${index + 1}`}
            </div>
            <div className="w-full px-2 print:border-slate-300">
              <ExpressionRenderer
                print
                className="text-sm"
                expression={entry.substitutedExpression}
                option={{
                  append100: parsed.percentageResults,
                  result: formatFormulaEquationResult({
                    value: entry.result,
                    percentageResults: parsed.percentageResults,
                    decimalPlaces: parsed.decimalPlaces,
                  }),
                }}
              />
            </div>
          </div>
        ))}
    </div>
  </>
);

export default FormulaPrintWorksheet;
