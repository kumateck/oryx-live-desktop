import { z } from "zod";
const amount = z.number().finite().nonnegative();
const text = z
  .string()
  .nullish()
  .transform((value) => value ?? "");
const date = z.iso.datetime({ local: true, offset: true });
const type = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);
export const allowanceSchema = z.object({ id: z.uuid(), type: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), description: text, amount, isTaxable: z.boolean() });
export const compensationSchema = z.object({
  id: z.uuid(),
  employeeId: z.uuid(),
  employeeName: text,
  staffNumber: text,
  payGradeId: z
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  payGradeName: text,
  basicSalary: amount,
  bankName: text,
  bankBranch: text,
  bankAccountNumber: text,
  tinNumber: text,
  tier3VoluntaryEnrolled: z.boolean(),
  effectiveFrom: date,
  effectiveTo: date.nullish().transform((value) => value ?? null),
  totalAllowances: amount,
  allowances: z.array(allowanceSchema),
});
const base = {
  id: z.uuid(),
  employeeId: z.uuid(),
  employeeName: text,
  type,
  effectiveFrom: date,
  effectiveTo: date.nullish().transform((value) => value ?? null),
};
export const additionSchema = z.object({
  ...base,
  type: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  description: text,
  amount,
  isRecurring: z.boolean(),
  isTaxable: z.boolean(),
});
export const deductionSchema = z.object({ ...base, type: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]), description: text, amount, isRecurring: z.boolean() });
export const reliefSchema = z.object({ ...base, annualAmount: amount });
const metadata = { pageIndex: z.number().int().positive(), pageCount: z.number().int().nonnegative(), totalRecordCount: z.number().int().nonnegative() };
export const historySchema = z.object({ ...metadata, data: z.array(compensationSchema) });
export const additionPage = z.object({ ...metadata, data: z.array(additionSchema) });
export const deductionPage = z.object({ ...metadata, data: z.array(deductionSchema) });
export type Compensation = z.infer<typeof compensationSchema>;
export type CompensationBody = Omit<Compensation, "id" | "employeeName" | "staffNumber" | "payGradeName" | "effectiveTo" | "totalAllowances" | "allowances"> & {
  allowances: Omit<z.infer<typeof allowanceSchema>, "id">[];
};
export type AdjustmentKind = "addition" | "deduction" | "relief";
export interface Adjustment {
  id: string;
  employeeId: string;
  type: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  description: string;
  amount: number;
  isTaxable: boolean | null;
  isRecurring: boolean | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}
export interface AdjustmentBody {
  employeeId: string;
  type: Adjustment["type"];
  description: string;
  amount: number;
  annualAmount: number;
  isTaxable: boolean;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}
export const adjustmentLabels = {
  addition: ["Bonus", "Commission", "Overtime", "Arrears", "Other"],
  deduction: ["Loan repayment", "Salary advance", "Union dues", "Other"],
  relief: ["Marriage / responsibility", "Child education", "Aged dependent", "Old age", "Disability", "Life insurance premium", "Other"],
} as const;
