import type { ApiDispatch } from "@/shared/api/api-provider";
import { reportsApi } from "@/shared/api/generated/reports";
import type { ReportFilters } from "../schemas/report-filters";
import { freezeHistoricalFilters } from "../lib/history";
import { reportsAudit } from "../lib/report-model";
import { reportRequest } from "./request";

export async function prepareReportHistory(dispatch: ApiDispatch, filters: ReportFilters, signal: AbortSignal, forceRefetch = true, requireMaterialIdentity = false) {
  if (!filters.asOfDate && !requireMaterialIdentity) return { ...filters, asOfInstant: null };
  if (!forceRefetch && filters.asOfInstant) return filters;
  try {
    const capability = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportHistoryCapabilities.initiate(reportsAudit, { subscribe: false, forceRefetch })), signal);
    if (requireMaterialIdentity && capability.protocolVersion !== 1) throw new Error("Update the backend report API before filtering material batch details by material. The material filter was not ignored.");
    return freezeHistoricalFilters(filters, capability);
  } catch (error) {
    if (error instanceof Error) throw error;
    if (requireMaterialIdentity) throw new Error("Could not verify material-ID filtering on this backend. Update the report API before generating filtered batch details.");
    throw new Error("Could not verify historical reporting on this server. Retry, or clear the as-of date for a current report.");
  }
}
