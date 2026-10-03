import test from "node:test";
import assert from "node:assert/strict";
import type { ModuleManifest } from "../apps/web/src/modules/contract.ts";
import { canAccess, resolveQueryAccess, routeAccessRule, validateModuleRegistry } from "../apps/web/src/modules/registry-model.ts";
import type { QueryAccess } from "../apps/web/src/modules/contract.ts";

const inventory: ModuleManifest<"inventory", "/inventory"> = {
  id: "inventory", label: "Inventory", root: "/inventory", order: 2,
  access: { kind: "all", permissions: ["stock.view"] },
  routes: [
    { pattern: "/inventory/stock/create", access: { kind: "all", permissions: ["stock.create"] } },
    { pattern: "/inventory/stock/:id", access: { kind: "some", permissions: ["stock.view", "stock.audit"] } },
  ],
};

test("requires authentication and exact permissions", () => {
  assert.equal(canAccess({ kind: "authenticated" }, { state: "anonymous" }), false);
  assert.equal(canAccess({ kind: "authenticated" }, { state: "authenticated", permissions: new Set() }), true);
  assert.equal(canAccess({ kind: "all", permissions: ["stock.view"] }, { state: "authenticated", permissions: new Set() }), false);
  const viewer = { state: "authenticated", permissions: new Set(["stock.view"]) } as const;
  assert.equal(canAccess({ kind: "all", permissions: [] }, viewer), false);
  assert.equal(canAccess({ kind: "some", permissions: [] }, viewer), false);
  assert.equal(canAccess({ kind: "all", permissions: ["stock.view", "stock.edit"] }, viewer), false);
  assert.equal(canAccess({ kind: "some", permissions: ["stock.view", "stock.edit"] }, viewer), true);
});

test("rejects duplicate module IDs, roots, and paths outside a module", () => {
  assert.throws(() => validateModuleRegistry([inventory, inventory]), /Duplicate module ID/);
  assert.throws(() => validateModuleRegistry([{ ...inventory, id: "stock" }, inventory]), /Duplicate module root/);
  const misplaced: ModuleManifest = {
    id: "inventory", label: "Inventory", root: "/inventory", order: 2, access: { kind: "authenticated" },
    routes: [{ pattern: "/finance", access: { kind: "authenticated" } }],
  };
  assert.throws(() => validateModuleRegistry([misplaced]), /outside/);
});

test("sorts manifests deterministically", () => {
  const warehouse: ModuleManifest<"warehouse", "/warehouse"> = {
    id: "warehouse", label: "Warehouse", root: "/warehouse", order: 1, access: { kind: "authenticated" },
  };
  assert.deepEqual(validateModuleRegistry([inventory, warehouse]).map((module) => module.id), ["warehouse", "inventory"]);
});

test("resolves the most specific route rule and falls back to the module rule", () => {
  assert.deepEqual(routeAccessRule([inventory], "/inventory/stock/create"), { kind: "all", permissions: ["stock.create"] });
  assert.deepEqual(routeAccessRule([inventory], "/inventory/stock/42/"), { kind: "some", permissions: ["stock.view", "stock.audit"] });
  assert.deepEqual(routeAccessRule([inventory], "/inventory/stock/42/history"), inventory.access);
  assert.deepEqual(routeAccessRule([inventory], "/inventory"), inventory.access);
  assert.equal(routeAccessRule([inventory], "/inventory-reports"), null);
  assert.equal(routeAccessRule([inventory], "/settings/appearance"), null);
});

test("rejects route access declared outside its module or twice", () => {
  assert.throws(() => validateModuleRegistry([{ ...inventory, routes: [{ pattern: "/finance", access: { kind: "authenticated" } }] }]), /Route access outside/);
  const rule = { pattern: "/inventory/stock/:id", access: { kind: "authenticated" } } as const;
  assert.throws(() => validateModuleRegistry([{ ...inventory, routes: [rule, rule] }]), /Duplicate route access/);
});

test("requires the department type a rule names, in addition to its permissions", () => {
  const rule = { kind: "all", permissions: ["plan.view"], departmentType: 0 } as const;
  const user = (departmentType: 0 | 1 | 2 | null) => ({ state: "authenticated", permissions: new Set(["plan.view"]), departmentType }) as const;
  assert.equal(canAccess(rule, user(0)), true);
  assert.equal(canAccess(rule, user(1)), false);
  assert.equal(canAccess(rule, user(null)), false);
  assert.equal(canAccess({ kind: "all", permissions: ["plan.view"] }, user(1)), true);
});

test("authenticated landing pages cannot grant implicit access to new child pages", () => {
  const settings: ModuleManifest = { id: "settings", label: "Settings", root: "/settings", order: 1,
    access: { kind: "authenticated" }, routes: [{ pattern: "/settings/appearance", access: { kind: "authenticated" } }] };
  assert.deepEqual(routeAccessRule([settings], "/settings"), settings.access);
  assert.deepEqual(routeAccessRule([settings], "/settings/appearance"), settings.access);
  assert.equal(routeAccessRule([settings], "/settings/admin"), null);
});

const tabs: QueryAccess = { key: "type", choices: [
  { value: "0", access: { kind: "all", permissions: ["foreign.view"] } },
  { value: "1", access: { kind: "all", permissions: ["local.view"] } },
] };

test("query access preserves filters, resets paging, and denies when no choice is allowed", () => {
  const local = { state: "authenticated", permissions: new Set(["local.view"]) } as const;
  assert.deepEqual(resolveQueryAccess(tabs, "?type=1&page=3", local), { state: "allowed" });
  assert.deepEqual(resolveQueryAccess(tabs, "?type=0&search=Acme&page=3", local), { state: "redirect", search: "?type=1&search=Acme" });
  assert.deepEqual(resolveQueryAccess(tabs, "?type=bad", local), { state: "redirect", search: "?type=1" });
  assert.deepEqual(resolveQueryAccess(tabs, "", local), { state: "redirect", search: "?type=1" });
  assert.deepEqual(resolveQueryAccess(tabs, "", { state: "anonymous" }), { state: "denied" });
  assert.deepEqual(resolveQueryAccess(tabs, "", { state: "authenticated", permissions: new Set() }), { state: "denied" });
});

test("rejects invalid query policies on module roots and individual routes", () => {
  const duplicate = { ...tabs, choices: [tabs.choices[0], tabs.choices[0]].filter((choice) => choice !== undefined) };
  assert.throws(() => validateModuleRegistry([{ ...inventory, query: duplicate }]), /Invalid query access/);
  assert.throws(() => validateModuleRegistry([{ ...inventory, routes: [{ pattern: "/inventory", access: inventory.access, query: { key: "", choices: [] } }] }]), /Invalid query access/);
});
