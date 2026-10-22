import type { ModuleManifest } from "../contract";
// A calculation scratchpad for R&D. It reads and writes nothing on the server.
export const manifest = {
  id: "formula-builder", label: "Formula builder", root: "/formula", order: 190,
  access: { kind: "all", permissions: ["CanViewFormulaBuilder"] },
} satisfies ModuleManifest<"formula-builder", "/formula">;
