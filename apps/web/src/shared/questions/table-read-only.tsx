import type { TableConfig } from "./table-question";
const tableCellText = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "object") {
    const option = value as { label?: unknown; value?: unknown };
    return tableCellText(option.label ?? option.value);
  }
  return String(value);
};

const cellSpan = (value: number | undefined, available: number) =>
  Number.isInteger(value) && Number(value) > 0
    ? Math.min(Number(value), available)
    : 1;

export const TableReadOnly = ({
  config,
  values = {},
}: {
  config: TableConfig;
  values?: Record<string, unknown>;
}) => (
  <div className="overflow-x-auto print:overflow-visible">
    <table className="w-full min-w-[320px] border-collapse border border-border text-sm text-foreground print:min-w-0 print:text-black">
      <tbody>
        {Array.from({ length: config.rows }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: config.cols }, (_, col) => {
              const key = `${row}-${col}`;
              const cell = config.cellConfigs[key];
              if (cell?.isMerged) return null;
              const isLabel = cell?.type === "label";
              const raw = values[key];
              const selected = cell?.options?.find(
                (option) => String(option.value) === tableCellText(raw),
              );
              const text = isLabel
                ? tableCellText(cell.label)
                : tableCellText(selected?.label ?? raw);

              return (
                <td
                  key={key}
                  colSpan={cellSpan(cell?.colspan, config.cols - col)}
                  rowSpan={cellSpan(cell?.rowspan, config.rows - row)}
                  className={`border border-border px-3 py-2 align-middle whitespace-pre-wrap wrap-anywhere print:border-slate-300 ${isLabel ? "bg-muted text-center font-semibold print:bg-slate-100" : ""}`}
                >
                  {text || <div className="min-h-6" />}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
