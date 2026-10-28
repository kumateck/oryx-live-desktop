import { z } from "zod";
import type { ConfigRecord, ConfigCommand, ConfigKind } from "./contracts";
const nonnegative = z.number().finite().nonnegative();
const percent = nonnegative.max(100);
const level = z.object({ value: z.enum(["0", "1", "2"]), label: z.string() }).nullable();
export const gradeEditorSchema = z
  .object({ name: z.string().trim().min(1), minSalary: nonnegative, maxSalary: nonnegative, level })
  .refine((v) => v.maxSalary >= v.minSalary, { path: ["maxSalary"], message: "Maximum salary must be at least the minimum." });
export const bandEditorSchema = z
  .object({
    lowerBound: nonnegative,
    upperBound: z.union([nonnegative, z.nan().transform(() => null), z.null()]),
    rate: percent,
    from: z.date().nullable(),
    to: z.date().nullable(),
  })
  .superRefine((v, context) => {
    if (!v.from) context.addIssue({ code: "custom", path: ["from"], message: "Choose an effective date." });
    if (v.upperBound !== null && v.upperBound <= v.lowerBound)
      context.addIssue({ code: "custom", path: ["upperBound"], message: "Upper bound must exceed lower bound, or be blank for an uncapped band." });
    if (v.from && v.to && v.to <= v.from) context.addIssue({ code: "custom", path: ["to"], message: "End date must follow the start." });
  });
export const pensionEditorSchema = z
  .object({ employeeRate: percent, employerRate: percent, tier2Rate: percent, ceiling: nonnegative, from: z.date().nullable(), to: z.date().nullable() })
  .superRefine((v, context) => {
    if (!v.from) context.addIssue({ code: "custom", path: ["from"], message: "Choose an effective date." });
    if (v.from && v.to && v.to <= v.from) context.addIssue({ code: "custom", path: ["to"], message: "End date must follow the start." });
  });
export type GradeValues = z.infer<typeof gradeEditorSchema>;
export type BandValues = z.infer<typeof bandEditorSchema>;
export type PensionValues = z.infer<typeof pensionEditorSchema>;
const day = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T00:00:00Z`;
export function gradeCommand(values: GradeValues, original: ConfigRecord | null): ConfigCommand {
  return {
    kind: "grade",
    ...(original?.kind === "grade" ? { id: original.row.id } : {}),
    body: {
      name: values.name,
      minSalary: values.minSalary,
      maxSalary: values.maxSalary,
      level: values.level?.value === "0" ? 0 : values.level?.value === "1" ? 1 : values.level?.value === "2" ? 2 : null,
    },
  };
}
export function bandCommand(values: BandValues): ConfigCommand | null {
  return values.from
    ? {
        kind: "band",
        body: {
          lowerBound: values.lowerBound,
          upperBound: values.upperBound,
          rate: values.rate,
          effectiveFrom: day(values.from),
          effectiveTo: values.to ? day(values.to) : null,
        },
      }
    : null;
}
export function pensionCommand(values: PensionValues): ConfigCommand | null {
  return values.from
    ? {
        kind: "pension",
        body: {
          employeeRate: values.employeeRate,
          employerRate: values.employerRate,
          tier2Rate: values.tier2Rate,
          insurableEarningsCeiling: values.ceiling,
          effectiveFrom: day(values.from),
          effectiveTo: values.to ? day(values.to) : null,
        },
      }
    : null;
}
export const configLabels: Record<ConfigKind, string> = { grade: "Pay grades", band: "PAYE tax bands", pension: "SSNIT rates" };
