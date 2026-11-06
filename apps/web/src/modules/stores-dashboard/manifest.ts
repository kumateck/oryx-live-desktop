import type { ModuleManifest } from "../contract";

// Each dashboard has its own view key, which the server checks too.
export const manifest = {
  id: "stores-dashboard",
  label: "Stores dashboard",
  root: "/stores-dashboard",
  order: 107,
  access: { kind: "all", permissions: ["CanViewStoresDashboard"] },
} satisfies ModuleManifest<"stores-dashboard", "/stores-dashboard">;
