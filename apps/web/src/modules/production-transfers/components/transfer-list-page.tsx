import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { TableMenuHeader } from "@/shared/actions";
import { NoAccess } from "@/shared/auth/no-access";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { richTextToPlain } from "@/shared/rich-text/rich-text-view";
import { toLargestUnit } from "@/shared/units/quantity";
import { useTransferList } from "../hooks/use-transfer-list";
import { directionPermission, statusLabel, TransferDirection, TransferStatus, transferPath, type Transfer } from "../lib/transfers";
import { TransferActions } from "./transfer-actions";
import { TransferStanding } from "./transfer-standing";

const column = dataTableColumns<Transfer>();
const stages = [undefined, TransferStatus.Pending, TransferStatus.Approved, TransferStatus.Issued, TransferStatus.Rejected];
export function ProductionTransferListPage() {
  const page = useTransferList();
  const navigate = useNavigate();
  const direction = page.direction;
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.createdAt ?? "", { id: "requested", header: "Requested", cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.accessor((row) => row.material?.name ?? "", { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0 break-words"><span className="font-medium">{row.original.material?.name ?? "Not recorded"}</span><p className="text-xs text-muted-foreground">{row.original.material?.code}</p></div> }),
    column.accessor((row) => direction === TransferDirection.Incoming ? row.toDepartment?.name ?? "" : row.fromDepartment?.name ?? "", { id: "department", header: direction === TransferDirection.Incoming ? "Requested by" : "Supplying department" }),
    column.accessor((row) => row.quantity ?? "", { id: "quantity", header: "Quantity", cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.uoM?.symbol)?.text ?? "Not recorded" }),
    column.accessor((row) => richTextToPlain(row.reason), { id: "reason", header: "Reason", cell: ({ getValue }) => <span className="line-clamp-2 break-words" title={getValue()}>{getValue() || "–"}</span> }),
    column.accessor((row) => row.status ?? "", { id: "status", header: "Status", cell: ({ row }) => <TransferStanding status={row.original.status} /> }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TransferActions transfer={row.original} direction={direction} /> }),
  ]), [direction]);
  if (!page.permitted) return <NoAccess />;
  return <section className="page-fill">
    <PageHeader title="Internal stock transfers" crumbs={[{ label: "Production" }, { label: "Stock transfers" }]} />
    <p className="text-sm text-muted-foreground">Review requests to your department, or follow stock requested from other departments. Approval and warehouse issue are separate steps.</p>
    <div className="flex flex-wrap gap-3">
      <div role="group" aria-label="Transfer direction" className="flex gap-1">{[TransferDirection.Incoming, TransferDirection.Outgoing].filter((value) => page.has(directionPermission(value))).map((value) => <Button key={value} variant={direction === value ? "default" : "outline"} size="sm" aria-pressed={direction === value} onClick={() => page.change("type", String(value))}>{value === TransferDirection.Incoming ? "Incoming requests" : "Outgoing requests"}</Button>)}</div>
      <div role="group" aria-label="Transfer status" className="flex flex-wrap gap-1">{stages.map((value) => <Button key={value ?? "all"} variant={page.status === value ? "secondary" : "ghost"} size="sm" aria-pressed={page.status === value} onClick={() => page.change("status", value === undefined ? "all" : String(value))}>{value === undefined ? "All statuses" : statusLabel(value)}</Button>)}</div>
    </div>
    <ServerDataTable label="Internal stock transfers" columns={columns} rows={page.rows} getRowId={(row) => row.id} page={page.table.page} pageSize={page.table.pageSize} totalRows={page.meta.totalRows}
      onPageChange={page.table.onPageChange} onPageSizeChange={page.table.onPageSizeChange} loading={page.query.isLoading} refreshing={page.query.isFetching && !page.query.isLoading}
      error={page.error} onRetry={() => void page.query.refetch()} onRowOpen={(row) => void navigate(transferPath(row.id, direction))} emptyTitle="No transfers match" emptyDescription="Change the status or search by transfer number." />
  </section>;
}
