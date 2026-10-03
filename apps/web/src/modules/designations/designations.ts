import { z } from "zod";
import { hrApi } from "@/shared/api/generated/hr";

export const designationPermissions = { view: "CanViewDesignation", add: "CanCreateDesignation", edit: "CanEditDesignation", remove: "CanDeleteDesignation" } as const;
export const leaveTypePermissions = { view: "CanViewLeaveType", add: "CanCreateLeaveType", edit: "CanEditLeaveType", remove: "CanDeleteLeaveType" } as const;
export const designationAudit = { module: "Human Resources", subModule: "Designation Management" } as const;
export const leaveTypeAudit = { module: "Human Resources", subModule: "Leave Type Configuration" } as const;

const designations = { type: "Designations" as const, id: "all" }, leaveTypes = { type: "LeaveTypes" as const, id: "all" };
// A leave type lists its designations, so it is read again when a designation changes.
const designationChanged = (_result: unknown, error: unknown) => error ? [] : [designations, leaveTypes];
const leaveTypeChanged = (_result: unknown, error: unknown) => error ? [] : [leaveTypes];
export const staffSetupApi = hrApi.enhanceEndpoints({ endpoints: {
  getApiV1Designation: { providesTags: [designations] }, postApiV1Designation: { invalidatesTags: designationChanged }, putApiV1DesignationById: { invalidatesTags: designationChanged }, deleteApiV1DesignationById: { invalidatesTags: designationChanged },
  getApiV1LeaveType: { providesTags: [leaveTypes] }, postApiV1LeaveType: { invalidatesTags: leaveTypeChanged }, putApiV1LeaveTypeById: { invalidatesTags: leaveTypeChanged }, deleteApiV1LeaveTypeById: { invalidatesTags: leaveTypeChanged } } });

const text = z.string().nullish().transform((value) => value?.trim() || null);
const named = z.object({ id: z.string().nullish(), name: text });
const options = (items: readonly z.infer<typeof named>[] | null | undefined, fallback: string) => (items ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.name ?? fallback }] : []);
const option = z.object({ value: z.string().min(1), label: z.string() });
const days = (what: string) => z.number({ error: `Enter the ${what}` }).positive(`The ${what} must be more than 0`).max(366, `The ${what} cannot be more than 366`);

export const designationRowsSchema = z.array(z.object({ id: z.string().nullish(), name: text, description: text, maximumLeaveDays: z.number().nullish(), departments: z.array(named).nullish() })).nullish()
  .transform((rows) => (rows ?? []).flatMap((row) => row.id ? [{ id: row.id, name: row.name ?? "Unnamed designation", description: row.description, leaveDays: row.maximumLeaveDays ?? 0, departments: options(row.departments, "Unnamed department") }] : []));
export type Designation = z.infer<typeof designationRowsSchema>[number];
export const designationFormSchema = z.object({ name: z.string().trim().min(1, "Enter the designation name").max(150, "Keep the name under 150 characters"), departments: z.array(option).min(1, "Choose at least one department"),
  leaveDays: days("paid leave days"), description: z.string().nullish() });
export type DesignationFormValues = z.infer<typeof designationFormSchema>;

export const leaveTypeRowsSchema = z.array(z.object({ id: z.string().nullish(), name: text, isPaid: z.boolean().nullish(), deductFromBalance: z.boolean().nullish(), deductionLimit: z.number().nullish(), numberOfDays: z.number().nullish(), isActive: z.boolean().nullish(),
  designations: z.array(named).nullish() })).nullish()
  .transform((rows) => (rows ?? []).flatMap((row) => row.id ? [{ id: row.id, name: row.name ?? "Unnamed leave type", isPaid: row.isPaid ?? false, deductFromBalance: row.deductFromBalance ?? false, deductionLimit: row.deductionLimit ?? null, days: row.numberOfDays ?? 0,
    isActive: row.isActive ?? true, designations: options(row.designations, "Unnamed designation") }] : []));
export type LeaveType = z.infer<typeof leaveTypeRowsSchema>[number];
export const leaveTypeFormSchema = z.object({ name: z.string().trim().min(1, "Enter the leave type").max(150, "Keep the name under 150 characters"), isPaid: z.boolean(), deductFromBalance: z.boolean(), days: days("maximum leave days").int("Use whole days"),
  designations: z.array(option).min(1, "Choose at least one designation") });
export type LeaveTypeFormValues = z.infer<typeof leaveTypeFormSchema>;
/**
 * The request for a save. Whether a leave type is active is not on the form: a new one is active, and an
 * existing one keeps what it had, as does its deduction limit.
 */
export const leaveTypeBody = (values: LeaveTypeFormValues, existing: LeaveType | null) => ({ name: values.name, isPaid: values.isPaid, deductFromBalance: values.deductFromBalance, numberOfDays: values.days, designationList: values.designations.map((item) => item.value),
  isActive: existing?.isActive ?? true, ...(existing?.deductionLimit === null || existing?.deductionLimit === undefined ? {} : { deductionLimit: existing.deductionLimit }) });
