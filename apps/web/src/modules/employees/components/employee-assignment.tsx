import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { identityApi } from "@/shared/api/generated/identity";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { employeeApi, type Employee } from "../api/employee-api";
import { employeeAudit, employeePermissions } from "../lib/access";
import { useEmployeeLookups } from "../hooks/use-employee-lookups";
import { useEmployeeChange } from "../hooks/use-employee-change";
import { assignmentSchema, type AssignmentValues } from "../schemas/assignment-schema";
const named = (row: { id?: string; name?: string | null } | undefined) => row?.id && row.name ? { value: row.id, label: row.name } : null;
const levelOptions = [{ value: "0", label: "Junior staff" }, { value: "1", label: "Senior staff" }, { value: "2", label: "Senior management" }] as const;
export function EmployeeAssignment({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const gate = usePermissionAction(employeePermissions.update); const action = useEmployeeChange(employee, employeePermissions.update, onClose);
  const form = useForm<AssignmentValues>({ resolver: zodResolver(assignmentSchema), defaultValues: { department: named(employee.department), designation: named(employee.designation), manager: employee.reportingManagerId ? { value: employee.reportingManagerId, label: `${employee.reportingManager?.firstName ?? ""} ${employee.reportingManager?.lastName ?? ""}`.trim() || employee.reportingManagerId } : null, warehouses: [], staffNumber: employee.staffNumber ?? "", level: levelOptions.find((option) => Number(option.value) === employee.level) ?? null, startDate: employee.dateEmployed ? new Date(employee.dateEmployed) : null } });
  const department = useWatch({ control: form.control, name: "department" }); const load = useEmployeeLookups(department?.value);
  const scope = identityApi.useGetApiV1DepartmentByDepartmentIdQuery({ ...employeeAudit, departmentId: department?.value ?? "" }, { skip: !department });
  const production = scope.currentData?.type === 0;
  const [readDepartment] = identityApi.useLazyGetApiV1DepartmentByDepartmentIdQuery(); const [readDesignations] = employeeApi.useLazyGetApiV1DesignationDepartmentByIdQuery(); const [readWarehouses] = warehouseApi.useLazyGetApiV1WarehouseDepartmentByDepartmentIdQuery();
  const [assign] = employeeApi.usePutApiV1EmployeeByIdAssignMutation();
  const fields: WizardField<AssignmentValues>[] = useMemo(() => [
    { type: I.SELECT, name: "department", label: "Department", required: true, mode: "single", source: "async", loadOptions: (search, page, signal) => load("department", search, page, signal) },
    { type: I.SELECT, name: "designation", label: "Designation", required: true, mode: "single", source: "async", loadOptions: (search, page, signal) => load("designation", search, page, signal), disabled: !department },
    { type: I.SELECT, name: "manager", label: "Reporting manager", mode: "single", source: "async", loadOptions: (search, page, signal) => load("manager", search, page, signal) },
    { type: I.TEXT, name: "staffNumber", label: "Staff number", required: true }, { type: I.DATE, name: "startDate", label: "Employment start date" },
    ...(employee.type === 1 ? [{ type: I.SELECT, name: "level", label: "Employee grade", required: true, mode: "single", source: "sync", options: levelOptions } satisfies WizardField<AssignmentValues>] : []),
    ...(production ? [{ type: I.SELECT, name: "warehouses", label: "Assigned warehouses", required: true, mode: "multiple", source: "async", loadOptions: (search, page, signal) => load("warehouse", search, page, signal), description: "Select the full intended assignment. The employee read contract does not expose existing assigned warehouse IDs." } satisfies WizardField<AssignmentValues>] : []),
  ], [load, department, production, employee.type]);
  const submit = form.handleSubmit((v) => action.run(async (fresh) => {
    if (!fresh.id || !v.department || !v.designation) return "Choose a department and designation.";
    if (fresh.type === 1 && !v.level) { form.setError("level", { message: "A permanent employee must have a grade." }); return "Choose an employee grade."; }
    const [dept, designations, warehouses] = await Promise.all([
      readDepartment({ ...employeeAudit, departmentId: v.department.value }, false), readDesignations({ ...employeeAudit, id: v.department.value }, false), readWarehouses({ ...employeeAudit, departmentId: v.department.value }, false),
    ]);
    if ("error" in dept) return apiErrorMessage(dept.error); if ("error" in designations) return apiErrorMessage(designations.error); if ("error" in warehouses) return apiErrorMessage(warehouses.error);
    if (!dept.data?.id || !designations.data?.some((row) => row.id === v.designation?.value)) return "The designation is no longer available in this department. Choose it again.";
    if (dept.data.type === 0 && !v.warehouses.length) return "Select the complete warehouse assignment for this production employee.";
    if (new Set(v.warehouses.map((row) => row.value)).size !== v.warehouses.length || v.warehouses.some((option) => !warehouses.data?.some((row) => row.id === option.value))) return "One or more selected warehouses are not available for this department.";
    const denied = gate.check(); if (denied) return denied;
    const level = v.level?.value === "0" ? 0 : v.level?.value === "1" ? 1 : v.level?.value === "2" ? 2 : undefined;
    const result = await assign({ ...employeeAudit, id: fresh.id, domainEntitiesEmployeesAssignEmployeeDto: { departmentId: v.department.value, designationId: v.designation.value, staffNumber: v.staffNumber, warehouseIds: dept.data.type === 0 ? v.warehouses.map((row) => row.value) : [], ...(level === undefined ? {} : { level }), ...(v.manager ? { reportingManagerId: v.manager.value } : {}), ...(v.startDate ? { startDate: `${v.startDate.getFullYear()}-${String(v.startDate.getMonth() + 1).padStart(2, "0")}-${String(v.startDate.getDate()).padStart(2, "0")}T00:00:00Z` } : {}) } });
    return "error" in result ? apiErrorMessage(result.error) : null;
  }, "Employee designation assigned"));
  return <Dialog open onOpenChange={(open) => { if (!open && !action.busy) onClose(); }}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Assign employee designation</DialogTitle><DialogDescription>Assigning {employee.firstName} {employee.lastName} activates their employment, sets leave entitlement from the designation, updates linked user information and sends the server's acceptance email.</DialogDescription></DialogHeader>
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4"><DialogBody><fieldset disabled={action.busy || !action.allowed} className="grid gap-4 sm:grid-cols-2"><FormWizard form={form} fields={fields} /></fieldset>{scope.error ? <p role="alert">{apiErrorMessage(scope.error)}</p> : null}{action.error ? <p role="alert" className="text-destructive">{action.error}</p> : null}</DialogBody><DialogFooter><Button type="button" variant="outline" disabled={action.busy} onClick={onClose}>Cancel</Button><Button disabled={action.busy || !action.allowed || scope.isFetching || Boolean(scope.error)}>{action.busy ? "Assigning…" : "Assign and activate employee"}</Button></DialogFooter></form>
  </DialogContent></Dialog>;
}
