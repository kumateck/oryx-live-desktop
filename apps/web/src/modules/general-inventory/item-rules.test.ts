import { expect, it } from "vitest";
import { canAccess } from "@/shared/auth/access";
import { routeAccessPolicy, resolveQueryAccess } from "@/modules/registry-model";
import { itemBody, editorSchema, defaults, savedItemMatches } from "./schemas/editor";
import { itemRule, Store } from "@/shared/inventory/stores";
import { itemRegister } from "./lib/register";
import { manifest } from "./manifest";
import { item, otherId } from "./fixture";
it("retains zero-valued store, recoverable classification and stock levels", () => {
  const values = defaults(item);
  expect(editorSchema.safeParse(values).success).toBe(true);
  expect(itemBody(values, Store.IT)).toMatchObject({ store: 0, classification: 0, minimumLevel: 0, maximumLevel: 0, reorderLevel: 0 });
  expect(savedItemMatches(item, itemBody(values, Store.IT))).toBe(true);
});
it("rejects fractional, negative and overflowing levels instead of silently truncating them", () => {
  for (const number of [0.1, -1, 2147483648]) expect(editorSchema.safeParse({ ...defaults(item), reorderLevel: number }).success).toBe(false);
  expect(editorSchema.safeParse({ ...defaults(item), unit: null }).success).toBe(false);
  expect(editorSchema.safeParse({ ...defaults(item), classification: null }).success).toBe(false);
});
it("requires both current read and write access to the exact store", () => {
  const actor = { state: "authenticated", permissions: new Set(["CanViewItemsInItStore", "CanEditItemInItStore"]) } as const;
  expect(canAccess(itemRule(Store.IT, "edit"), actor)).toBe(true);
  expect(canAccess(itemRule(Store.General, "edit"), actor)).toBe(false);
  expect(canAccess(itemRule(Store.IT, "delete"), actor)).toBe(false);
  const policy = routeAccessPolicy([manifest], "/extrals/general-inventory-config/create");
  expect(policy?.query && resolveQueryAccess(policy.query, "?storeType=0", actor)).toEqual({ state: "denied" });
});
it("reads every scoped inventory page and rejects duplicate identities or another store", async () => {
  const load = async (page: number) => ({ data: [page === 1 ? item : { ...item, id: otherId }], pageIndex: page, pageCount: 2, totalRecordCount: 2 });
  expect(await itemRegister(load, Store.IT)).toHaveLength(2);
  await expect(itemRegister(async () => ({ data: [item], pageIndex: 1, pageCount: 1, totalRecordCount: 2 }), Store.IT)).rejects.toThrow();
  await expect(itemRegister(async () => ({ data: [{ ...item, store: 1 }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 }), Store.IT)).rejects.toThrow();
});
