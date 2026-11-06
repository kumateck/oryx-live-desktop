import type { ModuleManifest } from "../contract";

// Each dashboard has its own view key, which the server checks too.
export const manifest = {
  id: "inventory-command-center",
  label: "Inventory command centre",
  root: "/inventory-command-center",
  order: 108,
  access: { kind: "all", permissions: ["CanViewInventoryCommandCenter"] },
} satisfies ModuleManifest<"inventory-command-center", "/inventory-command-center">;
