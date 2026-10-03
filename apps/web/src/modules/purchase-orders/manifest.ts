import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { viewOrderPermissions, viewApprovedPermissions } from "./lib/purchase-order-access";

const view = ["CanViewForeignPurchaseOrder", "CanViewLocalPurchaseOrder"];
const approved = ["CanViewApprovedForeignPurchaseOrder", "CanViewApprovedLocalPurchaseOrder"];

export const manifest = {
  query: permissionTabs(viewOrderPermissions),
  id: "purchase-orders",
  label: "Purchase orders",
  root: "/procurement/purchase-orders",
  order: 50,
  access: { kind: "some", permissions: view },
  routes: [
    { pattern: "/procurement/purchase-orders/:id/revise", access: { kind: "some", permissions: ["CanReviseForeignPurchaseOrder", "CanReviseLocalPurchaseOrder"] } },
    { pattern: "/procurement/purchase-orders/approved", access: { kind: "some", permissions: approved }, query: permissionTabs(viewApprovedPermissions) },
    { pattern: "/procurement/purchase-orders/check", access: { kind: "some", permissions: view }, query: permissionTabs(viewOrderPermissions) },
    { pattern: "/procurement/purchase-orders/:id", access: { kind: "some", permissions: [...view, ...approved] } },
  ],
} satisfies ModuleManifest<"purchase-orders", "/procurement/purchase-orders">;
