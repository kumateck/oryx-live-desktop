import { useMemo } from "react";
import { Eye, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import type { QuotationRequest } from "../schemas/quotation-request-schema";

const column = dataTableColumns<QuotationRequest>();

export function QuotationRequestsTable({ rows, sent, sendPermission, paging, loading, refreshing, error, onRetry, onOpen }: {
  rows: readonly QuotationRequest[]; sent: boolean; sendPermission: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: QuotationRequest) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.supplier.name, { id: "supplier", header: "Supplier", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.supplier.name}</div>
      <div className={row.original.supplier.email ? "break-all text-xs text-muted-foreground" : "text-xs text-destructive"}>{row.original.supplier.email ?? "No email address"}</div></div> }),
    column.accessor((row) => row.items.length, { id: "materials", header: "Materials", cell: ({ row }) => <div className="min-w-0"><div>{row.original.items.length} {row.original.items.length === 1 ? "material" : "materials"}</div>
      <div className="break-words text-xs text-muted-foreground">{row.original.items.slice(0, 3).map((item) => item.materialName).join(", ")}{row.original.items.length > 3 ? ` and ${row.original.items.length - 3} more` : ""}</div></div> }),
    column.accessor((row) => row.sentAt ?? "", { id: "status", header: "Status", size: 200, cell: ({ row }) => row.original.sentAt
      ? <div><Badge variant="secondary">Sent</Badge><div className="mt-0.5 text-xs text-muted-foreground">{formatDate(row.original.sentAt)}</div></div> : <Badge variant="outline">Not sent</Badge> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.supplier.name}`} items={[
      row.original.sentAt ? { id: "view", label: "View request", icon: Eye, onSelect: () => onOpen(row.original) }
        : { id: "send", label: "Review and send", icon: Send, require: sendPermission, onSelect: () => onOpen(row.original) },
      !row.original.sentAt && { id: "view", label: "View request", icon: Eye, onSelect: () => onOpen(row.original) },
    ]} /> }),
  ]), [sendPermission, onOpen]);
  return <ServerDataTable label="Quotation requests" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={sent ? "No requests have been sent" : "No requests waiting"}
    emptyDescription={sent ? "Requests appear here once they are emailed to the supplier." : "Suppliers appear here once Procurement chooses them for a purchase requisition."} />;
}
