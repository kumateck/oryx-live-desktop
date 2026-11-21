import { formatDate } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn, type PrintSigner } from "@/shared/print/print-sheet";
import { divisionLabel, type PriceListLine, type PriceListPrint, type PriceListSignatory } from "../lib/price-lists";
import { priceIn } from "../lib/costing";

const columns: readonly PrintColumn<PriceListLine>[] = [
  { id: "no", header: "#", cell: (_row, index) => index + 1, width: "5%" },
  { id: "code", header: "Product code", cell: (row) => row.productCode, width: "12%" },
  { id: "product", header: "Product", cell: (row) => row.productName, width: "29%" },
  { id: "packing", header: "Packing style", cell: (row) => row.packingStyle, width: "26%" },
  { id: "price", header: "Price per complete pack", cell: (row) => row.price === null ? "Not priced" : priceIn(row.price, { name: row.currencyName, symbol: row.currencySymbol }), align: "right", width: "28%" },
];
const signer = (role: string, person: PriceListSignatory): PrintSigner => person
  ? { role, name: person.name, signature: person.signature, signedOn: formatDate(person.signedAt), note: person.designation } : { role };

export function PriceListPrintView({ data, onClose }: { data: PriceListPrint; onClose: () => void }) {
  const list = data.revision;
  return <PrintPreviewDialog title={`Price list, revision ${list.revisionNumber}`} landscape onClose={onClose}
    note={list.stage === "Current" ? null : `Status: ${list.stage}. This revision is not the current effective price list.`}>
    <PrintHeader title={list.status === 1 ? "Approved Product Price List" : "Product Price List"} reference={`Document No. ${list.documentNumber}`} />
    <PrintFacts facts={[{ label: "Division", value: divisionLabel(list.division) }, { label: "Revision", value: list.revisionNumber },
      { label: "Supersedes", value: list.supersedesRevision ?? "–" }, { label: "Effective from", value: formatDate(list.effectiveFrom) },
      { label: "Status", value: list.stage }, { label: "Revision reason", value: list.revisionReason }]} />
    <PrintTable columns={columns} rows={data.lines} rowKey={(row) => row.id} empty="No products on this revision." />
    <PrintSignatures signers={[signer("Prepared by", list.preparedBySignatory), signer("Checked by", list.checkedBy), signer("Approved by", list.approvedBy)]} />
  </PrintPreviewDialog>;
}
