import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { approvedMaterialPermissions } from "./lib/approved-material-access";

export const manifest = {
  query: permissionTabs(approvedMaterialPermissions),
  id: "approved-materials",
  label: "Approved materials",
  root: "/warehouse/approved-materials",
  order: 60,
  // Raw and packaging materials have a permission each; either opens the page, and the page shows only what the user holds.
  access: { kind: "some", permissions: ["CanViewApprovedRawMaterials", "CanViewApprovedPackagingMaterials"] },
} satisfies ModuleManifest<"approved-materials", "/warehouse/approved-materials">;
