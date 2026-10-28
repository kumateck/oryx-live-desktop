import { z } from "zod";
import type { ApiDispatch } from "@/shared/api/api-provider";
import { reportsApi } from "@/shared/api/generated/reports";
import { ReportKey, reportsAudit, type ReportOutput } from "../lib/report-model";
import { reportBoundary } from "../lib/filter-params";
import { productionReadinessSheets } from "../lib/production-readiness-sheets";
import { productionReadinessSchema } from "../schemas/production-readiness";
import type { ReportFilters } from "../schemas/report-filters";
import { singleReportFilters } from "../lib/selections";
import { reportRequest } from "./request";

const absent = z.object({ status: z.literal(404) });
export async function loadProductionReadiness(dispatch: ApiDispatch, key: ReportKey, filters: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const selected = singleReportFilters(filters);
  if (!selected.department) throw new Error("Choose a production department.");
  let startDate: string; let endDate: string;
  if (key === ReportKey.DailySchedule) {
    if (!selected.date) throw new Error("Choose a date.");
    startDate = reportBoundary(selected.date).slice(0, 10); endDate = startDate;
  } else {
    if (!selected.month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(selected.month)) throw new Error("Choose a valid month.");
    startDate = `${selected.month}-01`;
    const start = new Date(`${startDate}T00:00:00Z`);
    endDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  }
  const args = { ...reportsAudit, departmentId: selected.department.value, startDate, endDate };
  try {
    const response = await reportRequest(dispatch(reportsApi.endpoints.getProductionReadinessReport.initiate(args,
      { subscribe: false, forceRefetch: true })), signal);
    const parsed = productionReadinessSchema.safeParse(response);
    if (!parsed.success) throw new Error("The server returned an incomplete or inconsistent readiness report. Retry, or contact support if it continues.");
    const report = parsed.data;
    if (report.departmentId !== args.departmentId || report.startDate !== startDate || report.endDate !== endDate)
      throw new Error("The returned report does not match the requested department or dates. Generate the report again.");
    return { sheets: productionReadinessSheets(report), warnings: report.warnings, generatedAt: report.generatedAt,
      readiness: { report, mode: key === ReportKey.ProductReadiness ? "products" : "schedule" } };
  } catch (reason) {
    if (absent.safeParse(reason).success)
      throw new Error("The report or production department is unavailable on this server. Verify the department and that the backend includes the production-readiness endpoint, then retry.");
    throw reason;
  }
}
