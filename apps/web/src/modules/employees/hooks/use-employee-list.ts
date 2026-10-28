import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useAccess } from "@/shared/auth/use-access";
import { useServerTable, pageMeta } from "@/shared/datatable";
import { usePageSearch } from "@/shared/search/page-search";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { employeeApi } from "../api/employee-api";
import { EmployeeStatus, employeePermissions as p, employeeAudit } from "../lib/access";
export const employeeTabs = [{ value: EmployeeStatus.Active, label: "Active", permission: p.active }, { value: EmployeeStatus.Inactive, label: "Inactive", permission: p.inactive }, { value: EmployeeStatus.New, label: "New", permission: p.new }] as const;
export function useEmployeeList(department: string | null) {
  const [params, setParams] = useSearchParams(); const access = useAccess(); const tabs = employeeTabs.filter((tab) => access.has(tab.permission));
  const tab = tabs.find((tab) => String(tab.value) === params.get("status")) ?? tabs[0];
  const search = usePageSearch("employees", false); const table = useServerTable({ resetKey: `${tab?.value}|${department}|${search}` });
  const sort = table.sorting[0];
  const sortBy = sort?.id === "name" ? 1 : sort?.id === "staff" ? 3 : sort?.id === "type" ? 4 : sort?.id === "department" ? 5 : sort?.id === "designation" ? 6 : 0;
  const query = employeeApi.useGetApiV1EmployeeQuery({ ...employeeAudit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(tab ? { status: tab.value } : {}), ...(department ? { department } : {}), sortBy, sortDirection: sort ? sort.desc ? 2 : 1 : 0 }, { skip: !tab });
  const rows = useMemo(() => query.currentData?.data ?? [], [query.currentData]);
  const error = query.error ? apiErrorMessage(query.error) : rows.some((row) => !row.id) ? "An employee has no identity. Refresh the list before taking action." : null;
  return { tabs, tab, query, rows, error, table, meta: pageMeta(query.currentData, table, rows.length), access, changeTab: (value: EmployeeStatus) => setParams((old) => { const next = new URLSearchParams(old); next.set("status", String(value)); return next; }) };
}
