import { useMemo, useState } from "react";
import { useAccess } from "@/shared/auth/use-access";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useServerTable } from "@/shared/datatable/hooks/use-server-table";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { alertApi, alertAudit } from "../api/alert-api";
import { alertsPageSchema } from "../schemas/alert-schema";

export function useAlerts() {
  const { has } = useAccess();
  const [search, setSearch] = useState("");
  const [withDisabled, setWithDisabled] = useState(true);
  const debounced = useDebouncedValue(search.trim());
  const paging = useServerTable({ resetKey: `${debounced}:${withDisabled}` });
  const query = alertApi.useGetApiV1AlertQuery({ ...alertAudit, page: paging.page, pageSize: paging.pageSize, searchQuery: debounced, withDisabled }, { skip: !has("CanViewAlerts") });
  const parsed = useMemo(() => query.currentData ? alertsPageSchema.safeParse(query.currentData) : null, [query.currentData]);
  return { search, setSearch, withDisabled, setWithDisabled,
    rows: parsed?.success ? parsed.data.data : [], paging: { page: paging.page, pageSize: paging.pageSize, onPageChange: paging.onPageChange, onPageSizeChange: paging.onPageSizeChange, totalRows: parsed?.success ? parsed.data.totalRecordCount : 0 },
    loading: query.isFetching && !query.currentData, refreshing: query.isFetching && Boolean(query.currentData),
    error: query.error ? apiErrorMessage(query.error) : parsed?.success === false ? "The alerts could not be read safely." : null,
    retry: () => { void query.refetch(); },
  };
}
