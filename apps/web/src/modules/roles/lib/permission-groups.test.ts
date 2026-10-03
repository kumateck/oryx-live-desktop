import { expect, it } from "vitest";
import { groupPermissions, matchPermissions, mergePermissionCatalog, setPermissionAccess } from "./permission-groups";
import { permissionFixture } from "./permission-fixtures";


it("merges catalog metadata and denies new or missing assignments by default", () => {
  const catalog = permissionFixture.map((module) => ({ ...module, children: module.children.map((child) => ({ ...child, types: ["Access"] })) }));
  const merged = mergePermissionCatalog(catalog, permissionFixture);
  expect(merged[0]?.children.map((child) => child.types)).toEqual([["Access"], [], []]);
  expect(mergePermissionCatalog(catalog, [])[0]?.isActive).toBe(false);
  expect(catalog[0]?.children[1]?.types).toEqual(["Access"]);
});

it("groups submodules and makes ungrouped permissions discoverable", () => {
  expect(Array.from(groupPermissions(permissionFixture[0]?.children ?? []).keys())).toEqual(["Suppliers", "Orders"]);
  expect(groupPermissions(permissionFixture[1]?.children ?? []).get("General")?.length).toBe(1);
});

it("filters by names, descriptions, keys and submodules without whitespace sensitivity", () => {
  const children = permissionFixture[0]?.children ?? [];
  expect(matchPermissions(children, "  READ  ").map((child) => child.key)).toEqual(["view"]);
  expect(matchPermissions(children, "edit").map((child) => child.key)).toEqual(["edit"]);
  expect(matchPermissions(children, "Orders").map((child) => child.key)).toEqual(["purchase"]);
});

it("bulk editing a filtered group preserves hidden permissions and other modules", () => {
  const changed = setPermissionAccess(permissionFixture, "Procurement", new Set(["edit"]), true);
  expect(changed[0]?.children.map((child) => child.types)).toEqual([["Access"], ["Access"], []]);
  expect(changed[1]).toBe(permissionFixture[1]);
  expect(permissionFixture[0]?.children[1]?.types).toEqual([]);
});

it("module access grants or revokes every item and recalculates its active flag", () => {
  const keys = new Set(permissionFixture[0]?.children.map((child) => child.key));
  const granted = setPermissionAccess(permissionFixture, "Procurement", keys, true);
  expect(granted[0]?.children.every((child) => child.types.includes("Access"))).toBe(true);
  expect(setPermissionAccess(granted, "Procurement", keys, false)[0]?.isActive).toBe(false);
});
