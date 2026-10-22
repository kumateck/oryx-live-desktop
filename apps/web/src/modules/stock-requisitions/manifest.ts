import type { ModuleManifest } from "../contract";
import { workflowAnyStore, workflowStoreQuery } from "@/shared/inventory/workflows";
// Store stock requisitions: raising, editing and following them. Issuing against them is the issue-stock module.
export const manifest = {
  id: "stock-requisitions", label: "Stock requisitions", root: "/extrals/stock-requisitions", order: 150,
  access: workflowAnyStore("stockRequisitions"), query: workflowStoreQuery("stockRequisitions"),
  routes: [{ pattern: "/extrals/stock-requisitions/:id/details", access: workflowAnyStore("stockRequisitions") }],
} satisfies ModuleManifest<"stock-requisitions", "/extrals/stock-requisitions">;
