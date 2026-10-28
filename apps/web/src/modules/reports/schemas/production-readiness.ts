import { z } from "zod";

const state = z.union([z.literal(0), z.literal(1), z.literal(2)]);
export const readinessChecks = [
  { key: "specification", label: "SPEC", name: "Specification" },
  { key: "stp", label: "STP", name: "STP" },
  { key: "ard", label: "ARD", name: "ARD" },
  { key: "procedure", label: "Procedure", name: "Procedure" },
  { key: "bom", label: "BOM", name: "BOM" },
  { key: "packaging", label: "Packaging", name: "Packaging" },
  { key: "packingStyle", label: "Packing style", name: "Packing style" },
] as const;
const configuration = z.object({ specification: state, stp: state, ard: state, procedure: state,
  bom: state, packaging: state, packingStyle: state, readiness: state }).refine((value) => {
  const checks = readinessChecks.map(({ key }) => value[key]);
  return value.readiness === (checks.includes(2) ? 2 : checks.every((check) => check === 1) ? 1 : 0);
}, "The configuration checks and readiness disagree.");
const amount = z.number().finite().nonnegative();
const market = z.object({ id: z.uuid().nullable(), name: z.string().min(1) });
const identity = { productId: z.uuid(), productCode: z.string(), productName: z.string().min(1) };
const totals = z.object({ batches: amount, expectedYield: amount.nullable(), shippers: amount.nullable(), loosePacks: amount.nullable() });
const row = z.object({ ...identity, productPackingId: z.uuid().nullable(), packingStyle: z.string().min(1),
  scheduleProductIds: z.array(z.uuid()).min(1), batches: amount.positive(), unitPrice: z.number().finite().nullable(),
  priceUnit: z.string().nullable(), expectedYield: amount.nullable(), packsPerShipper: amount.int().positive().nullable(),
  shippers: amount.int().nullable(), loosePacks: amount.nullable(), configuration });
export const productionReadinessSchema = z.object({
  departmentId: z.uuid(), departmentName: z.string().min(1), startDate: z.iso.date(), endDate: z.iso.date(),
  generatedAt: z.iso.datetime(), productCount: amount.int(), readyProductCount: amount.int(),
  actionNeededProductCount: amount.int(), unavailableProductCount: amount.int(),
  markets: z.array(z.object({ market, rows: z.array(row).min(1), totals })),
  products: z.array(z.object({ ...identity, batches: amount.positive(), markets: z.array(market).min(1), configuration })),
  totals, warnings: z.array(z.string()),
}).superRefine((report, context) => {
  const products = new Map(report.products.map((product) => [product.productId, product]));
  const rows = report.markets.flatMap((group) => group.rows);
  const ids = rows.flatMap((item) => item.scheduleProductIds);
  const planned = new Map<string, { batches: number; markets: Map<string | null, string> }>();
  for (const group of report.markets) for (const item of group.rows) {
    const summary = planned.get(item.productId) ?? { batches: 0, markets: new Map<string | null, string>() };
    summary.batches += item.batches; summary.markets.set(group.market.id, group.market.name);
    planned.set(item.productId, summary);
  }
  const consistent = products.size === report.products.length
    && report.productCount === products.size
    && new Set(report.markets.map((group) => group.market.id)).size === report.markets.length
    && report.markets.every((group) => new Set(group.rows.map((item) => `${item.productId}:${item.productPackingId}`)).size === group.rows.length)
    && new Set(ids).size === ids.length
    && report.readyProductCount === report.products.filter((product) => product.configuration.readiness === 1).length
    && report.actionNeededProductCount === report.products.filter((product) => product.configuration.readiness === 0).length
    && report.unavailableProductCount === report.products.filter((product) => product.configuration.readiness === 2).length
    && rows.every((item) => {
      const product = products.get(item.productId);
      return product && item.productName === product.productName && item.productCode === product.productCode
        && readinessChecks.every(({ key }) => item.configuration[key] === product.configuration[key]);
    })
    && report.products.every((product) => {
      const summary = planned.get(product.productId);
      return summary && summary.batches === product.batches
        && new Set(product.markets.map((item) => item.id)).size === product.markets.length
        && product.markets.length === summary.markets.size
        && product.markets.every((item) => summary.markets.get(item.id) === item.name);
    });
  if (!consistent) context.addIssue({ code: "custom", message: "The report is incomplete or its product summaries disagree." });
});

export type ProductionReadinessReport = z.infer<typeof productionReadinessSchema>;
export type ProductionReadinessRow = ProductionReadinessReport["markets"][number]["rows"][number];
export type ReadinessProduct = ProductionReadinessReport["products"][number];
export type ProductConfiguration = ProductionReadinessRow["configuration"];
export type ReadinessView = { report: ProductionReadinessReport; mode: "schedule" | "products" };
