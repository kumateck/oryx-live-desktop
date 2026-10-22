import { useCallback } from "react";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { useAccess } from "@/shared/auth/use-access";
import { audit, itemReadPermissions, type Store } from "../schemas/vendor";
export function useVendorItems(store: Store | undefined) {
  const dispatch = useApiDispatch();
  const { allowsNow } = useAccess();
  return useCallback(
    async (searchQuery: string, page: number, signal: AbortSignal) => {
      const permission = store === undefined ? null : itemReadPermissions[store];
      if (store === undefined || !permission || !allowsNow(permission)) throw new Error("Choose a store you have permission to read.");
      const request = dispatch(
        inventoryApi.endpoints.getApiV1Items.initiate({ ...audit, store, page, pageSize: 30, searchQuery }, { subscribe: false, forceRefetch: true }),
      );
      const abort = () => request.abort();
      signal.addEventListener("abort", abort, { once: true });
      try {
        const result = await request.unwrap();
        if (signal.aborted || !allowsNow(permission)) throw new Error("Item access changed.");
        if ((result.data ?? []).some((r) => r.store !== store)) throw new Error("Items from another store were returned.");
        return {
          options: (result.data ?? []).flatMap((r) => (r.id && r.isActive ? [{ value: r.id, label: `${r.name ?? "Item"} · ${r.code ?? "No code"}` }] : [])),
          hasNext: (result.pageIndex ?? page) < (result.pageCount ?? page),
          hasPrevious: page > 1,
        };
      } finally {
        signal.removeEventListener("abort", abort);
      }
    },
    [dispatch, store, allowsNow],
  );
}
