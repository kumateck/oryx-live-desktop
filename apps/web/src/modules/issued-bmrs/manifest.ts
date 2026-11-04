import type { ModuleManifest } from "../contract";

export const manifest = { id: "issued-bmrs", label: "Issued BMR records", root: "/qa/issued-bmrs", order: 72,
  access: { kind: "all", permissions: ["CanViewIssuedBmrRecords"] },
} satisfies ModuleManifest<"issued-bmrs", "/qa/issued-bmrs">;
