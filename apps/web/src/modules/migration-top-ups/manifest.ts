import type { ModuleManifest } from "../contract";

// Warehouse entry of stock that arrived before go-live but was missed by the opening-stock migration.
export const manifest = {
  id: "migration-top-ups", label: "Migration stock top-ups", root: "/warehouse/migration-top-ups", order: 66,
  access: { kind: "all", permissions: ["CanViewOpeningBalances"] },
  routes: [
    { pattern: "/warehouse/migration-top-ups/new", access: { kind: "all", permissions: ["CanViewOpeningBalances", "CanUploadOpeningBalances"] } },
    { pattern: "/warehouse/migration-top-ups/:id", access: { kind: "all", permissions: ["CanViewOpeningBalances"] } },
  ],
} satisfies ModuleManifest<"migration-top-ups", "/warehouse/migration-top-ups">;
