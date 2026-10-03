import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const viewDistributedPermissions: Record<MaterialKind, string> = { 0: "CanViewDistributedRawMaterials", 1: "CanViewDistributedPackagingMaterials" };
/** Putting newly received stock on shelves. */
export const shelvePermissions: Record<MaterialKind, string> = { 0: "CanAssignRawMaterialsStockToShelves", 1: "CanAssignPackagingMaterialsStockToShelves" };
export const audit = { module: "Warehouse", subModule: "Distributed Area" } as const;
/** Stock that has reached the department's store but is not on a shelf yet. The number is the server's. */
export const awaitingShelving = 0;
