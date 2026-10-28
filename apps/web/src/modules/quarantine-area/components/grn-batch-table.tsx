import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { TableMenuHeader } from "@/shared/actions";
import { formatMonthYear } from "@/shared/format/dates";
import { BatchStatus, batchStatusLabel } from "@/shared/material-batches/batch-status";
import type { ReceivedBatch } from "@/shared/material-batches/received-batch";
import { stockQuantity } from "../lib/distribution-plan";
import type { Grn } from "../schemas/grn-schema";
import { BatchDistributionAction } from "./distribution-action";

const column = dataTableColumns<ReceivedBatch>();

function BatchQuantities({ batch }: { batch: ReceivedBatch }) {
  const quantity = (value: number | null) => value === null ? "–" : stockQuantity(value, batch.unit);
  return <dl className="space-y-1 tabular-nums">
    <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Received</dt><dd>{quantity(batch.total)}</dd></div>
    <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Allocated</dt><dd>{quantity(batch.assigned)}</dd></div>
    <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Distributed</dt><dd>{quantity(batch.distributed)}</dd></div>
  </dl>;
}

function BatchDates({ batch }: { batch: ReceivedBatch }) {
  return <dl className="space-y-1 tabular-nums">
    <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Manufacturing</dt><dd>{formatMonthYear(batch.made) ?? "–"}</dd></div>
    <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Expiry</dt><dd>{formatMonthYear(batch.expires) ?? "–"}</dd></div>
    <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Retest</dt><dd>{formatMonthYear(batch.retest) ?? "–"}</dd></div>
  </dl>;
}

export function GrnBatchTable({ grn, refreshing }: { grn: Grn; refreshing: boolean }) {
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.number ?? "", { id: "number", header: "Batch", size: 100,
      cell: ({ row }) => <span className="break-words font-medium">{row.original.number ?? "No number"}</span> }),
    column.accessor((row) => row.materialName ?? "", { id: "material", header: "Material", size: 150,
      cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.materialName ?? "–"}</div>
        <div className="break-words text-xs text-muted-foreground">{row.original.manufacturer ? `Made by ${row.original.manufacturer}` : "Manufacturer not recorded"}</div></div> }),
    column.accessor((row) => row.invoice ?? "", { id: "invoice", header: "Invoice", size: 105, cell: ({ row }) => row.original.invoice ?? "–" }),
    column.display({ id: "quantities", header: "Quantities", size: 175, cell: ({ row }) => <BatchQuantities batch={row.original} /> }),
    column.display({ id: "dates", header: "Dates", size: 210, cell: ({ row }) => <BatchDates batch={row.original} /> }),
    column.accessor((row) => row.status ?? -1, { id: "status", header: "Status", size: 100,
      cell: ({ row }) => <Badge variant={row.original.status === BatchStatus.Approved || row.original.status === BatchStatus.Available ? "default" : row.original.status === BatchStatus.Rejected ? "destructive" : "outline"}>{batchStatusLabel(row.original.status)}</Badge> }),
    column.display({ id: "actions", header: TableMenuHeader, size: 48, enableHiding: false,
      cell: ({ row }) => <BatchDistributionAction grn={grn} batch={row.original} refreshing={refreshing} /> }),
  ]), [grn, refreshing]);
  return <ClientDataTable label="Batches on this note" columns={columns} rows={grn.batches} getRowId={(row) => row.id}
    fill={false} emptyTitle="No batches on this note" />;
}
