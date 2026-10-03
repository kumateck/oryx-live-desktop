import { useMemo } from "react";
import { Eye, HandCoins, PencilLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import type { SupplierQuotation } from "../schemas/quotation-response-schema";

const column = dataTableColumns<SupplierQuotation>();

export function SupplierQuotationsTable({ rows, received, recordPermission, paging, loading, refreshing, error, onRetry, onOpen }: {
  rows: readonly SupplierQuotation[]; received: boolean; recordPermission: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: SupplierQuotation) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.supplier.name, { id: "supplier", header: "Supplier", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.supplier.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.supplier.currency ? `Quotes in ${row.original.supplier.currency}` : "No currency set"}</div></div> }),
    column.accessor((row) => row.items.length, { id: "materials", header: "Materials", cell: ({ row }) => <div className="min-w-0"><div>{row.original.items.length} {row.original.items.length === 1 ? "material" : "materials"}</div>
      <div className="break-words text-xs text-muted-foreground">{row.original.items.slice(0, 3).map((item) => item.materialName).join(", ")}{row.original.items.length > 3 ? ` and ${row.original.items.length - 3} more` : ""}</div></div> }),
    column.accessor("received", { header: "Status", size: 190, cell: ({ row }) => row.original.received ? <Badge variant="secondary">Prices recorded</Badge> : <Badge variant="outline">Awaiting prices</Badge> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.supplier.name}`} items={[
      !row.original.received && { id: "record", label: "Record prices", icon: HandCoins, require: recordPermission, onSelect: () => onOpen(row.original) },
      row.original.received && { id: "correct", label: "Correct prices", icon: PencilLine, require: recordPermission, onSelect: () => onOpen(row.original) },
      { id: "view", label: "View prices", icon: Eye, onSelect: () => onOpen(row.original) },
    ]} /> }),
  ]), [recordPermission, onOpen]);
  return <ServerDataTable label="Quotation responses" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={received ? "No prices recorded yet" : "No quotations waiting for prices"}
    emptyDescription={received ? "Quotations appear here once their prices are recorded." : "Quotations appear here once a request has been sent to the supplier."} />;
}
