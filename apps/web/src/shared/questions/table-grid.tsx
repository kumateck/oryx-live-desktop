import { memo } from "react";
import { Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { cellKey, type CellConfig, type TableAnswer, type TableConfig } from "./table-question";

export type GridMode = "configure" | "preview" | "answer";
interface GridProps {
  config: TableConfig; mode: GridMode; answer: TableAnswer; labels: Record<string, string>; loadEquipment: SelectLoader; disabled?: boolean;
  onConfigure?: (key: string) => void; onRemove?: (line: { kind: "row" | "column"; index: number }) => void; onAnswer?: (key: string, value: string, label?: string) => void;
}

const Cell = memo(function Cell({ row, col, cell, mode, value, label, loadEquipment, disabled, onConfigure, onRemove, onAnswer }: Omit<GridProps, "config" | "answer" | "labels"> & {
  row: number; col: number; cell: CellConfig | undefined; value: string; label: string | undefined;
}) {
  if (cell?.isMerged) return null;
  const key = cellKey(row, col);
  const span = { colSpan: cell?.colspan ?? 1, rowSpan: cell?.rowspan ?? 1 };
  if (mode === "configure") return <td {...span} className="group relative border p-0">
    <button type="button" onClick={() => onConfigure?.(key)} aria-label={`Configure cell row ${row + 1}, column ${col + 1}`}
      className="flex h-16 w-full flex-col items-center justify-center px-2 text-xs text-muted-foreground hover:bg-muted focus-visible:bg-muted">
      {!cell || cell.type === "empty" ? <Settings aria-hidden="true" className="size-4" /> : <><span className="font-medium text-foreground">{cell.type}</span>
        {cell.label ? <span className="max-w-36 truncate">{cell.label}</span> : null}{(span.colSpan > 1 || span.rowSpan > 1) ? <span className="font-semibold">{span.colSpan}×{span.rowSpan}</span> : null}</>}
    </button>
    <Button type="button" variant="ghost" size="icon-xs" aria-label={`Delete row ${row + 1}`} className="absolute left-1 top-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      onClick={() => onRemove?.({ kind: "row", index: row })}><Trash2 className="text-destructive" /></Button>
    <Button type="button" variant="ghost" size="icon-xs" aria-label={`Delete column ${col + 1}`} className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      onClick={() => onRemove?.({ kind: "column", index: col })}><Trash2 className="text-destructive" /></Button>
  </td>;
  if (!cell || cell.type === "empty") return <td {...span} className="border bg-muted p-2" />;
  if (cell.type === "label") return <td {...span} className="border bg-muted p-2 text-center text-sm font-semibold">{cell.label}</td>;
  const readOnly = mode === "preview" || Boolean(disabled);
  const name = `Row ${row + 1}, column ${col + 1}`;
  if (cell.type === "input") return <td {...span} className="border p-1.5"><Input aria-label={name} value={value} placeholder={cell.placeholder || "Enter value"} disabled={Boolean(disabled)}
    readOnly={mode === "preview"} onChange={(event) => onAnswer?.(key, event.target.value)} className="h-8" /></td>;
  if (cell.dataSource === "async" && cell.asyncSource) return <td {...span} className="border p-1.5">
    <AsyncOptionPicker label={name} loadOptions={loadEquipment} disabled={readOnly} value={value ? { value, label: label ?? value } : null} onChange={(option) => onAnswer?.(key, option.value, option.label)} /></td>;
  return <td {...span} className="border p-1.5"><Select value={value} disabled={readOnly} onValueChange={(next) => onAnswer?.(key, next)}>
    <SelectTrigger aria-label={name} className="h-8 w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
    <SelectContent>{(cell.options ?? []).map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
  </Select></td>;
});

/** The cells of a table question: configuration buttons, a preview, or the inputs an analyst fills in. */
export function TableGrid({ config, answer, labels, ...props }: GridProps) {
  return <div className="max-w-full overflow-x-auto rounded-lg border bg-card p-2"><table className="w-full border-collapse"><tbody>
    {Array.from({ length: config.rows }, (_, row) => <tr key={row}>{Array.from({ length: config.cols }, (_, col) => { const key = cellKey(row, col);
      return <Cell key={key} row={row} col={col} cell={config.cellConfigs[key]} value={answer[key] ?? ""} label={labels[key]} {...props} />; })}</tr>)}
  </tbody></table></div>;
}
