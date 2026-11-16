import type { ModuleManifest } from "../contract";
// Records waiting for the user's review (the "Checked by" step before approval), and records returned to them to correct.
export const manifest = { id: "pending-reviews", label: "My pending reviews", root: "/qa/pending-reviews", order: 21,
  access: { kind: "all", permissions: ["CanViewPendingReviews"] },
} satisfies ModuleManifest<"pending-reviews", "/qa/pending-reviews">;
