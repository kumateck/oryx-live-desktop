import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const locationChartPath = "/warehouse/location-chart";
export const locationChartPermissions: Record<MaterialKind, string> = { 0: "CanViewRawMaterialLocationChartList", 1: "CanViewPackagingMaterialLocationChartList" };
/** Moving stock that is already on a shelf to another shelf. The server lists these under the Locations area. */
export const moveStockPermissions: Record<MaterialKind, string> = { 0: "CanReassignRawMaterialStock", 1: "CanReassignPackagingMaterialStock" };
export const audit = { module: "Warehouse", subModule: "Location Chart Record" } as const;
