import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1ProductQuery } from "../api/product-api";
import { useProductWorkspace } from "./use-product-workspace";
import { productListError } from "../lib/products-list";
import { audit } from "../lib/product-access";
import { productListSchema, type ProductRow } from "../schemas/product-schema";
import { useProductAccess } from "./use-product-access";

const noProducts: ProductRow[] = [];

/** Products in the active production or explicitly selected QA department, paged and searched by the backend. */
export function useProductsList(selectedDepartmentId?: string | null) {
  const access = useProductAccess();
  const workspace = useProductWorkspace();
  const user = useCurrentUser();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("planned products", busy);
  const departmentId = workspace.mode === "qa" ? selectedDepartmentId ?? null : user?.departmentId ?? null;
  const table = useServerTable({ pageSize: 50, resetKey: `${departmentId ?? ""}:${search}` });
  // Without a department the backend would return every department's products; show none instead.
  const query = useGetApiV1ProductQuery(
    { ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(departmentId ? { departmentId } : {}) },
    { skip: !access.view || !departmentId },
  );
  const parsed = useMemo(() => query.currentData ? productListSchema.safeParse(query.currentData.data ?? []) : null, [query.currentData]);
  const rows = parsed?.success ? parsed.data : noProducts;
  const meta = pageMeta(query.currentData, table, rows.length);
  const error = productListError(departmentId, workspace.mode, query.error ? apiErrorMessage(query.error) : null, parsed?.success === false);

  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);

  return {
    access, rows, error,
    loading: Boolean(departmentId) && query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    retry: () => { void query.refetch(); },
    search,
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
