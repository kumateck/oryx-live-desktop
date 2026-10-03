import { utcBoundary } from "@/shared/format/date-boundary";
import type { PricingAgreement, PricingRequest } from "@/modules/suppliers/relationship/types";
import type { PriceLine } from "./price-lines";

const approved = 1;
const archiving = 2;

/** The supplier's approved agreement for a material and unit that is in force on a day; the newest when several are. */
export function activeAgreement(agreements: readonly PricingAgreement[], materialId: string, unitId: string, on = new Date()): PricingAgreement | null {
  const time = on.getTime();
  return agreements
    .filter((agreement) => agreement.status === approved && agreement.changeKind !== archiving && agreement.materialId === materialId && agreement.uoMId === unitId
      && new Date(agreement.effectiveFrom).getTime() <= time && (agreement.effectiveTo ? time <= new Date(agreement.effectiveTo).getTime() : true))
    .sort((left, right) => new Date(right.effectiveFrom).getTime() - new Date(left.effectiveFrom).getTime())[0] ?? null;
}

/** A quoted price that differs from the standing agreement, or a material that has no agreement yet. */
export interface AgreementChange { line: PriceLine; agreement: PricingAgreement | null }

export function agreementChanges(lines: readonly PriceLine[], agreements: readonly PricingAgreement[]): AgreementChange[] {
  const byId = new Map(agreements.map((agreement) => [agreement.id, agreement]));
  return lines.flatMap((line): AgreementChange[] => {
    if (line.price === null || !line.materialId || !line.unitId) return [];
    const agreement = line.agreementId ? byId.get(line.agreementId) ?? null : null;
    if (!agreement) return [{ line, agreement: null }];
    return line.price !== agreement.agreedPrice || line.priceUnit.trim() !== agreement.priceUoM.trim() ? [{ line, agreement }] : [];
  });
}

export type AgreementProposal = { mode: "create"; body: PricingRequest } | { mode: "replace"; id: string; body: PricingRequest };

/**
 * The proposal that brings the standing agreement in line with the quoted price from the agreed date.
 * Returns the reason instead when the date does not fit the agreement it replaces.
 */
export function agreementProposal(change: AgreementChange, agreedDate: Date, quotationId: string, supplierCurrencyId: string | null): AgreementProposal | { error: string } {
  const { line, agreement } = change;
  const from = utcBoundary(agreedDate);
  const note = `Price agreed from quotation response ${quotationId}, effective ${from.slice(0, 10)}.`;
  if (line.price === null || !line.materialId || !line.unitId) return { error: `${line.materialName} has no price to agree` };
  if (!agreement) {
    if (!supplierCurrencyId) return { error: "The supplier has no currency, so a price agreement cannot be proposed" };
    return { mode: "create", body: { materialId: line.materialId, uoMId: line.unitId, agreedPrice: line.price, priceUoM: line.priceUnit.trim(), currencyId: supplierCurrencyId, effectiveFrom: from, notes: note } };
  }
  if (new Date(from).getTime() < new Date(utcBoundary(new Date(agreement.effectiveFrom))).getTime()) return { error: `${line.materialName}: the agreed date cannot be before the current agreement started` };
  if (agreement.effectiveTo && new Date(from).getTime() > new Date(agreement.effectiveTo).getTime()) return { error: `${line.materialName}: the agreed date must fall within the current agreement` };
  return { mode: "replace", id: agreement.id, body: { materialId: agreement.materialId, uoMId: agreement.uoMId, agreedPrice: line.price, priceUoM: line.priceUnit.trim(), currencyId: agreement.currency.id,
    effectiveFrom: from, effectiveTo: agreement.effectiveTo ?? null, notes: [agreement.notes?.trim(), note].filter(Boolean).join("\n") } };
}
