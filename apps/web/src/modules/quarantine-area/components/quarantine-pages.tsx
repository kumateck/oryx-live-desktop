import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetApiV1WarehouseGrnByIdQuery, useGetApiV1WarehouseGrnsQuery } from "../api/quarantine-api";
import type { ReceivedBatch } from "@/shared/material-batches/received-batch";
import { ClientDataTable, ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { BatchStatus, batchStatusLabel } from "@/shared/material-batches/batch-status";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { stockQuantity } from "../lib/distribution-plan";
import { DistributionAction } from "./distribution-action";
import { audit, grnPath, grnStatusLabels, quarantinePath, quarantinePermissions } from "../lib/quarantine";
import { grnRowsSchema, grnSchema, type Grn } from "../schemas/grn-schema";

const show = stockQuantity;
const grnColumn = dataTableColumns<Grn>();
const grnColumns = grnColumn.columns([
  grnColumn.accessor("number", { header: "GRN", size: 200, cell: ({ row }) => <span className="break-words font-medium">{row.original.number}</span> }),
  grnColumn.accessor((row) => row.batches.length, { id: "batches", header: "Batches", size: 110 }),
  grnColumn.accessor((row) => row.batches[0]?.supplier ?? "", { id: "supplier", header: "Supplier", cell: ({ row }) => [...new Set(row.original.batches.flatMap((batch) => batch.supplier ? [batch.supplier] : []))].join(", ") || "–" }),
  grnColumn.accessor((row) => row.carrier ?? "", { id: "carrier", header: "Carrier", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.carrier ?? "–"}</div><div className="text-xs text-muted-foreground">{row.original.vehicle ?? "No vehicle number"}</div></div> }),
  grnColumn.accessor((row) => row.createdAt ?? "", { id: "received", header: "Received", size: 180, cell: ({ row }) => formatDateTime(row.original.createdAt) ?? "–" }),
  grnColumn.accessor((row) => row.status ?? -1, { id: "status", header: "Status", size: 160, cell: ({ row }) => row.original.status === null ? "–" : <Badge variant={row.original.status === 2 ? "default" : row.original.status === 1 ? "secondary" : "outline"}>{grnStatusLabels[row.original.status] ?? "Unknown"}</Badge> }),
]);

