import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlaceStockDialog } from "@/modules/distributed-area/components/shelve-stock-dialog";
import { shelvePermissions } from "@/modules/distributed-area/lib/distributed-access";
import { amount } from "@/modules/stock-issue/components/batch-breakdown";
import { batchNumber } from "@/modules/stock-issue/lib/stock-issue";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { materialsApi } from "@/shared/api/generated/materials";
import { productionApi } from "@/shared/api/generated/production";
import { ClientDataTable, ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { audit, restocked, restockedLabels, returnNoteRowsSchema, returnNoteSchema, returnPath, returnsPath, type ReturnLine, type ReturnNote } from "../returns";

const tag = { type: "MaterialReturns" as const, id: "all" };
const { useGetApiV1ProductionScheduleMaterialReturnNoteQuery, useGetApiV1ProductionScheduleMaterialReturnNoteByMaterialReturnNoteIdQuery } = productionApi.enhanceEndpoints({ endpoints: {
  getApiV1ProductionScheduleMaterialReturnNote: { providesTags: [tag] }, getApiV1ProductionScheduleMaterialReturnNoteByMaterialReturnNoteId: { providesTags: [tag] } } });
const { usePostApiV1MaterialBatchSupplyMutation } = materialsApi.enhanceEndpoints({ endpoints: { postApiV1MaterialBatchSupply: { invalidatesTags: (_result, error) => error ? [] : [tag, "StockOnShelves"] } } });

function Standing({ note }: { note: Pick<ReturnNote, "lines"> }) {
  const state = restocked(note);
  return <Badge variant={state === "all" ? "default" : state === "part" ? "secondary" : "outline"}>{restockedLabels[state]}</Badge>;
}
const column = dataTableColumns<ReturnNote>();
const columns = column.columns([
  column.accessor((row) => row.product ?? "", { id: "product", header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.product ?? "–"}</div>
    <div className="break-words text-xs text-muted-foreground">{[row.original.schedule, row.original.batchNumber ? `Batch ${row.original.batchNumber}` : null].filter(Boolean).join(" · ") || "No schedule"}</div></div> }),
  column.accessor("full", { header: "Return", size: 150, cell: ({ row }) => row.original.full ? "Everything unused" : "Part of what was issued" }),
  column.accessor((row) => row.lines.length, { id: "materials", header: "Materials", size: 110 }),
  column.accessor((row) => row.returnDate ?? "", { id: "date", header: "Returned on", size: 150, cell: ({ row }) => formatDate(row.original.returnDate) ?? "–" }),
  column.display({ id: "status", header: "Status", size: 200, cell: ({ row }) => <Standing note={row.original} /> }),
]);

