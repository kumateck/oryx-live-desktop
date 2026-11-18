import type { FormResponseDto } from "./dto";
import type { DomainEntitiesFormsResponseDetailDto } from "@/shared/api/generated/forms";

export interface CertificateSignatories { analysts: readonly string[]; releasedBy: string | null; approvedBy: string | null; generated?: boolean; approved?: boolean }
const fullName = (person: { firstName?: string | null; lastName?: string | null } | null | undefined) => [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim() || null;
/** The saved answer authors, certificate generator and actual approver; opening a preview does not sign it. */
export function certificateSignatories(responses: readonly FormResponseDto[], detail: DomainEntitiesFormsResponseDetailDto | null): CertificateSignatories {
  return { analysts: [...new Set(responses.flatMap(answer => fullName(answer.createdBy) ? [fullName(answer.createdBy) ?? ""] : []))],
    releasedBy: fullName(detail?.checkedBy), approvedBy: detail?.approved ? fullName(detail.approvedBy) : null, generated: Boolean(detail?.checkedAt), approved: Boolean(detail?.approved) };
}
export function CertificateSignatures({ signatories }: { signatories?: CertificateSignatories | undefined }) {
  return <section aria-label="Certificate signatories" className="grid grid-cols-1 gap-6 pt-6 text-sm sm:grid-cols-3 print:grid-cols-3">
    <div className="border-t pt-2"><p>Analysed by</p><p className="mt-1 font-medium">{signatories?.analysts.join(", ") || "Not recorded"}</p></div>
    <div className="border-t pt-2"><p>Released by</p><p className="mt-1 font-medium">{signatories?.releasedBy || (signatories?.generated ? "Not recorded" : "Pending generation")}</p></div>
    <div className="border-t pt-2"><p>Approved by</p><p className="mt-1 font-medium">{signatories?.approvedBy || (signatories?.approved ? "Not recorded" : "Pending approval")}</p></div>
  </section>;
}
