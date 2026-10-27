import type { DomainEntitiesReportsReportHistoryCapabilitiesDto } from "@/shared/api/generated/reports";
import type { ReportFilters } from "../schemas/report-filters";
import { reportBoundary } from "./filter-params";

export function freezeHistoricalFilters(filters: ReportFilters, capability: DomainEntitiesReportsReportHistoryCapabilitiesDto): ReportFilters {
  if (!filters.asOfDate) return { ...filters, asOfInstant: null };
  if (capability.protocolVersion !== 1 || capability.basis !== "RecordedState" || !capability.available) {
    throw new Error("Historical reporting is not installed on this server. Clear the as-of date to generate a current report.");
  }
  const now = Date.parse(capability.serverTime ?? "");
  const coverage = Date.parse(capability.availableFrom ?? "");
  if (!Number.isFinite(now) || !Number.isFinite(coverage)) throw new Error("The server did not provide verified reporting history coverage.");
  const end = Date.parse(reportBoundary(filters.asOfDate, true));
  if (reportBoundary(filters.asOfDate).slice(0, 10) > new Date(now).toISOString().slice(0, 10)) {
    throw new Error("Choose today or an earlier as-of date.");
  }
  const instant = Math.min(end, now);
  if (instant < coverage) throw new Error(`Recorded history begins ${new Date(coverage).toISOString()}. Choose a date within that coverage.`);
  return { ...filters, asOfInstant: new Date(instant).toISOString() };
}

export function historyParams(filters: ReportFilters): { asOfDate?: string } {
  if (!filters.asOfDate) return {};
  if (!filters.asOfInstant) throw new Error("Historical report coverage must be verified before reading report data.");
  return { asOfDate: filters.asOfInstant };
}
