import { z } from "zod";
import type { Leave } from "../lib/leave";
import { day, weekdays, LeaveCategory, LeaveStatus } from "../lib/leave";
const option = z.object({ value: z.uuid(), label: z.string() }).nullable();
const category = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
export const leaveSchema = z
  .object({
    category,
    employee: option,
    leaveType: option,
    from: z.date().nullable(),
    to: z.date().nullable(),
    contactPerson: z.string().trim().max(100),
    contactPhone: z.string().trim().max(50),
    destination: z.string().trim(),
    justification: z.string().trim(),
    files: z.array(z.instanceof(File).refine((file) => file.size <= 16 * 1024 * 1024, "Each file must be 16 MB or smaller")).max(20),
  })
  .superRefine((v, context) => {
    const error = (path: keyof typeof v, message: string) => context.addIssue({ code: "custom", path: [path], message });
    if (!v.employee) error("employee", "Choose an employee.");
    if (!v.from) error("from", "Choose a start date.");
    if (!v.to) error("to", "Choose an end date.");
    if (v.from && v.to) {
      if (day(v.from) > day(v.to)) error("to", "End date cannot precede the start date.");
      if (v.category === LeaveCategory.ExitPass && day(v.from) !== day(v.to)) error("to", "An exit pass must be for one day.");
      if (v.category === LeaveCategory.Absence && weekdays(v.from, v.to) > 2) error("to", "Absence requests allow at most two weekdays.");
    }
    if ((v.category === LeaveCategory.Leave || v.category === LeaveCategory.Absence) && !v.leaveType)
      error("leaveType", "Choose the employee's eligible leave type.");
    if (v.category === LeaveCategory.Absence && !v.contactPerson) error("contactPerson", "A contact person is required for absence.");
    if (v.category === LeaveCategory.Absence && !v.contactPhone) error("contactPhone", "A contact number is required for absence.");
    if (v.contactPhone && !/^\+?[\d\s().-]{5,50}$/.test(v.contactPhone)) error("contactPhone", "Enter a valid contact phone number.");
    if (v.category === LeaveCategory.OfficialDuty && !v.destination) error("destination", "A destination is required for official duty.");
  });
export type LeaveValues = z.infer<typeof leaveSchema>;
const parsedDate = (value: string | undefined): Date | null => (value && Number.isFinite(Date.parse(value)) ? new Date(value) : null);
export function leaveDefaults(category: 0 | 1 | 2 | 3, row: Leave | null): LeaveValues {
  return {
    category,
    employee: row?.employeeId
      ? { value: row.employeeId, label: [row.employee?.firstName, row.employee?.lastName].filter(Boolean).join(" ") || row.employeeId }
      : null,
    leaveType: row?.leaveTypeId ? { value: row.leaveTypeId, label: row.leaveType?.name ?? "Leave type" } : null,
    from: parsedDate(row?.startDate),
    to: parsedDate(row?.endDate),
    contactPerson: row?.contactPerson ?? "",
    contactPhone: row?.contactPersonNumber ?? "",
    destination: row?.destination ?? "",
    justification: row?.justification ?? "",
    files: [],
  };
}
export const changeSchema = z.object({
  date: z.date().nullable(),
  end: z.date().nullable(),
  reason: z.string().trim().min(1, "Explain the reason for this change."),
});
export type LeaveChangeValues = z.infer<typeof changeSchema>;
export function changeProblem(row: Leave, kind: "recall" | "reapply", values: LeaveChangeValues): string | null {
  if (!values.date) return "Choose the return or new start date.";
  const start = day(values.date);
  if (kind === "recall")
    return !row.startDate || !row.endDate || start < row.startDate.slice(0, 10) || start > row.endDate.slice(0, 10)
      ? "The return date must fall within the approved leave period."
      : null;
  if (row.leaveStatus !== LeaveStatus.Rejected) return "Only rejected requests can be reapplied.";
  if (!values.end || start > day(values.end)) return "Choose an end date on or after the new start date.";
  if (row.requestCategory === LeaveCategory.ExitPass && start !== day(values.end)) return "An exit pass must be for one day.";
  if (row.requestCategory === LeaveCategory.Absence && weekdays(values.date, values.end) > 2) return "Absence requests allow at most two weekdays.";
  return null;
}
