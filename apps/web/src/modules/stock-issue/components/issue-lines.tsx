import { useMemo, useState } from "react";
import { PackageOpen } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDateTime } from "@/shared/format/dates";
import { adjustIssuePermission, issueDifference } from "../lib/issue-quantity";
import type { StockLine, StockRequisition } from "../schemas/stock-issue-schema";
import { BatchBreakdown, amount } from "./batch-breakdown";
import { IssueQuantityDialog } from "./issue-quantity-dialog";

/** "20 kg · 1.25 kg over" for a packaging line issued other than as required, with its reason and who set it. */
export function IssuedNote({ line }: { line: StockLine }) {
  if (line.issuedQuantity === null) return null;
  const difference = issueDifference(line);
  if (difference === 0) return null;
  return <div className="mt-1 space-y-0.5 text-xs">
    <div className={difference < 0 ? "font-medium text-destructive" : "font-medium"}>{line.issued ? "Issued" : "To issue"} {amount(line.issuedQuantity, line.unit)} ·{" "}
      {amount(Math.abs(difference), line.unit)} {difference > 0 ? "over" : "under"}</div>
    {line.adjustmentReason ? <div className="break-words text-muted-foreground">{line.adjustmentReason}</div> : null}
    {line.adjustedBy ? <div className="text-muted-foreground">{line.adjustedBy}{line.adjustedAt ? ` · ${formatDateTime(line.adjustedAt) ?? ""}` : ""}</div> : null}
  </div>;
}

const column = dataTableColumns<StockLine>();

/** The requisition's materials and the batches set aside; a supervisor may set how much of a packaging line is issued. */
export function IssueLines({ requisition }: { requisition: StockRequisition }) {
  const [adjusting, setAdjusting] = useState<StockLine | null>(null);
  const open = requisition.status !== 3 && requisition.status !== 4;
  const columns = useMemo(() => column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div>
      {row.original.substituteFor ? <div className="break-words text-xs text-muted-foreground">Substitute for {row.original.substituteFor}</div> : null}</div> }),
    column.accessor("quantity", { header: "Quantity", size: 170, cell: ({ row }) => <div><div>{amount(row.original.quantity, row.original.unit)}</div>
      {row.original.approvedQuantity !== null ? <div className="text-xs text-muted-foreground">Originally approved: {amount(row.original.approvedQuantity, row.original.unit)} · repaired after issue</div> : null}
      <IssuedNote line={row.original} /></div> }),
    column.display({ id: "batches", header: "Issued from", cell: ({ row }) => <BatchBreakdown line={row.original} /> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => row.original.kind === 1 && open && !row.original.issued
      ? <TableMenu label={`Actions for ${row.original.materialName}`} items={[
        { id: "issue-quantity", label: "Set quantity to issue", icon: PackageOpen, require: adjustIssuePermission, onSelect: () => setAdjusting(row.original) }]} /> : null }),
  ]), [open]);
  return <>
    <ClientDataTable label="Materials and the batches set aside" columns={columns} rows={requisition.items} getRowId={(row) => row.id} fill={false} emptyTitle="No materials on this requisition" />
    {adjusting ? <IssueQuantityDialog requisitionId={requisition.id} line={adjusting} onClose={() => setAdjusting(null)} /> : null}
  </>;
}
