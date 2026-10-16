import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const person = z.object({ firstName: text, lastName: text }).nullish().transform((value) => value ? `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() || null : null);
const product = z.object({ id: z.string().nullish(), name: text, code: text, labelClaim: text, shelfLife: text }).nullish();

/** A request to test a product batch at one stage of production. */
export const atrSchema = z.object({
  id: z.string().min(1), status: z.number().nullish(), stage: z.number().nullish(), isRetest: z.boolean().nullish(),
  manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(), arNumber: text, issueNumber: text, sampledQuantity: text, numberOfContainers: z.number().nullish(),
  sampledBy: person, sampledAt: z.string().nullish(), acknowledgedAt: z.string().nullish(), assignedAt: z.string().nullish(), assignees: z.array(z.object({ firstName: text, lastName: text })).nullish(),
  batchManufacturingRecord: z.object({ id: z.string().nullish(), batchNumber: text }).nullish(),
  productionScheduleProduct: z.object({ productionSchedule: z.object({ code: text }).nullish(), product, productPacking: z.object({ name: text }).nullish() }).nullish(),
  productionActivityStep: z.object({ id: z.string().nullish(), order: z.number().nullish() }).nullish(),
}).transform((atr) => ({
  id: atr.id, status: atr.status ?? null, stage: atr.stage ?? null, isRetest: atr.isRetest ?? false, made: atr.manufacturingDate ?? null, expires: atr.expiryDate ?? null,
  arNumber: atr.arNumber, issueNumber: atr.issueNumber, sampledQuantity: atr.sampledQuantity, containers: atr.numberOfContainers ?? null, sampledBy: atr.sampledBy, sampledAt: atr.sampledAt ?? null,
  acknowledgedAt: atr.acknowledgedAt ?? null, assignedAt: atr.assignedAt ?? null,
  analysts: (atr.assignees ?? []).map((user) => `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()).filter(Boolean),
  bmrId: atr.batchManufacturingRecord?.id ?? null, batchNumber: atr.batchManufacturingRecord?.batchNumber ?? null, stepId: atr.productionActivityStep?.id ?? null, step: atr.productionActivityStep?.order ?? null,
  schedule: atr.productionScheduleProduct?.productionSchedule?.code ?? null, productId: atr.productionScheduleProduct?.product?.id ?? null,
  product: atr.productionScheduleProduct?.product?.name ?? "Unnamed product", productCode: atr.productionScheduleProduct?.product?.code ?? null,
  composition: atr.productionScheduleProduct?.product?.labelClaim ?? null, shelfLife: atr.productionScheduleProduct?.product?.shelfLife ?? null, packing: atr.productionScheduleProduct?.productPacking?.name ?? null,
}));
export const atrRowsSchema = z.array(z.unknown()).transform((rows) => rows.flatMap((row) => { const parsed = atrSchema.safeParse(row); return parsed.success ? [parsed.data] : []; }));
export type Atr = z.infer<typeof atrSchema>;

/** The product's analytical raw data for each stage; the one for the request's stage holds its test form. Chemical analysis is preferred when both exist. */
export const productArdsSchema = z.array(z.object({ stage: z.number().nullish(), analysisType: z.number().nullish(), specNumber: text, form: z.object({ id: z.string().nullish(), name: text }).nullish(),
  productStandardTestProcedure: z.object({ stpNumber: text }).nullish() })).nullish().transform((rows) => rows ?? []);
export const ardForStage = (rows: z.infer<typeof productArdsSchema>, stage: number | null) => {
  const matching = rows.filter((row) => row.stage === stage && row.form?.id);
  return matching.find((row) => row.analysisType !== 1) ?? matching[0] ?? null;
};
