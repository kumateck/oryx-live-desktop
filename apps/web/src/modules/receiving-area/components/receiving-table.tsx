import { useMemo } from "react";
import { ClipboardCheck, Eye } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns, type DataTableSelection } from "@/shared/datatable";
import { formatDateTime } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import { canCreateChecklist, checklistPermissions, createChecklistPath, viewChecklistPath } from "../lib/receiving";
import type { DeliveredMaterial } from "../schemas/receiving-schema";
import { ReceivingStatusBadge } from "./receiving-status-badge";

const column = dataTableColumns<DeliveredMaterial>();
const columns = column.columns([
  column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
  column.accessor((row) => row.supplierName ?? "", { id: "supplier", header: "Supplier", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.supplierName ?? "–"}</div>
    <div className="break-words text-xs text-muted-foreground">{row.original.manufacturer ? `Made by ${row.original.manufacturer}` : "Manufacturer not recorded"}</div></div> }),
  column.accessor((row) => row.invoiceCode ?? "", { id: "invoice", header: "Invoice", size: 150, cell: ({ row }) => row.original.invoiceCode ?? "–" }),
  column.accessor("quantity", { header: "Quantity", size: 150, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity) }),
  column.accessor((row) => row.distributedAt ?? "", { id: "distributed", header: "Distributed", size: 180, cell: ({ row }) => formatDateTime(row.original.distributedAt) ?? "–" }),
  column.accessor("status", { header: "Status", size: 190, cell: ({ row }) => <ReceivingStatusBadge status={row.original.status} /> }),
  column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.materialName}`} items={[
    canCreateChecklist(row.original.status) ? { id: "check", label: "Create checklist", icon: ClipboardCheck, require: checklistPermissions[row.original.kind], to: createChecklistPath(row.original.id) }
      : { id: "view", label: "View checklist", icon: Eye, to: viewChecklistPath(row.original.id) },
  ]} /> }),
]);

export function ReceivingTable({ rows, search, paging, loading, refreshing, error, onRetry, selection, title }: {
  rows: readonly DeliveredMaterial[]; search: string; title: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; selection?: DataTableSelection<DeliveredMaterial> | undefined;
}) {
  const shown = useMemo(() => columns, []);
  return <ServerDataTable label={title} columns={shown} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} selection={selection}
    emptyTitle={search.trim() ? "Nothing matches this search" : "Nothing here"} emptyDescription={search.trim() ? "Search by material name or code." : "Materials arrive here when a delivery is distributed to your department's store."} />;
}
