import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { pickMaterialPermissions } from "./lib/requisition-access";

const view = ["CanViewRawMaterialRequisitions", "CanViewPackagingMaterialRequisitions"];
const pick = ["CanViewRawMaterialRequisitionsForCreation", "CanViewPackageMaterialRequisitionsForCreation"];

export const manifest = {
  id: "requisitions",
  label: "Requisitions",
  root: "/production/requisition",
  order: 32,
  access: { kind: "some", permissions: [...view, ...pick] },
  routes: [
    { pattern: "/production/requisition/create", access: { kind: "some", permissions: pick }, query: permissionTabs(pickMaterialPermissions) },
    { pattern: "/production/requisition/general", access: { kind: "some", permissions: view } },
    { pattern: "/production/requisition/:id/details", access: { kind: "some", permissions: view } },
  ],
} satisfies ModuleManifest<"requisitions", "/production/requisition">;
