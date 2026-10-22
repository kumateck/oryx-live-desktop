import { z } from "zod";
import type { ApiDispatch } from "@/shared/api/api-provider";
import { productsApi } from "@/shared/api/generated/products";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { reportSheet } from "@/shared/reports/report-data";
import { reportsAudit } from "../lib/report-model";
import type { PlannedProduct } from "../lib/schedule-plan";
import { reportRequest } from "./request";
export enum ReadinessStatus { Missing = 0, Configured = 1, Unavailable = 2 }
const labels = ["Missing", "Configured", "Unavailable"] as const;
const options = { subscribe: false, forceRefetch: true };
const notFound = z.object({ status: z.literal(404) });
async function status<T>(read: Promise<T>, configured: (value: T) => boolean): Promise<ReadinessStatus> {
  try { return configured(await read) ? ReadinessStatus.Configured : ReadinessStatus.Missing; }
  catch (reason) { return notFound.safeParse(reason).success ? ReadinessStatus.Missing : ReadinessStatus.Unavailable; }
}
export async function readinessSheet(dispatch: ApiDispatch, products: readonly PlannedProduct[], signal: AbortSignal) {
  const rows: { name: string; code: string | null; markets: string; batches: number; specification: ReadinessStatus; stp: ReadinessStatus; ard: ReadinessStatus; procedure: ReadinessStatus; bom: ReadinessStatus; packaging: ReadinessStatus; packingStyle: ReadinessStatus; ready: boolean }[] = [];
  // One product at a time bounds fan-out to five requests, even for a large monthly plan.
  for (const product of products) {
    if (signal.aborted) throw new Error("Report cancelled");
    const args = { ...reportsAudit, productId: product.productId };
    const detail = reportRequest(dispatch(productsApi.endpoints.getApiV1ProductByProductId.initiate(args, options)), signal);
    const [bom, packaging, packingStyle, procedure, specification, stp, ard] = await Promise.all([
      status(detail, (value) => Boolean(value.currentBillOfMaterial?.billOfMaterial?.items?.length)),
      status(detail, (value) => Boolean(value.packages?.length)), status(detail, (value) => Boolean(value.packings?.length)),
      status(reportRequest(dispatch(productsApi.endpoints.getApiV1ProductByProductIdRoutes.initiate(args, options)), signal), (value) => value.length > 0),
      status(reportRequest(dispatch(analyticalApi.endpoints.getApiV1ProductSpecificationsProductById.initiate({ ...reportsAudit, id: product.productId }, options)), signal), (value) => value.length > 0),
      status(reportRequest(dispatch(analyticalApi.endpoints.getApiV1ProductStpsByProductIdProduct.initiate(args, options)), signal), (value) => Boolean(value.id)),
      status(reportRequest(dispatch(analyticalApi.endpoints.getApiV1ProductArdProductByProductId.initiate(args, options)), signal), (value) => value.length > 0),
    ]);
    rows.push({ name: product.name, code: product.code, markets: [...product.markets].sort().join(", "), batches: product.batches, specification, stp, ard, procedure, bom, packaging, packingStyle, ready: [bom, packaging, packingStyle, procedure, specification, stp, ard].every((value) => value === ReadinessStatus.Configured) });
  }
  if (signal.aborted) throw new Error("Report cancelled");
  return { sheets: [reportSheet("Product readiness", rows, [
    { label: "Product", read: (r) => r.name }, { label: "Code", read: (r) => r.code }, { label: "Markets", read: (r) => r.markets }, { label: "Batches", read: (r) => r.batches },
    { label: "Specification", read: (r) => labels[r.specification] }, { label: "STP", read: (r) => labels[r.stp] }, { label: "ARD", read: (r) => labels[r.ard] }, { label: "Procedure", read: (r) => labels[r.procedure] },
    { label: "BOM", read: (r) => labels[r.bom] }, { label: "Packaging", read: (r) => labels[r.packaging] }, { label: "Packing style", read: (r) => labels[r.packingStyle] }, { label: "Ready", read: (r) => r.ready },
  ])], warnings: rows.some((row) => [row.bom, row.packaging, row.packingStyle, row.procedure, row.specification, row.stp, row.ard].includes(ReadinessStatus.Unavailable)) ? ["Some definition checks failed or were denied. Unavailable checks are not classified as missing and those products are not marked ready."] : [] };
}
