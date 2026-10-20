import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const quarantinePath = "/warehouse/quarantine-area";
export const grnPath = (id: string, kind: MaterialKind) => `${quarantinePath}/${id}/details?type=${kind}`;
export const audit = { module: "Warehouse", subModule: "Quarantine Area" } as const;
export const quarantinePermissions: Record<MaterialKind, string> = { 0: "CanViewQuarantineRawMaterials", 1: "CanViewQuarantinePackagingMaterials" };

/** How much of a note's stock has been put away. The numbers are the server's. */
export const grnStatusLabels: Record<number, string> = { 0: "Pending", 1: "Partly put away", 2: "Completed" };
/** Distribution is separate from viewing quarantine and from putting stock on shelves. */
export const distributePermissions = { 0: "CanDistributeRawMaterials", 1: "CanDistributePackagingMaterials" } as const;
export const distributionAudit = { module: "Warehouse", subModule: "Quality Assurance Goods Receipt Note" } as const;
