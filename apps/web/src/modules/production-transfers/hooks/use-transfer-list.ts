import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { productionTransfersApi } from "../api/transfers-api";
import { belongsToDepartment, directionPermission, TransferDirection, TransferStatus, transferAudit, transferRowsSchema } from "../lib/transfers";

export function useTransferList() {
  const [params, setParams] = useSearchParams();
  const { has } = useAccess();
  const departmentId = useCurrentUser()?.departmentId ?? null;
  const direction = params.get("type") === "1" ? TransferDirection.Outgoing : TransferDirection.Incoming;
  const wantedStatus = params.get("status");
  const status = wantedStatus === "all" || (wantedStatus == null && direction === TransferDirection.Outgoing) ? undefined : wantedStatus === "1" ? TransferStatus.Approved : wantedStatus === "2" ? TransferStatus.Issued : wantedStatus === "3" ? TransferStatus.Rejected : TransferStatus.Pending;
  const search = usePageSearch("stock transfers", false);
  const table = useServerTable({ resetKey: `${direction}|${status}|${search}` });
  const permitted = has(directionPermission(direction));
  const arg = { ...transferAudit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(status === undefined ? {} : { status }) };
  const incoming = productionTransfersApi.useGetApiV1ProductionScheduleStockTransferInBoundQuery(arg, { skip: !permitted || !departmentId || direction !== TransferDirection.Incoming });
  const outgoing = productionTransfersApi.useGetApiV1ProductionScheduleStockTransferOutBoundQuery(arg, { skip: !permitted || !departmentId || direction !== TransferDirection.Outgoing });
  const query = direction === TransferDirection.Incoming ? incoming : outgoing;
  const parsed = useMemo(() => query.currentData ? transferRowsSchema.safeParse(query.currentData.data ?? []) : null, [query.currentData]);
  const wrongDepartment = parsed?.success && parsed.data.some((row) => !belongsToDepartment(row, departmentId, direction));
  const rows = parsed?.success && !wrongDepartment ? parsed.data : [];
  const meta = pageMeta(query.currentData, table, rows.length);
  const change = (key: string, value: string) => setParams((current) => { const next = new URLSearchParams(current); next.set(key, value); next.delete("page"); if (key === "type") next.delete("status"); return next; });
  return { direction, status, rows, table, meta, query, has, permitted, change,
    error: !departmentId ? "Your account has no department. Choose a department before reviewing transfers." : query.error ? apiErrorMessage(query.error) : wrongDepartment ? "The server returned a transfer outside your department. No records are shown." : parsed && !parsed.success ? "The transfer list could not be read. Refresh and try again." : null };
}
