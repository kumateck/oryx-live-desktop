import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const approvedMaterialsPath = "/warehouse/approved-materials";
export const approvedMaterialPath = (id: string, kind: MaterialKind) => `${approvedMaterialsPath}/${id}/details?type=${kind}`;
export const approvedMaterialPermissions: Record<MaterialKind, string> = { 0: "CanViewApprovedRawMaterials", 1: "CanViewApprovedPackagingMaterials" };
export const stockTracePermissions: Record<MaterialKind, string> = { 0: "CanViewRawMaterialStockTrace", 1: "CanViewPackagingMaterialStockTrace" };
export const stockPrintPermissions: Record<MaterialKind, string> = { 0: "CanPrintRawMaterialStockTrace", 1: "CanPrintPackagingMaterialStockTrace" };
export const audit = { module: "Warehouse", subModule: "Approved Materials" } as const;
