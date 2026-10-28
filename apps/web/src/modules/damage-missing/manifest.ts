import type { ModuleManifest } from "../contract";
import { workflowAnyStore, workflowStoreQuery } from "@/shared/inventory/workflows";
// The register of damaged and missing store stock, with corrections and deletions. Reports are raised from available stock.
export const manifest = {
  id: "damage-missing", label: "Damage/Missing Items", root: "/extrals/damage-missing-items", order: 153,
  access: workflowAnyStore("damageMissing"), query: workflowStoreQuery("damageMissing"),
} satisfies ModuleManifest<"damage-missing", "/extrals/damage-missing-items">;
