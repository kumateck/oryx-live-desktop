import { useNavigate } from "react-router";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDateTime } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import type { DomainEntitiesApprovalsApprovalEntity } from "@/shared/api/generated/approvals";
import { financeQueueApi } from "../api/finance-api";
import { financeAudit, paymentPath } from "../lib/access";
import { PaymentToolbar } from "./payment-toolbar";
const column = dataTableColumns<DomainEntitiesApprovalsApprovalEntity>();
const columns = column.columns([
  column.accessor((row) => row.code ?? "", { id: "reference", header: "Reference" }),
  column.accessor((row) => row.department?.name ?? "", { id: "department", header: "Department" }),
  column.accessor((row) => [row.requestedBy?.firstName, row.requestedBy?.lastName].filter(Boolean).join(" "), { id: "requestedBy", header: "Recorded by" }),
  column.accessor((row) => row.createdAt ?? "", { id: "requested", header: "Requested", cell: ({ row }) => formatDateTime(row.original.createdAt) ?? "Not recorded" }),
]);
export function PaymentApprovalQueue() {
  const navigate = useNavigate();
  const query = financeQueueApi.useGetApiV1ApprovalMyPendingQuery({ ...financeAudit, subModule: "Payment approval", modelType: "Payment" }, { refetchOnMountOrArgChange: true });
  const rows = query.currentData ?? [];
  return <section className="page-fill"><PageHeader title="My payment approvals" crumbs={[{ label: "Finance" }, { label: "Payment approvals" }]} actions={<PaymentToolbar />} />
    <p className="text-sm text-muted-foreground">Payment and receipt stages assigned to you or one of your roles. Open the record to review its evidence and approval history.</p>
    <ListDataTable label="My payment approvals" columns={columns} rows={rows} getRowId={(row) => row.id ?? ""} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : rows.some((row) => !row.id || row.modelType !== "Payment") ? "The server returned an unreadable payment approval queue." : null} onRetry={() => void query.refetch()}
      onRowOpen={(row) => { if (row.id) void navigate(paymentPath(row.id, true)); }} emptyTitle="No payments awaiting your review" emptyDescription="Assigned stages appear here when they become active." />
  </section>;
}
