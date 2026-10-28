import { z } from "zod";
import { hrApi } from "@/shared/api/generated/hr";
import { settingsApi } from "@/shared/api/generated/settings";
import { parseClockValue } from "@/shared/forms/time-value";
import { daysOfWeek } from "@/modules/working-days/working-days";
import { addTags } from "@/shared/api/add-tags";

// Shift types, shift categories, shift schedules and the working hours policy share the rules in this file.
export const shiftPermissions = {
  types: { view: "CanViewShiftTypes", add: "CanCreateShiftType", edit: "CanEditShiftType", remove: "CanDeleteShiftType" },
  categories: { view: "CanViewShiftCategories", add: "CanCreateShiftCategory", edit: "CanEditShiftCategory", remove: "CanDeleteShiftCategory" },
  schedules: { view: "CanViewShiftSchedule", add: "CanCreateShiftSchedule", edit: "CanEditShiftSchedule", remove: "CanDeleteShiftSchedule" },
  policy: { view: "CanViewWorkingHoursPolicy", manage: "CanManageWorkingHoursPolicy" },
} as const;
export const shiftAudit = { types: { module: "Settings", subModule: "Shift Type" }, categories: { module: "Settings", subModule: "Shift Category" }, schedules: { module: "Settings", subModule: "Shift Schedule" }, policy: { module: "Settings", subModule: "Working Hours Policy" } } as const;

// The numbers are the server's.
export const rotationOptions = [{ value: "0", label: "Rotational" }, { value: "1", label: "Fixed" }] as const;
export const frequencyOptions = [{ value: "0", label: "Week" }, { value: "1", label: "Two weeks" }, { value: "2", label: "Month" }, { value: "3", label: "Quarter" }, { value: "4", label: "Half year" }, { value: "5", label: "Year" }] as const;
export const scheduleStatuses = ["New", "Assigned", "In progress", "Cancelled", "Expired"] as const;
export const dayOptions = daysOfWeek.map((label, day) => ({ value: String(day), label }));
const labelOf = (options: readonly { value: string; label: string }[], value: number) => options.find((item) => item.value === String(value))?.label ?? "Other";
export const rotationLabel = (value: number) => labelOf(rotationOptions, value);
export const frequencyLabel = (value: number) => labelOf(frequencyOptions, value);

const tag = (type: "ShiftTypes" | "ShiftCategories" | "ShiftSchedules" | "WorkingHoursPolicies") => { const list = { type, id: "all" }; return { list, changed: (_result: unknown, error: unknown) => error ? [] : [list] }; };
const types = tag("ShiftTypes"), categories = tag("ShiftCategories"), schedules = tag("ShiftSchedules"), policies = tag("WorkingHoursPolicies");
// A schedule shows its shift types, so it is read again when a shift type changes.
const typeChanged = (_result: unknown, error: unknown) => error ? [] : [types.list, schedules.list];
export const shiftApi = hrApi.enhanceEndpoints({ endpoints: {
  getApiV1ShiftType: (definition) => { definition.providesTags = addTags(definition.providesTags, [types.list]); }, postApiV1ShiftType: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, typeChanged); }, putApiV1ShiftTypeById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, typeChanged); }, deleteApiV1ShiftTypeById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, typeChanged); },
  getApiV1ShiftCategory: (definition) => { definition.providesTags = addTags(definition.providesTags, [categories.list]); }, postApiV1ShiftCategory: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, categories.changed); }, putApiV1ShiftCategoryById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, categories.changed); }, deleteApiV1ShiftCategoryById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, categories.changed); },
  getApiV1ShiftSchedules: (definition) => { definition.providesTags = addTags(definition.providesTags, [schedules.list]); }, postApiV1ShiftSchedules: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, schedules.changed); }, putApiV1ShiftSchedulesById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, schedules.changed); }, deleteApiV1ShiftSchedulesById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, schedules.changed); } } });
export const policyApi = settingsApi.enhanceEndpoints({ endpoints: { getApiV1WorkingHoursPolicy: (definition) => { definition.providesTags = addTags(definition.providesTags, [policies.list]); }, postApiV1WorkingHoursPolicy: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, policies.changed); }, deleteApiV1WorkingHoursPolicyById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, policies.changed); } } });

