import { expect, it } from "vitest";
import type { PricingAgreement } from "@/modules/suppliers/relationship/types";
import { AgreementOutcome, agreementOutcome, agreementFeedback } from "./agreement-outcome";
import type { AgreementProposal } from "./agreements";
const proposal: AgreementProposal = { mode: "replace", id: "old", body: { materialId: "material", uoMId: "unit", agreedPrice: 25, priceUoM: "kg", currencyId: "currency", effectiveFrom: "2026-10-24T00:00:00Z" } };
const record: PricingAgreement = { id: "new", supplierId: "supplier", materialId: "material", materialName: "Material", uoMId: "unit", uoMName: "kg", status: 1, changeKind: 1,
  agreedPrice: 25, priceUoM: "kg", currency: { id: "currency", name: "Cedi", symbol: "GH₵" }, effectiveFrom: "2026-10-24T00:00:00Z", effectiveTo: null, notes: null };
it("recognizes a replacement that the backend already approved", () => {
  expect(agreementOutcome(proposal, [record])).toBe(AgreementOutcome.Approved);
});
it("never treats the prior agreement, pending proposal or wrong price as an approval", () => {
  for (const change of [{ id: "old" }, { status: 0 as const }, { agreedPrice: 20 }, { priceUoM: "g" }])
    expect(agreementOutcome(proposal, [{ ...record, ...change }])).toBe(AgreementOutcome.Submitted);
  expect(agreementOutcome(proposal, [])).toBe(AgreementOutcome.Submitted);
});
it("explains the configured approval rule without claiming a submission is already approved", () => {
  expect(agreementFeedback(1, 0)).toBe("1 agreement change is approved.");
  expect(agreementFeedback(0, 1)).toContain("With no configured approval stages, approval is automatic");
  expect(agreementFeedback(0, 1)).toContain("assigned approver");
});
