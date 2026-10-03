import { Badge } from "@/components/ui/badge";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { toLargestUnit } from "@/shared/units/quantity";
import { carrierLabel, intactnessLabel, receivingListPath, receivingStatus } from "../lib/receiving";
import type { Checklist, DeliveredMaterial, ReceivedBatch } from "../schemas/receiving-schema";
import { ReceivingStatusBadge } from "./receiving-status-badge";

const show = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
const weights = (batch: ReceivedBatch) => batch.weights.length ? batch.weights.map((weight) => weight.gross).join(", ") : "–";
const column = dataTableColumns<ReceivedBatch>();
const columns = column.columns([
  column.accessor((row) => row.number ?? "", { id: "number", header: "Batch", cell: ({ row }) => <span className="break-words font-medium">{row.original.number ?? "No number"}</span> }),
  column.display({ id: "containers", header: "Containers", size: 190, cell: ({ row }) => `${row.original.containers} ${row.original.style ?? ""} × ${show(row.original.perContainer, row.original.unit)}` }),
  column.accessor("total", { header: "Quantity", size: 150, cell: ({ row }) => show(row.original.total, row.original.unit) }),
  column.accessor((row) => row.made ?? "", { id: "made", header: "Manufactured", size: 150, cell: ({ row }) => formatMonthYear(row.original.made) ?? "–" }),
  column.accessor((row) => row.expires ?? "", { id: "expires", header: "Expires", size: 150, cell: ({ row }) => formatMonthYear(row.original.expires) ?? "–" }),
  column.display({ id: "weights", header: "Gross weights", cell: ({ row }) => <span className="break-words">{weights(row.original)}</span> }),
]);
const printColumns: PrintColumn<ReceivedBatch>[] = [
  { id: "number", header: "Batch", cell: (row) => row.number ?? "No number" },
  { id: "containers", header: "Containers", cell: (row) => `${row.containers} ${row.style ?? ""} × ${show(row.perContainer, row.unit)}` },
  { id: "total", header: "Quantity", align: "right", cell: (row) => show(row.total, row.unit) },
  { id: "made", header: "Manufactured", cell: (row) => formatMonthYear(row.made) ?? "–" },
  { id: "expires", header: "Expires", cell: (row) => formatMonthYear(row.expires) ?? "–" },
  { id: "weights", header: "Gross weights", cell: weights },
];
const yesNo = (value: boolean) => value ? "Yes" : "No";

function ChecklistPrint({ checklist, onClose }: { checklist: Checklist; onClose: () => void }) {
  return <PrintPreviewDialog title={`Receiving checklist · ${checklist.materialName}`} onClose={onClose}>
    <PrintHeader title="Material receiving checklist" reference={checklist.materialCode} />
    <PrintFacts facts={[{ label: "Material", value: checklist.materialName }, { label: "Supplier", value: checklist.supplier }, { label: "Manufacturer", value: checklist.manufacturer }, { label: "Invoice", value: checklist.invoice },
      { label: "Date checked", value: formatDate(checklist.checkedAt) }, { label: "Certificate of analysis delivered", value: yesNo(checklist.certificate) }, { label: "Containers properly labelled", value: yesNo(checklist.labelled) },
      { label: "Intactness of containers", value: intactnessLabel(checklist.intactness) }, { label: "Condition of carrier", value: carrierLabel(checklist.carrier) }]} />
    <PrintTable caption="Batches" columns={printColumns} rows={checklist.batches} rowKey={(row) => row.id} empty="No batches recorded" />
    <PrintSignatures roles={["Checked by", "Verified by"]} />
  </PrintPreviewDialog>;
}

/** A saved checklist: what was found on arrival, and the batches recorded. */
export function ChecklistView({ material, checklist }: { material: DeliveredMaterial; checklist: Checklist }) {
  const back = receivingListPath(material.status === receivingStatus.distributed ? receivingStatus.distributed : receivingStatus.checked, material.kind);
  const bad = checklist.intactness === 1 || (checklist.carrier !== null && checklist.carrier !== 1) || !checklist.labelled;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Checklist · ${checklist.materialName}`} crumbs={[{ label: "Receiving area", to: back }, { label: "Checklist" }]} actions={<PrintButton preview={(close) => <ChecklistPrint checklist={checklist} onClose={close} />} />} />
    <div className="flex flex-wrap items-center gap-2"><ReceivingStatusBadge status={material.status} />{bad ? <Badge variant="destructive">Problems noted on arrival</Badge> : null}</div>
    <KeyFacts>
      <KeyFact label="Delivered" value={show(material.quantity, material.unit)} note={checklist.materialCode ?? undefined} />
      <KeyFact label="Supplier" value={checklist.supplier ?? material.supplierName ?? "–"} note={checklist.manufacturer ? `Made by ${checklist.manufacturer}` : undefined} />
      <KeyFact label="Invoice" value={checklist.invoice ?? material.invoiceCode ?? "–"} />
      <KeyFact label="Date checked" value={formatDate(checklist.checkedAt) ?? "–"} />
      <KeyFact label="Certificate of analysis" value={checklist.certificate ? "Delivered" : "Not delivered"} state={checklist.certificate ? "none" : "soon"} />
      <KeyFact label="Labelling" value={checklist.labelled ? "Properly labelled" : "Not properly labelled"} state={checklist.labelled ? "none" : "overdue"} />
      <KeyFact label="Containers" value={intactnessLabel(checklist.intactness)} state={checklist.intactness === 1 ? "overdue" : "none"} />
      <KeyFact label="Carrier" value={carrierLabel(checklist.carrier)} state={checklist.carrier !== null && checklist.carrier !== 1 ? "overdue" : "none"} />
    </KeyFacts>
    <ClientDataTable label="Batches" columns={columns} rows={checklist.batches} getRowId={(row) => row.id} fill={false} emptyTitle="No batches recorded" />
  </article>;
}
