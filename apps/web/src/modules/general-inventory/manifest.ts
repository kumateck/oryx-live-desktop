import type { ModuleManifest, QueryAccess } from "../contract";
import { storeIds, itemRule, itemReadPermissions, inventoryRoot as root } from "@/shared/inventory/stores";
const query = (action: "view" | "create" | "edit"): QueryAccess => ({
  key: "storeType",
  choices: [1, 0, 2, 3].flatMap((id) => {
    const store = storeIds.find((s) => s === id);
    return store === undefined ? [] : [{ value: String(store), access: itemRule(store, action) }];
  }),
});
const access = { kind: "some", permissions: itemReadPermissions } as const;
export const manifest = {
  id: "general-inventory",
  label: "General inventory",
  root,
  order: 148,
  access,
  query: query("view"),
  routes: [
    { pattern: `${root}/create`, access, query: query("create") },
    { pattern: `${root}/:id`, access, query: query("view") },
    { pattern: `${root}/:id/edit`, access, query: query("edit") },
  ],
} satisfies ModuleManifest<"general-inventory", typeof root>;
