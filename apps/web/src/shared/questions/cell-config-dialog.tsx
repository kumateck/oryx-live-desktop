import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseCellKey, type ApplyScope, type AsyncSource, type CellConfig, type CellType, type TableConfig } from "./table-question";

const cellTypes: { value: CellType; label: string }[] = [{ value: "empty", label: "Empty" }, { value: "label", label: "Label" }, { value: "input", label: "Text input" }, { value: "select", label: "Choice" }];
const scopes: { value: ApplyScope; label: string }[] = [{ value: "single", label: "This cell only" }, { value: "range", label: "A range of rows in this column" }, { value: "column", label: "The whole column" }];
const sources: { value: AsyncSource; label: string }[] = [{ value: "equipments", label: "QC equipment" }, { value: "reagents", label: "Reagents (QC equipment list)" }];
const whole = (value: string, fallback: number) => { const parsed = Number.parseInt(value, 10); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; };

function Choice<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Select value={value} onValueChange={(next) => { const found = options.find((option) => option.value === next); if (found) onChange(found.value); }}>
    <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}

/** What one cell of a table question is, how far it spans, and which cells the same setting applies to. */
export function CellConfigDialog({ cellKey, config, onSave, onClose }: { cellKey: string; config: TableConfig; onSave: (cell: CellConfig, scope: ApplyScope, range: { start: number; end: number }) => void; onClose: () => void }) {
  const at = parseCellKey(cellKey) ?? { row: 0, col: 0 };
  const existing = config.cellConfigs[cellKey] ?? { type: "empty" as const };
  const [cell, setCell] = useState<CellConfig>({ ...existing, colspan: existing.colspan ?? 1, rowspan: existing.rowspan ?? 1 });
  const [scope, setScope] = useState<ApplyScope>("single");
  const [range, setRange] = useState({ start: String(at.row + 1), end: String(at.row + 1) });
  const [option, setOption] = useState("");
  const addOption = () => { const text = option.trim(); if (!text || cell.options?.some((item) => item.value === text)) return; setCell({ ...cell, options: [...(cell.options ?? []), { value: text, label: text }] }); setOption(""); };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>Cell in row {at.row + 1}, column {at.col + 1}</DialogTitle><DialogDescription>Merging applies to this cell only. Bulk settings can still be changed cell by cell later.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="cell-colspan">Columns spanned</Label><Input id="cell-colspan" type="number" min={1} max={config.cols - at.col} value={cell.colspan ?? 1} disabled={scope !== "single"}
            onChange={(event) => setCell({ ...cell, colspan: Math.min(whole(event.target.value, 1), config.cols - at.col) })} /></div>
          <div className="space-y-1.5"><Label htmlFor="cell-rowspan">Rows spanned</Label><Input id="cell-rowspan" type="number" min={1} max={config.rows - at.row} value={cell.rowspan ?? 1} disabled={scope !== "single"}
            onChange={(event) => setCell({ ...cell, rowspan: Math.min(whole(event.target.value, 1), config.rows - at.row) })} /></div>
        </div>
        <Choice id="cell-scope" label="Apply to" value={scope} options={scopes} onChange={setScope} />
        {scope === "range" ? <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="cell-from">From row</Label><Input id="cell-from" type="number" min={1} max={config.rows} value={range.start} onChange={(event) => setRange({ ...range, start: event.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="cell-to">To row</Label><Input id="cell-to" type="number" min={1} max={config.rows} value={range.end} onChange={(event) => setRange({ ...range, end: event.target.value })} /></div>
        </div> : null}
        <Choice id="cell-type" label="Cell type" value={cell.type} options={cellTypes} onChange={(type) => setCell({ ...cell, type })} />
        {cell.type === "label" ? <div className="space-y-1.5"><Label htmlFor="cell-label">Label text</Label><Input id="cell-label" value={cell.label ?? ""} onChange={(event) => setCell({ ...cell, label: event.target.value })} /></div> : null}
        {cell.type === "input" ? <div className="space-y-1.5"><Label htmlFor="cell-placeholder">Placeholder</Label><Input id="cell-placeholder" value={cell.placeholder ?? ""} onChange={(event) => setCell({ ...cell, placeholder: event.target.value })} /></div> : null}
        {cell.type === "select" ? <>
          <Choice id="cell-source" label="Options come from" value={cell.dataSource ?? "sync"} options={[{ value: "sync", label: "A list written here" }, { value: "async", label: "A record list" }] as const}
            onChange={(dataSource) => { const next: CellConfig = { ...cell, dataSource, options: [] }; delete next.asyncSource; setCell(next); }} />
          {cell.dataSource === "async" ? <Choice id="cell-records" label="Record list" value={cell.asyncSource ?? "equipments"} options={sources} onChange={(asyncSource) => setCell({ ...cell, asyncSource })} />
            : <div className="space-y-2"><Label htmlFor="cell-option">Options</Label>
              <div className="flex gap-2"><Input id="cell-option" value={option} onChange={(event) => setOption(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addOption(); } }} placeholder="Add an option" />
                <Button type="button" size="icon" variant="outline" aria-label="Add option" onClick={addOption}><Plus /></Button></div>
              <ul className="flex flex-wrap gap-1.5">{(cell.options ?? []).map((item) => <li key={item.value} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">{item.label}
                <button type="button" aria-label={`Remove ${item.label}`} onClick={() => setCell({ ...cell, options: (cell.options ?? []).filter((entry) => entry.value !== item.value) })}><X className="size-3" /></button></li>)}</ul>
            </div>}
        </> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={() => onSave(cell.type === "select" && cell.dataSource === "async" && !cell.asyncSource ? { ...cell, asyncSource: "equipments" } : cell, scope, { start: whole(range.start, 1), end: whole(range.end, 1) })}>Save cell</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
