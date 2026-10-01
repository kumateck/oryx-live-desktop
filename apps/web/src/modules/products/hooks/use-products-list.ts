import { useMemo } from "react";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useGetApiV1ProductQuery } from "../api/product-api";
import { audit } from "../lib/product-access";
import { productListSchema, type ProductRow } from "../schemas/product-schema";
import { useProductAccess } from "./use-product-access";

const noProducts: ProductRow[] = [];

/** Planned products of the signed-in user's department, paged and searched by the backend. */
export function useProductsList() {
  const access = useProductAccess();
  const user = useCurrentUser();
  const table = useServerTable({ pageSize: 50 });
  const search = useDebouncedValue(table.search.trim());
  // Without a department the backend would return every department's products; show none instead.
  const departmentId = user?.departmentId ?? null;

  const query = useGetApiV1ProductQuery(
    { ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(departmentId ? { departmentId } : {}) },
    { skip: !access.view || !departmentId },
  );
  const parsed = useMemo(() => query.data ? productListSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : noProducts;
  const meta = pageMeta(query.data, table, rows.length);
  const error = !departmentId ? "Your account has no department, so there are no planned products to show."
    : query.error ? apiErrorMessage(query.error)
      : parsed && !parsed.success ? "The server returned product records the app could not read." : null;

  return {
    access, rows, error,
    loading: Boolean(departmentId) && query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    retry: () => { void query.refetch(); },
    search: table.search,
    onSearchChange: table.onSearchChange,
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
