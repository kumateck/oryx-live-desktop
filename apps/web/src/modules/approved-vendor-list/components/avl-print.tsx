import { formatDate } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn, type PrintSigner } from "@/shared/print/print-sheet";
import { shortMonth, type ListDetail, type ListLine, type Signatory } from "../lib/avl";

const columns: readonly PrintColumn<ListLine>[] = [
  { id: "no", header: "#", cell: (_, index) => index + 1, width: "5%" },
  { id: "code", header: "Item code", cell: (line) => line.materialCode ?? "", width: "9%" },
  { id: "material", header: "Material name", cell: (line) => line.materialName ?? "", width: "18%" },
  { id: "manufacturer", header: "Manufacturer name & address", cell: (line) => <>{line.manufacturerName}{line.manufacturerAddress ? <><br />{line.manufacturerAddress}</> : null}</>, width: "26%" },
  { id: "supplier", header: "Supplier name", cell: (line) => line.supplierName ?? "", width: "16%" },
  { id: "qty", header: "Qty/Pack (kg)", cell: (line) => line.quantityPerPack, align: "right", width: "8%" },
  { id: "approved", header: "Date of approval", cell: (line) => shortMonth(line.approvalDate), width: "9%" },
  { id: "validity", header: "Validity date", cell: (line) => shortMonth(line.validityDate), width: "9%" },
];

const signer = (role: string, person: Signatory | null): PrintSigner => person
  ? { role, name: person.name, signature: person.signature, signedOn: formatDate(person.signedAt) ?? null, note: person.designation }
  : { role };

/** The list as the paper annexure: header numbers, the material table and the three signatures. */
export function VendorListPrint({ list, onClose }: { list: ListDetail; onClose: () => void }) {
  return <PrintPreviewDialog title={`Approved vendor list, revision ${list.revisionNumber}`} landscape onClose={onClose}
    note={list.status === 1 ? null : "This revision is not the current approved list. Unsigned lines stay blank."}>
    <PrintHeader title="Approved Manufacturer List for Raw Materials" reference={list.annexureNumber ? `Annexure No. ${list.annexureNumber}` : null} />
    <PrintFacts facts={[
      { label: "Annexure No.", value: list.annexureNumber },
      { label: "Revision No.", value: String(list.revisionNumber) },
      { label: "Supersedes", value: list.supersedesRevision === null ? "–" : String(list.supersedesRevision) },
    ]} />
    <PrintTable columns={columns} rows={list.lines} rowKey={(line) => line.id} empty="No materials on this list." />
    <PrintSignatures signers={[
      signer("Prepared by", list.preparedBySignatory),
      signer("Checked by", list.checkedBy),
      signer("Approved by", list.approvedBy),
    ]} />
  </PrintPreviewDialog>;
}
