import { sanitizeString } from "@/shared/ard-view/legacy";
import { FormResponseDto } from "@/shared/ard-view/dto";

const parseTablePayload = (value: unknown): unknown => {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  if (typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    if ("value" in candidate) {
      const nested = candidate.value;
      if (typeof nested === "string") {
        const trimmed = nested.trim();
        if (!trimmed) return null;
        try {
          return JSON.parse(trimmed);
        } catch {
          return nested;
        }
      }
      if (nested && typeof nested === "object") return nested;
    }
  }
  return value;
};

const getHeadersFromQuestion = (response?: FormResponseDto): string[] => {
  const normalize = (value: unknown) => sanitizeString(value);
  const options = response?.formField?.question?.options ?? [];
  const headers = options.flatMap((opt) => {
    const label = normalize((opt as { label?: unknown })?.label);
    const value = normalize((opt as { value?: unknown })?.value);
    const name = normalize((opt as { name?: unknown })?.name);

    if (label && value && label !== value) return [label, value];
    if (label) return [label];
    if (value) return [value];
    if (name) return [name];
    return [];
  });

  return Array.from(new Set(headers));
};

type TableConfig = {
  rows?: number | undefined;
  cols?: number | undefined;
  cellConfigs?: Record<
    string,
    {
      type?: "empty" | "label" | "input" | "select" | undefined;
      label?: string | undefined;
    }
  >;
};

const parseTableConfigFromQuestion = (
  response?: FormResponseDto,
): TableConfig | null => {
  const raw = sanitizeString(response?.formField?.question?.options?.[0]?.name);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TableConfig;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // ignore invalid config payload
  }
  return null;
};

const buildGridFromCellMap = (
  raw: Record<string, unknown>,
  headerCount: number,
): string[][] => {
  const keyedCells = Object.entries(raw)
    .map(([key, value]) => {
      const match = key.match(/^(\d+)-(\d+)$/);
      if (!match) return null;
      const row = Number(match[1]);
      const col = Number(match[2]);
      if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
      return { row, col, value: String(value ?? "") };
    })
    .filter((item): item is { row: number; col: number; value: string } =>
      Boolean(item),
    );

  if (!keyedCells.length) return [];

  const maxRow = Math.max(...keyedCells.map((c) => c.row));
  const maxCol = Math.max(...keyedCells.map((c) => c.col));
  const colCount = Math.max(headerCount, maxCol + 1);
  const rows = Array.from({ length: maxRow + 1 }, () =>
    Array.from({ length: colCount }, () => ""),
  );

  keyedCells.forEach(({ row, col, value }) => {
    const target = rows[row];
    if (target) target[col] = value;
  });

  return rows;
};

export const TableValue = ({
  value,
  response,
}: {
  value: unknown;
  response?: FormResponseDto | undefined;
}) => {
  const parsed = parseTablePayload(value);
  const questionHeaders = getHeadersFromQuestion(response);
  const tableConfig = parseTableConfigFromQuestion(response);

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
      const configuredCols = sanitizeString(tableConfig?.cols)
        ? Number(tableConfig?.cols)
        : (cellMapRows[0]?.length ?? 0);
      const colCount = Number.isFinite(configuredCols)
        ? Math.max(configuredCols, cellMapRows[0]?.length ?? 0)
        : (cellMapRows[0]?.length ?? 0);

      const inputOrSelectCols = new Set<number>();
      const headerByCol = new Map<number, string>();
      if (tableConfig?.cellConfigs) {
        Object.entries(tableConfig.cellConfigs).forEach(([key, cfg]) => {
          const match = key.match(/^(\d+)-(\d+)$/);
          if (!match) return;
          const row = Number(match[1]);
          const col = Number(match[2]);
          if (cfg?.type === "input" || cfg?.type === "select") {
            inputOrSelectCols.add(col);
          }
          if (
            cfg?.type === "label" &&
            row === 0 &&
            sanitizeString(cfg?.label)
          ) {
            headerByCol.set(col, sanitizeString(cfg?.label));
          }
        });
      }

      const activeCols =
        inputOrSelectCols.size > 0
          ? Array.from(inputOrSelectCols).sort((a, b) => a - b)
          : Array.from({ length: colCount }, (_, idx) => idx);

      const headersFromConfig = activeCols.map(
        (col, idx) =>
          headerByCol.get(col) || questionHeaders[idx] || `Col ${col + 1}`,
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
