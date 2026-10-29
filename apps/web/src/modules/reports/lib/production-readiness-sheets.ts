import { reportSheet } from "@/shared/reports/report-data";
import type { ReportColumn } from "@/shared/reports/report-data";
import { readinessChecks, type ProductConfiguration, type ProductionReadinessReport, type ProductionReadinessRow, type ReadinessProduct } from "../schemas/production-readiness";

export const definitionLabels = ["Missing", "Configured", "Could not be verified"] as const;
export const readinessLabels = ["Action needed", "Ready", "Could not verify"] as const;
const checks = <T extends { configuration: ProductConfiguration }>(): ReportColumn<T>[] => [
  ...readinessChecks.map(({ key, name }) => ({ label: key === "packingStyle" ? "Packing style check" : name, read: (item: T) => definitionLabels[item.configuration[key]] })),
  { label: "Readiness", read: (item) => readinessLabels[item.configuration.readiness] },
];
const planColumns: ReportColumn<ProductionReadinessRow>[] = [
  { label: "Product", read: (row) => row.productName }, { label: "Code", read: (row) => row.productCode },
  { label: "Packing style", read: (row) => row.packingStyle }, { label: "Expected batches", read: (row) => row.batches },
  { label: "Unit price", read: (row) => row.unitPrice }, { label: "Price unit", read: (row) => row.priceUnit },
  { label: "Expected yield", read: (row) => row.expectedYield }, { label: "Packs", read: (row) => row.packs }, { label: "Packs per shipper", read: (row) => row.packsPerShipper },
  { label: "Shippers", read: (row) => row.shippers }, { label: "Loose packs", read: (row) => row.loosePacks },
  ...checks<ProductionReadinessRow>(),
  { label: "Product ID", read: (row) => row.productId }, { label: "Packing ID", read: (row) => row.productPackingId },
  { label: "Schedule product IDs", read: (row) => row.scheduleProductIds.join(", ") },
];

/** The screen and every export use the same server snapshot; no quantities are recalculated here. */
export function productionReadinessSheets(report: ProductionReadinessReport) {
  const plans = report.markets.map((group) => reportSheet(`Production plan · ${group.market.name}`, group.rows, planColumns));
  const products = reportSheet("Product readiness", report.products, [
    { label: "Product", read: (row: ReadinessProduct) => row.productName }, { label: "Code", read: (row) => row.productCode },
    { label: "Markets", read: (row) => row.markets.map((market) => market.name).join(", ") },
    { label: "Expected batches", read: (row) => row.batches }, ...checks<ReadinessProduct>(),
    { label: "Product ID", read: (row) => row.productId },
    { label: "Market IDs", read: (row) => row.markets.map((market) => market.id ?? "Unrecorded").join(", ") },
  ]);
  const totals = reportSheet("Production totals", [
    ...report.markets.map((group) => ({ label: group.market.name, id: group.market.id, ...group.totals })),
    { label: "Grand total", id: null, ...report.totals },
  ], [{ label: "Market", read: (row) => row.label }, { label: "Market ID", read: (row) => row.id },
    { label: "Expected batches", read: (row) => row.batches }, { label: "Expected yield", read: (row) => row.expectedYield },
    { label: "Packs", read: (row) => row.packs }, { label: "Shippers", read: (row) => row.shippers }, { label: "Loose packs", read: (row) => row.loosePacks }]);
  const summary = reportSheet("Readiness summary", [report], [
    { label: "Products", read: (row) => row.productCount }, { label: "Ready", read: (row) => row.readyProductCount },
    { label: "Action needed", read: (row) => row.actionNeededProductCount },
    { label: "Could not verify", read: (row) => row.unavailableProductCount },
  ]);
  return [...plans, products, totals, summary];
}
