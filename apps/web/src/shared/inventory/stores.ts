import type { AccessRule } from "@/shared/auth/access";
export enum Store {
  IT,
  General,
  Equipment,
  Reagent,
}
export const stores = ["IT store", "General store", "Equipment store", "Reagent store"];
export const storeIds = [Store.IT, Store.General, Store.Equipment, Store.Reagent];
const names = ["It", "General", "Equipment", "Reagent"];
export const itemReadPermissions = names.map((s) => `CanViewItemsIn${s}Store`);
export const itemPermissions = (s: Store) => ({
  view: `CanViewItemsIn${names[s]}Store`,
  create: `CanCreateNewItemIn${names[s]}Store`,
  edit: `CanEditItemIn${names[s]}Store`,
  delete: `CanDeleteItemFrom${names[s]}Store`,
});
export const storeValue = (s: string | null | undefined): Store | undefined =>
  s === "0" ? Store.IT : s === "1" ? Store.General : s === "2" ? Store.Equipment : s === "3" ? Store.Reagent : undefined;
export function itemRule(store: Store, action: "view" | "create" | "edit" | "delete"): AccessRule {
  const p = itemPermissions(store);
  return { kind: "all", permissions: [...new Set([p.view, p[action]])] };
}
export const inventoryRoot = "/extrals/general-inventory-config";
export const inventoryLink = (store: Store, suffix = "") => `${inventoryRoot}${suffix}?storeType=${store}`;

export const stockPermissions = (s: Store) => ({
  available: `CanView${names[s]}StoreAvailableStocks`,
  receiving: `CanView${names[s]}StoreReceivingArea`,
  approve: `CanApprove${names[s]}StoreReceivingAreaEntry`,
  reject: `CanReject${names[s]}StoreReceivingAreaEntry`,
  damage: `CanCreate${names[s]}StoreDamageMissingItemRecord`,
});
export const stockRule = (store: Store, action: "available" | "receiving" | "approve" | "reject" | "damage"): AccessRule => {
  const p = stockPermissions(store);
  const view = action === "damage" || action === "available" ? p.available : p.receiving;
  return { kind: "all", permissions: [...new Set([view, p[action]])] };
};
export const stockRoot = (scope: "available" | "receiving") => (scope === "available" ? "/extrals/available-stocks" : "/extrals/receiving-area");
export const stockLink = (store: Store, scope: "available" | "receiving", suffix = "") => `${stockRoot(scope)}${suffix}?storeType=${store}`;
