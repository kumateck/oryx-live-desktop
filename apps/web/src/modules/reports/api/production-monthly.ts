import type { ApiDispatch } from "@/shared/api/api-provider";
import { reportBoundary } from "../lib/filter-params";
import { batchValueSheet, productionMonthlySheet, scheduleSummarySheet, stockIssuedSheet } from "../lib/production-sheets";
import { ReportKey, reportsAudit, type ReportOutput } from "../lib/report-model";
import { singleReportFilters } from "../lib/selections";
import type { ReportFilters } from "../schemas/report-filters";
import { reportContractApi } from "./contract-adapters";
import { reportRequest } from "./request";

const options = { subscribe: false, forceRefetch: true };
const monthName = (year: number, month: number) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(year, month - 1, 1));

/** The production monthly report, the schedule summary and the batch value report share one month of batches. */
export async function loadProductionMonth(dispatch: ApiDispatch, key: ReportKey, filters: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const selected = singleReportFilters(filters);
  const match = /^(\d{4})-(\d{2})$/.exec(selected.month ?? "");
  if (!match) throw new Error("Choose a month.");
  const year = Number(match[1]); const month = Number(match[2]);
  const report = await reportRequest(dispatch(reportContractApi.endpoints.readProductionMonthly.initiate({ ...reportsAudit, year, month,
    ...(selected.department ? { departmentId: selected.department.value } : {}) }, options)), signal);
  if (report.year !== year || report.month !== month || (selected.department && report.departmentId !== selected.department.value))
    throw new Error("The returned report does not match the requested month or department.");
  const scope = `${monthName(year, month)} · ${report.departmentName ?? "All production departments"}`;
  const notPacked = report.rows.filter((row) => !row.packed).length;
  const warnings = [`${report.rows.length} batches scheduled to start in ${scope}.`,
    ...(notPacked ? [`${notPacked} batches have no final packing yet; their yield, retained samples and actual quantity are blank, not zero.`] : []),
    "Expected yield is the packing style's expected yield for the batch size (half batches count half)."];
  if (key === ReportKey.ProductionMonthly) return { title: `Production monthly report · ${scope}`, sheets: [productionMonthlySheet(report.rows)], generatedAt: report.generatedAt, warnings };
  if (key === ReportKey.ScheduleSummary) return { title: `Production schedule summary · ${scope}`, sheets: [scheduleSummarySheet(report.rows)], generatedAt: report.generatedAt,
    warnings: [...warnings, "Actual yield adds the batches packed so far."] };
  if (key === ReportKey.BatchValue) return { title: `Batch value report · ${scope}`, sheets: [batchValueSheet(report.rows)], generatedAt: report.generatedAt,
    warnings: [...warnings, "Unit price is the list price in force when the schedule started. A batch with no price by then shows none.",
      ...(report.rows.some((row) => row.unitPrice === null) ? ["Some products had no price recorded by then; missing prices are not zero."] : [])] };
  throw new Error("Invalid production report.");
}

export async function loadStockIssued(dispatch: ApiDispatch, filters: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const selected = singleReportFilters(filters);
  if (Boolean(selected.startDate) !== Boolean(selected.endDate) || (selected.startDate && selected.endDate && selected.startDate > selected.endDate))
    throw new Error("Choose both issue dates, or neither.");
  const dates = selected.startDate && selected.endDate
    ? { startDate: reportBoundary(selected.startDate).slice(0, 10), endDate: reportBoundary(selected.endDate).slice(0, 10) } : {};
  const batchNumber = selected.batchNumber?.trim() ?? "";
  const report = await reportRequest(dispatch(reportContractApi.endpoints.readStockIssued.initiate({ ...reportsAudit, ...dates,
    ...(selected.department ? { departmentId: selected.department.value } : {}), ...(selected.product ? { productId: selected.product.value } : {}),
    ...(batchNumber ? { batchNumber } : {}) }, options)), signal);
  if ((selected.product && report.productId !== selected.product.value) || (selected.department && report.departmentId !== selected.department.value))
    throw new Error("The returned report does not match the requested product or department.");
  return { sheets: [stockIssuedSheet(report)], generatedAt: report.generatedAt,
    warnings: [`${report.rows.length} issue lines · ${report.departmentName ?? "All production departments"}.`,
      "Requisition lines show each material batch taken from the store. Extra packing is recorded per material, without the material batch."] };
}
