import { z } from "zod";
import { appointments, budgets, calendarDay, type StaffRequest } from "../lib/staff";
const selection = z.object({ value: z.uuid(), label: z.string() }).nullable();
const binary = z.object({ value: z.enum(["0", "1"]), label: z.string() }).nullable();
export const staffSchema = z
  .object({
    staff: z.number().int("Enter a whole number of employees.").min(1).max(2147483647),
    department: selection,
    designation: selection,
    qualification: z.string().trim().min(1).max(255),
    education: z.string().trim().min(1).max(255),
    appointment: binary,
    budget: binary,
    urgency: z.date().nullable(),
    justification: z.string().trim(),
    requirements: z.string().trim(),
    additionalRequests: z.string().trim(),
  })
  .superRefine((v, context) => {
    for (const key of ["department", "designation", "appointment", "budget", "urgency"] as const)
      if (!v[key]) context.addIssue({ code: "custom", path: [key], message: `Choose ${key === "urgency" ? "the required-by date" : `a ${key}`}.` });
  });
export type StaffValues = z.infer<typeof staffSchema>;
export function staffDefaults(row: StaffRequest | null): StaffValues {
  return {
    staff: row?.staffRequired ?? 1,
    department: row?.departmentId ? { value: row.departmentId, label: row.department?.name ?? row.departmentName ?? "Department" } : null,
    designation: row?.designationId ? { value: row.designationId, label: row.designation?.name ?? "Designation" } : null,
    qualification: row?.qualification ?? "",
    education: row?.educationalQualification ?? "",
    appointment: row?.appointmentType === undefined ? null : { value: row.appointmentType === 0 ? "0" : "1", label: appointments[row.appointmentType] },
    budget: row?.budgetStatus === undefined ? null : { value: row.budgetStatus === 0 ? "0" : "1", label: budgets[row.budgetStatus] },
    urgency: row?.requestUrgency && Number.isFinite(Date.parse(row.requestUrgency)) ? new Date(row.requestUrgency) : null,
    justification: row?.justification ?? "",
    requirements: row?.additionalRequirements ?? "",
    additionalRequests: row?.additionalRequests ?? "",
  };
}
export function staffPayload(v: StaffValues, original: StaffRequest | null) {
  if (!staffSchema.safeParse(v).success || !v.department || !v.designation || !v.appointment || !v.budget || !v.urgency) return null;
  const existingDate = original?.requestUrgency;
  return {
    staffRequired: v.staff,
    departmentId: v.department.value,
    designationId: v.designation.value,
    qualification: v.qualification,
    educationalQualification: v.education,
    appointmentType: v.appointment.value === "0" ? (0 as const) : (1 as const),
    budgetStatus: v.budget.value === "0" ? (0 as const) : (1 as const),
    requestUrgency: existingDate && existingDate.slice(0, 10) === calendarDay(v.urgency) ? existingDate : `${calendarDay(v.urgency)}T23:59:59Z`,
    justification: v.justification || null,
    additionalRequirements: v.requirements || null,
    additionalRequests: v.additionalRequests || null,
  };
}
