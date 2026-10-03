import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { locationChartPermissions } from "./lib/location-access";

export const manifest = {
  query: permissionTabs(locationChartPermissions),
  id: "location-chart",
  label: "Location chart",
  root: "/warehouse/location-chart",
  order: 61,
  access: { kind: "some", permissions: ["CanViewRawMaterialLocationChartList", "CanViewPackagingMaterialLocationChartList"] },
} satisfies ModuleManifest<"location-chart", "/warehouse/location-chart">;
