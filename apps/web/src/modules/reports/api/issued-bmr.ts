import { z } from "zod";
import type { ApiDispatch } from "@/shared/api/api-provider";
import { reportsApi } from "@/shared/api/generated/reports";
import { reportBoundary } from "../lib/filter-params";
import { issuedBmrSheets } from "../lib/issued-bmr-sheets";
import { reportsAudit, type ReportOutput } from "../lib/report-model";
import { singleReportFilters } from "../lib/selections";
import { issuedBmrReportSchema } from "../schemas/issued-bmr";
import type { ReportFilters } from "../schemas/report-filters";
import { reportRequest } from "./request";
import { reportContractApi } from "./contract-adapters";

export async function loadIssuedBmrReport(dispatch: ApiDispatch, filters: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const selected = singleReportFilters(filters);
  if (!selected.startDate || !selected.endDate || selected.startDate > selected.endDate)
    throw new Error("Choose a valid issue-date range.");
  const startDate = reportBoundary(selected.startDate).slice(0, 10);
  const endDate = reportBoundary(selected.endDate).slice(0, 10);
  try {
    const response = await reportRequest(dispatch(reportsApi.endpoints.getIssuedBmrReport.initiate({ ...reportsAudit,
      startDate, endDate, ...(selected.department ? { departmentId: selected.department.value } : {}),
    }, { subscribe: false, forceRefetch: true })), signal);
    const parsed = issuedBmrReportSchema.safeParse(response);
    if (!parsed.success) throw new Error("The server returned an incomplete or inconsistent BMR issued report. Generate it again.");
    const report = parsed.data;
    if (report.startDate !== startDate || report.endDate !== endDate
      || (selected.department && report.departmentId !== selected.department.value))
      throw new Error("The returned BMR report does not match the requested dates or department.");
    return { sheets: issuedBmrSheets(report), generatedAt: report.generatedAt,
      warnings: [`${report.totalIssued} BMRs issued · ${report.departmentName ?? "All authorized departments"}.`,
        "Dates use the recorded BMR issue time (UTC). Each BMR is included once using its currently recorded issue date.",
        "Product names, codes, departments and unit labels reflect current linked records. Issued history includes archived or cancelled batches."] };
  } catch (error) {
    if (z.object({ status: z.literal(404) }).safeParse(error).success)
      throw new Error("The BMR report or selected department is unavailable. Verify the department and that the backend includes the BMR issued report endpoint.");
    throw error;
  }
}

export async function loadIssuedBmrByProductReport(dispatch: ApiDispatch, filters: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const selected = singleReportFilters(filters);
  if (!selected.product) throw new Error("Choose a product.");
  if (Boolean(selected.startDate) !== Boolean(selected.endDate) || (selected.startDate && selected.endDate && selected.startDate > selected.endDate))
    throw new Error("Choose both issue dates, or neither to list every batch issued so far.");
  const dates = selected.startDate && selected.endDate
    ? { startDate: reportBoundary(selected.startDate).slice(0, 10), endDate: reportBoundary(selected.endDate).slice(0, 10) } : {};
  try {
    const report = await reportRequest(dispatch(reportContractApi.endpoints.readIssuedBmrByProduct.initiate({ ...reportsAudit,
      productId: selected.product.value, ...dates, ...(selected.department ? { departmentId: selected.department.value } : {}),
    }, { subscribe: false, forceRefetch: true })), signal);
    if (report.productId !== selected.product.value || (report.startDate ?? undefined) !== dates.startDate || (report.endDate ?? undefined) !== dates.endDate)
      throw new Error("The returned BMR report does not match the requested product or dates.");
    const product = [report.productCode, report.productName].filter(Boolean).join(" · ") || selected.product.label;
    return { title: `BMR issued · ${product}`, sheets: issuedBmrSheets(report), generatedAt: report.generatedAt,
      warnings: [`${report.totalIssued} BMRs issued for ${product}${dates.startDate ? "" : " so far"}.`,
        "Dates use the recorded BMR issue time (UTC). Issued history includes completed, archived and cancelled batches."] };
  } catch (error) {
    if (z.object({ status: z.literal(404) }).safeParse(error).success)
      throw new Error("The product was not found in your department, or the backend does not yet include the BMR issued by product report.");
    throw error;
  }
}
