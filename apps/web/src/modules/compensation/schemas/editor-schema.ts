import { z } from "zod";
import type { Compensation, CompensationBody, AdjustmentKind, AdjustmentBody } from "./contracts";
const option = z.object({ value: z.string(), label: z.string() }).nullable();
export const salarySchema = z
  .object({
    salary: z.number().finite().nonnegative(),
    grade: option,
    bank: z.string().trim(),
    branch: z.string().trim(),
    account: z.string().trim(),
    tin: z.string().trim(),
    tier3: z.boolean(),
    from: z.date().nullable(),
    allowances: z
      .array(
        z.object({
          type: z.object({ value: z.enum(["0", "1", "2", "3", "4"]), label: z.string() }),
          description: z.string().trim(),
          amount: z.number().finite().nonnegative(),
          taxable: z.boolean(),
        }),
      )
      .max(100),
  })
  .superRefine((v, context) => {
    if (!v.from) context.addIssue({ code: "custom", path: ["from"], message: "Choose the effective date for this new compensation record." });
    if (v.grade && !z.uuid().safeParse(v.grade.value).success) context.addIssue({ code: "custom", path: ["grade"], message: "Choose a valid pay grade." });
  });
export type SalaryValues = z.infer<typeof salarySchema>;
export const allowanceLabels = ["Transport", "Housing", "Utility", "Responsibility", "Other"] as const;
export function salaryDefaults(row: Compensation | null): SalaryValues {
  return {
    salary: row?.basicSalary ?? Number.NaN,
    grade: row?.payGradeId ? { value: row.payGradeId, label: row.payGradeName } : null,
    bank: row?.bankName ?? "",
    branch: row?.bankBranch ?? "",
    account: row?.bankAccountNumber ?? "",
    tin: row?.tinNumber ?? "",
    tier3: row?.tier3VoluntaryEnrolled ?? false,
    from: null,
    allowances: (row?.allowances ?? []).map((allowance) => ({
      type: {
        value: allowance.type === 0 ? "0" : allowance.type === 1 ? "1" : allowance.type === 2 ? "2" : allowance.type === 3 ? "3" : "4",
        label: allowanceLabels[allowance.type] ?? "Other",
      },
      amount: allowance.amount,
      description: allowance.description,
      taxable: allowance.isTaxable,
    })),
  };
}
export const dateString = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T00:00:00Z`;
export function salaryPayload(v: SalaryValues, employeeId: string): CompensationBody | null {
  if (!v.from || !salarySchema.safeParse(v).success) return null;
  return {
    employeeId,
    payGradeId: v.grade?.value ?? null,
    basicSalary: v.salary,
    bankName: v.bank,
    bankBranch: v.branch,
    bankAccountNumber: v.account,
    tinNumber: v.tin,
    tier3VoluntaryEnrolled: v.tier3,
    effectiveFrom: dateString(v.from),
    allowances: v.allowances.map((row) => ({
      type: row.type.value === "0" ? 0 : row.type.value === "1" ? 1 : row.type.value === "2" ? 2 : row.type.value === "3" ? 3 : 4,
      description: row.description,
      amount: row.amount,
      isTaxable: row.taxable,
    })),
  };
}
export const adjustmentSchema = z
  .object({
    type: option,
    amount: z.number().finite().nonnegative(),
    description: z.string().trim(),
    recurring: z.boolean(),
    taxable: z.boolean(),
    from: z.date().nullable(),
    to: z.date().nullable(),
  })
  .superRefine((v, context) => {
    if (!v.type || !/^[0-6]$/.test(v.type.value)) context.addIssue({ code: "custom", path: ["type"], message: "Choose an adjustment type." });
    if (!v.from) context.addIssue({ code: "custom", path: ["from"], message: "Choose an effective date." });
    if (v.from && v.to && v.to <= v.from) context.addIssue({ code: "custom", path: ["to"], message: "End date must follow the start." });
  });
export type AdjustmentValues = z.infer<typeof adjustmentSchema>;
export function adjustmentPayload(v: AdjustmentValues, employeeId: string, kind: AdjustmentKind): AdjustmentBody | null {
  if (!v.from || !v.type || !adjustmentSchema.safeParse(v).success) return null;
  const value = v.type.value;
  const type = value === "0" ? 0 : value === "1" ? 1 : value === "2" ? 2 : value === "3" ? 3 : value === "4" ? 4 : value === "5" ? 5 : 6;
  if ((kind === "addition" && type > 4) || (kind === "deduction" && type > 3)) return null;
  return {
    employeeId,
    type,
    amount: v.amount,
    annualAmount: v.amount,
    description: v.description,
    isRecurring: v.recurring,
    isTaxable: v.taxable,
    effectiveFrom: dateString(v.from),
    effectiveTo: v.to ? dateString(v.to) : null,
  };
}

export function adjustmentDurationProblem(values: AdjustmentValues, kind: AdjustmentKind): string | null {
  return kind !== "relief" && !values.recurring && !values.to
    ? "A non-recurring adjustment needs an end date. The current server applies every overlapping effective record regardless of its recurring flag."
    : null;
}
