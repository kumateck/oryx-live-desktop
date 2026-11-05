import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const requisitionsPath = "/production/requisition/general";
export const createRequisitionPath = "/production/requisition/create";
export const requisitionPath = (id: string) => `/production/requisition/${id}/details`;

/** Production's own requisition-list keys (the Warehouse issue list keeps CanViewRawMaterialRequisitions). */
export const viewRequisitionPermissions = ["CanViewProductionRawMaterialRequisitions", "CanViewProductionPackagingMaterialRequisitions"] as const;
/** Seeing the materials a purchase requisition can be raised for. */
export const pickMaterialPermissions: Record<MaterialKind, string> = { 0: "CanViewRawMaterialRequisitionsForCreation", 1: "CanViewPackageMaterialRequisitionsForCreation" };
/** Raising the purchase requisition itself. */
export const createRequisitionPermissions: Record<MaterialKind, string> = { 0: "CanCreateRawMaterialRequisitions", 1: "CanCreatePackageMaterialRequisitions" };

export const requisitionCodeModel = "Requisition";
export const listAudit = { module: "Production", subModule: "Material Requisitions" } as const;
export const createAudit = { module: "Production", subModule: "Create Purchase Requisitions" } as const;
