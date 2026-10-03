import type { BatchMaterial } from "@/modules/schedules/schemas/batch-schema";
import type { DomainEntitiesRequisitionsRequestCreateRequisitionRequest as RequisitionRequest } from "@/shared/api/generated/warehouse";
import type { StockRequisitionFormValues } from "../schemas/stock-requisition-schema";

const stockVoucher = 0;

/** Why a material cannot be requested, or null when it can. Every material of the batch goes on the one voucher. */
export function requisitionProblem(material: BatchMaterial): string | null {
  if (!material.materialId) return "the material could not be identified";
  if (!material.unitId) return "it has no unit of measure in this department";
  if (!(material.needed > 0)) return "the quantity needed is zero";
  return null;
}

/** A stock requisition voucher for everything a batch needs, raised from the step that asks for it. */
export function stockRequisitionRequest(values: StockRequisitionFormValues, materials: readonly BatchMaterial[], batchId: string, stepId: string): RequisitionRequest {
  return {
    code: values.code, requisitionType: stockVoucher, comments: values.comments ?? "", expectedDelivery: values.expectedDelivery.toISOString(),
    productionScheduleProductId: batchId, productionActivityStepId: stepId,
    items: materials.flatMap((material) => material.materialId && material.unitId ? [{ materialId: material.materialId, quantity: material.needed, uomId: material.unitId }] : []),
  };
}