/** Goods received notes, whose batches wait in quarantine for quality control. */
export function QuarantineListPage() {
  const navigate = useNavigate();
  const { kind, select, tabs } = useKindTabs(quarantinePermissions);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("goods received notes", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}` });
  const query = useGetApiV1WarehouseGrnsQuery({ ...audit, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? grnRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Quarantine area · goods received notes</h1></div>
      <KindSwitch tabs={tabs} kind={kind} onSelect={select} />
    </div>
    <ServerDataTable label="Goods received notes" columns={grnColumns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(grnPath(row.id, kind ?? 0))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned notes the app could not read." : null}
      emptyTitle={search.trim() ? "No notes match this search" : "No goods received notes"} emptyDescription={search.trim() ? "Search by GRN number or carrier." : "A note is created in the receiving area from materials that have been checked."} />
  </section>;
}

const batchColumn = dataTableColumns<ReceivedBatch>();
const batchColumns = batchColumn.columns([
  batchColumn.accessor((row) => row.number ?? "", { id: "number", header: "Batch", cell: ({ row }) => <span className="break-words font-medium">{row.original.number ?? "No number"}</span> }),
  batchColumn.accessor((row) => row.materialName ?? "", { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.materialName ?? "–"}</div>
    <div className="break-words text-xs text-muted-foreground">{row.original.manufacturer ? `Made by ${row.original.manufacturer}` : "Manufacturer not recorded"}</div></div> }),
  batchColumn.accessor((row) => row.invoice ?? "", { id: "invoice", header: "Invoice", size: 140, cell: ({ row }) => row.original.invoice ?? "–" }),
  batchColumn.accessor("total", { header: "Received", size: 140, cell: ({ row }) => show(row.original.total, row.original.unit) }),
  batchColumn.accessor((row) => row.assigned ?? -1, { id: "allocated", header: "Allocated", size: 140, cell: ({ row }) => row.original.assigned === null ? "–" : show(row.original.assigned, row.original.unit) }),
  batchColumn.accessor((row) => row.distributed ?? -1, { id: "distributed", header: "Distributed", size: 140, cell: ({ row }) => row.original.distributed === null ? "–" : show(row.original.distributed, row.original.unit) }),
  batchColumn.accessor((row) => row.retest ?? "", { id: "retest", header: "Retest", size: 140, cell: ({ row }) => formatMonthYear(row.original.retest) ?? "–" }),
  batchColumn.accessor((row) => row.made ?? "", { id: "made", header: "Manufactured", size: 140, cell: ({ row }) => formatMonthYear(row.original.made) ?? "–" }),
  batchColumn.accessor((row) => row.expires ?? "", { id: "expires", header: "Expires", size: 140, cell: ({ row }) => formatMonthYear(row.original.expires) ?? "–" }),
  batchColumn.accessor((row) => row.status ?? -1, { id: "status", header: "Status", size: 140, cell: ({ row }) => <Badge variant={row.original.status === BatchStatus.Approved || row.original.status === BatchStatus.Available ? "default" : row.original.status === BatchStatus.Rejected ? "destructive" : "outline"}>{batchStatusLabel(row.original.status)}</Badge> }),
]);
const printColumns: PrintColumn<ReceivedBatch>[] = [
  { id: "n", header: "#", cell: (_row, index) => index + 1, width: "6%" },
  { id: "material", header: "Material", cell: (row) => <>{row.materialName ?? "–"}<small>{row.manufacturer ?? ""}</small></> },
  { id: "batch", header: "Batch", cell: (row) => row.number ?? "No number" },
  { id: "invoice", header: "Invoice", cell: (row) => row.invoice ?? "–" },
  { id: "containers", header: "Containers", cell: (row) => `${row.containers} ${row.style ?? ""}` },
  { id: "quantity", header: "Quantity", align: "right", cell: (row) => show(row.total, row.unit) },
  { id: "expires", header: "Expires", cell: (row) => formatMonthYear(row.expires) ?? "–" },
];

function GrnDetail({ id }: { id: string }) {
  const access = useAccess();
  const query = useGetApiV1WarehouseGrnByIdQuery({ ...audit, id });
  const grn = useMemo(() => { const parsed = grnSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading goods received note" />;
  if (!grn) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Note unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a note the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={quarantinePath}>Quarantine area</Link></Button></div></div>;
  if (grn.batches.some((batch) => (batch.materialKind === 0 || batch.materialKind === 1) && !access.has(quarantinePermissions[batch.materialKind]))) return <NoAccess />;
  const suppliers = [...new Set(grn.batches.flatMap((batch) => batch.supplier ? [batch.supplier] : []))].join(", ");
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`GRN ${grn.number}`} crumbs={[{ label: "Quarantine area", to: quarantinePath }, { label: grn.number }]} actions={<><DistributionAction key={grn.id} grn={grn} refreshing={query.isFetching} /><PrintButton preview={(close) => <PrintPreviewDialog title={`Goods received note · ${grn.number}`} onClose={close}>
      <PrintHeader title="Goods received note" reference={grn.number} />
      <PrintFacts facts={[{ label: "Received", value: formatDateTime(grn.createdAt) }, { label: "Supplier", value: suppliers }, { label: "Carrier", value: grn.carrier }, { label: "Vehicle", value: grn.vehicle }, { label: "Declaration number", value: grn.declaration }, { label: "Remarks", value: grn.remarks }]} />
      <PrintTable columns={printColumns} rows={grn.batches} rowKey={(row) => row.id} empty="No batches on this note" />
      <PrintSignatures roles={["Received by", "Checked by", "Quality control"]} />
    </PrintPreviewDialog>} /></>} />
    <KeyFacts>
      <KeyFact label="Received" value={formatDateTime(grn.createdAt) ?? "–"} />
      <KeyFact label="Supplier" value={suppliers || "–"} />
      <KeyFact label="Carrier" value={grn.carrier ?? "–"} note={grn.vehicle ?? undefined} />
      <KeyFact label="Declaration number" value={grn.declaration ?? "–"} />
      <KeyFact label="Batches" value={grn.batches.length} />
    </KeyFacts>
    {grn.remarks ? <p className="text-sm"><span className="text-muted-foreground">Remarks: </span>{grn.remarks}</p> : null}
    <ClientDataTable label="Batches on this note" columns={batchColumns} rows={grn.batches} getRowId={(row) => row.id} fill={false} emptyTitle="No batches on this note" />
  </article>;
}

export function GrnDetailPage() {
  const { id } = useParams();
  return id ? <PermissionGuard require={{ kind: "some", permissions: Object.values(quarantinePermissions) }} fallback={<NoAccess />}><GrnDetail id={id} /></PermissionGuard> : null;
}
