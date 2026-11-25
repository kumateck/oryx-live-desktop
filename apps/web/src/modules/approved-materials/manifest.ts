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
  routes: [{
    pattern: "/warehouse/approved-materials/:id/details",
    access: { kind: "some", permissions: ["CanViewApprovedRawMaterials", "CanViewApprovedPackagingMaterials"] },
    query: {
      key: "tab",
      choices: [
        // Each view serves separate raw and packaging variants; the stored material selects the exact key in the component and API.
        ...["stock", "bin-card", "reserved"].map((value) => ({ value, access: { kind: "some" as const, permissions: ["CanViewApprovedRawMaterials", "CanViewApprovedPackagingMaterials"] } })),
        ...["floor", "consumed", "reconciliation"].map((value) => ({ value, access: { kind: "some" as const, permissions: ["CanViewRawMaterialStockTrace", "CanViewPackagingMaterialStockTrace"] } })),
      ],
    },
  }],
} satisfies ModuleManifest<"approved-materials", "/warehouse/approved-materials">;
