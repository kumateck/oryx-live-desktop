import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { employeeApi, type Employee } from "../api/employee-api";
import { employeeAudit, employeePermissions, employeeStatusLabels, employeeTypeLabels, activeStatusLabels, inactiveStatusLabels } from "../lib/access";
import { enumOptions } from "../lib/employee-payload";
import { useEmployeeChange } from "../hooks/use-employee-change";
export type EmployeeChange = "status" | "type" | "email";
const selection = z.object({ value: z.string(), label: z.string() }).nullable();
const schema = z.object({ status: selection, active: selection, inactive: selection, type: selection, email: z.string().trim(), from: z.date().nullable(), to: z.date().nullable() });
const binary = (value: string | undefined): 0 | 1 | undefined => value === "0" ? 0 : value === "1" ? 1 : undefined;
const ternary = (value: string | undefined): 0 | 1 | 2 | undefined => value === "2" ? 2 : binary(value);
const activeValue = (value: string | undefined): 0 | 1 | 2 | 3 | undefined => value === "3" ? 3 : ternary(value);
const inactiveValue = (value: string | undefined): 0 | 1 | 2 | 3 | 4 | 5 | undefined => value === "4" ? 4 : value === "5" ? 5 : activeValue(value);
const day = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T00:00:00Z`;
export function EmployeeChangeDialog({ employee, kind, onClose }: { employee: Employee; kind: EmployeeChange; onClose: () => void }) {
  const permission = kind === "email" ? employeePermissions.email : employeePermissions.update;
  const action = useEmployeeChange(employee, permission, onClose);
  const validation = useMemo(() => schema.superRefine((v, ctx) => {
    if (kind === "email" && !z.email().safeParse(v.email).success) ctx.addIssue({ code: "custom", path: ["email"], message: "Enter a valid email address." });
    if (kind === "type" && binary(v.type?.value) === undefined) ctx.addIssue({ code: "custom", path: ["type"], message: "Choose an employment type." });
    if (kind === "status") {
      if (binary(v.status?.value) === undefined) ctx.addIssue({ code: "custom", path: ["status"], message: "Choose Active or Inactive. New employees are activated through designation assignment." });
      if (v.status?.value === "0" && v.active?.value === "3") {
        if (!v.from) ctx.addIssue({ code: "custom", path: ["from"], message: "Suspension start is required." });
        if (!v.to || (v.from && v.to < v.from)) ctx.addIssue({ code: "custom", path: ["to"], message: "Choose a suspension end on or after the start." });
      }
    }
  }), [kind]);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(validation), defaultValues: { status: enumOptions(employeeStatusLabels).find((row) => Number(row.value) === employee.status) ?? null, active: enumOptions(activeStatusLabels).find((row) => Number(row.value) === employee.activeStatus) ?? null, inactive: enumOptions(inactiveStatusLabels).find((row) => Number(row.value) === employee.inactiveStatus) ?? null, type: enumOptions(employeeTypeLabels).find((row) => Number(row.value) === employee.type) ?? null, email: employee.email ?? "", from: employee.suspensionStartDate ? new Date(employee.suspensionStartDate) : null, to: employee.suspensionEndDate ? new Date(employee.suspensionEndDate) : null } });
  const [status, active] = useWatch({ control: form.control, name: ["status", "active"] });
  const [changeStatus] = employeeApi.usePutApiV1EmployeeByIdStatusMutation(); const [changeType] = employeeApi.usePutApiV1EmployeeByIdChangeTypeMutation(); const [changeEmail] = employeeApi.usePutApiV1EmployeeEmailByIdMutation();
  const fields: WizardField<z.infer<typeof schema>>[] = kind === "email" ? [{ type: I.EMAIL, name: "email", label: "Email address", required: true }] : kind === "type" ? [{ type: I.SELECT, name: "type", label: "Employment type", mode: "single", source: "sync", options: enumOptions(employeeTypeLabels), required: true }] : [
    { type: I.SELECT, name: "status", label: "Employment status", mode: "single", source: "sync", options: enumOptions(["Active", "Inactive"]), required: true },
    ...(status?.value === "0" ? [{ type: I.SELECT, name: "active", label: "Disciplinary status", mode: "single", source: "sync", options: enumOptions(activeStatusLabels) } satisfies WizardField<z.infer<typeof schema>>] : [{ type: I.SELECT, name: "inactive", label: "Exit reason", mode: "single", source: "sync", options: enumOptions(inactiveStatusLabels) } satisfies WizardField<z.infer<typeof schema>>]),
    ...(status?.value === "0" && active?.value === "3" ? [{ type: I.DATE, name: "from", label: "Suspension start", required: true } satisfies WizardField<z.infer<typeof schema>>, { type: I.DATE, name: "to", label: "Suspension end", required: true } satisfies WizardField<z.infer<typeof schema>>] : []),
  ];
  const submit = form.handleSubmit((values) => action.run(async (fresh) => {
    if (!fresh.id) return "Employee identity is missing.";
    if (kind === "status" && fresh.status === 2) return "Assign a designation to activate a new employee.";
    const status = binary(values.status?.value); const type = binary(values.type?.value); const active = activeValue(values.active?.value); const inactive = inactiveValue(values.inactive?.value);
    const result = kind === "email" ? await changeEmail({ ...employeeAudit, id: fresh.id, email: values.email }) : kind === "type" ? await changeType({ ...employeeAudit, id: fresh.id, ...(type === undefined ? {} : { employeeType: type }) })
      : await changeStatus({ ...employeeAudit, id: fresh.id, domainEntitiesEmployeesUpdateEmployeeStatus: { ...(status === undefined ? {} : { status }), ...(status === 0 && active !== undefined ? { activeStatus: active } : {}), ...(status === 1 && inactive !== undefined ? { inactiveStatus: inactive } : {}), ...(status === 0 && active === 3 && values.from && values.to ? { suspensionStartDate: day(values.from), suspensionEndDate: day(values.to) } : {}) } });
    return "error" in result ? apiErrorMessage(result.error) : null;
  }, "Employee updated"));
  return <Dialog open onOpenChange={(open) => { if (!open && !action.busy) onClose(); }}><DialogContent><DialogHeader><DialogTitle>{kind === "email" ? "Update employee email" : kind === "type" ? "Change employment type" : "Change employee status"}</DialogTitle><DialogDescription>This updates {employee.firstName} {employee.lastName}. Employment changes affect HR and payroll eligibility and are recorded through the server audit flow.</DialogDescription></DialogHeader>
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4"><DialogBody><fieldset disabled={action.busy || !action.allowed} className="space-y-3"><FormWizard form={form} fields={fields} /></fieldset>{action.error ? <p role="alert" className="text-destructive">{action.error}</p> : null}</DialogBody><DialogFooter><Button type="button" variant="outline" disabled={action.busy} onClick={onClose}>Cancel</Button><Button disabled={action.busy || !action.allowed}>{action.busy ? "Updating…" : "Confirm update"}</Button></DialogFooter></form>
  </DialogContent></Dialog>;
}
