import type { ModuleManifest } from "../contract";
import { workflowAnyStore, workflowStoreQuery } from "@/shared/inventory/workflows";
// Store purchase requisitions: what a store asks Procurement to buy. Sourcing them is the store-procurement module.
export const manifest = {
  id: "store-purchase-requisitions", label: "Store purchase requisitions", root: "/extrals/purchase-requisitions", order: 154,
  access: workflowAnyStore("purchaseRequisitions"), query: workflowStoreQuery("purchaseRequisitions"),
  routes: [{ pattern: "/extrals/purchase-requisitions/:id/details", access: workflowAnyStore("purchaseRequisitions") }],
} satisfies ModuleManifest<"store-purchase-requisitions", "/extrals/purchase-requisitions">;
