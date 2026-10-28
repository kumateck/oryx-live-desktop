import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { procurementApi } from "@/shared/api/generated/procurement";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { shipmentDiscrepancySchema, shipmentDiscrepancyStatus, shipmentDiscrepancyAudit as audit, shipmentDiscrepancyPath, type ShipmentDiscrepancy } from "../schemas/discrepancy";
import { ShipmentDiscrepancyEvidence } from "./shipment-discrepancy-detail";
const column = dataTableColumns<ShipmentDiscrepancy>();
const columns = column.columns([
  column.accessor((row) => row.shipmentDocument.code ?? row.shipmentDocument.id, { id: "document", header: "Shipment document" }),
  column.accessor((row) => row.items.map((line) => line.material.name).join(", "), { id: "materials", header: "Materials" }),
  column.accessor(shipmentDiscrepancyStatus, { id: "state", header: "State" }),
  column.accessor("createdAt", { header: "Reported", cell: ({ row }) => formatDateTime(row.original.createdAt) ?? "–" }),
]);
export function ShipmentDiscrepancyListPage() {
  const navigate = useNavigate();
  const search = usePageSearch("shipment discrepancies");
  const query = procurementApi.useGetApiV1ProcurementShipmentDiscrepancyQuery(audit);
  const parsed = useMemo(() => shipmentDiscrepancySchema.array().safeParse(query.data), [query.data]);
  const rows = parsed.success ? parsed.data.filter((row) => `${row.shipmentDocument.code} ${row.items.map((item) => item.material.name).join(" ")} ${shipmentDiscrepancyStatus(row)}`.toLowerCase().includes(search.toLowerCase())) : [];
  return <section className="page-fill"><PageHeader title="Shipment discrepancies" crumbs={[]} actions={<PermissionGuard require={{ kind: "all", permissions: ["CanRecordShipmentDiscrepancy", "CanViewShipmentDocument"] }}><Button asChild size="sm"><Link to="/logistics/shipment-discrepancies/create">Record discrepancy</Link></Button></PermissionGuard>} />
    <ClientDataTable label="Shipment discrepancies" columns={columns} rows={rows} getRowId={(row) => row.id} loading={query.isLoading} refreshing={query.isFetching}
      error={query.error ? apiErrorMessage(query.error) : query.data && !parsed.success ? "The shipment discrepancies could not be read." : null} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(shipmentDiscrepancyPath(row.id))} emptyTitle="No shipment discrepancies" />
  </section>;
}
export function ShipmentDiscrepancyDetailPage() {
  const { id = "" } = useParams();
  return <article className="min-w-0 space-y-4"><PageHeader title="Shipment discrepancy" crumbs={[{ label: "Shipment discrepancies", to: "/logistics/shipment-discrepancies" }, { label: "Report" }]} /><ShipmentDiscrepancyEvidence id={id} /></article>;
}
