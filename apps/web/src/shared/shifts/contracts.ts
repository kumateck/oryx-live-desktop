import { z } from "zod";
export enum ScheduleStatus {
  New,
  Assigned,
  InProgress,
  Cancelled,
  Expired,
}
export enum CalendarMode {
  Week,
  Month,
  Year,
  Day,
}
export const statuses = ["New", "Assigned", "In progress", "Cancelled", "Expired"];
export const frequencies = ["Week", "Two weeks", "Month", "Quarter", "Half year", "Year"];
export const audit = { module: "HR Management", subModule: "Shift Planning" };
const date = z.string().refine((v) => Number.isFinite(Date.parse(v)), "Invalid schedule date.");
export const scheduleSchema = z.object({
  id: z.uuid(),
  scheduleName: z.string(),
  startDate: date,
  endDate: date,
  frequency: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  departmentId: z.uuid(),
  scheduleStatus: z.enum(ScheduleStatus),
  shiftType: z.array(
    z.object({
      id: z.uuid(),
      shiftName: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      applicableDays: z.array(z.number().int().min(0).max(6)).nullish(),
    }),
  ),
  department: z.object({ id: z.uuid(), name: z.string().nullish(), code: z.string().nullish() }).nullish(),
});
export const employeeSchema = z.object({
  employeeId: z.uuid(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  staffNumber: z.string().nullish(),
  department: z.string().nullish(),
  designation: z.string().nullish(),
  type: z.string().nullish(),
});
export const assignmentSchema = z.object({
  employees: z.array(employeeSchema),
  scheduleDate: date,
  shiftCategory: z.object({ id: z.uuid(), name: z.string().nullish() }),
  shiftType: z.object({ shiftTypeId: z.uuid(), shiftName: z.string().nullish() }),
  shiftSchedule: z.object({ scheduleId: z.uuid(), scheduleName: z.string().nullish(), startDate: date, endDate: date }),
});
export type Schedule = z.infer<typeof scheduleSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type ShiftEmployee = z.infer<typeof employeeSchema>;
export interface AssignBody {
  employeeIds: string[];
  shiftScheduleId: string;
  shiftCategoryId: string;
  shiftTypeId: string;
}
export interface SwapBody {
  employeeId: string;
  newEmployeeId: string;
  shiftScheduleId: string;
  shiftCategoryId: string;
  shiftTypeId: string;
  scheduleDate: string;
}
export const assignmentKey = (r: Assignment): string => `${r.scheduleDate.slice(0, 10)}:${r.shiftCategory.id}:${r.shiftType.shiftTypeId}`;
export const employeeName = (e: ShiftEmployee): string => `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.staffNumber || e.employeeId;
