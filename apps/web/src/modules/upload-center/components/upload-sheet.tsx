import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, FileDown, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog } from "@/shared/actions";
import type { PermissionRequirement } from "@/shared/auth/access";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { batchDatesIssue } from "@/shared/batch-dates/batch-dates";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { relatedUnits, toLargestUnit } from "@/shared/units/quantity";
import { cellText, mapColumns, missingColumns, monthCell, monthOf, rowProblems, switchUnit, type SheetField, type SheetProfile } from "../lib/sheets";
import { buildWorkbook, parseWorkbook, saveFile, type SheetRow } from "../lib/workbook";

interface Line { id: number; row: SheetRow; problems: string[] }
const show = (item: SheetField, value: SheetRow[string] | undefined) => {
  if (value === undefined || value === "") return "–";
  if (item.kind === "month") { const month = monthOf(value); return month ? formatMonthYear(`${month}-01`) ?? month : cellText(value); }
  if (item.kind === "datetime") return value instanceof Date ? formatDateTime(value.toISOString()) ?? "" : cellText(value);
  return cellText(value);
};

/** The fields of one row, edited in their own terms: numbers, months, a unit of the same family, a date and time. */
function RowDialog({ profile, columns, row, onSave, onClose }: { profile: SheetProfile; columns: Record<string, string | null>; row: SheetRow; onSave: (row: SheetRow) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<SheetRow>(row);
  const unitColumn = columns.unit;
  const units = unitColumn ? relatedUnits(cellText(row[unitColumn])) : [];
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Edit row</DialogTitle><DialogDescription>Changes apply to the sheet that is uploaded; the file on your computer is not changed.</DialogDescription></DialogHeader>
      <DialogBody className="grid gap-3 md:grid-cols-2">{profile.fields.map((item) => {
        const column = columns[item.key];
        if (!column) return null;
        const value = draft[column];
        const set = (next: SheetRow[string]) => setDraft((current) => ({ ...current, [column]: next }));
        return <label key={item.key} className="space-y-1 text-sm">{item.label}
          {item.kind === "unit" && units.length > 1 ? <Select value={cellText(value)} onValueChange={(target) => setDraft((current) => switchUnit(current, columns, target))}>
            <SelectTrigger aria-label={item.label} className="w-full"><SelectValue /></SelectTrigger><SelectContent>{units.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select>
          : item.kind === "month" ? <Input type="month" value={monthOf(value) ?? ""} onChange={(event) => set(event.target.value ? monthCell(event.target.value, item.key === "expiry") : "")} />
          : item.kind === "number" ? <Input type="number" step="any" value={cellText(value)} onChange={(event) => set(event.target.value === "" ? "" : Number(event.target.value))} />
          : <Input value={cellText(value)} onChange={(event) => set(event.target.value)} />}</label>;
      })}</DialogBody>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => { onSave(draft); onClose(); }}>Apply</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

/**
 * One upload: choose a filled sheet, check and correct its rows here, then submit the reviewed rows (or export them).
 * Rows with problems block the submit so a half-wrong sheet is never sent.
 */
export function UploadSheet({ profile, require, options, ready, template, prepare, submit, unitSwitch = false }: {
  profile: SheetProfile; require: PermissionRequirement; options?: ReactNode;
  /** Null when the choices above are complete, else what is missing. */ ready: string | null;
  template?: { label: string; download: () => Promise<string | null> };
  /** Last changes before upload, such as quantities in their smallest unit. */ prepare?: (rows: SheetRow[], columns: Record<string, string | null>) => SheetRow[];
  submit: (file: File) => Promise<string | null>; unitSwitch?: boolean;
}) {
  const permission = usePermissionAction(require);
  const [file, setFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState<{ headers: string[]; rows: SheetRow[] } | null>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [editing, setEditing] = useState<Line | null>(null);
  const [removing, setRemoving] = useState<Line | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  useEffect(() => {
    if (!file) { setSheet(null); return; }
    let current = true;
    setReading(true); setError("");
    void parseWorkbook(file).then((result) => { if (!current) return; setReading(false); if ("error" in result) { setSheet(null); setError(result.error); } else setSheet(result); });
    return () => { current = false; };
  }, [file]);
  const columns = useMemo(() => sheet ? mapColumns(sheet.headers, profile) : {}, [sheet, profile]);
  const missing = sheet ? missingColumns(profile, columns) : [];
  const lines = useMemo<Line[]>(() => (sheet?.rows ?? []).map((row, id) => {
    const problems = rowProblems(row, profile, columns);
    const made = columns.manufactured ? monthOf(row[columns.manufactured]) : null;
    const expires = columns.expiry ? monthOf(row[columns.expiry]) : null;
    const dates = batchDatesIssue(made, expires);
    return { id, row, problems: dates ? [...problems, dates.message] : problems };
  }), [sheet, profile, columns]);
  const flagged = lines.filter((line) => line.problems.length > 0).length;
  const blocked = !sheet || lines.length === 0 ? "Choose a filled sheet first." : missing.length ? `The sheet has no ${missing.join(", ")} column.` : flagged ? `Correct or remove the ${String(flagged)} row${flagged === 1 ? "" : "s"} with problems.` : ready;
  const reviewed = async (name: string) => { if (!sheet) return null; const rows = prepare ? prepare(sheet.rows, columns) : sheet.rows; return buildWorkbook(rows, sheet.headers, name); };

  const tableColumns = useMemo(() => {
    const column = dataTableColumns<Line>();
    return column.columns([
      column.display({ id: "number", header: "#", size: 56, cell: ({ row }) => row.original.id + 1 }),
      ...profile.fields.filter((item) => columns[item.key]).map((item) => column.display({ id: item.key, header: item.label, cell: ({ row }) => {
        const key = columns[item.key] ?? "";
        if (item.key === "quantity" && unitSwitch && columns.unit) { const shown = toLargestUnit(Number(cellText(row.original.row[key])), cellText(row.original.row[columns.unit])); return shown?.text ?? show(item, row.original.row[key]); }
        return <span className="break-words">{show(item, row.original.row[key])}</span>;
      } })),
      column.display({ id: "check", header: "Check", cell: ({ row }) => row.original.problems.length ? <span className="text-xs text-destructive">{row.original.problems.join("; ")}</span> : <Badge variant="outline">OK</Badge> }),
      column.display({ id: "actions", size: 96, cell: ({ row }) => <div className="flex gap-1">
        <Button size="icon-sm" variant="ghost" aria-label={`Edit row ${String(row.original.id + 1)}`} onClick={() => setEditing(row.original)}><Pencil /></Button>
        <Button size="icon-sm" variant="ghost" className="text-destructive" aria-label={`Remove row ${String(row.original.id + 1)}`} onClick={() => setRemoving(row.original)}><Trash2 /></Button></div> }),
    ]);
  }, [profile, columns, unitSwitch]);

  const reset = () => { setFile(null); setSheet(null); setInputKey((value) => value + 1); };
  return <section aria-label={profile.title} className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="font-semibold">{profile.title} upload</h2><p className="text-sm text-muted-foreground">{template ? "Download the template, fill it, choose it here, check the rows, then submit." : "Choose the sheet, check the rows, then submit."}</p></div>
      <div className="flex flex-wrap gap-2">
        {template ? <Button size="sm" variant="outline" disabled={downloading} onClick={() => { setDownloading(true); void template.download().then((problem) => { setDownloading(false); if (problem) toast.error(problem); }); }}>
          {downloading ? <Spinner /> : <Download />}{template.label}</Button> : null}
        <Button size="sm" variant="outline" disabled={!sheet || lines.length === 0} onClick={() => void reviewed(`final-${file?.name ?? profile.fileName}`).then((built) => { if (built) saveFile(built, built.name); })}><FileDown />Export reviewed sheet</Button>
        <PermissionGuard require={require}><Button size="sm" disabled={Boolean(blocked)} onClick={() => setConfirming(true)}><Upload />Submit upload</Button></PermissionGuard>
      </div></div>
    {options ? <div className="grid gap-3 md:grid-cols-3">{options}</div> : null}
    <label className="block max-w-md space-y-1 text-sm">Sheet (.xlsx, up to 10 MB)<Input key={inputKey} type="file" accept=".xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
    {reading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Reading the sheet…</p> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    {sheet && blocked ? <p className="text-sm text-amber-700 dark:text-amber-400">{blocked}</p> : null}
    {sheet ? <ListDataTable label={`${profile.title} rows`} columns={tableColumns} rows={lines} getRowId={(line) => String(line.id)} emptyTitle="No rows left" emptyDescription="Every row was removed. Choose the sheet again to start over." /> : null}
    {editing && sheet ? <RowDialog profile={profile} columns={columns} row={editing.row} onClose={() => setEditing(null)}
      onSave={(next) => setSheet((current) => current ? { ...current, rows: current.rows.map((row, index) => index === editing.id ? next : row) } : current)} /> : null}
    {removing ? <ConfirmActionDialog require={require} title={`Remove row ${String(removing.id + 1)}?`} description="It is left out of the upload. The file on your computer is not changed." confirmLabel="Remove row" busyLabel="Removing…"
      onClose={() => setRemoving(null)} onConfirm={() => { setSheet((current) => current ? { ...current, rows: current.rows.filter((_, index) => index !== removing.id) } : current); setRemoving(null); return Promise.resolve(null); }} /> : null}
    {confirming ? <ConfirmActionDialog require={require} destructive={false} title={`Submit ${String(lines.length)} ${profile.title.toLowerCase()} row${lines.length === 1 ? "" : "s"}?`}
      description="The server records what the sheet says. This cannot be undone from here." confirmLabel="Submit upload" busyLabel="Uploading…" onClose={() => setConfirming(false)}
      onConfirm={async () => {
        const denied = permission.check();
        if (denied) return denied;
        const built = await reviewed(file?.name ?? profile.fileName);
        if (!built) return "Choose a filled sheet first.";
        const problem = await submit(built);
        if (problem) return problem;
        setConfirming(false);
        toast.success(`${profile.title} uploaded`);
        reset();
        return null;
      }} /> : null}
  </section>;
}
