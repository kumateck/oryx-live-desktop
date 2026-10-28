import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => value ?? 0);
const unit = z.object({ id: z.string().nullish(), symbol: text }).nullish();
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
const real = (value: string | null) => value && value.toLowerCase() !== "n/a" ? value : null;

const batch = z.object({ id: z.string().nullish(), batchNumber: text, numberOfContainers: amount, quantityPerContainer: amount, totalQuantity: amount, quantityAssigned: z.number().nullish(), quantityDistributed: z.number().nullish(), uoM: unit, containerPackageStyle: z.object({ name: text }).nullish(),
  manufacturingDate: date, expiryDate: date, retestDate: date, status: z.number().nullish(), material: z.object({ id: z.string().nullish(), name: text, code: text, kind: z.number().nullish() }).nullish(), manufacturerName: text, supplierName: text,
  checklist: z.object({ shipmentInvoice: z.object({ code: text }).nullish(), manufacturer: z.object({ name: text }).nullish(), supplier: z.object({ name: text }).nullish() }).nullish(),
  sampleWeights: z.array(z.object({ srNumber: text, grossWeight: amount })).nullish() });
const readBatch = (entry: z.infer<typeof batch>, index: number) => ({ id: entry.id ?? `batch-${index}`, number: entry.batchNumber, containers: entry.numberOfContainers, perContainer: entry.quantityPerContainer, total: entry.totalQuantity,
  unitId: entry.uoM?.id ?? null, assigned: entry.quantityAssigned ?? null, distributed: entry.quantityDistributed ?? null,
  materialId: entry.material?.id ?? null, materialKind: entry.material?.kind ?? null, unit: entry.uoM?.symbol ?? null, style: entry.containerPackageStyle?.name ?? null, made: entry.manufacturingDate, expires: entry.expiryDate, retest: entry.retestDate, status: entry.status ?? null,
  materialName: entry.material?.name ?? null, materialCode: entry.material?.code ?? null, manufacturer: real(entry.manufacturerName ?? entry.checklist?.manufacturer?.name ?? null), supplier: entry.supplierName ?? entry.checklist?.supplier?.name ?? null,
  invoice: entry.checklist?.shipmentInvoice?.code ?? null, weights: (entry.sampleWeights ?? []).map((weight, position) => ({ serial: weight.srNumber ?? String(position + 1), gross: weight.grossWeight })) });
export const batchRowsSchema = z.array(batch).nullish().transform((value) => (value ?? []).map(readBatch));
export type ReceivedBatch = z.infer<typeof batchRowsSchema>[number];