/** Notes of material sent back from production. */
export function ReturnListPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("material returns", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1ProductionScheduleMaterialReturnNoteQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? returnNoteRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Material returns</h1></div>
    <ServerDataTable label="Material return notes" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(returnPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned notes the app could not read." : null}
      emptyTitle={search.trim() ? "No notes match this search" : "No material returns"} emptyDescription={search.trim() ? "Search by batch number." : "A note appears here when production sends unused material back."} />
  </section>;
}

const printColumns: PrintColumn<ReturnLine>[] = [
  { id: "n", header: "#", cell: (_row, index) => index + 1, width: "6%" },
  { id: "material", header: "Material", cell: (row) => <>{row.materialName}<small>{row.materialCode ?? "No code"}</small></> },
  { id: "batch", header: "Batch", cell: (row) => batchNumber(row.batchNumber) },
  { id: "quantity", header: "Quantity returned", align: "right", cell: (row) => amount(row.quantity, row.unit) },
  { id: "state", header: "Restocked", cell: (row) => row.returned ? "Yes" : "No" },
];
const lineColumn = dataTableColumns<ReturnLine>();

function Detail({ id }: { id: string }) {
  const query = useGetApiV1ProductionScheduleMaterialReturnNoteByMaterialReturnNoteIdQuery({ ...audit, materialReturnNoteId: id });
  const note = useMemo(() => { const parsed = returnNoteSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  const [placing, setPlacing] = useState<ReturnLine | null>(null);
  const [shelve] = usePostApiV1MaterialBatchSupplyMutation();
  const columns = useMemo(() => lineColumn.columns([
    lineColumn.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
    lineColumn.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", size: 170, cell: ({ row }) => batchNumber(row.original.batchNumber) }),
    lineColumn.accessor("quantity", { header: "Returned", size: 150, cell: ({ row }) => amount(row.original.quantity, row.original.unit) }),
    lineColumn.accessor("returned", { header: "Status", size: 200, cell: ({ row }) => row.original.returned ? <Badge>Back on shelves</Badge> : <Badge variant="outline">Waiting to be shelved</Badge> }),
    lineColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => row.original.returned ? null
      : <TableMenu label={`Actions for ${row.original.materialName} batch ${batchNumber(row.original.batchNumber)}`} items={[{ id: "shelve", label: "Put on shelves", icon: MapPin, require: shelvePermissions[row.original.kind], onSelect: () => setPlacing(row.original),
        ...(row.original.batchId ? {} : { disabled: true, disabledReason: "The server did not say which batch this is." }) }]} /> }),
  ]), []);
  if (query.isLoading) return <DetailPageSkeleton label="Loading return note" groups={4} />;
  if (!note) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Return note unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a note the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={returnsPath}>Material returns</Link></Button></div></div>;
  const done = note.lines.filter((line) => line.returned).length;
  const title = `Return from ${note.product ?? "production"}`;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={[{ label: "Material returns", to: returnsPath }, { label: note.batchNumber ?? "Note" }]} actions={<PrintButton preview={(close) => <PrintPreviewDialog title="Material return note" onClose={close}>
      <PrintHeader title="Material return note" reference={note.batchNumber} />
      <PrintFacts facts={[{ label: "Product", value: [note.product, note.productCode].filter(Boolean).join(" · ") }, { label: "Schedule", value: note.schedule }, { label: "Batch", value: note.batchNumber }, { label: "Returned on", value: formatDate(note.returnDate) },
        { label: "Returned by", value: note.returnedBy }, { label: "Department", value: note.department }, { label: "Return", value: note.full ? "Everything unused" : "Part of what was issued" }]} />
      <PrintTable columns={printColumns} rows={note.lines} rowKey={(row) => row.key} empty="No materials on this note" />
      <PrintSignatures roles={["Returned by", "Received by", "Checked by"]} />
    </PrintPreviewDialog>} />} />
    <Standing note={note} />
    <KeyFacts>
      <KeyFact label="Product" value={note.product ?? "–"} note={note.productCode ?? undefined} />
      <KeyFact label="Schedule" value={note.schedule ?? "–"} note={note.batchNumber ? `Batch ${note.batchNumber}` : undefined} />
      <KeyFact label="Returned on" value={formatDate(note.returnDate) ?? "–"} note={[note.returnedBy, note.department].filter(Boolean).join(" · ") || undefined} />
      <KeyFact label="Return" value={note.full ? "Everything unused" : "Part of what was issued"} />
      <KeyFact label="Back on shelves" value={`${done} of ${note.lines.length}`} />
    </KeyFacts>
    <ClientDataTable label="Returned materials" columns={columns} rows={note.lines} getRowId={(row) => row.key} fill={false} emptyTitle="No materials on this note" />
    {placing?.batchId ? <PlaceStockDialog stock={placing} kind={placing.kind} title="Put returned material on shelves" description="Place the whole quantity, on one shelf or split over several." onClose={() => setPlacing(null)}
      onPlace={async (shelves) => { const result = await shelve({ ...audit, domainEntitiesMaterialsBatchSupplyMaterialBatchRequest: { materialBatchId: placing.batchId ?? "", materialReturnNoteId: note.id, shelfMaterialBatches: shelves } });
        return "error" in result ? apiErrorMessage(result.error) : null; }} /> : null}
  </article>;
}
export function ReturnDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : null;
}
