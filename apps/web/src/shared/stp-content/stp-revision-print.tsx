import { useMemo } from "react";
import { formatDate } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, type PrintSigner } from "@/shared/print/print-sheet";
import { StpContentView } from "./stp-content-view";
import { detailSchema, RevisionStatus, type Signatory } from "./stp-content";
import { stpRevisionAudit } from "./stp-keys";
import { useStpRevisionPrintQuery } from "./stp-revision-api";

const signer = (role: string, person: Signatory | null): PrintSigner => person
  ? { role, name: person.name, signature: person.signature, signedOn: formatDate(person.signedAt) ?? null, note: person.designation }
  : { role };

/** Reads the revision through the print endpoint (its own key) and shows it as the STP prints. */
export function StpRevisionPrint({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useStpRevisionPrintQuery({ ...stpRevisionAudit, id });
  const parsed = useMemo(() => query.data ? detailSchema.safeParse(query.data) : null, [query.data]);
  const revision = parsed?.success ? parsed.data : null;
  return <PrintPreviewDialog title={revision ? `${revision.stpNumber} revision ${String(revision.revisionNumber)}` : "STP revision"} ready={revision !== null}
    note={!revision ? (query.error || parsed?.success === false ? "The revision could not be read for printing." : "Loading…")
      : revision.status === RevisionStatus.Approved ? null : "This revision is not the current approved STP."} onClose={onClose}>
    {revision ? <>
      <PrintHeader title="Standard Test Procedure" reference={revision.stpNumber} aside={revision.title} />
      <PrintFacts facts={[
        { label: "STP No.", value: revision.stpNumber }, { label: "Revision No.", value: String(revision.revisionNumber).padStart(2, "0") },
        { label: "Supersedes", value: revision.supersedesRevision === null ? "–" : String(revision.supersedesRevision).padStart(2, "0") },
        { label: "Area", value: revision.area ?? "–" }, { label: "Reference", value: revision.reference ?? "–" },
        { label: "Effective date", value: formatDate(revision.effectiveDate) ?? "–" }, { label: "Review date", value: formatDate(revision.reviewDate) ?? "–" },
        { label: "Issue date", value: formatDate(revision.issueDate) ?? "–" },
      ]} />
      <StpContentView revision={revision} />
      <PrintSignatures signers={[signer("Prepared by", revision.preparedBySignatory), signer("Checked by", revision.checkedBy), signer("Approved by", revision.approvedBy)]} />
    </> : null}
  </PrintPreviewDialog>;
}
