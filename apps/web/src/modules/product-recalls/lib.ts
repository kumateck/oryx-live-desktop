import { z } from "zod";
const text = z.string().nullish().transform((value) => value?.trim() || null);
const count = z.number().nullish().transform((value) => value ?? 0);
export const recallPath = "/warehouse/product-recalls";
export const recallAudit = { module: "Finished Goods Warehouse", subModule: "Product Recalls" } as const;
export const recallKeys = { decision: "CanUpdateProductRecallDecision", view: "CanViewProductRecalls", create: "CanCreateProductRecall", notify: "CanNotifyProductRecall", recover: "CanRecordProductRecallRecovery",
  dispose: "CanDisposeProductRecallRecovery", disposeStock: "CanDisposeRecalledFinishedGoodsStock", close: "CanCloseProductRecall", reopen: "CanReopenProductRecall", print: "CanPrintProductRecall" } as const;
export const traceSchema = z.object({ allocationId: z.string(), transferNoteId: z.string(), transferNoteNumber: text, batchNumber: text, productName: text, packingStyle: text,
  customer: text, contact: text, deliveryAddress: text, stage: text, packs: count, yield: count, waybill: text, vehicle: text, dispatchedAt: text, deliveredAt: text,
  notified: z.boolean().default(false), acknowledged: z.boolean().default(false), effectivenessConfirmed: z.boolean().default(false), recoveredYield: count });
export const summarySchema = z.object({ id: z.string(), code: text, batchManufacturingRecordId: z.string(), batchNumber: text, productName: text, reason: text, regulatoryClassification: text,
  authorityReference: text, closed: z.boolean().default(false), createdAt: text, closedAt: text, closureReport: text, unrecoverableYield: count, unrecoverableReason: text });
export const detailSchema = summarySchema.extend({ transferVariance: count, history: z.array(z.object({ id: z.string(), event: text, evidence: text, actor: text, at: text })).nullish().transform((v) => v ?? []), settlements: z.array(z.object({ id: z.string(), invoiceCode: text, kind: text, amount: count, currency: text, reference: text, evidence: text, replacementProductionOrderId: text, createdAt: text })).nullish().transform((v) => v ?? []), consignments: z.array(traceSchema).nullish().transform((v) => v ?? []),
  recoveries: z.array(z.object({ id: z.string(), allocationId: z.string(), finishedGoodsTransferNoteId: z.string(), quantity: count, evidence: text, condition: text,
    disposed: z.boolean().default(false), dispositionEvidence: text })).nullish().transform((v) => v ?? []),
  stocks: z.array(z.object({ transferNoteId: z.string(), transferNoteNumber: text, packingStyle: text, unitsPerPack: count, physical: count, reserved: count, quarantinedReturns: count })).nullish().transform((v) => v ?? []),
  onSiteYield: count, dispatchedYield: count, recoveredYield: count });
export type Recall = z.infer<typeof detailSchema>;
export type RecallSummary = z.infer<typeof summarySchema>;
export type Trace = z.infer<typeof traceSchema>;
