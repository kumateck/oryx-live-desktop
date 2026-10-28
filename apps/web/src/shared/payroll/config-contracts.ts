import { z } from "zod";
const money = z.number().finite().nonnegative();
const percent = money.max(100);
const date = z.iso.datetime({ offset: true, local: true });
const dated = { effectiveFrom: date, effectiveTo: date.nullish().transform((value) => value ?? null) };
export const payGradeSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  minSalary: money,
  maxSalary: money,
  level: z
    .union([z.literal(0), z.literal(1), z.literal(2)])
    .nullish()
    .transform((value) => value ?? null),
});
export const taxBandSchema = z.object({
  id: z.uuid(),
  lowerBound: money,
  upperBound: money.nullish().transform((value) => value ?? null),
  rate: percent,
  ...dated,
});
export const pensionSchema = z.object({
  id: z.uuid(),
  employeeRate: percent,
  employerRate: percent,
  tier2Rate: percent,
  insurableEarningsCeiling: money,
  ...dated,
});
const uniqueIds = (rows: { id: string }[]) => new Set(rows.map((row) => row.id)).size === rows.length;
export const gradesSchema = z.array(payGradeSchema).refine(uniqueIds, "Repeated pay grade identity");
export const bandsSchema = z.array(taxBandSchema).refine(uniqueIds, "Repeated tax band identity");
export const pensionsSchema = z.array(pensionSchema).refine(uniqueIds, "Repeated SSNIT rate identity");
export type PayGrade = z.infer<typeof payGradeSchema>;
export type TaxBand = z.infer<typeof taxBandSchema>;
export type PensionRate = z.infer<typeof pensionSchema>;
export type GradeBody = Omit<PayGrade, "id">;
export type BandBody = Omit<TaxBand, "id">;
export type PensionBody = Omit<PensionRate, "id">;
export type ConfigRecord = { kind: "grade"; row: PayGrade } | { kind: "band"; row: TaxBand } | { kind: "pension"; row: PensionRate };
export type ConfigCommand = { kind: "grade"; body: GradeBody; id?: string } | { kind: "band"; body: BandBody } | { kind: "pension"; body: PensionBody };
export type ConfigKind = ConfigRecord["kind"];
