import { z } from "zod";
import { batchDatesIssue } from "@/shared/batch-dates/batch-dates";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import type { ReceivingStatus } from "../lib/receiving";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const unit = z.object({ id: z.string().nullish(), symbol: text }).nullish();
const status = z.number().nullish().transform((value): ReceivingStatus => value === 1 || value === 2 || value === 3 || value === 4 ? value : 0);
// The server writes "N/A" where there is nothing to record.
const real = (value: string | null) => value && value.toLowerCase() !== "n/a" ? value : null;

const delivered = z.object({
  id: z.string().nullish(), status, quantity: amount, uoM: unit, distributedAt: z.string().nullish(), checkedAt: z.string().nullish(), grnGeneratedAt: z.string().nullish(),
  material: z.object({ id: z.string().nullish(), name: text, code: text, kind: z.number().nullish() }).nullish(),
  shipmentInvoice: z.object({ id: z.string().nullish(), code: text, supplier: z.object({ id: z.string().nullish(), name: text, status: z.number().nullish() }).nullish() }).nullish(),
  materialItemDistributions: z.array(z.object({ shipmentInvoiceItem: z.object({ uoM: unit, manufacturer: z.object({ id: z.string().nullish(), name: text }).nullish() }).nullish() })).nullish(),
  checklists: z.array(z.object({ materialBatches: z.array(z.unknown()).nullish() })).nullish(),
  department: z.object({ name: text, isBeta: z.boolean().nullish() }).nullish(),
});

function read(entry: z.infer<typeof delivered>) {
  if (!entry.id) return null;
  const item = entry.materialItemDistributions?.[0]?.shipmentInvoiceItem;
  const itemUnit = entry.uoM?.id ? entry.uoM : item?.uoM ?? entry.uoM;
  return { id: entry.id, status: entry.status, quantity: entry.quantity, unit: itemUnit?.symbol ?? null, unitId: itemUnit?.id ?? null, distributedAt: entry.distributedAt ?? null, checkedAt: entry.checkedAt ?? null,
    materialId: entry.material?.id ?? null, materialName: entry.material?.name ?? "Unnamed material", materialCode: entry.material?.code ?? null, kind: (entry.material?.kind === 1 ? 1 : 0) as MaterialKind,
    invoiceId: entry.shipmentInvoice?.id ?? null, invoiceCode: entry.shipmentInvoice?.code ?? null, supplierId: entry.shipmentInvoice?.supplier?.id ?? null, supplierName: entry.shipmentInvoice?.supplier?.name ?? null,
    manufacturerId: item?.manufacturer?.id ?? null, manufacturer: real(item?.manufacturer?.name ?? null),
    batches: (entry.checklists ?? []).reduce((sum, checklist) => sum + (checklist.materialBatches?.length ?? 0), 0), department: entry.department?.name ?? null, beta: entry.department?.isBeta === true };
}

/** A material that was distributed to a store and is on its way through receiving. */
export const deliveredMaterialSchema = delivered.transform(read);
export const deliveredRowsSchema = z.array(delivered).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type DeliveredMaterial = z.infer<typeof deliveredRowsSchema>[number];

const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
const batch = z.object({ id: z.string().nullish(), batchNumber: text, numberOfContainers: amount, quantityPerContainer: amount, totalQuantity: amount, uoM: unit, containerPackageStyle: z.object({ name: text }).nullish(),
  manufacturingDate: date, expiryDate: date, retestDate: date, status: z.number().nullish(), material: z.object({ name: text, code: text }).nullish(), manufacturerName: text, supplierName: text,
  checklist: z.object({ shipmentInvoice: z.object({ code: text }).nullish(), manufacturer: z.object({ name: text }).nullish(), supplier: z.object({ name: text }).nullish() }).nullish(),
  sampleWeights: z.array(z.object({ srNumber: text, grossWeight: amount })).nullish() });
const readBatch = (entry: z.infer<typeof batch>, index: number) => ({ id: entry.id ?? `batch-${index}`, number: entry.batchNumber, containers: entry.numberOfContainers, perContainer: entry.quantityPerContainer, total: entry.totalQuantity,
  unit: entry.uoM?.symbol ?? null, style: entry.containerPackageStyle?.name ?? null, made: entry.manufacturingDate, expires: entry.expiryDate, retest: entry.retestDate, status: entry.status ?? null,
  materialName: entry.material?.name ?? null, materialCode: entry.material?.code ?? null, manufacturer: real(entry.manufacturerName ?? entry.checklist?.manufacturer?.name ?? null), supplier: entry.supplierName ?? entry.checklist?.supplier?.name ?? null,
  invoice: entry.checklist?.shipmentInvoice?.code ?? null, weights: (entry.sampleWeights ?? []).map((weight, position) => ({ serial: weight.srNumber ?? String(position + 1), gross: weight.grossWeight })) });
export const batchRowsSchema = z.array(batch).nullish().transform((value) => (value ?? []).map(readBatch));
export type ReceivedBatch = z.infer<typeof batchRowsSchema>[number];

