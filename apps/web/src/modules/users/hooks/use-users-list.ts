import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useGetApiV1UserQuery } from "../api/user-api";
import { allowedStatuses, audit, disabledFilter, resolveStatus, statusFromParam, statusToParam, type UserStatus } from "../lib/user-access";
import { userListSchema, type UserRow } from "../schemas/user-schema";
import { useUserAccess } from "./use-user-access";

const noUsers: UserRow[] = [];

/** The user directory: status tab from the address, search, and one page of users from the backend. */
export function useUsersList() {
  const access = useUserAccess();
  const [params, setParams] = useSearchParams();
  const statuses = allowedStatuses(access);
  const status = resolveStatus(statusFromParam(params.get("status")), statuses);
  const table = useServerTable({ pageSize: 30 });
  const search = useDebouncedValue(table.search.trim());

  const query = useGetApiV1UserQuery(
    { ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search, isActive: status ? disabledFilter(status) : false },
    { skip: !status },
  );
  const parsed = useMemo(() => query.data ? userListSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : noUsers;
  const meta = pageMeta(query.data, table, rows.length);
  const error = query.error ? apiErrorMessage(query.error)
    : parsed && !parsed.success ? "The server returned user records the app could not read." : null;

  const setStatus = (next: UserStatus) => {
    setParams((current) => { const copy = new URLSearchParams(current); copy.set("status", statusToParam(next)); return copy; });
    table.onPageChange(1);
  };

  return {
    access, statuses, status, setStatus, rows, error,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    retry: () => { void query.refetch(); },
    search: table.search,
    onSearchChange: table.onSearchChange,
    // The requested page, so paging controls respond at once while the previous rows stay on screen.
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange },
  };
}
