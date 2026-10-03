import { useMemo } from "react";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { toLargestUnit } from "@/shared/units/quantity";
import { requisitionsPath } from "../lib/requisition-access";
import type { Requisition, RequisitionLine } from "../schemas/requisition-schema";
import { RequisitionFacts } from "./requisition-facts";
import { RequisitionPrint } from "./requisition-print";
import { RequisitionStatusBadge } from "./requisition-status-badge";

const column = dataTableColumns<RequisitionLine>();

/** One requisition: what was asked for and how far each line has got. */
export function RequisitionDetail({ requisition }: { requisition: Requisition }) {
  const columns = useMemo(() => column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
      <div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
    column.accessor("quantity", { header: "Requested", size: 170, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity) }),
    column.accessor("status", { header: "Status", size: 190, cell: ({ row }) => <RequisitionStatusBadge status={row.original.status} type={requisition.type} /> }),
  ]), [requisition.type]);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={requisition.code} crumbs={[{ label: "Material requisitions", to: requisitionsPath }, { label: requisition.code }]}
      actions={<PrintButton preview={(close) => <RequisitionPrint requisition={requisition} onClose={close} />} />} />
    <RequisitionStatusBadge status={requisition.status} type={requisition.type} />
    <RequisitionFacts requisition={requisition} />
    {requisition.comments ? <section className="space-y-1 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Remarks</h2><RichTextView html={requisition.comments} className="text-sm" /></section> : null}
    <ClientDataTable label="Requested materials" columns={columns} rows={requisition.items} getRowId={(row) => row.id} fill={false} emptyTitle="No materials on this requisition" />
  </article>;
}
