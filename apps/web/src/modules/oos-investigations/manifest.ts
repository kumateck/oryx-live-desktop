import type { ModuleManifest } from "../contract";
export const manifest = { id: "oos-investigations", label: "OOS investigations", root: "/qa/oos-investigations", order: 74,
  access: { kind: "all", permissions: ["CanViewOosInvestigations"] },
} satisfies ModuleManifest<"oos-investigations", "/qa/oos-investigations">;
