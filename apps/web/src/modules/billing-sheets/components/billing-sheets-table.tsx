import { useMemo } from "react";
import { Eye, Pencil } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { billingPermissions, billingSheetPath, editBillingSheetPath } from "../lib/billing-access";
import { changeBlock } from "../lib/billing-rules";
import type { BillingSheet } from "../schemas/billing-schema";
import { BillingSheetStatus } from "./billing-status";

const column = dataTableColumns<BillingSheet>();

export function BillingSheetsTable({ rows, search, paging, loading, refreshing, error, onRetry, onOpen }: {
  rows: readonly BillingSheet[]; search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: BillingSheet) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Billing sheet", size: 190, cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.code}</div>
      <div className="break-words text-xs text-muted-foreground">Bill of lading {row.original.billOfLading ?? "not recorded"}</div></div> }),
    column.accessor((row) => row.supplier?.name ?? "", { id: "supplier", header: "Supplier", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.supplier?.name ?? "–"}</div>
      <div className="break-words text-xs text-muted-foreground">Invoice {row.original.invoiceCode ?? "not recorded"}</div></div> }),
    column.accessor((row) => row.invoiceDate ?? "", { id: "invoiceDate", header: "Invoice date", size: 150, cell: ({ row }) => formatDate(row.original.invoiceDate) ?? "–" }),
    column.accessor((row) => row.arrival ?? "", { id: "arrival", header: "Expected arrival", size: 160, cell: ({ row }) => formatDate(row.original.arrival) ?? "–" }),
    column.accessor((row) => row.freeTimeExpiry ?? "", { id: "expiry", header: "Free time ends", size: 160, cell: ({ row }) => formatDate(row.original.freeTimeExpiry) ?? "–" }),
    column.accessor("status", { header: "Status", size: 170, cell: ({ row }) => <BillingSheetStatus sheet={row.original} /> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const block = changeBlock({ ...row.original, charges: [] });
      return <TableMenu label={`Actions for ${row.original.code}`} items={[
        { id: "view", label: "View", icon: Eye, to: billingSheetPath(row.original.id) },
        { id: "edit", label: "Edit", icon: Pencil, require: billingPermissions.edit, to: editBillingSheetPath(row.original.id), ...(block ? { disabled: true, disabledReason: block } : {}) },
      ]} />; } }),
  ]), []);
  return <ServerDataTable label="Billing sheets" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={search.trim() ? "No billing sheets match this search" : "No billing sheets"} emptyDescription={search.trim() ? "Search by sheet number or bill of lading." : "A billing sheet is created for a shipment once it reaches the port."} />;
}
