import { useEffect, useMemo, useState } from "react";
import { Eye, Send } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdQuery } from "@/modules/shipment-documents/api/shipment-api";
import { ShipmentStatusBadge } from "@/modules/shipment-documents/components/shipment-status-badge";
import { shipmentRowsSchema, shipmentSchema, type Shipment } from "@/modules/shipment-documents/schemas/shipment-schema";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatMoney } from "@/shared/procurement/price";
import { SupplierDetails } from "@/shared/procurement/supplier-details";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { toLargestUnit } from "@/shared/units/quantity";
import { useGetApiV1ProcurementShipmentDocumentArrivedQuery, useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistributionQuery } from "../api/distribution-api";
import { audit, confirmBlock, deliveryProgress, distributionPath, distributionPermissions, progressLabel, sectionProgress, shipmentDistributionPath } from "../lib/distribution";
import { distributionSchema, type DistributionSection } from "../schemas/distribution-schema";
import { ConfirmDistributionDialog } from "./confirm-distribution-dialog";
import { DistributionBreakdownDialog } from "./distribution-breakdown-dialog";

const show = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
const shipmentColumn = dataTableColumns<Shipment>();
const shipmentColumns = shipmentColumn.columns([
  shipmentColumn.accessor("code", { header: "Delivery", size: 190, cell: ({ row }) => <span className="break-words font-medium">{row.original.code}</span> }),
  shipmentColumn.accessor((row) => row.invoice?.supplier.name ?? "", { id: "supplier", header: "Supplier", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.invoice?.supplier.name ?? "–"}</div>
    <div className="break-words text-xs text-muted-foreground">Invoice {row.original.invoice?.code ?? "not recorded"}</div></div> }),
  shipmentColumn.accessor((row) => row.invoice?.items.length ?? 0, { id: "materials", header: "Materials", size: 120 }),
  shipmentColumn.accessor("kind", { header: "Document", size: 170, cell: ({ row }) => row.original.kind === "waybill" ? "Waybill" : "Shipment document" }),
  shipmentColumn.accessor("status", { header: "Stage", size: 130, cell: ({ row }) => <ShipmentStatusBadge status={row.original.status} /> }),
  shipmentColumn.accessor((row) => row.reached[4] ?? "", { id: "arrived", header: "Arrived", size: 190, cell: ({ row }) => formatDateTime(row.original.reached[4]) ?? "–" }),
  shipmentColumn.accessor("approved", { header: "Arrival", size: 180, cell: ({ row }) => row.original.approved ? <Badge variant="secondary">Approved</Badge> : <Badge variant="outline">Awaiting approval</Badge> }),
]);

