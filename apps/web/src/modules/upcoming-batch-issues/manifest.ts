import type { ModuleManifest } from "../contract";

// Batches whose production has started but whose stock is not requested yet, with the lots reserved for them, so the
// warehouse prepares (and swaps) before the requisition arrives.
export const manifest = { id: "upcoming-batch-issues", label: "Upcoming batch issues", root: "/warehouse/upcoming-batch-issues", order: 66,
  access: { kind: "all", permissions: ["CanViewUpcomingBatchIssues"] },
} satisfies ModuleManifest<"upcoming-batch-issues", "/warehouse/upcoming-batch-issues">;
