import type { ModuleManifest } from "../contract";
import { workflowAnyStore, workflowStoreQuery } from "@/shared/inventory/workflows";
// Issuing store stock against stock requisitions. Its pages are the stock-requisitions module's list and detail in issue mode.
export const manifest = {
  id: "issue-stock", label: "Issue stock", root: "/extrals/issue-stock", order: 151,
  access: workflowAnyStore("issueStock"), query: workflowStoreQuery("issueStock"),
  routes: [{ pattern: "/extrals/issue-stock/:id", access: workflowAnyStore("issueStock") }],
} satisfies ModuleManifest<"issue-stock", "/extrals/issue-stock">;
