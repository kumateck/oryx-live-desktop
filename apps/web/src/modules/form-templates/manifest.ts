import type { ModuleManifest } from "../contract";
// Form templates: the tests (sections) of an analytical raw data sheet or specification, and the questions under each.
export const manifest = { id: "form-templates", label: "Templates", root: "/settings/templates", order: 95,
  access: { kind: "all", permissions: ["CanViewTemplate"] },
  routes: [
    { pattern: "/settings/templates/create", access: { kind: "all", permissions: ["CanViewTemplate", "CanCreateTemplate"] } },
    { pattern: "/settings/templates/:id/edit", access: { kind: "all", permissions: ["CanViewTemplate", "CanEditTemplate"] } },
  ],
} satisfies ModuleManifest<"form-templates", "/settings/templates">;
