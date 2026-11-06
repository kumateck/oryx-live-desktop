import { expect, it } from "vitest";
import { canAccess } from "@/shared/auth/access";
import { navigationCatalog } from "@/modules/navigation/catalog.generated";
import { manifest } from "./manifest";
import { permissions } from "./lib/white-placebo";

const authenticated = { state: "authenticated", permissions: new Set<string>([permissions.view]), departmentType: 0 } as const;

it("guards every White Placebo screen before mounting its data hooks", () => {
  expect(canAccess(manifest.access, { state: "anonymous" })).toBe(false);
  expect(canAccess(manifest.access, authenticated)).toBe(true);
  expect(canAccess(manifest.access, { ...authenticated, departmentType: 1 })).toBe(false);
  expect(canAccess(manifest.access, { ...authenticated, permissions: new Set() })).toBe(false);
  for (const route of manifest.routes) expect(canAccess(route.access, authenticated)).toBe(false);
});

it("opens each task screen with its own key and no other", () => {
  const route = (suffix: string) => manifest.routes.find((item) => item.pattern.endsWith(suffix))!.access;
  const withKey = (key: string) => ({ ...authenticated, permissions: new Set<string>([permissions.view, key]) });
  expect(canAccess(route("/new"), withKey(permissions.create))).toBe(true);
  expect(canAccess(route("/new"), withKey(permissions.recipe))).toBe(false);
  expect(canAccess(route("/recipe"), withKey(permissions.recipe))).toBe(true);
  expect(canAccess(route("/recipe"), withKey(permissions.create))).toBe(false);
  // The old shared requisition keys no longer open White Placebo.
  const legacy = { ...authenticated, permissions: new Set(["CanViewRawMaterialRequisitions", "CanCreateRawMaterialRequisitions", "CanEditProductionPlan", "CanEditRawMaterials"]) };
  expect(canAccess(manifest.access, legacy)).toBe(false);
});

it("shows the sidebar entry under the view key", () => {
  const items: readonly { id: string; permissions?: readonly string[] }[] = navigationCatalog.flatMap((group) => group.items as readonly { id: string; permissions?: readonly string[] }[]);
  expect(items.find((item) => item.id === "production-planning.white-placebo")?.permissions).toEqual([permissions.view]);
});
