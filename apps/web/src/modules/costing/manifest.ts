import type { ModuleManifest } from "../contract";
import { costingPermissions as p } from "./lib/costing";
import { priceListKeys } from "./lib/price-lists";
// Product list prices and customer pricing agreements, each in the currency it is priced in.
export const manifest = {
  id: "costing", label: "Costing", root: "/finance/costing", order: 11,
  // Costing contains price-list revisions and customer agreements with independent view keys.
  access: { kind: "some", permissions: [priceListKeys.view, p.manage] }, routes: [
    { pattern: "/finance/costing", access: { kind: "all", permissions: [priceListKeys.view] } },
    { pattern: "/finance/costing/revisions/:id", access: { kind: "all", permissions: [priceListKeys.view] } },
    { pattern: "/finance/costing/agreements", access: { kind: "all", permissions: [p.manage] } },
    { pattern: "/finance/costing/agreements/:id", access: { kind: "all", permissions: [p.manage] } },
  ],
} satisfies ModuleManifest<"costing", "/finance/costing">;
