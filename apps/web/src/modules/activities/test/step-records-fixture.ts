import type { StepActionRecordsData } from "../schemas/step-records-schema";

export const evidenceTime = "2026-10-26T00:08:22Z";
export const evidencePerson = { id: "operator", firstName: "Eunice", lastName: "Adams" };
export const emptyStepRecords = (stepId = "done"): StepActionRecordsData => ({
  stepId, productionScheduleProductId: "b1", batchScopedRecordIds: [],
  analyticalTests: [], batchRecords: [], requisitions: [], extraMaterialRequests: [], finalPackings: [], transfers: [], materialReturns: [],
});
export function stepEvidenceFixture(stepId = "done"): StepActionRecordsData {
  return {
    ...emptyStepRecords(stepId),
    analyticalTests: [{ request: { id: "atr-1", arNumber: "AR-4862", stage: 2, status: 5, createdAt: evidenceTime, createdBy: evidencePerson,
      batchManufacturingRecord: { batchNumber: "4862" }, state: { name: "Liquid" }, filled: "150 ml", sampledQuantity: "500 ml", numberOfContainers: 4,
      releasedAt: evidenceTime, releasedBy: evidencePerson, assignees: [evidencePerson] }, testedAt: evidenceTime, testedBy: { name: "QC analyst" } }],
    batchRecords: [{ id: "bmr-1", batchNumber: "4862", batchQuantity: 3_000_000, status: 2, manufacturingDate: "2026-10-01", expiryDate: "2031-10-31", createdAt: evidenceTime, createdBy: evidencePerson }],
    requisitions: [{ id: "req-1", code: "RM-4862", status: 3, requestedBy: { name: "Eunice Adams" }, approved: true,
      items: [{ id: "line-1", material: { name: "Sugar", code: "RM-1" }, uoM: { symbol: "mg" }, quantity: 1000001.123456, quantityReceived: 1000001.123456, status: 3 }] }],
    extraMaterialRequests: [{ id: "extra-1", material: { name: "Extra bottles", code: "PM-EXTRA" }, unit: { name: "pcs" }, quantity: 11.000123,
      status: 2, approved: true, createdAt: evidenceTime, createdBy: evidencePerson, issuedAt: evidenceTime, issuedBy: { name: "Warehouse team" } }],
    finalPackings: [{ id: "packing-1", productPacking: { name: "150 ml bottles" }, expectedYield: 20_000, totalQuantityPacked: 19_980,
      yieldTotalQuantityPacked: 20_000, qualityControlAnalyticalSample: 5, retainedSamples: 10, stabilitySamples: 5,
      nUmberOfFullShipperPacked: 666, numberOfBottlesPerShipper: 30, leftOver: 0, totalGainOrLoss: 0, createdAt: evidenceTime, createdBy: evidencePerson,
      materials: [{ material: { name: "Bottle with a deliberately long packaging description for production reconciliation", code: "PM-001" },
        receivedQuantity: 20_100, subsequentDeliveredQuantity: 10, totalReceivedQuantity: 20_110, packedQuantity: 20_000, returnedQuantity: 100,
        rejectedQuantity: 5, sampledQuantity: 5, totalAccountedForQuantity: 20_110, percentageLoss: 0.012345, percentageVarianceDescription: "Bottle breakages recorded" }] }],
    transfers: [{ id: "transfer-1", transferNoteNumber: "FGT-4862-A", fromWarehouse: { name: "Production" }, toWarehouse: { name: "Finished goods quarantine" },
      totalQuantity: 10000, quantityReceived: 9500, uoM: { symbol: "pcs" }, productPacking: { name: "150 ml bottles" },
      approved: true, isApproved: false, isPartial: true, isFulfilled: false, notes: "Partial receipt", createdAt: evidenceTime, createdBy: evidencePerson },
    { id: "transfer-2", transferNoteNumber: "FGT-4862-B", totalQuantity: 9980, quantityReceived: 9980, approved: true, isApproved: true, isPartial: true, isFulfilled: true }],
    materialReturns: [{ id: "return-1", batchNumber: "4862", status: 1, isFullReturn: false, returnDate: evidenceTime, createdBy: evidencePerson,
      partialReturns: [{ material: { name: "Unused caps", code: "PM-CAP" }, quantity: 100, uoM: { symbol: "pcs" }, returned: true, destinationWarehouse: { name: "Packaging warehouse" } }] }],
    batchScopedRecordIds: ["extra-1", "return-1"],
  };
}
