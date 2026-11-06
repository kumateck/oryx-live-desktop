import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "white-placebo", label: "White Placebo", root: "/production/white-placebo", order: 90,
  access: { kind: "all", permissions: ["CanViewWhitePlacebo"], departmentType: 0 },
  routes: [
    { pattern: "/production/white-placebo/new", access: { kind: "all", permissions: ["CanViewWhitePlacebo", "CanRequestWhitePlaceboIngredients"], departmentType: 0 } },
    { pattern: "/production/white-placebo/recipe", access: { kind: "all", permissions: ["CanViewWhitePlacebo", "CanEditWhitePlaceboRecipe"], departmentType: 0 } },
  ],
} satisfies ModuleManifest<"white-placebo", "/production/white-placebo">;
