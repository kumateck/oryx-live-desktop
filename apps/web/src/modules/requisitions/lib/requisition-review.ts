import type { AccessRule } from "@/shared/auth/access";
import type { ReviewKeys } from "@/shared/reviews/review-panel";
import type { ReviewRecord } from "@/shared/reviews/review-api";
import { requisitionType } from "./requisition-status";
import type { Requisition } from "../schemas/requisition-schema";

type Kind = 0 | 1;
const all = (permissions: string[]): AccessRule => ({ kind: "all", permissions });
const purchase = {
  confirm: { 0: "CanReviewRawMaterialPurchaseRequisition", 1: "CanReviewPackageMaterialPurchaseRequisition" },
  return: { 0: "CanReturnRawMaterialPurchaseRequisition", 1: "CanReturnPackageMaterialPurchaseRequisition" },
  edit: { 0: "CanEditRawMaterialPurchaseRequisition", 1: "CanEditPackageMaterialPurchaseRequisition" },
} as const;
const stock = {
  confirm: { 0: "CanReviewRawMaterialStockRequisition", 1: "CanReviewPackageMaterialStockRequisition" },
  return: { 0: "CanReturnRawMaterialStockRequisition", 1: "CanReturnPackageMaterialStockRequisition" },
} as const;

/** The material kinds on a requisition, from its stored lines. */
export function requisitionKinds(requisition: Requisition): Kind[] {
  const kinds = new Set(requisition.items.flatMap((line): Kind[] => line.materialKind === 0 || line.materialKind === 1 ? [line.materialKind] : []));
  return ([0, 1] as const).filter((kind) => kinds.has(kind));
}

/**
 * The record and keys of a requisition's review, from its stored type and the kinds of its lines: a purchase requisition
 * needs the key of every kind it holds; a stock requisition holds one kind. Trial requisitions have no review step.
 */
export function requisitionReview(requisition: Requisition): { record: ReviewRecord; keys: ReviewKeys; edit: AccessRule | null } | null {
  const kinds = requisitionKinds(requisition);
  if (kinds.length === 0) return null;
  if (requisition.type === requisitionType.purchase) return {
    record: { modelType: "PurchaseRequisition", modelId: requisition.id },
    keys: { confirm: all(kinds.map((kind) => purchase.confirm[kind])), return: all(kinds.map((kind) => purchase.return[kind])), resubmit: all(kinds.map((kind) => purchase.edit[kind])) },
    edit: all(kinds.map((kind) => purchase.edit[kind])),
  };
  const kind = kinds[0];
  if (requisition.type !== requisitionType.stock || kinds.length !== 1 || kind === undefined) return null;
  return {
    record: { modelType: kind === 0 ? "RawStockRequisition" : "PackageStockRequisition", modelId: requisition.id },
    // A stock requisition is corrected through its batch's Repair action and sent back by production.
    keys: { confirm: stock.confirm[kind], return: stock.return[kind], resubmit: "CanUpdateProductionStep" },
    edit: null,
  };
}

/** The key to correct a purchase requisition holding these kinds (the corrected lines' kinds included). */
export const correctionPermissions = (kinds: Kind[]): AccessRule => all(kinds.map((kind) => purchase.edit[kind]));
