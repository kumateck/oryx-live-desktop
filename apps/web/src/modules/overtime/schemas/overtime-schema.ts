import { z } from "zod";
import { overtimeDay, overtimeDuration, type Overtime } from "../lib/overtime";
const option = z.object({ value: z.uuid(), label: z.string() });
export const overtimeSchema = z
  .object({
    code: z.string().trim().min(1, "Enter or suggest a request code."),
    date: z.date().nullable(),
    start: z.string().nullable(),
    end: z.string().nullable(),
    department: option.nullable(),
    employees: z.array(option).min(1, "Choose at least one employee."),
    justification: z.string().trim(),
  })
  .superRefine((v, context) => {
    const error = (path: keyof typeof v, message: string) => context.addIssue({ code: "custom", path: [path], message });
    if (!v.date) error("date", "Choose the overtime date.");
    if (!v.department) error("department", "Choose a department.");
    if (overtimeDuration(v.start, v.end) === null)
      error("end", "Use valid times with the end after the start on the same day. Overnight overtime is not supported by the current server calculation.");
    if (new Set(v.employees.map((employee) => employee.value)).size !== v.employees.length) error("employees", "Select each employee once.");
  });
export type OvertimeValues = z.infer<typeof overtimeSchema>;
export function overtimeDefaults(row: Overtime | null): OvertimeValues {
  return {
    code: row?.code ?? "",
    date: row?.overtimeDate && Number.isFinite(Date.parse(row.overtimeDate)) ? new Date(row.overtimeDate) : null,
    start: row?.startTime ?? null,
    end: row?.endTime ?? null,
    department: row?.departmentId ? { value: row.departmentId, label: row.department?.name ?? "Department" } : null,
    employees: (row?.employees ?? []).flatMap((employee) =>
      employee.id
        ? [{ value: employee.id, label: [employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.staffNumber || employee.id }]
        : [],
    ),
    justification: row?.justification ?? "",
  };
}
export function overtimePayload(values: OvertimeValues) {
  if (!values.date || !values.department || !values.start || !values.end || !overtimeSchema.safeParse(values).success) return null;
  return {
    code: values.code,
    employeeIds: values.employees.map((employee) => employee.value),
    departmentId: values.department.value,
    overtimeDate: `${overtimeDay(values.date)}T00:00:00Z`,
    startTime: values.start.replace(/^0(?=\d:)/, ""),
    endTime: values.end.replace(/^0(?=\d:)/, ""),
    justification: values.justification || null,
  };
}
