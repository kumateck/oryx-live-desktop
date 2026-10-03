import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { viewResponsePermissions } from "./lib/quotation-response-access";

export const manifest = {
  query: permissionTabs(viewResponsePermissions),
  id: "quotation-responses",
  label: "Quotation responses",
  root: "/procurement/sales-quotation",
  order: 46,
  access: { kind: "some", permissions: ["CanViewForeignQuotationResponse", "CanViewLocalQuotationResponse"] },
} satisfies ModuleManifest<"quotation-responses", "/procurement/sales-quotation">;
