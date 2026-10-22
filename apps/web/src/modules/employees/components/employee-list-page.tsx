import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { Employee } from "../api/employee-api";
import { employeeDetailsPath, employeePermissions as p, employeeTypeLabels, employeeStatusLabels, activeStatusLabels, inactiveStatusLabels } from "../lib/access";
import { useEmployeeList } from "../hooks/use-employee-list";
import { useEmployeeLookups } from "../hooks/use-employee-lookups";
import { EmployeeActions } from "./employee-actions";
import { EmployeeInvitations } from "./employee-invitations";
const schema = z.object({ department: z.object({ value: z.string(), label: z.string() }).nullable() });
const c = dataTableColumns<Employee>();
const columns = c.columns([
  c.accessor((row) => row.staffNumber ?? "", { id: "staff", header: "Staff ID" }), c.accessor((row) => `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(), { id: "name", header: "Employee" }),
  c.accessor((row) => row.email ?? "", { id: "email", header: "Email", enableSorting: false }), c.accessor((row) => row.department?.name ?? "", { id: "department", header: "Department" }),
  c.accessor((row) => row.designation?.name ?? "", { id: "designation", header: "Designation" }), c.accessor((row) => row.type === undefined ? "Not recorded" : employeeTypeLabels[row.type], { id: "type", header: "Employment" }),
  c.display({ id: "status", header: "Status", cell: ({ row }) => { const e = row.original; return <Badge variant="outline">{e.status === 0 && e.activeStatus !== undefined ? activeStatusLabels[e.activeStatus] : e.status === 1 && e.inactiveStatus !== undefined ? inactiveStatusLabels[e.inactiveStatus] : e.status === undefined ? "Not recorded" : employeeStatusLabels[e.status]}</Badge>; } }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <EmployeeActions employee={row.original} /> }),
]);
export function EmployeeListPage() {
  const navigate = useNavigate(); const [inviting, setInviting] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { department: null } });
  const department = useWatch({ control: form.control, name: "department" }); const load = useEmployeeLookups();
  const list = useEmployeeList(department?.label ?? null);
  const fields: WizardField<z.infer<typeof schema>>[] = useMemo(() => [{ type: InputTypes.SELECT, name: "department", label: "Department", mode: "single", source: "async", loadOptions: (search, page, signal) => load("department", search, page, signal), placeholder: "All departments" }], [load]);
  return <section className="page-fill"><PageHeader title="Employee management" crumbs={[{ label: "Human resources" }, { label: "Employee management" }]} actions={list.access.has(p.register) ? <><Button asChild variant="outline"><Link to="/hr/employee-management/create/0">Register casual employee</Link></Button><Button asChild><Link to="/hr/employee-management/create/1">Register permanent employee</Link></Button><Button variant="outline" onClick={() => setInviting(true)}>Invite by email</Button></> : null} />
    <div className="flex flex-wrap items-end gap-4"><div className="flex flex-wrap gap-1" role="group" aria-label="Employee status">{list.tabs.map((tab) => <Button key={tab.value} size="sm" aria-pressed={list.tab?.value === tab.value} variant={list.tab?.value === tab.value ? "secondary" : "ghost"} onClick={() => list.changeTab(tab.value)}>{tab.label}</Button>)}</div><div className="w-full sm:max-w-xs"><FormWizard form={form} fields={fields} /></div></div>
    <ServerDataTable label="Employees" columns={columns} rows={list.rows} getRowId={(row) => row.id ?? ""} page={list.table.page} pageSize={list.table.pageSize} totalRows={list.meta.totalRows} onPageChange={list.table.onPageChange} onPageSizeChange={list.table.onPageSizeChange} sorting={list.table.sorting} onSortingChange={list.table.onSortingChange} loading={list.query.isLoading} refreshing={list.query.isFetching && !list.query.isLoading} error={list.error} onRetry={() => void list.query.refetch()} onRowOpen={list.access.has(p.details) ? (row) => { if (row.id) void navigate(employeeDetailsPath(row.id)); } : undefined} emptyTitle="No matching employees" emptyDescription="Change the filters or register an employee." />
    {inviting ? <EmployeeInvitations onClose={() => setInviting(false)} /> : null}
  </section>;
}