const text = z.string().nullish().transform((value) => value?.trim() || null);
const option = z.object({ value: z.string().min(1), label: z.string() });
const chosen = (message: string) => option.nullable().refine((value): boolean => Boolean(value), message);

// ----- shift types
const shiftType = z.object({ id: z.string().nullish(), shiftName: text, rotationType: z.number().nullish(), startTime: text, endTime: text, applicableDays: z.array(z.number()).nullish() });
export const shiftTypeRowsSchema = z.array(shiftType).nullish().transform((rows) => (rows ?? []).flatMap((row) => row.id ? [{ id: row.id, name: row.shiftName ?? "Unnamed shift", rotation: row.rotationType ?? 0, startTime: row.startTime ?? "", endTime: row.endTime ?? "",
  days: [...new Set(row.applicableDays ?? [])].filter((day) => day >= 0 && day <= 6).sort((a, b) => a - b) }] : []));
export type ShiftType = z.infer<typeof shiftTypeRowsSchema>[number];
export const daysText = (days: readonly number[]) => days.length === 7 ? "Every day" : days.map((day) => daysOfWeek[day]).join(", ");
const clock = (what: string) => z.string().nullable().refine((value): boolean => parseClockValue(value) !== null, `Choose the ${what} time`);
export const shiftTypeFormSchema = z.object({ name: z.string().trim().min(1, "Enter the shift name").max(150, "Keep the name under 150 characters"), rotation: chosen("Choose the shift category"), startTime: clock("start"), endTime: clock("end"),
  days: z.array(option).min(1, "Choose at least one day") })
  // A night shift ends the next morning, so the end may be earlier than the start; only an empty shift is refused.
  .refine((values) => values.startTime !== values.endTime || parseClockValue(values.startTime) === null, { path: ["endTime"], message: "The shift cannot start and end at the same time" });
export type ShiftTypeFormValues = z.infer<typeof shiftTypeFormSchema>;
export const shiftTypeDefaults = (item: ShiftType | null): ShiftTypeFormValues => item
  ? { name: item.name, rotation: { value: String(item.rotation), label: rotationLabel(item.rotation) }, startTime: item.startTime, endTime: item.endTime, days: item.days.map((day) => dayOptions[day]!) } : { name: "", rotation: null, startTime: null, endTime: null, days: [] };
/** Hours from start to end; a shift that ends at or before its start runs into the next day. */
export function shiftHours(startTime: string, endTime: string): number | null {
  const start = parseClockValue(startTime), end = parseClockValue(endTime);
  if (!start || !end) return null;
  const minutes = end.hour * 60 + end.minute - (start.hour * 60 + start.minute);
  return (minutes <= 0 ? minutes + 1440 : minutes) / 60;
}

// ----- shift categories
export const shiftCategoryRowsSchema = z.array(z.object({ id: z.string().nullish(), name: text })).nullish().transform((rows) => (rows ?? []).flatMap((row) => row.id ? [{ id: row.id, name: row.name ?? "Unnamed category" }] : []));
export type ShiftCategory = z.infer<typeof shiftCategoryRowsSchema>[number];
export const shiftCategoryFormSchema = z.object({ name: z.string().trim().min(1, "Enter the category name").max(150, "Keep the name under 150 characters") });
export type ShiftCategoryFormValues = z.infer<typeof shiftCategoryFormSchema>;

// ----- shift schedules
export const shiftScheduleRowsSchema = z.array(z.object({ id: z.string().nullish(), scheduleName: text, startDate: text, endDate: text, frequency: z.number().nullish(), scheduleStatus: z.number().nullish(),
  shiftType: z.array(z.object({ id: z.string().nullish(), shiftName: text })).nullish(), department: z.object({ id: z.string().nullish(), name: text }).nullish() })).nullish()
  .transform((rows) => (rows ?? []).flatMap((row) => row.id ? [{ id: row.id, name: row.scheduleName ?? "Unnamed schedule", startDate: row.startDate, endDate: row.endDate, frequency: row.frequency ?? 0, status: row.scheduleStatus ?? 0,
    shiftTypes: (row.shiftType ?? []).flatMap((type) => type.id ? [{ value: type.id, label: type.shiftName ?? "Unnamed shift" }] : []), department: row.department?.id ? { value: row.department.id, label: row.department.name ?? "Unnamed department" } : null }] : []));
