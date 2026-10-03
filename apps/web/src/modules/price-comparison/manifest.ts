import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { viewComparisonPermissions } from "./lib/comparison-access";

export const manifest = {
  query: permissionTabs(viewComparisonPermissions),
  id: "price-comparison",
  label: "Price comparison",
  root: "/procurement/price-comparison",
  order: 47,
  access: { kind: "some", permissions: ["CanViewForeignVendorPricing", "CanViewLocalVendorPricing"] },
} satisfies ModuleManifest<"price-comparison", "/procurement/price-comparison">;
