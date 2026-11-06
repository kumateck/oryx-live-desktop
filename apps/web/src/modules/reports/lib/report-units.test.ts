import { expect, it } from "vitest";
import type { ReportSheet } from "@/shared/reports/report-data";
import { showReportCell } from "@/shared/reports/report-print";
import { inventoryValuationSheet, materialStockDetailSheet, materialStockSummarySheet } from "./warehouse-adapters-1";
import { productStockSummarySheet } from "./finished-goods-adapters-1";
import { storeStockSheet } from "./stores-adapters-1";
import { purchasedOrdersSheet } from "./procurement-adapters-1";

const shown = (sheet: ReportSheet, label: string) => showReportCell(sheet.rows[0]?.cells[sheet.columns.indexOf(label)]);

it("shows every report quantity in its largest unit, with the unit in the same cell", () => {
  const summary = materialStockSummarySheet("Summary", [{ materialName: "Benzoyl peroxide", totalQuantity: 100_000_000, uom: "mg" }]);
  expect(shown(summary, "Total quantity")).toBe("100 kg"); expect(summary.columns).not.toContain("Unit");
  expect(shown(materialStockDetailSheet("Detail", [{ quantityAvailable: 69_700_000, uom: "mg" }]), "Quantity available")).toBe("69.7 kg");
  // Some reports name the unit instead of giving its symbol.
  expect(shown(productStockSummarySheet("Products", [{ totalQuantity: 2_500_000, uomName: "Milliliter" }]), "Total quantity")).toBe("2,500 L");
  expect(shown(productStockSummarySheet("Products", [{ totalQuantity: 1200, uomName: "Pack" }]), "Total quantity")).toBe("1,200 Pack");
  expect(shown(storeStockSheet("Stores", [{ totalQuantity: 15, unitOfMeasure: "pcs" }]), "Total quantity")).toBe("15 pcs");
  const purchased = purchasedOrdersSheet("Purchased", [{ orderedQuantity: 1_250_000, orderedUom: "mg", quantityReceived: 1_000_000, receivedUom: "mg" }]);
  expect(shown(purchased, "Ordered quantity")).toBe("1.25 kg"); expect(shown(purchased, "Quantity received")).toBe("1 kg");
});

it("states that valuation costs stay per stored unit while the quantity is shown in its largest unit", () => {
  const sheet = inventoryValuationSheet("Valuation", [{ uom: "mg", quantityUOM: "26780000", itemCount: 26_780_000, estUnitCostVal: 0.0002, costBasis: "Per UOM" }]);
  expect(shown(sheet, "Quantity")).toBe("26.78 kg");
  expect(shown(sheet, "Cost basis")).toBe("Per mg");
  expect(sheet.columns).toContain("Est unit cost (per base unit)");
  expect(sheet.columns).not.toContain("Item count"); expect(sheet.columns).not.toContain("Quantity / UOM");
});
