import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { materialPermissions } from "./lib/material-access";

export const manifest = {
  query: permissionTabs(materialPermissions.view),
  id: "materials",
  label: "Materials",
  root: "/warehouse/materials",
  order: 65,
  access: { kind: "some", permissions: ["CanViewRawMaterials", "CanViewPackagingMaterials"] },
  routes: [
    { pattern: "/warehouse/materials/linked", access: { kind: "some", permissions: Object.values(materialPermissions.viewLinked) }, query: permissionTabs(materialPermissions.viewLinked) },
    { pattern: "/warehouse/materials/unlink", access: { kind: "some", permissions: Object.values(materialPermissions.viewUnlinked) }, query: permissionTabs(materialPermissions.viewUnlinked) },
  ],
} satisfies ModuleManifest<"materials", "/warehouse/materials">;