/** Deliveries that have arrived and still have materials to share out. */
export function DistributionListPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("arrived deliveries", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1ProcurementShipmentDocumentArrivedQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? shipmentRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div><p className="eyebrow">PROCUREMENT</p><h1 className="text-xl font-semibold">Material distribution</h1></div>
    <ServerDataTable label="Arrived deliveries" columns={shipmentColumns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(shipmentDistributionPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned deliveries the app could not read." : null}
      emptyTitle={search.trim() ? "No deliveries match this search" : "Nothing to distribute"} emptyDescription={search.trim() ? "Search by document number." : "A delivery appears here when it is marked as arrived, and leaves once all its materials are distributed."} />
  </section>;
}

const sectionColumn = dataTableColumns<DistributionSection>();
function sectionColumns(canConfirm: boolean, shipment: { approved: boolean }, onView: (section: DistributionSection) => void, onConfirm: (section: DistributionSection) => void) {
  return sectionColumn.columns([
    sectionColumn.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
    sectionColumn.accessor("arrived", { header: "Supplied", size: 130, cell: ({ row }) => show(row.original.arrived, row.original.unit) }),
    sectionColumn.display({ id: "requested", header: "Requested", size: 130, cell: ({ row }) => show(sectionProgress(row.original).requested, row.original.unit) }),
    sectionColumn.display({ id: "allocated", header: "Allocated", size: 130, cell: ({ row }) => show(sectionProgress(row.original).allocated, row.original.unit) }),
    sectionColumn.display({ id: "remaining", header: "Remaining", size: 130, cell: ({ row }) => show(sectionProgress(row.original).remaining, row.original.unit) }),
    sectionColumn.display({ id: "departments", header: "Departments", cell: ({ row }) => <div><div className="font-medium">{row.original.shares.length}</div>
      <div className="break-words text-xs text-muted-foreground">{row.original.shares.map((share) => share.department).join(", ")}</div></div> }),
    sectionColumn.display({ id: "status", header: "Status", size: 150, cell: ({ row }) => { const percent = sectionProgress(row.original).percent;
      return <Badge variant={percent >= 100 ? "default" : percent > 0 ? "secondary" : "outline"}>{progressLabel(percent)}</Badge>; } }),
    sectionColumn.display({ id: "actions", size: canConfirm ? 230 : 100, enableHiding: false, header: () => <span className="sr-only">Actions</span>, cell: ({ row }) => { const block = confirmBlock(shipment, row.original);
      return <div className="flex justify-end gap-1.5"><Button type="button" size="sm" variant="outline" aria-label={`View ${row.original.materialName}`} onClick={() => onView(row.original)}><Eye />View</Button>
        {canConfirm ? <Button type="button" size="sm" disabled={block !== null} title={block ?? undefined} aria-label={`Distribute ${row.original.materialName}`} onClick={() => onConfirm(row.original)}><Send />Distribute</Button> : null}</div>; } }),
  ]);
}

function Detail({ id }: { id: string }) {
  const { has } = useAccess();
  const navigate = useNavigate();
  const shipmentQuery = useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdQuery({ ...audit, shipmentDocumentId: id });
  const query = useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistributionQuery({ ...audit, shipmentDocumentId: id });
  const shipment = useMemo(() => { const parsed = shipmentSchema.safeParse(shipmentQuery.data ?? null); return parsed.success ? parsed.data : null; }, [shipmentQuery.data]);
  const sections = useMemo(() => { const parsed = distributionSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : []; }, [query.data]);
  const [confirming, setConfirming] = useState<DistributionSection | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const approved = shipment?.approved === true;
  const canConfirm = has(distributionPermissions.confirm);
  const columns = useMemo(() => sectionColumns(canConfirm, { approved }, (section) => setViewing(section.materialId), setConfirming), [canConfirm, approved]);
  const progress = deliveryProgress(sections);
  // Looked up again on every render, so the breakdown follows a refetch.
  const viewed = sections.find((section) => section.materialId === viewing) ?? null;
  if (shipmentQuery.isLoading || query.isLoading) return <DetailPageSkeleton label="Loading delivery" />;
  if (!shipment) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Delivery unavailable</h1><p className="text-sm text-muted-foreground">{shipmentQuery.error ? apiErrorMessage(shipmentQuery.error) : "The server returned a delivery the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void shipmentQuery.refetch()}>Retry</Button><Button asChild size="sm"><Link to={distributionPath}>Material distribution</Link></Button></div></div>;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Distribute ${shipment.code}`} crumbs={[{ label: "Material distribution", to: distributionPath }, { label: shipment.code }]} />
    {shipment.distributedAt ? <p role="status" className="rounded-md border bg-muted/50 p-3 text-sm">Every material on this delivery was distributed on {formatDateTime(shipment.distributedAt) ?? "an unrecorded date"}.</p>
      : !approved ? <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">The arrival of this delivery is waiting for approval. Its materials can be distributed once it is approved.</p> : null}
    <div className="flex flex-wrap items-center gap-2"><ShipmentStatusBadge status={shipment.status} /><Badge variant={progress.percent >= 100 ? "default" : progress.percent > 0 ? "secondary" : "outline"}>{progressLabel(progress.percent)}</Badge>
      <span className="text-sm text-muted-foreground">{progress.complete} of {progress.of} {progress.of === 1 ? "material" : "materials"} fully allocated</span></div>
    <KeyFacts>
      <KeyFact label="Invoice" value={shipment.invoice?.code ?? "–"} note={shipment.invoice?.orders.length ? `Orders ${shipment.invoice.orders.join(", ")}` : undefined} />
      <KeyFact label="Arrived" value={formatDate(shipment.reached[4]) ?? "Pending"} />
      <KeyFact label="Materials" value={shipment.invoice?.items.length ?? 0} note={`${sections.length} still to distribute`} />
      <KeyFact label="Manufacturers" value={new Set(shipment.invoice?.items.flatMap((line) => line.manufacturer ? [line.manufacturer] : []) ?? []).size} />
      <KeyFact label="Value" value={shipment.invoice && shipment.invoice.total !== null ? formatMoney(shipment.invoice.total, shipment.invoice.currency) : "Not available"} />
    </KeyFacts>
    {shipment.invoice ? <SupplierDetails supplier={shipment.invoice.supplier} /> : null}
    {query.error ? <div role="alert" className="space-y-2 rounded-md border border-destructive/50 p-3 text-sm"><p>{apiErrorMessage(query.error)}</p>
      <p className="text-muted-foreground">A material is shared between the purchase requisitions it was bought for. If none of them still waits for it, there is nothing to share it between.</p>
      <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
      : <ClientDataTable label="Materials to distribute" columns={columns} rows={sections} getRowId={(row) => row.materialId} fill={false} emptyTitle="Nothing left to distribute" emptyDescription="Every material on this delivery has been shared out." />}
    {viewed ? <DistributionBreakdownDialog section={viewed} onClose={() => setViewing(null)}
      action={canConfirm ? <Button type="button" disabled={confirmBlock({ approved }, viewed) !== null} title={confirmBlock({ approved }, viewed) ?? undefined} onClick={() => { setViewing(null); setConfirming(viewed); }}><Send />Distribute</Button> : undefined} /> : null}
    {confirming ? <ConfirmDistributionDialog key={confirming.materialId} shipmentId={shipment.id} section={confirming} onClose={() => setConfirming(null)}
      onDone={() => { const last = sections.length <= 1; setConfirming(null); if (last) void navigate(distributionPath); }} /> : null}
  </article>;
}

export function DistributionDetailPage() {
  const { id } = useParams();
  return id ? <Detail id={id} /> : null;
}
