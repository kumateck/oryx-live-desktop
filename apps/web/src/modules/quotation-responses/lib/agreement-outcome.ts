import type { PricingAgreement } from "@/modules/suppliers/relationship/types";
import type { AgreementProposal } from "./agreements";
export enum AgreementOutcome { Approved, Submitted }
/** An approved readback is evidence; never infer auto-approval merely from an HTTP success. */
export function agreementOutcome(proposal: AgreementProposal, approved: readonly PricingAgreement[]): AgreementOutcome {
  const body = proposal.body;
  return approved.some((row) => row.status === 1 && row.changeKind !== 2
    && (proposal.mode !== "replace" || row.id !== proposal.id)
    && row.materialId === body.materialId && row.uoMId === body.uoMId
    && row.agreedPrice === body.agreedPrice && row.currency.id === body.currencyId
    && row.priceUoM.trim().toLowerCase() === body.priceUoM.trim().toLowerCase()
    && row.effectiveFrom.slice(0, 10) === body.effectiveFrom.slice(0, 10))
    ? AgreementOutcome.Approved : AgreementOutcome.Submitted;
}
export function agreementFeedback(approved: number, submitted: number): string {
  const parts: string[] = [];
  if (approved) parts.push(`${approved} agreement ${approved === 1 ? "change is" : "changes are"} approved.`);
  if (submitted) parts.push(`${submitted} agreement ${submitted === 1 ? "change was" : "changes were"} submitted. With no configured approval stages, approval is automatic; otherwise it goes to the assigned approver.`);
  return parts.join(" ");
}
