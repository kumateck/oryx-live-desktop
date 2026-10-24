import { FormResponseDto } from "@/shared/ard-view/dto";
import { TableReadOnly } from "@/shared/questions/table-read-only";
import { getTableConfig, parseTablePayload } from "./table-config";
import { getHeadersFromQuestion, buildGridFromCellMap } from "./table-data";

export const TableValue = ({
  value,
  response,
}: {
  value: unknown;
  response?: FormResponseDto | undefined;
}) => {
  const parsed = parseTablePayload(value);
  const questionHeaders = getHeadersFromQuestion(response);
  const tableConfig = getTableConfig(response?.formField?.question?.options);

  const isLegacyTable =
    parsed &&
    typeof parsed === "object" &&
    "headers" in parsed &&
    Array.isArray(parsed.headers) &&
    "data" in parsed &&
    Array.isArray(parsed.data);
  if (tableConfig && !isLegacyTable) {
    const values =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    return <TableReadOnly config={tableConfig} values={values} />;
  }

  if (parsed == null || parsed === "") {
    return <span className="text-sm text-muted-foreground/80">-</span>;
  }

  if (typeof parsed === "object" && parsed !== null) {
    const candidate = parsed as { headers?: unknown; data?: unknown };
    if (
      Array.isArray(candidate.headers) &&
      Array.isArray(candidate.data) &&
      candidate.headers.length > 0
    ) {
      const headers = candidate.headers.map((h) => String(h ?? ""));
      const rows = candidate.data as unknown[];
      return (
        <div className="overflow-x-auto  p-4">
          <table className="w-full min-w-[320px] border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted/40">
                {headers.map((header) => (
                  <th
                    key={header}
                    className="border border-border px-4 py-3 text-center font-semibold"
                  >
                    {header || "-"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {(Array.isArray(row) ? row : []).map((cell, cellIndex) => (
                    <td
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className="border border-border px-3 py-3"
                    >
                      <div className="rounded-xl border border-border bg-background px-4 py-3 text-foreground">
                        {String(cell ?? "-")}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const cellMapRows = buildGridFromCellMap(
      parsed as Record<string, unknown>,
      questionHeaders.length,
    );
    if (cellMapRows.length > 0) {
      const rawMap = parsed as Record<string, unknown>;
      const activeCols = Array.from(
        { length: (cellMapRows[0]?.length ?? 0) },
        (_, index) => index,
      );
      const headersFromConfig = activeCols.map(
        (col) => questionHeaders[col] || `Col ${col + 1}`,
      );

      const rowIndexes = Array.from(
        new Set(
          Object.keys(rawMap)
            .map((key) => {
              const match = key.match(/^(\d+)-(\d+)$/);
              return match ? Number(match[1]) : -1;
            })
            .filter((row) => row >= 0),
        ),
      ).sort((a, b) => a - b);

      const gridRows = rowIndexes
        .map((rowIdx) =>
          activeCols.map((colIdx) => {
            const rawCell = rawMap[`${rowIdx}-${colIdx}`];
            return String(rawCell ?? "").trim();
          }),
        )
        .filter((row) => row.some((cell) => cell.length > 0));

      if (!gridRows.length) {
        return <span className="text-sm text-muted-foreground/80">-</span>;
      }

      return (
        <div className="overflow-x-auto  p-4">
          <table className="w-full min-w-[320px] border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted/40">
                {headersFromConfig.map((header) => (
                  <th
                    key={header}
                    className="border border-border px-4 py-3 text-center font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridRows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className="border border-border px-4 py-3 text-foreground"
                    >
                      {cell || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const entries = Object.entries(parsed as Record<string, unknown>);
    if (!entries.length) {
      return <span className="text-sm text-muted-foreground/80">-</span>;
    }

    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {entries.map(([key, entryValue]) => (
          <div key={key} className=" px-2 py-1">
            <div className="text-xs text-muted-foreground">{key}</div>
            <div className="text-sm text-foreground">
              {String(entryValue ?? "-")}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-sm text-foreground">{String(parsed)}</span>;
};
