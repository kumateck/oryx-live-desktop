import { useMemo, useRef, useState } from "react";
import { hrApi } from "@/shared/api/generated/hr";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { readAllPages } from "@/shared/api/read-all-pages";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { Button } from "@/components/ui/button";
import type { DomainEntitiesEmployeesEmployeeDto as Employee } from "@/shared/api/generated/hr";
const audit = { module: "HR Management", subModule: "Department employee export" } as const;
const requirement = { kind: "all", permissions: ["CanViewDepartmentEmployee", "CanExportDepartmentEmployee"] } as const;
const c = dataTableColumns<Employee>();
const columns = c.columns([c.accessor((row) => row.staffNumber ?? "", { id: "staff", header: "Staff ID" }), c.accessor((row) => `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(), { id: "name", header: "Employee" }), c.accessor((row) => row.department?.name ?? "", { id: "department", header: "Department" }), c.accessor((row) => row.designation?.name ?? "", { id: "designation", header: "Designation" })]);
export function DepartmentEmployeesPage() {
  const user = useCurrentUser(); const currentDepartment = useRef(user?.departmentId); currentDepartment.current = user?.departmentId;
  const departmentId = user?.departmentId; const department = user?.department; const dispatch = useApiDispatch(); const permission = usePermissionAction(requirement);
  const search = usePageSearch("department employees", false); const table = useServerTable({ resetKey: `${departmentId}|${search}` });
  const query = hrApi.useGetApiV1EmployeeQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search, status: 0, ...(department ? { department } : {}) }, { skip: !departmentId || !department });
  const rows = useMemo(() => query.currentData?.data ?? [], [query.currentData]); const outOfScope = rows.some((row) => !row.id || row.department?.id !== departmentId || row.status !== 0);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set()); const guard = useRef(false); const [exporting, setExporting] = useState(false); const [error, setError] = useState("");
  const exportSelected = async () => {
    if (guard.current || !selected.size || !department || !departmentId) return;
    const denied = permission.check(); if (denied) { setError(denied); return; }
    guard.current = true; setExporting(true); setError("");
    try {
      const controller = new AbortController();
      const all = await readAllPages((page) => dispatch(hrApi.endpoints.getApiV1Employee.initiate({ ...audit, department, status: 0, page, pageSize: 100 }, { subscribe: false, forceRefetch: true })).unwrap(), (row) => row.id, controller.signal);
      const selectedRows = all.filter((row) => Boolean(row.id && selected.has(row.id)));
      if (selectedRows.length !== selected.size || selectedRows.some((row) => row.status !== 0 || row.department?.id !== departmentId || !row.staffNumber)) { setError("The selection changed, has no staff ID, or includes an employee outside your department. Refresh and select again."); return; }
      const revoked = permission.check(); if (revoked || currentDepartment.current !== departmentId) { setError(revoked ?? "Your department changed. Reload before exporting."); return; }
      const { downloadDepartmentTemplate } = await import("../lib/export-template");
      const lateRevocation = permission.check(); if (lateRevocation) { setError(lateRevocation); return; }
      await downloadDepartmentTemplate(selectedRows);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The employee template could not be exported."); }
    finally { guard.current = false; setExporting(false); }
  };
  const meta = pageMeta(query.currentData, table, rows.length);
  return <section className="page-fill"><PageHeader title="Department employees" crumbs={[{ label: "Human resources" }, { label: "Department employees" }]} actions={permission.allowed ? <Button disabled={exporting || !selected.size} onClick={() => void exportSelected()}>{exporting ? "Verifying selection…" : `Export ${selected.size || "selected"} employees`}</Button> : null} />
    <p className="text-sm text-muted-foreground">{department ?? "No department recorded"}. Select employees to create the shift-import workbook. Category and shift type remain blank for the planner to complete.</p>
    {error ? <p role="alert" className="text-destructive">{error}</p> : null}
    <ServerDataTable label="Department employees" rows={outOfScope ? [] : rows} columns={columns} getRowId={(row) => row.id ?? ""} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={!departmentId || !department ? "Your account has no department assignment." : query.error ? apiErrorMessage(query.error) : outOfScope ? "The server returned employees outside the requested department/status. Refresh before exporting." : null} onRetry={() => void query.refetch()} selection={permission.allowed ? { selected, onChange: setSelected, isSelectable: (row) => Boolean(row.id && row.staffNumber) } : undefined} emptyTitle="No active employees in this department" />
  </section>;
}
