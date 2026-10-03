import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "about-to-expire-materials",
  label: "About to expire materials",
  root: "/warehouse/about-to-expire-materials",
  order: 64,
  access: { kind: "all", permissions: ["CanViewAboutToExpireMaterials"] },
} satisfies ModuleManifest<"about-to-expire-materials", "/warehouse/about-to-expire-materials">;
