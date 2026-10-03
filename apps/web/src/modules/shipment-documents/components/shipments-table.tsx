import { useMemo } from "react";
import { Banknote, Eye, Forward, Plus, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { advanceBlock, nextStatus, shipmentKinds, shipmentPath, shipmentStatus, shipmentStatusLabels, type ShipmentKind } from "../lib/shipment-kinds";
import type { Shipment } from "../schemas/shipment-schema";
import type { ChargeAction } from "./shipment-charge-actions";
import { ShipmentStatusBadge } from "./shipment-status-badge";

const column = dataTableColumns<Shipment>();

export function ShipmentsTable({ kind, rows, search, paging, loading, refreshing, error, onRetry, onOpen, onAdvance, onCharges }: {
  kind: ShipmentKind; rows: readonly Shipment[]; search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: Shipment) => void; onAdvance: (row: Shipment) => void; onCharges: (row: Shipment, action: ChargeAction) => void;
}) {
  const config = shipmentKinds[kind];
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Document", size: 190, cell: ({ row }) => <span className="break-words font-medium">{row.original.code}</span> }),
    column.accessor((row) => row.invoice?.supplier.name ?? "", { id: "supplier", header: "Supplier", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.invoice?.supplier.name ?? "–"}</div>
      <div className="break-words text-xs text-muted-foreground">Invoice {row.original.invoice?.code ?? "not recorded"}</div></div> }),
    column.accessor((row) => row.createdAt ?? "", { id: "created", header: "Created", size: 140, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.accessor("status", { header: "Stage", size: 150, cell: ({ row }) => <ShipmentStatusBadge status={row.original.status} /> }),
    column.accessor((row) => row.reached[4] ?? "", { id: "arrived", header: "Arrived", size: 140, cell: ({ row }) => row.original.status === shipmentStatus.arrived ? formatDate(row.original.reached[4]) ?? "–" : <span className="text-muted-foreground">Not yet</span> }),
    ...(kind === "shipment" ? [column.accessor("hasBillingSheet", { header: "Billing sheet", size: 170, cell: ({ row }) => !row.original.hasBillingSheet ? <span className="text-muted-foreground">None</span>
      : row.original.billingSheetApproved ? <Badge variant="secondary">Approved</Badge> : <Badge variant="outline">Awaiting approval</Badge> })] : []),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const next = nextStatus(kind, row.original.status); const block = advanceBlock(kind, row.original);
      return <TableMenu label={`Actions for ${row.original.code}`} items={[
        { id: "view", label: "View", icon: Eye, to: shipmentPath(kind, row.original.id) },
        next !== null && { id: "advance", label: `Mark as ${shipmentStatusLabels[next].toLowerCase()}`, icon: Forward, require: config.permissions.advance, onSelect: () => onAdvance(row.original),
          ...(block ? { disabled: true, disabledReason: block } : {}) },
        kind === "shipment" && row.original.status === shipmentStatus.atPort && !row.original.hasBillingSheet && row.original.invoice
          && { id: "billing", label: "Create billing sheet", icon: Banknote, require: "CanCreateBillingSheet", to: `/logistics/billing-sheets/create?invoiceId=${row.original.invoice.id}` },
        // The port charges live on the billing sheet; without one there is nothing to pay or print.
        kind === "shipment" && row.original.invoice && { id: "pay", label: "Pay charges", icon: Banknote, require: "CanRecordPayment", onSelect: () => onCharges(row.original, "pay"),
          ...(!row.original.hasBillingSheet ? { disabled: true, disabledReason: "Create the billing sheet first." } : !row.original.billingSheetApproved ? { disabled: true, disabledReason: "The billing sheet has to be approved before its charges are paid." } : {}) },
        kind === "shipment" && row.original.invoice && { id: "add", label: "Add charges", icon: Plus, require: "CanEditBillingSheet", onSelect: () => onCharges(row.original, "add"),
          ...(!row.original.hasBillingSheet ? { disabled: true, disabledReason: "Create the billing sheet first." } : !row.original.billingSheetApproved ? { disabled: true, disabledReason: "The billing sheet can be added to once it is approved." } : {}) },
        kind === "shipment" && row.original.invoice && { id: "print", label: "Print charges", icon: Printer, require: "CanViewBillingSheet", onSelect: () => onCharges(row.original, "print"),
          ...(!row.original.hasBillingSheet ? { disabled: true, disabledReason: "Create the billing sheet first." } : {}) },
      ]} />; } }),
  ]), [kind, config.permissions.advance, onAdvance, onCharges]);
  return <ServerDataTable label={config.title} columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={search.trim() ? "Nothing matches this search" : `No ${config.title.toLowerCase()}`} emptyDescription={search.trim() ? "Search by document number." : `A ${config.singular} is created once a supplier's invoice is recorded.`} />;
}
