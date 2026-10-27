import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "expired-materials",
  label: "Expired materials",
  root: "/warehouse/expired-materials",
  order: 64,
  routes: [{ pattern: "/warehouse/expired-materials/:id", access: { kind: "all", permissions: ["CanViewExpiredMaterials"] } }],
  access: { kind: "all", permissions: ["CanViewExpiredMaterials"] },
} satisfies ModuleManifest<"expired-materials", "/warehouse/expired-materials">;
