import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { viewProformaResponsePermissions } from "./lib/proforma-response-access";

export const manifest = {
  query: permissionTabs(viewProformaResponsePermissions),
  id: "proforma-responses",
  label: "Proforma responses",
  root: "/procurement/profoma-responses",
  order: 49,
  access: { kind: "some", permissions: ["CanViewForeignProformaInvoiceSubmissions", "CanViewLocalProformaInvoiceSubmissions"] },
} satisfies ModuleManifest<"proforma-responses", "/procurement/profoma-responses">;
