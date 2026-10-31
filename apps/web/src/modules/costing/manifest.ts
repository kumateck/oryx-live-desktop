import type { ModuleManifest } from "../contract";
import { costingPermissions as p } from "./lib/costing";
// Product list prices and customer pricing agreements, each in the currency it is priced in.
export const manifest = {
  id: "costing", label: "Costing", root: "/finance/costing", order: 11,
  access: { kind: "all", permissions: [p.manage] }, routes: [
    { pattern: "/finance/costing/agreements", access: { kind: "all", permissions: [p.manage] } },
    { pattern: "/finance/costing/agreements/:id", access: { kind: "all", permissions: [p.manage] } },
  ],
} satisfies ModuleManifest<"costing", "/finance/costing">;
