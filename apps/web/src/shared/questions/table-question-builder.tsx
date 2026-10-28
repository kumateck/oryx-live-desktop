import { useState } from "react";
import { Copy, Download, Eye, Upload, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionDialog } from "@/shared/actions";
import { CellConfigDialog } from "./cell-config-dialog";
import { TableGrid } from "./table-grid";
import { applyCellConfig, emptyTable, maxTableSize, parseTableConfig, removeLine, resizeTable, serializeTableConfig, type TableAnswer, type TableConfig } from "./table-question";
import { useEquipmentOptions } from "./use-equipment-options";

/** Designs the grid of a table question: its size, what each cell is, and a preview of how analysts will fill it in. */
export function TableQuestionBuilder({ value, onChange, require }: { value: string; onChange: (value: string) => void; require: string }) {
  const config = parseTableConfig(value) ?? emptyTable();
  const loadEquipment = useEquipmentOptions();
  const [mode, setMode] = useState<"configure" | "preview">("configure");
  const [size, setSize] = useState({ rows: String(config.rows), cols: String(config.cols) });
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ kind: "row" | "column"; index: number } | null>(null);
  const [resizing, setResizing] = useState<TableConfig | null>(null);
  const [preview, setPreview] = useState<TableAnswer>({});
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [jsonText, setJsonText] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState("");
  const commit = (next: TableConfig) => { onChange(serializeTableConfig(next)); setSize({ rows: String(next.rows), cols: String(next.cols) }); };
  const proposed = resizeTable(Number(size.rows), Number(size.cols));
  const download = () => { if (jsonText === null) return; const url = URL.createObjectURL(new Blob([jsonText], { type: "application/json" })); const link = document.createElement("a");
    link.href = url; link.download = "table-configuration.json"; link.click(); URL.revokeObjectURL(url); };
  const importJson = () => { const parsed = parseTableConfig(jsonText); if (!parsed) { setJsonError("This is not a table configuration."); return; } commit(parsed); setPreview({}); setJsonText(null); };
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      <div className="space-y-1"><Label htmlFor="table-rows">Rows</Label><Input id="table-rows" type="number" min={1} max={maxTableSize} className="w-20" value={size.rows} disabled={mode !== "configure"} onChange={(event) => setSize({ ...size, rows: event.target.value })} /></div>
      <div className="space-y-1"><Label htmlFor="table-cols">Columns</Label><Input id="table-cols" type="number" min={1} max={maxTableSize} className="w-20" value={size.cols} disabled={mode !== "configure"} onChange={(event) => setSize({ ...size, cols: event.target.value })} /></div>
      {mode === "configure" ? <Button type="button" variant="outline" disabled={!proposed || (proposed.rows === config.rows && proposed.cols === config.cols)} onClick={() => setResizing(proposed)}
        title={proposed ? undefined : `Rows and columns go from 1 to ${maxTableSize}.`}>Make new grid</Button> : null}
      <div className="ml-auto flex flex-wrap gap-2">
        {mode === "configure" ? <Button type="button" variant="outline" onClick={() => { setJsonError(""); setJsonText(JSON.stringify(config, null, 2)); }}><Download />Export or import</Button> : null}
        <Button type="button" variant="outline" onClick={() => setMode(mode === "configure" ? "preview" : "configure")}>{mode === "configure" ? <><Eye />Preview</> : <><Wrench />Configure</>}</Button>
      </div>
      <p className="basis-full text-xs text-muted-foreground">{mode === "configure" ? "Choose a cell to set it up. Hover a cell to delete its row or column." : "This is how analysts will see the table. Values typed here are not saved."}</p>
    </div>
    <TableGrid config={config} mode={mode} answer={preview} labels={labels} loadEquipment={loadEquipment} onConfigure={setEditing} onRemove={setRemoving}
      onAnswer={(key, entry, label) => { setPreview({ ...preview, [key]: entry }); if (label !== undefined) setLabels({ ...labels, [key]: label }); }} />
    {editing ? <CellConfigDialog cellKey={editing} config={config} onClose={() => setEditing(null)} onSave={(cell, scope, range) => { commit(applyCellConfig(config, editing, cell, scope, range)); setEditing(null); }} /> : null}
    {resizing ? <ConfirmActionDialog require={require} title={`Make a ${resizing.rows} × ${resizing.cols} grid?`} description="Every cell's setup is cleared. This cannot be undone."
      confirmLabel="Make new grid" busyLabel="Working…" onClose={() => setResizing(null)} onConfirm={async () => { commit(resizing); setPreview({}); setResizing(null); return null; }} /> : null}
    {removing ? <ConfirmActionDialog require={require} title={`Delete ${removing.kind} ${removing.index + 1}?`} description={`The cells after it move up to close the gap.${(removing.kind === "row" ? config.rows : config.cols) <= 1 ? " A table needs at least one." : ""}`}
      confirmLabel={`Delete ${removing.kind}`} busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = removeLine(config, preview, removing); if (!result) return `A table needs at least one ${removing.kind}.`; commit(result.config); setPreview(result.answer); setRemoving(null); return null; }} /> : null}
    {jsonText !== null ? <Dialog open onOpenChange={(open) => { if (!open) setJsonText(null); }}><DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Table configuration</DialogTitle><DialogDescription>Copy or download this to reuse the table, or paste one here and import it.</DialogDescription></DialogHeader>
      <DialogBody><Textarea aria-label="Table configuration" className="h-64 font-mono text-xs" value={jsonText} onChange={(event) => { setJsonText(event.target.value); setJsonError(""); }} />
        {jsonError ? <p role="alert" className="text-sm text-destructive">{jsonError}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={() => void navigator.clipboard.writeText(jsonText)}><Copy />Copy</Button>
        <Button type="button" variant="outline" onClick={download}><Download />Download</Button><Button type="button" onClick={importJson}><Upload />Import</Button></DialogFooter>
    </DialogContent></Dialog> : null}
  </div>;
}
