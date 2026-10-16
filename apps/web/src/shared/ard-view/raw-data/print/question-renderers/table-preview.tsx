import { sanitizeNumber, sanitizeString } from "@/shared/ard-view/legacy";
import { QuestionOptionDto } from "@/shared/ard-view/dto";

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

const parseTableConfig = (
  options?: QuestionOptionDto[],
): TableConfig | null => {
  const raw = sanitizeString(options?.[0]?.name);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TableConfig;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const renderTablePreview = (options?: QuestionOptionDto[]) => {
  const cfg = parseTableConfig(options);
  const rowCount = Math.max(3, sanitizeNumber(cfg?.rows) || 5);
  const colCount = Math.max(2, sanitizeNumber(cfg?.cols) || 2);
  const headerLabels = Array.from({ length: colCount }, (_v, index) => {
    const explicitHeader = cfg?.cellConfigs?.[`0-${index}`];
    const label = sanitizeString(explicitHeader?.label);
    return label || `Column ${index + 1}`;
  });

  return (
    <div className="mt-1 overflow-x-auto">
      <table className="w-full min-w-[320px] border-collapse text-sm">
        <thead>
          <tr>
            {headerLabels.map((label, index) => (
              <th
                key={`${label}-${index}`}
                className="border border-border print:border-slate-300 bg-muted print:bg-slate-100 px-2 py-1 text-left font-semibold"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_r, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {Array.from({ length: colCount }, (_c, colIndex) => (
                <td
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="border border-border print:border-slate-300 px-2 py-2"
                >
                  <div className="h-6" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
