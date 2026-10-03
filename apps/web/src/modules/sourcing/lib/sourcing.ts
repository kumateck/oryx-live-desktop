import type { SupplierType } from "@/shared/procurement/supplier-type";
import { requisitionStatus } from "@/modules/requisitions/lib/requisition-status";
import type { Requisition, RequisitionLine } from "@/modules/requisitions/schemas/requisition-schema";

/** Where one material is to be bought and who is asked to quote. */
export interface SourcingChoice { source: SupplierType | null; suppliers: readonly string[] }
export type SourcingChoices = Readonly<Record<string, SourcingChoice>>;
export const noChoice: SourcingChoice = { source: null, suppliers: [] };

/** Lines Procurement can still act on. A line already sent to suppliers must not be sent again: that would ask for the quantity twice. */
export function openLines(requisition: Requisition): RequisitionLine[] {
  return requisition.items.filter((line) => line.status === requisitionStatus.pending);
}

/** Why the requisition cannot be sourced at all, or null when it can. */
export function sourcingBlock(requisition: Requisition): string | null {
  if (requisition.type !== 1) return "This is not a purchase requisition, so there is nothing to source.";
  if (requisition.status === requisitionStatus.rejected) return "This requisition was rejected.";
  if (!requisition.approved) return "This requisition is still awaiting approval. Suppliers can be chosen once it is approved.";
  if (openLines(requisition).length === 0) return "Every material on this requisition already has its suppliers.";
  return null;
}

export interface SourcingProblem { lineId: string; message: string }
export interface SourcingReview { ready: RequisitionLine[]; untouched: RequisitionLine[]; problems: SourcingProblem[] }

/** Sorts the open lines into those ready to send, those left for later, and those half filled in. */
export function reviewSourcing(lines: readonly RequisitionLine[], choices: SourcingChoices): SourcingReview {
  const review: SourcingReview = { ready: [], untouched: [], problems: [] };
  for (const line of lines) {
    const choice = choices[line.id] ?? noChoice;
    if (!line.materialId || !line.unitId) review.problems.push({ lineId: line.id, message: `${line.materialName} is missing its material or unit record and cannot be sourced` });
    else if (choice.source === null) review.untouched.push(line);
    else if (choice.suppliers.length === 0) review.problems.push({ lineId: line.id, message: `Choose at least one supplier for ${line.materialName}` });
    else review.ready.push(line);
  }
  return review;
}

/** The request for the lines that are ready. Quantities go back exactly as the requisition holds them. */
export function sourcingRequest(requisitionId: string, ready: readonly RequisitionLine[], choices: SourcingChoices) {
  return { requisitionId, items: ready.flatMap((line) => {
    const choice = choices[line.id];
    return line.materialId && line.unitId && choice && choice.source !== null ? [{
      materialId: line.materialId, uoMId: line.unitId, quantity: line.quantity, source: choice.source, suppliers: choice.suppliers.map((supplierId) => ({ supplierId })),
    }] : [];
  }) };
}
