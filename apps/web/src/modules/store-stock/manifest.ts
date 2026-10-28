import type { ModuleManifest, QueryAccess } from "../contract";
import { storeIds, stockRule } from "@/shared/inventory/stores";
const policy = (scope: "available" | "receiving") => ({
  access: {
    kind: "some",
    permissions: storeIds.flatMap((s) => {
      const r = stockRule(s, scope);
      return r.kind === "all" ? r.permissions : [];
    }),
  } as const,
  query: {
    key: "storeType",
    choices: [1, 0, 2, 3].flatMap((id) => {
      const store = storeIds.find((s) => s === id);
      return store === undefined ? [] : [{ value: String(store), access: stockRule(store, scope) }];
    }),
  } satisfies QueryAccess,
});
export const manifest = {
  id: "store-stock",
  label: "Store stock",
  root: "/extrals",
  order: 149,
  access: { kind: "authenticated" },
  routes: [
    { pattern: "/extrals/available-stocks", ...policy("available") },
    { pattern: "/extrals/available-stocks/:code/item-transactions", ...policy("available") },
    { pattern: "/extrals/receiving-area", ...policy("receiving") },
  ],
} satisfies ModuleManifest<"store-stock", "/extrals">;
