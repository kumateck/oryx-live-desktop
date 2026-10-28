import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const item = z.object({ id: z.string().nullish(), name: text, code: text }).nullish();

export const qcGrnRowsSchema = z.array(z.object({ id: z.string().min(1), grnNumber: text, createdAt: z.string().nullish(), status: z.number().nullish(), carrierName: text,
  materialBatches: z.array(z.unknown()).nullish() })).transform((rows) => rows.map((row) => ({ id: row.id, number: row.grnNumber ?? "No number", receivedAt: row.createdAt ?? null,
  status: row.status ?? null, carrier: row.carrierName, batches: row.materialBatches?.length ?? 0 })));
export type QcGrnRow = z.infer<typeof qcGrnRowsSchema>[number];

const names = (value: string | null) => [...new Set((value ?? "").split(",").map((name) => name.trim()).filter(Boolean))];
/** A received batch as QC works on it: what it is, how much came in and was sampled, its references and where its testing stands. */
export const qcBatchSchema = z.object({
  id: z.string().min(1), batchNumber: text, material: item, uoM: z.object({ symbol: text }).nullish(), totalQuantity: amount, sampledQuantity: z.number().nullish(),
  status: z.number().nullish(), manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(), retestDate: z.string().nullish(),
  supplierName: text, manufacturerName: text, checklist: z.object({ supplier: item, manufacturer: item, shipmentInvoice: z.object({ code: text }).nullish() }).nullish(),
  arNumber: text, issueNumber: text, sampledBy: text, sampledOn: z.string().nullish(), analysedBy: text,
}).transform((batch) => ({
  id: batch.id, number: batch.batchNumber, materialId: batch.material?.id ?? null, material: batch.material?.name ?? "Unnamed material", code: batch.material?.code ?? null,
  unit: batch.uoM?.symbol ?? null, received: batch.totalQuantity, sampled: batch.sampledQuantity ?? null, status: batch.status ?? null,
  made: batch.manufacturingDate ?? null, expires: batch.expiryDate ?? null, retest: batch.retestDate ?? null,
  supplier: batch.supplierName ?? batch.checklist?.supplier?.name ?? null, manufacturer: batch.manufacturerName ?? batch.checklist?.manufacturer?.name ?? null,
  invoice: batch.checklist?.shipmentInvoice?.code ?? null, arNumber: batch.arNumber, issueNumber: batch.issueNumber, sampledBy: batch.sampledBy, sampledOn: batch.sampledOn ?? null,
  analysts: names(batch.analysedBy),
}));
export type QcBatch = z.infer<typeof qcBatchSchema>;
export const qcGrnSchema = z.object({ id: z.string().min(1), grnNumber: text, createdAt: z.string().nullish(), carrierName: text, vehicleNumber: text, declarationNumber: text, remarks: text,
  materialBatches: z.array(z.unknown()).nullish() }).transform((grn) => ({ id: grn.id, number: grn.grnNumber ?? "No number", receivedAt: grn.createdAt ?? null, carrier: grn.carrierName,
  vehicle: grn.vehicleNumber, declaration: grn.declarationNumber, remarks: grn.remarks && grn.remarks !== "<p></p>" ? grn.remarks : null,
  batches: (grn.materialBatches ?? []).flatMap((entry) => { const parsed = qcBatchSchema.safeParse(entry); return parsed.success ? [parsed.data] : []; }) }));
export type QcGrn = z.infer<typeof qcGrnSchema>;
