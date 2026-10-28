import { z } from "zod";

const text = z.string().nullish();
const amount = z.number().finite().nullish();
const named = z.object({ id: text, name: text, code: text, symbol: text }).nullish();
const person = z.object({ id: text, firstName: text, lastName: text, name: text }).nullish();
const base = { id: z.string().min(1), createdAt: text, createdBy: person };
const material = z.object({ name: text, code: text }).nullish();
const bmr = z.object({ ...base, batchNumber: text, status: z.number().nullish(), batchQuantity: amount,
  sampledQuantity: amount, manufacturingDate: text, expiryDate: text, issuedDate: text });
const analysis = z.object({
  request: z.object({ ...base, status: z.number().nullish(), stage: z.number().nullish(), arNumber: text,
    batchManufacturingRecord: z.object({ batchNumber: text }).nullish(), state: named, filled: text,
    sampledQuantity: text, numberOfContainers: amount, isRetest: z.boolean().nullish(),
    sampledAt: text, sampledBy: person, acknowledgedAt: text, acknowledgedBy: person,
    assignedAt: text, assignees: z.array(person).nullish(), issuedAt: text, issuedBy: person, issueNumber: text,
    releasedAt: text, releasedBy: person, manufacturingDate: text, expiryDate: text }),
  chemicalArdId: text, microbialArdId: text, microbialRequired: z.boolean().nullish(), testedAt: text, testedBy: named,
});
const requisition = z.object({
  id: z.string().min(1), createdAt: text, code: text, status: z.number().nullish(), approved: z.boolean().nullish(),
  requestedBy: named, department: named, expectedDelivery: text, comments: text,
  items: z.array(z.object({ id: text, material, uoM: named, quantity: amount, quantityReceived: amount, status: z.number().nullish() })).nullish(),
});
const packing = z.object({ ...base, productPacking: named, numberOfBottlesPerShipper: amount, nUmberOfFullShipperPacked: amount,
  leftOver: amount, batchSize: amount, averageVolumeFilledPerBottle: amount, expectedYield: amount, totalQuantityPacked: amount,
  qualityControlAnalyticalSample: amount, retainedSamples: amount, stabilitySamples: amount, totalNumberOfBottles: amount,
  yieldTotalQuantityPacked: amount, totalGainOrLoss: amount, totalWeightReceived: amount, comment: text, percentageVarianceDescription: text,
  materials: z.array(z.object({ material, receivedQuantity: amount, subsequentDeliveredQuantity: amount, totalReceivedQuantity: amount,
    packedQuantity: amount, returnedQuantity: amount, rejectedQuantity: amount, sampledQuantity: amount,
    totalAccountedForQuantity: amount, percentageLoss: amount, percentageVarianceDescription: text })).nullish(),
});
const transfer = z.object({ ...base, transferNoteNumber: text, fromWarehouse: named, toWarehouse: named, productPacking: named,
  uoM: named, quantityPerPack: amount, totalQuantity: amount, quantityReceived: amount, loose: amount,
  allocatedQuantity: amount, remainingQuantity: amount, isApproved: z.boolean().nullish(), approved: z.boolean().nullish(),
  isPartial: z.boolean().nullish(), isFulfilled: z.boolean().nullish(), notes: text, qarNumber: text });
const extra = z.object({ ...base, material: named, unit: named, quantity: amount, status: z.number().nullish(),
  approved: z.boolean().nullish(), issuedAt: text, issuedBy: named });
const returnLine = { destinationWarehouse: named, returned: z.boolean().nullish() };
const returns = z.object({ ...base, returnDate: text, batchNumber: text, status: z.number().nullish(), isFullReturn: z.boolean().nullish(),
  fullReturns: z.array(z.object({ ...returnLine, materialBatchReservedQuantity: z.object({ quantity: amount, uoM: named,
    materialBatch: z.object({ batchNumber: text, material }).nullish() }).nullish() })).nullish(),
  partialReturns: z.array(z.object({ ...returnLine, material, materialBatch: z.object({ batchNumber: text }).nullish(), quantity: amount, uoM: named })).nullish(),
});

/** Historical records are validated separately from the mutable action preflight. */
export const stepRecordsSchema = z.object({
  stepId: z.string().min(1), productionScheduleProductId: z.string().min(1),
  analyticalTests: z.array(analysis), batchRecords: z.array(bmr), requisitions: z.array(requisition),
  extraMaterialRequests: z.array(extra), finalPackings: z.array(packing), transfers: z.array(transfer),
  materialReturns: z.array(returns), batchScopedRecordIds: z.array(z.string()),
});
export type StepActionRecordsData = z.infer<typeof stepRecordsSchema>;
export type AnalysisRecord = StepActionRecordsData["analyticalTests"][number];
export type ManufacturingRecord = StepActionRecordsData["batchRecords"][number];
export type RequisitionRecord = StepActionRecordsData["requisitions"][number];
export type PackingRecord = StepActionRecordsData["finalPackings"][number];
export type TransferRecord = StepActionRecordsData["transfers"][number];
export type ExtraMaterialRecord = StepActionRecordsData["extraMaterialRequests"][number];
export type ReturnRecord = StepActionRecordsData["materialReturns"][number];
