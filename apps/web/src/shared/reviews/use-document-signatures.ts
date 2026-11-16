import { skipToken } from "@reduxjs/toolkit/query";
import type { PrintSigner } from "../print/print-sheet";
import { formatDate } from "../format/dates";
import { useReadDocumentReviewQuery, type ReviewRecord } from "./review-api";
import type { DocumentReviewState, ReviewPerson } from "./review-schema";

const line = (role: string, person: ReviewPerson | null | undefined, on?: string | null): PrintSigner =>
  person ? { role, name: person.name ?? null, signature: person.signature ?? null, signedOn: formatDate(on ?? null) } : { role };

/** Prepared by is the record's creator, Checked by its confirmed reviewer, Approved by its final approver. Unsigned lines stay blank. */
export function documentSigners(state: DocumentReviewState | undefined): PrintSigner[] {
  return [line("Prepared by", state?.signatures.preparedBy), line("Checked by", state?.signatures.checkedBy, state?.signatures.checkedAt),
    line("Approved by", state?.signatures.approvedBy, state?.signatures.approvedAt)];
}

/** The Prepared / Checked / Approved lines for a record's print. While they load, or if they cannot be read, the lines stay blank. */
export function useDocumentSigners(record: ReviewRecord | null): PrintSigner[] {
  const query = useReadDocumentReviewQuery(record ?? skipToken);
  return documentSigners(query.data);
}
