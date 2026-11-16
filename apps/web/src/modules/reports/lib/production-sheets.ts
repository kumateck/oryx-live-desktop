import { reportDate, reportEnum, reportQuantity, reportSheet, type ReportSheet } from "@/shared/reports/report-data";
import type { ProductionBatch, StockIssued } from "../schemas/production-monthly";

const byProduct = (a: ProductionBatch, b: ProductionBatch) => (a.productName ?? "").localeCompare(b.productName ?? "") || (a.batchNumber ?? "").localeCompare(b.batchNumber ?? "");
/** Packs per shipper as packed on the line, or the packing style's figure before final packing. */
const perShipper = (row: ProductionBatch) => row.bottlesPerShipper ?? row.packsPerShipper;

/** Production monthly report: each batch on its own row. */
export function productionMonthlySheet(rows: readonly ProductionBatch[]): ReportSheet {
  return reportSheet("Production monthly report", [...rows].sort(byProduct), [
    { label: "Product", read: (row) => row.productName }, { label: "Product code", read: (row) => row.productCode },
    { label: "Batch number", read: (row) => row.batchNumber }, { label: "Market", read: (row) => row.marketName },
    { label: "Packing style", read: (row) => row.packingStyle },
    { label: "Qty expected", read: (row) => row.expectedYield },
    { label: "Qty transferred to warehouse", read: (row) => reportQuantity(row.transferredToWarehouse, row.transferUnit) },
    { label: "QA retained samples", read: (row) => row.retainedSamples },
    { label: "Total yield (unit packs)", read: (row) => row.actualYield },
    { label: "Qty per shipper", read: perShipper },
  ]);
}

interface SummaryRow { productName: string | null; productCode: string | null; marketName: string | null; packingStyle: string | null;
  perBatch: number | null; batches: number; expected: number | null; actual: number | null; packed: number; count: number }

/** Monthly schedule summary: one row per product, packing style and market. */
export function scheduleSummarySheet(rows: readonly ProductionBatch[]): ReportSheet {
  const groups = new Map<string, SummaryRow>();
  for (const row of rows) {
    const key = [row.productId, row.productPackingId ?? "", row.marketId ?? ""].join("|");
    const fullBatch = row.expectedYield !== null && row.batchShare > 0 ? row.expectedYield / row.batchShare : null;
    const group = groups.get(key) ?? { productName: row.productName, productCode: row.productCode, marketName: row.marketName ?? "No market recorded",
      packingStyle: row.packingStyle, perBatch: fullBatch, batches: 0, expected: 0, actual: null, packed: 0, count: 0 };
    group.batches += row.batchShare; group.count += 1;
    group.expected = group.expected === null || row.expectedYield === null ? null : group.expected + row.expectedYield;
    if (row.actualYield !== null) { group.actual = (group.actual ?? 0) + row.actualYield; group.packed += 1; }
    groups.set(key, group);
  }
  const summary = [...groups.values()].sort((a, b) => (a.marketName ?? "").localeCompare(b.marketName ?? "") || (a.productName ?? "").localeCompare(b.productName ?? ""));
  return reportSheet("Production schedule summary", summary, [
    { label: "Market", read: (row) => row.marketName }, { label: "Product", read: (row) => row.productName },
    { label: "Product code", read: (row) => row.productCode }, { label: "Packing style", read: (row) => row.packingStyle },
    { label: "Expected yield per batch", read: (row) => row.perBatch }, { label: "Total batches", read: (row) => row.batches },
    { label: "Total expected yield", read: (row) => row.expected },
    { label: "Actual yield", read: (row) => row.actual },
    { label: "Batches packed", read: (row) => `${row.packed} of ${row.count}` },
  ]);
}

/** Batch value report: price in force when the schedule started, with expected and actual quantity. */
export function batchValueSheet(rows: readonly ProductionBatch[]): ReportSheet {
  return reportSheet("Batch value report", [...rows].sort(byProduct), [
    { label: "Product", read: (row) => row.productName }, { label: "Product code", read: (row) => row.productCode },
    { label: "Batch number", read: (row) => row.batchNumber }, { label: "Packing style", read: (row) => row.packingStyle },
    { label: "Unit price", read: (row) => row.unitPrice }, { label: "Currency", read: (row) => row.currency },
    { label: "Price per", read: (row) => row.priceUnit },
    { label: "Expected qty", read: (row) => row.expectedYield }, { label: "Actual qty", read: (row) => row.actualYield },
  ]);
}

/** Stock issued: every material batch issued to a production batch, and extra packing. */
export function stockIssuedSheet(report: StockIssued): ReportSheet {
  return reportSheet("Stock issued", report.rows, [
    { label: "Issued date", read: (row) => reportDate(row.issuedAt) }, { label: "Issued by", read: (row) => row.issuedByName ?? "Not recorded" },
    { label: "Issued through", read: (row) => reportEnum(row.source, ["Stock requisition", "Extra packing"]) },
    { label: "Requisition", read: (row) => row.requisitionCode }, { label: "Department", read: (row) => row.departmentName },
    { label: "Product", read: (row) => row.productName }, { label: "Product code", read: (row) => row.productCode },
    { label: "Batch number", read: (row) => row.batchNumber }, { label: "Material code", read: (row) => row.materialCode },
    { label: "Material", read: (row) => row.materialName }, { label: "Material type", read: (row) => reportEnum(row.materialKind, ["Raw material", "Packaging material"]) },
    { label: "Material batch", read: (row) => row.materialBatchNumber }, { label: "AR number", read: (row) => row.arNumber },
    { label: "Quantity issued", read: (row) => reportQuantity(row.quantity, row.unit) }, { label: "Issued from", read: (row) => row.warehouseName },
  ]);
}
