import { useMemo, useState } from "react";
import { useAccess } from "@/shared/auth/use-access";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { approvalSettingsApi, approvalSettingsAudit } from "../api/approval-settings-api";
import { approvalsListSchema, readApprovalRows } from "../schemas/approval-settings-schema";

export function useApprovalConfigurations() {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim());
  const paging = useServerTable({ resetKey: debounced });
  const { has } = useAccess();
  const query = approvalSettingsApi.useGetApiV1ApprovalQuery({ ...approvalSettingsAudit, page: paging.page, pageSize: paging.pageSize, searchQuery: debounced }, { skip: !has("CanViewApprovals") });
  const parsed = useMemo(() => query.currentData ? approvalsListSchema.safeParse(query.currentData) : null, [query.currentData]);
  // One malformed workflow is set aside and named, rather than hiding every other workflow.
  const read = useMemo(() => parsed?.success ? readApprovalRows(parsed.data.data) : { rows: [], unreadable: [], repairable: [] }, [parsed]);
  return { search, setSearch, rows: read.rows, unreadable: read.unreadable, repairable: read.repairable, paging: { page: paging.page, pageSize: paging.pageSize, onPageChange: paging.onPageChange, onPageSizeChange: paging.onPageSizeChange, totalRows: parsed?.success ? parsed.data.totalRecordCount : 0 },
    loading: query.isFetching && !query.currentData, refreshing: query.isFetching && Boolean(query.currentData),
    error: query.error ? apiErrorMessage(query.error) : parsed?.success === false ? "These workflows cannot be read safely." : null,
    retry: () => { void query.refetch(); },
  };
}
