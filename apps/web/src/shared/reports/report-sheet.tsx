import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import type { ReportRow, ReportSheet } from "./report-data";
import { showReportCell } from "./report-print";
const column = dataTableColumns<ReportRow>();
export function ResultSheet({ sheet }: { sheet: ReportSheet }) {
  const [selected, setSelected] = useState<ReportRow | null>(null);
  const columns = useMemo(() => column.columns([
    ...sheet.columns.slice(0, 5).map((label, index) => column.accessor((row) => showReportCell(row.cells[index]), { id: String(index), header: label, cell: ({ getValue }) => <span className="whitespace-pre-wrap break-words">{getValue()}</span> })),
    column.display({ id: "details", header: TableMenuHeader, size: 40, cell: ({ row }) => <TableMenu label={`Details for report row ${Number(row.original.id) + 1}`} items={[{ id: "view", label: "View all fields", icon: Eye, onSelect: () => setSelected(row.original) }]} /> }),
  ]), [sheet.columns]);
  return <section className="space-y-2"><h2 className="font-semibold">{sheet.name}</h2>
    {sheet.columns.length > 5 ? <p className="text-xs text-muted-foreground">Open a row for all {sheet.columns.length} fields. Print and Excel include every field.</p> : null}
    <ClientDataTable label={sheet.name} columns={columns} rows={sheet.rows} getRowId={(row) => row.id} onRowOpen={setSelected} initialPageSize={30} maxHeight="32rem" emptyTitle="No matching records" emptyDescription="No records match the applied report filters." />
    {selected ? <Dialog open onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{sheet.name} · Row {Number(selected.id) + 1}</DialogTitle><DialogDescription>All values in this report snapshot</DialogDescription></DialogHeader>
      <DialogBody><dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{sheet.columns.map((label, index) => <div key={index}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap break-words">{showReportCell(selected.cells[index])}</dd></div>)}</dl></DialogBody>
    </DialogContent></Dialog> : null}
  </section>;
}
