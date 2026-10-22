import type { ModuleManifest } from "../contract";
import { workflowAnyStore, workflowStoreQuery } from "@/shared/inventory/workflows";
// Returns of recoverable items issued against stock requisitions, back into their store.
export const manifest = {
  id: "return-items", label: "Return items", root: "/extrals/return-items", order: 152,
  access: workflowAnyStore("returnItems"), query: workflowStoreQuery("returnItems"),
} satisfies ModuleManifest<"return-items", "/extrals/return-items">;
