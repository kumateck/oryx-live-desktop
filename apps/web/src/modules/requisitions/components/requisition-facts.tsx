import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatDate } from "@/shared/format/dates";
import { requisitionTypeLabels } from "../lib/requisition-status";
import type { Requisition } from "../schemas/requisition-schema";

/** Who asked for what, when, and by when it is needed. */
export function RequisitionFacts({ requisition }: { requisition: Requisition }) {
  return <KeyFacts>
    <KeyFact label="Type" value={`${requisitionTypeLabels[requisition.type]} requisition`} note={requisition.product ? `For ${requisition.product}` : undefined} />
    <KeyFact label="Requested by" value={requisition.requestedBy ?? "Not recorded"} note={requisition.department ?? undefined} />
    <KeyFact label="Requested on" value={formatDate(requisition.createdAt) ?? "–"} />
    <KeyFact label="Needed by" value={formatDate(requisition.expectedDelivery) ?? "No date given"} />
    <KeyFact label="Approval" value={requisition.approved ? "Approved" : requisition.status === 4 ? "Rejected" : "Awaiting approval"} />
  </KeyFacts>;
}