/** The record of how a delivery looked when it was checked in, and the batches it came in. */
export const checklistSchema = z.object({ checkedAt: date, certificateOfAnalysisDelivered: z.boolean().nullish(), visibleLabelling: z.boolean().nullish(), intactnessStatus: z.number().nullish(), consignmentCarrierStatus: z.number().nullish(),
  material: z.object({ name: text, code: text }).nullish(), supplier: z.object({ name: text }).nullish(), manufacturer: z.object({ name: text }).nullish(), shipmentInvoice: z.object({ code: text }).nullish(), materialBatches: batchRowsSchema,
}).transform((value) => ({ checkedAt: value.checkedAt, certificate: value.certificateOfAnalysisDelivered === true, labelled: value.visibleLabelling === true, intactness: value.intactnessStatus ?? null, carrier: value.consignmentCarrierStatus ?? null,
  materialName: value.material?.name ?? "Unnamed material", materialCode: value.material?.code ?? null, supplier: value.supplier?.name ?? null, manufacturer: real(value.manufacturer?.name ?? null), invoice: value.shipmentInvoice?.code ?? null, batches: value.materialBatches }));
export type Checklist = z.infer<typeof checklistSchema>;

const option = z.object({ value: z.string().min(1), label: z.string() });
const chosen = (message: string) => option.nullable().refine((value): boolean => Boolean(value), message);
const picked = (message: string) => z.date({ message }).nullable().refine((value): boolean => Boolean(value), message);
const endOfToday = () => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59); };
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a month and a year").nullable();
const notFuture = (value: Date | null) => !value || value <= endOfToday();

/** A raw material batch needs its number and its expiry date; packaging may come without either. */
export function checklistFormSchema(kind: MaterialKind) {
  const batchLine = z.object({
    number: z.string().trim().max(100, "Keep the batch number under 100 characters"),
    containers: z.number({ message: "Enter how many containers" }).refine((value) => Number.isInteger(value) && value >= 1 && value <= 100_000, "Enter a whole number of containers, 1 or more"),
    style: chosen("Choose the kind of container"),
    perContainer: z.number({ message: "Enter the quantity in each container" }).refine((value) => value > 0, "The quantity must be above zero"),
    // Manufacturing and expiry dates are a month and a year ("2026-06"), as printed on the container.
    made: month.refine((value): boolean => Boolean(value), "Choose the manufacturing date"),
    expires: month,
    weights: z.array(z.object({ gross: z.number().or(z.nan()).nullish() })),
  }).superRefine((value, context) => {
    if (kind === 0 && !value.number) context.addIssue({ code: "custom", path: ["number"], message: "Enter the batch number" });
    if (kind === 0 && !value.expires) context.addIssue({ code: "custom", path: ["expires"], message: "Choose the expiry date" });
    const dates = batchDatesIssue(value.made, value.expires);
    if (dates) context.addIssue({ code: "custom", path: [dates.field], message: dates.message });
    const weights = value.weights.map((weight) => weight.gross).filter((gross): gross is number => typeof gross === "number" && Number.isFinite(gross));
    if (weights.some((gross) => gross <= 0)) context.addIssue({ code: "custom", path: ["weights"], message: "A gross weight must be above zero" });
    else if (weights.length === 0) context.addIssue({ code: "custom", path: ["weights"], message: "Record at least one gross weight" });
  });
  return z.object({
    checkedAt: picked("Choose the date of the check").refine(notFuture, "The check cannot be dated in the future"),
    // Empty until answered, so neither answer is assumed.
    certificate: z.string().refine((value): boolean => value === "yes" || value === "no", "Say whether the certificate of analysis came with the delivery"),
    labelled: z.string().refine((value): boolean => value === "yes" || value === "no", "Say whether the containers are properly labelled"),
    intactness: chosen("Choose the state of the containers"),
    carrier: chosen("Choose the condition of the carrier"),
    batches: z.array(batchLine).min(1, "Add at least one batch").superRefine((lines, context) => {
      const seen = new Set<string>();
      lines.forEach((line, index) => { const key = line.number.toLowerCase(); if (!key) return;
        if (seen.has(key)) context.addIssue({ code: "custom", path: [index, "number"], message: "This batch number is already used above" });
        seen.add(key); });
    }),
  });
}
export type ChecklistFormValues = z.infer<ReturnType<typeof checklistFormSchema>>;

export const grnFormSchema = z.object({
  number: z.string().trim().min(1, "Enter the GRN number").max(100, "Keep the number under 100 characters"),
  declaration: z.string().trim().max(100, "Keep the declaration number under 100 characters"),
  carrier: z.string().trim().min(1, "Enter the carrier's name").max(200, "Keep the name under 200 characters"),
  vehicle: z.string().trim().min(1, "Enter the vehicle number").max(100, "Keep the vehicle number under 100 characters"),
  remarks: z.string().trim().max(1000, "Keep the remarks under 1000 characters"),
});
export type GrnFormValues = z.infer<typeof grnFormSchema>;
