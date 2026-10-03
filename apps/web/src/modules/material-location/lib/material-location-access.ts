import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const materialLocationsPath = "/warehouse/material-location";
export const materialLocationPath = (id: string, kind: MaterialKind) => `${materialLocationsPath}/${id}/details?type=${kind}`;
export const materialLocationPermissions: Record<MaterialKind, string> = { 0: "CanViewRawMaterialLocationList", 1: "CanViewPackagingMaterialLocationList" };
export const audit = { module: "Warehouse", subModule: "Material Location" } as const;
