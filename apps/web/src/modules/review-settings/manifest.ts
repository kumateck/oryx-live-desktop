import type { ModuleManifest } from "../contract";
// Who reviews each document type (the "Checked by" step between preparing a record and its approvals).
export const manifest = { id: "review-settings", label: "Document reviews", root: "/settings/reviews", order: 82,
  access: { kind: "all", permissions: ["CanViewDocumentReviewSettings"] },
} satisfies ModuleManifest<"review-settings", "/settings/reviews">;
