import { describe, expect, it } from "vitest";
import type { ProductionBatch } from "../schemas/production-monthly";
import { batchValueSheet, productionMonthlySheet, scheduleSummarySheet } from "./production-sheets";

const batch = (number: string, overrides: Partial<ProductionBatch> = {}): ProductionBatch => ({
  scheduleProductId: `00000000-0000-4000-8000-${number.padStart(12, "0")}`, scheduleCode: "PLAN-11", scheduleStart: "2026-11-03T00:00:00Z",
  productId: "11111111-1111-4111-8111-111111111111", productCode: "TAB-1", productName: "Paracetamol 500 mg", departmentId: null, departmentName: "Tablets",
  marketId: "22222222-2222-4222-8222-222222222222", marketName: "Local", batchNumber: `B-${number}`, batchSize: 0, batchShare: 1,
  productPackingId: "33333333-3333-4333-8333-333333333333", packingStyle: "10 × 10", packsPerShipper: 50, expectedYield: 1000, packed: true,
  actualYield: 980, retainedSamples: 6, bottlesPerShipper: null, fullShippers: 19, leftOver: 30, transferredToWarehouse: 970, transferUnit: "pk",
  transferNotes: 2, unitPrice: 10, priceUnit: "Pack", currency: "GH₵", ...overrides,
});

describe("production reports", () => {
  it("gives each batch its own row on the monthly report", () => {
    const sheet = productionMonthlySheet([batch("2"), batch("1", { packed: false, actualYield: null, retainedSamples: null, transferredToWarehouse: null })]);
    expect(sheet.columns).toEqual(["Product", "Product code", "Batch number", "Market", "Packing style", "Qty expected", "Qty transferred to warehouse",
      "QA retained samples", "Total yield (unit packs)", "Qty per shipper"]);
    expect(sheet.rows.map((row) => row.cells[2])).toEqual(["B-1", "B-2"]);
    expect(sheet.rows[0]?.cells.slice(6, 9)).toEqual([null, null, null]);
    expect(sheet.rows[1]?.cells[6]).toEqual({ quantity: 970, unit: "pk", origin: "calculated" });
  });

  it("summarises the schedule by product, packing and market; half batches count half and actual yield adds packed batches", () => {
    const sheet = scheduleSummarySheet([batch("1"), batch("2", { batchShare: 0.5, expectedYield: 500, packed: false, actualYield: null }),
      batch("3", { marketId: null, marketName: null })]);
    expect(sheet.rows).toHaveLength(2);
    const local = sheet.rows.find((row) => row.cells[0] === "Local")?.cells;
    expect(local?.slice(4)).toEqual([1000, 1.5, 1500, 980, "1 of 2"]);
    expect(sheet.rows.find((row) => row.cells[0] === "No market recorded")?.cells[5]).toBe(1);
  });

  it("shows unit price with its unit and currency beside expected and actual quantity", () => {
    const sheet = batchValueSheet([batch("1", { unitPrice: null })]);
    expect(sheet.columns).toEqual(["Product", "Product code", "Batch number", "Packing style", "Unit price", "Currency", "Price per", "Expected qty", "Actual qty"]);
    expect(sheet.rows[0]?.cells.slice(4)).toEqual([null, "GH₵", "Pack", 1000, 980]);
  });
});