export type ShiftSchedule = z.infer<typeof shiftScheduleRowsSchema>[number];
/** Why a schedule cannot be changed or deleted, or null: one that is running now is fixed. */
export function scheduleChangeBlock(schedule: Pick<ShiftSchedule, "startDate" | "endDate">, now: Date = new Date()): string | null {
  if (!schedule.startDate || !schedule.endDate) return null;
  return now > new Date(schedule.startDate) && now < new Date(schedule.endDate) ? "The schedule is running" : null;
}
export const tomorrow = (now: Date = new Date()) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
export const shiftScheduleFormSchema = (now: Date = new Date()) => z.object({ name: z.string().trim().min(1, "Enter the schedule name").max(150, "Keep the name under 150 characters"), frequency: chosen("Choose the frequency"),
  startDate: z.date().nullable().refine((value): boolean => value instanceof Date, "Choose the start date").refine((value) => !value || value >= tomorrow(now), "The schedule must start tomorrow or later"),
  shiftTypes: z.array(option).min(1, "Choose at least one shift type"), department: chosen("Choose the department") });
export type ShiftScheduleFormValues = z.infer<ReturnType<typeof shiftScheduleFormSchema>>;

// ----- working hours policy
export const policyRowsSchema = z.array(z.object({ id: z.string().nullish(), maxHoursPerDay: z.number().nullish(), maxHoursPerWeek: z.number().nullish(), minDailyRestHours: z.number().nullish(), minWeeklyRestHours: z.number().nullish(), effectiveFrom: text })).nullish()
  .transform((rows) => (rows ?? []).flatMap((row) => row.id ? [{ id: row.id, maxDay: row.maxHoursPerDay ?? 0, maxWeek: row.maxHoursPerWeek ?? 0, restDay: row.minDailyRestHours ?? 0, restWeek: row.minWeeklyRestHours ?? 0, effectiveFrom: row.effectiveFrom ?? "" }] : [])
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)));
export type WorkingHoursPolicy = z.infer<typeof policyRowsSchema>[number];
/** The policy in force on a day: the latest one that has taken effect. */
export const policyInForce = (policies: readonly WorkingHoursPolicy[], now: Date = new Date()) => policies.find((policy) => policy.effectiveFrom && new Date(policy.effectiveFrom) <= now) ?? null;
const hours = (what: string, low: number, high: number) => z.number({ error: `Enter the ${what}` }).min(low, `The ${what} is at least ${low}`).max(high, `The ${what} is at most ${high}`);
export const policyFormSchema = z.object({ maxDay: hours("hours a day", 1, 24), maxWeek: hours("hours a week", 1, 168), restDay: hours("daily rest", 0, 24), restWeek: hours("weekly rest", 0, 168),
  effectiveFrom: z.date().nullable().refine((value): boolean => value instanceof Date, "Choose the date it takes effect") })
  .refine((values) => values.maxDay + values.restDay <= 24, { path: ["restDay"], message: "Work and rest together cannot be more than 24 hours a day" })
  .refine((values) => values.maxWeek + values.restWeek <= 168, { path: ["restWeek"], message: "Work and rest together cannot be more than 168 hours a week" })
  .refine((values) => values.maxWeek >= values.maxDay, { path: ["maxWeek"], message: "The weekly limit cannot be less than the daily limit" });
export type PolicyFormValues = z.infer<typeof policyFormSchema>;
/** The Ghana Labour Act, 2003 (Act 651) baseline. */
export const policyDefaults: PolicyFormValues = { maxDay: 8, maxWeek: 40, restDay: 12, restWeek: 48, effectiveFrom: null };
