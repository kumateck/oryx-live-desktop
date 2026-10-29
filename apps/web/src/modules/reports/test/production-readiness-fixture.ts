import type { ProductConfiguration, ProductionReadinessReport } from "../schemas/production-readiness";

export const readinessDepartmentId = "00000000-0000-4000-8000-000000000001";
const productA = "00000000-0000-4000-8000-000000000002";
const productB = "00000000-0000-4000-8000-000000000003";
const marketA = { id: "00000000-0000-4000-8000-000000000004", name: "International Trade Board" };
const marketB = { id: "00000000-0000-4000-8000-000000000005", name: "Tobinco Pharmaceutical Ltd" };
const unrecorded = { id: null, name: "No market recorded" };
const ready: ProductConfiguration = { specification: 1, stp: 1, ard: 1, procedure: 1, bom: 1, packaging: 1, packingStyle: 1, readiness: 1 };
const missing: ProductConfiguration = { ...ready, stp: 0, readiness: 0 };

/** Synthetic, deterministic data for API/render/export verification. */
export function readinessFixture(): ProductionReadinessReport {
  const first = { productId: productA, productName: "Dicnac 100 Tablets", productCode: "NT-081",
    productPackingId: "00000000-0000-4000-8000-000000000006", packingStyle: "80 X 20 X 10",
    scheduleProductIds: ["00000000-0000-4000-8000-000000000007"], batches: 0.5, unitPrice: 1.1234567,
    priceUnit: "tablet", expectedYield: 500000, packsPerShipper: 1600, shippers: 312, loosePacks: 800, configuration: ready };
  const second = { ...first, scheduleProductIds: ["00000000-0000-4000-8000-000000000008"] };
  const third = { productId: productB, productName: "Paracetamol 50MG", productCode: "NT-001",
    productPackingId: "00000000-0000-4000-8000-000000000009", packingStyle: "20 X 100 X 10",
    scheduleProductIds: ["00000000-0000-4000-8000-000000000010"], batches: 1, unitPrice: 0,
    priceUnit: "tablet", expectedYield: 0, packsPerShipper: 1000, shippers: 0, loosePacks: 0, configuration: missing };
  return structuredClone({ departmentId: readinessDepartmentId, departmentName: "Oral Solid-Tablet (Ben Botwe)",
    startDate: "2026-10-28", endDate: "2026-10-28", generatedAt: "2026-10-28T18:08:02Z", productCount: 2,
    readyProductCount: 1, actionNeededProductCount: 1, unavailableProductCount: 0,
    markets: [
      { market: marketA, rows: [first], totals: { batches: 0.5, expectedYield: 500000, shippers: 312, loosePacks: 800 } },
      { market: marketB, rows: [second], totals: { batches: 0.5, expectedYield: 500000, shippers: 312, loosePacks: 800 } },
      { market: unrecorded, rows: [third], totals: { batches: 1, expectedYield: 0, shippers: 0, loosePacks: 0 } },
    ], products: [
      { productId: productA, productName: first.productName, productCode: first.productCode, batches: 1, markets: [marketA, marketB], configuration: ready },
      { productId: productB, productName: third.productName, productCode: third.productCode, batches: 1, markets: [unrecorded], configuration: missing },
    ], totals: { batches: 2, expectedYield: 1000000, shippers: 624, loosePacks: 1600 }, warnings: [] });
}
