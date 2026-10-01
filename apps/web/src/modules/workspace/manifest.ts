import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "workspace",
  label: "Workspace",
  root: "/home",
  order: 0,
  access: { kind: "authenticated" },
} satisfies ModuleManifest<"workspace", "/home">;
