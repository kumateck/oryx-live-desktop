import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { viewProformaRequestPermissions } from "./lib/proforma-request-access";

export const manifest = {
  query: permissionTabs(viewProformaRequestPermissions),
  id: "proforma-requests",
  label: "Proforma requests",
  root: "/procurement/awarded-quotations",
  order: 48,
  access: { kind: "some", permissions: ["CanViewForeignProformaRequest", "CanViewLocalProformaRequest"] },
} satisfies ModuleManifest<"proforma-requests", "/procurement/awarded-quotations">;
