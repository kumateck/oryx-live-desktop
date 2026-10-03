import type { ModuleManifest } from "../contract";

const view = { kind: "all", permissions: ["CanViewManufacturers"] } as const;

export const manifest = {
  id: "manufacturers",
  label: "Manufacturers",
  root: "/settings/manufacturers",
  order: 42,
  access: view,
  routes: [
    { pattern: "/settings/manufacturers/create", access: { kind: "all", permissions: ["CanCreateManufacturer"] } },
    { pattern: "/settings/manufacturers/:id/edit", access: { kind: "all", permissions: ["CanUpdateManufacturerDetails"] } },
  ],
} satisfies ModuleManifest<"manufacturers", "/settings/manufacturers">;
