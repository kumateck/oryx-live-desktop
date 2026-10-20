/** Reproducible GRN contract fixture: storage quantities are mg, including when a DTO's display unit is kg. */
export const ids = {
  grn: "11111111-1111-4111-8111-111111111111",
  material: "22222222-2222-4222-8222-222222222222",
  unit: "33333333-3333-4333-8333-333333333333",
  batch: "44444444-4444-4444-8444-444444444444",
  batch2: "44444444-4444-4444-8444-444444444445",
  warehouse: "55555555-5555-4555-8555-555555555555",
  warehouse2: "55555555-5555-4555-8555-555555555556",
  request: "66666666-6666-4666-8666-666666666666",
  request2: "66666666-6666-4666-8666-666666666667",
  request3: "66666666-6666-4666-8666-666666666668",
};
const unit = { id: ids.unit, symbol: "mg" };
const material = { id: ids.material, name: "Diclofenac Sodium", kind: 0 };
const batch = { id: ids.batch, batchNumber: "BNTXOCT16A", material, uoM: unit,
  totalQuantity: 10_000_000, quantityAssigned: 0, quantityDistributed: 2_000_000, status: 8,
  manufacturingDate: "2026-10-01", expiryDate: "2027-10-31" };
const request = { id: ids.request, quantity: 4_000_000, quantityDistributed: 1_000_000, uom: unit,
  warehouse: { id: ids.warehouse, name: "Production store" }, requisitionItem: { material } };
export function grnFixture(status = 8, kind = 0) {
  return { id: ids.grn, grnNumber: "GRXTNC", carrierName: "PORT", vehicleNumber: "AK47", declarationNumber: "FRT65",
    materialBatches: [{ ...batch, material: { ...material, kind }, status },
      { ...batch, material: { ...material, kind }, id: ids.batch2, batchNumber: "BNTXOCT16B", totalQuantity: 6_000_000, quantityDistributed: 1_000_000, status }],
    checkLists: [{ material, distributedRequisitionMaterial: { distributedRequisitionItems: [request,
      { ...request, id: ids.request2, quantity: 5_000_000, quantityDistributed: 0 },
      { ...request, id: ids.request3, quantity: 2_000_000, quantityDistributed: 0, warehouse: { id: ids.warehouse2, name: "Research store" } }] } }] };
}
