import type { ColumnStats, ExpressionExtract } from "./types";

interface WorksheetTableProps {
  data: string[][];
  formatNumber: (
    value: number | null,
    asPercentage?: boolean,
    digitsOverride?: number,
  ) => string;
  headers: string[];
  onCellChange: (row: number, column: number, value: string) => void;
  parsed: ExpressionExtract;
  stats: ColumnStats[];
}

const inputClass =
  "w-full rounded-none border-0 border-b border-border bg-background p-1.5 text-center text-xs transition-all focus:rounded focus:border focus:border-border focus:outline-none focus:ring-1 focus:ring-info/40";

const StatsRow = ({
  formatNumber,
  label,
  stats,
  value,
  decimalPlaces,
}: {
  formatNumber: WorksheetTableProps["formatNumber"];
  label: string;
  stats: ColumnStats[];
  value: keyof ColumnStats;
  decimalPlaces?: number | undefined;
}) => (
  <tr>
    <td className="border border-border p-2 font-bold">{label}</td>
    {stats.map((entry, index) => (
      <td
        key={`${label}-${index}`}
        className="border border-border p-2 font-semibold"
      >
        {formatNumber(entry[value], false, decimalPlaces)}
      </td>
    ))}
  </tr>
);

export const WorksheetTable = ({
  data,
  formatNumber,
  headers,
  onCellChange,
  parsed,
  stats,
}: WorksheetTableProps) => (
  <section className="space-y-3">
    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
      Data Table
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-border p-2 text-left">Reading</th>
            {headers.map((header, index) => (
              <th
                key={`${header}-${index}`}
                className="border border-border p-2 text-left"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              <td className="border border-border p-2">
                {parsed.rowHeaders?.[rowIndex]?.label ||
                  `Reading ${rowIndex + 1}`}
              </td>
              {row.map((cell, columnIndex) => (
                <td
                  key={`cell-${rowIndex}-${columnIndex}`}
                  className="border border-border p-1"
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cell}
                    onChange={(event) =>
                      onCellChange(rowIndex, columnIndex, event.target.value)
                    }
                    className={inputClass}
                    disabled={parsed.columnExpressions?.[columnIndex]?.enabled}
                    aria-label={`${headers[columnIndex]} reading ${rowIndex + 1}`}
                  />
                </td>
              ))}
            </tr>
          ))}
          {parsed.calculateAvgInTable && (
            <StatsRow
              formatNumber={formatNumber}
              label="Average"
              stats={stats}
              value="avg"
              decimalPlaces={parsed.tableCalculationDecimalPlaces}
            />
          )}
          {parsed.calculateSdInTable && (
            <StatsRow
              formatNumber={formatNumber}
              label="SD"
              stats={stats}
              value="sd"
              decimalPlaces={parsed.tableCalculationDecimalPlaces}
            />
          )}
          {parsed.calculateRsdInTable && (
            <StatsRow
              formatNumber={formatNumber}
              label="RSD (%)"
              stats={stats}
              value="rsd"
              decimalPlaces={parsed.tableCalculationDecimalPlaces}
            />
          )}
        </tbody>
      </table>
    </div>
  </section>
);
