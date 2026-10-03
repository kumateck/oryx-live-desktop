import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { viewRequestPermissions } from "./lib/quotation-request-access";

export const manifest = {
  query: permissionTabs(viewRequestPermissions),
  id: "quotation-requests",
  label: "Quotation requests",
  root: "/procurement/quotations",
  order: 45,
  access: { kind: "some", permissions: ["CanViewForeignQuotation", "CanViewLocalQuotation"] },
} satisfies ModuleManifest<"quotation-requests", "/procurement/quotations">;
