import { useMemo, useState } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import type { ReportBook, ReportRow } from "@/shared/reports/report-data";
import { ReportResults } from "@/shared/reports/report-results";
import { showReportCell } from "@/shared/reports/report-print";
import { useDocumentControl, documentControlLine, type DocumentControl } from "../hooks/use-document-control";
import { usePreparedBy } from "../hooks/use-prepared-by";
import { amlColumn, approvedManufacturerSummary, expiringWithinMonths, type ApprovalStatus } from "../lib/approved-manufacturers";
import { ApprovedManufacturerPrint } from "./approved-manufacturer-print";

type StatusFilter = "all" | "Expiring" | "Expired";
const statusTone: Record<ApprovalStatus, string> = {
  Valid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Expiring: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  Expired: "bg-destructive/10 text-destructive",
  "No validity date": "bg-muted text-muted-foreground",
};
const isStatus = (value: unknown): value is ApprovalStatus => typeof value === "string" && value in statusTone;
const text = (row: ReportRow, column: number) => showReportCell(row.cells[column]);
const second = (value: string) => value === "–" ? null : <span className="block text-xs text-muted-foreground">{value}</span>;
const column = dataTableColumns<ReportRow>();
/** Item code and pack size under the material name, as "RMA002 · 25 kg". */
function materialDetail(row: ReportRow): string {
  const pack = row.cells[amlColumn.pack] == null ? "" : [text(row, amlColumn.pack), row.cells[amlColumn.unit] == null ? "" : text(row, amlColumn.unit)].filter(Boolean).join(" ");
  return [row.cells[amlColumn.code] == null ? "" : text(row, amlColumn.code), pack].filter(Boolean).join(" · ") || "–";
}
/** Validity is shown as "Jun 2027"; sort on the month it names, with undated approvals last. */
function monthValue(row: ReportRow): number {
  const value = row.cells[amlColumn.validUntil];
  const parsed = typeof value === "string" ? Date.parse(`1 ${value}`) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function Tile({ label, value, tone, active, onClick }: { label: string; value: number; tone?: string | undefined; active?: boolean; onClick?: () => void }) {
  const body = <><span className="text-xs text-muted-foreground">{label}</span><span className={cn("text-2xl font-semibold tabular-nums", tone)}>{value}</span></>;
  return onClick ? <button type="button" aria-pressed={active} onClick={onClick} className={cn("flex flex-col items-start gap-0.5 rounded-lg bg-muted/60 px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", active && "ring-2 ring-ring")}>{body}</button>
    : <div className="flex flex-col gap-0.5 rounded-lg bg-muted/60 px-3 py-2.5">{body}</div>;
}

const controlFields: readonly { field: keyof DocumentControl; label: string; placeholder: string }[] = [
  { field: "reference", label: "Document reference", placeholder: "QAD/SOP/007/A03-06" },
  { field: "revision", label: "Revision", placeholder: "17" },
  { field: "supersedes", label: "Supersedes", placeholder: "16" },
];

/** The approved manufacturer list: approval tiles, a readable table, and the controlled copy for print. */
export function ApprovedManufacturerResults({ book }: { book: ReportBook }) {
  const sheet = book.sheets[0];
  const summary = useMemo(() => sheet ? approvedManufacturerSummary(sheet) : null, [sheet]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const { control, update } = useDocumentControl("approved-manufacturer-list");
  const preparedBy = usePreparedBy();
  const rows = useMemo(() => (sheet?.rows ?? []).filter((row) => status === "all" || row.cells[amlColumn.status] === status), [sheet, status]);
  const columns = useMemo(() => column.columns([
    column.accessor((row) => text(row, amlColumn.material), { id: "material", header: "Material", size: 240,
      cell: ({ row }) => <span className="break-words">{text(row.original, amlColumn.material)}{second(materialDetail(row.original))}</span> }),
    column.accessor((row) => text(row, amlColumn.manufacturer), { id: "manufacturer", header: "Manufacturer", size: 280,
      cell: ({ row }) => <span className="break-words">{text(row.original, amlColumn.manufacturer)}{second(text(row.original, amlColumn.manufacturerAddress))}</span> }),
    column.accessor((row) => text(row, amlColumn.supplier), { id: "supplier", header: "Supplier", size: 180 }),
    column.accessor((row) => text(row, amlColumn.validUntil), { id: "validity", header: "Approved → valid until", size: 190,
      sortFn: (a, b) => monthValue(a.original) - monthValue(b.original),
      cell: ({ row }) => { const value = row.original.cells[amlColumn.status]; return <span className="flex flex-col items-start gap-1">
        <span className="tabular-nums">{text(row.original, amlColumn.approvedOn)} → {text(row.original, amlColumn.validUntil)}</span>
        {isStatus(value) ? <span className={cn("rounded-full px-2 py-0.5 text-xs", statusTone[value])}>{value}</span> : null}
      </span>; } }),
  ]), []);
  if (!sheet || !summary) return <p role="status" className="text-sm text-muted-foreground">The list could not be built from this snapshot.</p>;
  const signer = { role: "Prepared by", name: preparedBy.name, signature: preparedBy.signature, signedOn: formatDate(book.generatedAt) };

  return <ReportResults book={book} printContent={<ApprovedManufacturerPrint book={book} reference={documentControlLine(control)} preparedBy={signer} />}>
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <Tile label="Materials" value={summary.materials} />
      <Tile label="Approved sources" value={summary.approvals} active={status === "all"} onClick={() => setStatus("all")} />
      <Tile label={`Expiring within ${expiringWithinMonths} months`} value={summary.expiring} tone={summary.expiring ? "text-amber-700 dark:text-amber-300" : undefined} active={status === "Expiring"} onClick={() => setStatus(status === "Expiring" ? "all" : "Expiring")} />
      <Tile label="Expired" value={summary.expired} tone={summary.expired ? "text-destructive" : undefined} active={status === "Expired"} onClick={() => setStatus(status === "Expired" ? "all" : "Expired")} />
    </div>
    <fieldset className="grid gap-3 rounded-lg border p-3 sm:grid-cols-3">
      <legend className="px-1 text-xs text-muted-foreground">Printed on the controlled copy</legend>
      {controlFields.map(({ field, label, placeholder }) => <div key={field} className="grid gap-1">
        <Label htmlFor={`aml-${field}`} className="text-xs">{label}</Label>
        <Input id={`aml-${field}`} value={control[field]} placeholder={placeholder} maxLength={80} onChange={(event) => update(field, event.target.value)} />
      </div>)}
    </fieldset>
    <ClientDataTable label={book.title} columns={columns} rows={rows} getRowId={(row) => row.id} initialPageSize={30} maxHeight="34rem"
      emptyTitle={status === "all" ? "No approved manufacturers" : `No ${status.toLowerCase()} approvals`} emptyDescription="No approvals match the applied report filters." />
  </ReportResults>;
}
