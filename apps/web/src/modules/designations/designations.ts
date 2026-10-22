import { z } from "zod";
import { hrApi } from "@/shared/api/generated/hr";
import { addTags } from "@/shared/api/add-tags";

export const designationPermissions = { view: "CanViewDesignation", add: "CanCreateDesignation", edit: "CanEditDesignation", remove: "CanDeleteDesignation" } as const;
export const leaveTypePermissions = { view: "CanViewLeaveType", add: "CanCreateLeaveType", edit: "CanEditLeaveType", remove: "CanDeleteLeaveType" } as const;
export const designationAudit = { module: "Human Resources", subModule: "Designation Management" } as const;
export const leaveTypeAudit = { module: "Human Resources", subModule: "Leave Type Configuration" } as const;

const designations = { type: "Designations" as const, id: "all" }, leaveTypes = { type: "LeaveTypes" as const, id: "all" };
// A leave type lists its designations, so it is read again when a designation changes.
const designationChanged = (_result: unknown, error: unknown) => error ? [] : [designations, leaveTypes];
const leaveTypeChanged = (_result: unknown, error: unknown) => error ? [] : [leaveTypes];
export const staffSetupApi = hrApi.enhanceEndpoints({ endpoints: {
  getApiV1Designation: (definition) => { definition.providesTags = addTags(definition.providesTags, [designations]); }, postApiV1Designation: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, designationChanged); }, putApiV1DesignationById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, designationChanged); }, deleteApiV1DesignationById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, designationChanged); },
  getApiV1LeaveType: (definition) => { definition.providesTags = addTags(definition.providesTags, [leaveTypes]); }, postApiV1LeaveType: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, leaveTypeChanged); }, putApiV1LeaveTypeById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, leaveTypeChanged); }, deleteApiV1LeaveTypeById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, leaveTypeChanged); } } });

const text = z.string().nullish().transform((value) => value?.trim() || null);
const named = z.object({ id: z.string().nullish(), name: text });
const options = (items: readonly z.infer<typeof named>[] | null | undefined, fallback: string) => (items ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.name ?? fallback }] : []);
const option = z.object({ value: z.string().min(1), label: z.string() });
/** At least one choice, each chosen once. */
const choices = (message: string) => z.array(option).min(1, message).refine((items) => new Set(items.map((item) => item.value)).size === items.length, "Choose each one only once");
const days = (what: string) => z.number({ error: `Enter the ${what}` }).positive(`The ${what} must be more than 0`).max(366, `The ${what} cannot be more than 366`);

export const designationRowsSchema = z.array(z.object({ id: z.string().nullish(), name: text, description: text, maximumLeaveDays: z.number().nullish(), departments: z.array(named).nullish() })).nullish()
  .transform((rows) => (rows ?? []).flatMap((row) => row.id ? [{ id: row.id, name: row.name ?? "Unnamed designation", description: row.description, leaveDays: row.maximumLeaveDays ?? 0, departments: options(row.departments, "Unnamed department") }] : []));
export type Designation = z.infer<typeof designationRowsSchema>[number];
export const designationFormSchema = z.object({ name: z.string().trim().min(1, "Enter the designation name").max(150, "Keep the name under 150 characters"), departments: choices("Choose at least one department"),
  leaveDays: days("paid leave days"), description: z.string().nullish() });
export type DesignationFormValues = z.infer<typeof designationFormSchema>;
export const designationBody = (values: DesignationFormValues) => ({ name: values.name, description: values.description ?? "", departmentIds: values.departments.map((department) => department.value), maximumLeaveDays: values.leaveDays });

export const leaveTypeRowsSchema = z.array(z.object({ id: z.string().nullish(), name: text, isPaid: z.boolean().nullish(), deductFromBalance: z.boolean().nullish(), deductionLimit: z.number().nullish(), numberOfDays: z.number().nullish(), isActive: z.boolean().nullish(),
  designations: z.array(named).nullish() })).nullish()
  .transform((rows) => (rows ?? []).flatMap((row) => row.id ? [{ id: row.id, name: row.name ?? "Unnamed leave type", isPaid: row.isPaid ?? false, deductFromBalance: row.deductFromBalance ?? false, deductionLimit: row.deductionLimit ?? null, days: row.numberOfDays ?? 0,
    isActive: row.isActive ?? true, designations: options(row.designations, "Unnamed designation") }] : []));
export type LeaveType = z.infer<typeof leaveTypeRowsSchema>[number];
export const leaveTypeFormSchema = z.object({ name: z.string().trim().min(1, "Enter the leave type").max(150, "Keep the name under 150 characters"), isPaid: z.boolean(), deductFromBalance: z.boolean(), days: days("maximum leave days").int("Use whole days"),
  designations: choices("Choose at least one designation") });
export type LeaveTypeFormValues = z.infer<typeof leaveTypeFormSchema>;
/**
 * The request for a save. Whether a leave type is active is not on the form: a new one is active, and an
 * existing one keeps what it had, as does its deduction limit.
 */
export const leaveTypeBody = (values: LeaveTypeFormValues, existing: LeaveType | null) => ({ name: values.name, isPaid: values.isPaid, deductFromBalance: values.deductFromBalance, numberOfDays: values.days, designationList: values.designations.map((item) => item.value),
  isActive: existing?.isActive ?? true, ...(existing?.deductionLimit === null || existing?.deductionLimit === undefined ? {} : { deductionLimit: existing.deductionLimit }) });

const ids = (items: readonly { value: string }[]) => items.map((item) => item.value).sort().join("|");
/** True when the record read just before saving is the one the form was opened from, so a save never overwrites someone else's change. */
export const sameDesignation = (opened: Designation, fresh: Designation) => opened.name === fresh.name && (opened.description ?? null) === (fresh.description ?? null)
  && opened.leaveDays === fresh.leaveDays && ids(opened.departments) === ids(fresh.departments);
export const sameLeaveType = (opened: LeaveType, fresh: LeaveType) => opened.name === fresh.name && opened.isPaid === fresh.isPaid && opened.deductFromBalance === fresh.deductFromBalance
  && opened.days === fresh.days && opened.isActive === fresh.isActive && opened.deductionLimit === fresh.deductionLimit && ids(opened.designations) === ids(fresh.designations);
export const changedSinceOpened = "Someone changed this record after you opened it. Close the form and open it again to see the current version before saving.";
