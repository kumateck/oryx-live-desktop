import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { stockDiscrepancySchema, stockDiscrepancyStatus, stockDiscrepancyAudit as audit, stockDiscrepancyPath, type StockDiscrepancy } from "../schemas/discrepancy";
import { StockDiscrepancyEvidence } from "./stock-discrepancy-detail";
const column = dataTableColumns<StockDiscrepancy>();
const columns = column.columns([
  column.accessor("materialName", { header: "Material" }), column.accessor("batchNumber", { header: "Batch" }),
  column.accessor("variance", { header: "Variance", cell: ({ row }) => `${formatQuantityNumber(row.original.variance, "calculated")} ${row.original.unit}` }),
  column.accessor(stockDiscrepancyStatus, { id: "state", header: "State" }),
]);
export function StockDiscrepancyListPage() {
  const navigate = useNavigate();
  const search = usePageSearch("stock discrepancies");
  const query = warehouseApi.useGetApiV1StockDiscrepancyQuery(audit);
  const parsed = useMemo(() => stockDiscrepancySchema.array().safeParse(query.data), [query.data]);
  const rows = parsed.success ? parsed.data.filter((row) => `${row.materialName} ${row.batchNumber} ${row.notes} ${stockDiscrepancyStatus(row)}`.toLowerCase().includes(search.toLowerCase())) : [];
  return <section className="page-fill"><PageHeader title="Stock discrepancies" crumbs={[]} actions={<PermissionGuard require="CanRecordStockDiscrepancy"><Button asChild size="sm"><Link to="/warehouse/stock-discrepancies/create">Record discrepancy</Link></Button></PermissionGuard>} />
    <ClientDataTable label="Stock discrepancies" columns={columns} rows={rows} getRowId={(row) => row.id} loading={query.isLoading} refreshing={query.isFetching}
      error={query.error ? apiErrorMessage(query.error) : query.data && !parsed.success ? "The discrepancy register could not be read." : null} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(stockDiscrepancyPath(row.id))} emptyTitle="No stock discrepancies" />
  </section>;
}
export function StockDiscrepancyDetailPage() {
  const { id = "" } = useParams();
  return <article className="min-w-0 space-y-4"><PageHeader title="Stock discrepancy" crumbs={[{ label: "Stock discrepancies", to: "/warehouse/stock-discrepancies" }, { label: "Report" }]} /><StockDiscrepancyEvidence id={id} /></article>;
}
