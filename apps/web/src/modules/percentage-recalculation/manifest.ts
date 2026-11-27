import type { ModuleManifest } from "../contract";
import { percentageRecalculationKey } from "./lib/percentage-recalculation";
/** Recalculating repaired Percentage results stored as fractions; one key covers the list and the action it serves. */
export const manifest = { id: "percentage-recalculation", label: "Percentage recalculation", root: "/qc/percentage-recalculation", order: 77,
  access: { kind: "all", permissions: [percentageRecalculationKey] },
} satisfies ModuleManifest<"percentage-recalculation", "/qc/percentage-recalculation">;
