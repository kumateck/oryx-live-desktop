import type { IssuedBmrReport } from "../schemas/issued-bmr";

export const bmrDepartmentId = "11111111-1111-4111-8111-111111111111";
export function issuedBmrFixture(): IssuedBmrReport {
  return { startDate: "2026-11-01", endDate: "2026-11-02", departmentId: bmrDepartmentId, departmentName: "Tablet production",
    generatedAt: "2026-11-02T20:00:00Z", totalIssued: 2, rows: [1, 2].map((number) => ({
      id: `22222222-2222-4222-8222-${String(number).padStart(12, "0")}`,
      scheduleProductId: "33333333-3333-4333-8333-333333333333", productId: "44444444-4444-4444-8444-444444444444",
      departmentId: bmrDepartmentId, departmentName: "Tablet production", productCode: `P-00${number}`,
      productName: number === 1 ? "Example tablet with a long descriptive product name 250 mg" : "Second product",
      scheduleCode: "PLAN-11", batchNumber: `BMR-2026-00${number}`, batchQuantity: number === 1 ? 120000000 : 0.00001,
      batchUnit: "mg", packingStyle: "10 × 10", manufacturingDate: "2026-11-01T00:00:00Z", expiryDate: "2028-10-31T00:00:00Z",
      issuedAt: number === 1 ? "2026-11-01T00:00:00Z" : "2026-11-02T23:59:59.999999Z",
      issuedById: number === 1 ? "55555555-5555-4555-8555-555555555555" : null,
      issuedByName: number === 1 ? "QA Operator" : null, isArchived: number === 2, isCancelled: number === 2,
    })) };
}
