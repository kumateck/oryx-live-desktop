import { expect, it } from "vitest";
import { accessOverrides, applyAccessOverrides, clearAccess, toggleAccess } from "./permissions";
import type { PermissionModule } from "../schemas/permission-schema";

const catalog: PermissionModule[] = [{ module: "IT Support", isActive: true, children: [
  { key: "CanViewRoles", name: "View roles", description: null, subModule: null, hasOptions: false, types: ["Access"] },
  { key: "CanEditRole", name: "Edit roles", description: null, subModule: null, hasOptions: false, types: ["Access"] },
] }];

it("starts a new role without granting the catalog defaults", () => {
  const cleared = clearAccess(catalog);
  expect(cleared[0]?.isActive).toBe(false);
  expect(cleared[0]?.children?.map((child) => child.types)).toEqual([[], []]);
  expect(catalog[0]?.children?.[0]?.types).toEqual(["Access"]);
});

it("tracks permission edits as overrides without losing server updates", () => {
  const changed = toggleAccess(catalog, "CanViewRoles");
  const overrides = accessOverrides(catalog, changed);
  expect(overrides).toEqual({ CanViewRoles: false });
  expect(applyAccessOverrides(catalog, overrides)[0]?.children[0]?.types).toEqual([]);
  expect(catalog[0]?.children[0]?.types).toEqual(["Access"]);
});

it("toggles one permission and keeps its module active only while access remains", () => {
  const cleared = clearAccess(catalog);
  const granted = toggleAccess(cleared, "CanViewRoles");
  expect(granted[0]?.isActive).toBe(true);
  expect(granted[0]?.children?.[0]?.types).toEqual(["Access"]);
  expect(granted[0]?.children?.[1]?.types).toEqual([]);
  expect(toggleAccess(granted, "CanViewRoles")[0]?.isActive).toBe(false);
});
