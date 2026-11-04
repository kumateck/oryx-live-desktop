import { z } from "zod";
import type { ApiDispatch } from "@/shared/api/api-provider";
import { materialsApi } from "@/shared/api/generated/materials";
import { binaryChoice } from "../lib/filter-params";
import { stockCountOutput } from "../lib/stock-count-sheet";
import { reportsAudit } from "../lib/report-model";
import { singleReportFilters } from "../lib/selections";
import { stockCountReportSchema } from "../schemas/stock-count-report";
import type { ReportFilters } from "../schemas/report-filters";
import { reportRequest } from "./request";
export async function loadStockCountReport(dispatch: ApiDispatch, filters: ReportFilters, expiredOnly: boolean, signal: AbortSignal) {
  const selected = singleReportFilters(filters);
  const materialKind = binaryChoice(selected.materialKind?.value);
  try {
    const response = await reportRequest(dispatch(materialsApi.endpoints.getApiV1MaterialBatchesStockReport.initiate({
      ...reportsAudit, expiredOnly, ...(selected.department ? { departmentId: selected.department.value } : {}),
      ...(materialKind === undefined ? {} : { materialKind }),
    }, { subscribe: false, forceRefetch: true })), signal);
    const parsed = stockCountReportSchema.safeParse(response);
    if (!parsed.success) throw new Error("The server returned incomplete stock records or units. Generate the report again.");
    const report = parsed.data;
    if (report.expiredOnly !== expiredOnly || report.materialKind !== materialKind && !(report.materialKind == null && materialKind === undefined)
      || (selected.department && report.departmentId !== selected.department.value))
      throw new Error("The returned stock report does not match the requested filters.");
    return stockCountOutput(report);
  } catch (error) {
    if (z.object({ status: z.literal(404) }).safeParse(error).success)
      throw new Error("Update the backend to use the current and expired stock count reports.");
    throw error;
  }
}
