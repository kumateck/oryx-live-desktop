import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { materialLocationPermissions } from "./lib/material-location-access";

export const manifest = {
  query: permissionTabs(materialLocationPermissions),
  id: "material-location",
  label: "Material location",
  root: "/warehouse/material-location",
  order: 62,
  access: { kind: "some", permissions: ["CanViewRawMaterialLocationList", "CanViewPackagingMaterialLocationList"] },
} satisfies ModuleManifest<"material-location", "/warehouse/material-location">;
