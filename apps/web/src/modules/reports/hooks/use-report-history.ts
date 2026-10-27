import { useGetApiV1ReportHistoryCapabilitiesQuery } from "@/shared/api/generated/reports";
import { reportsAudit } from "../lib/report-model";

export function useReportHistory(enabled: boolean) {
  const query = useGetApiV1ReportHistoryCapabilitiesQuery(reportsAudit, { skip: !enabled, refetchOnMountOrArgChange: true });
  const supported = query.data?.protocolVersion === 1 && query.data.basis === "RecordedState" && query.data.available === true;
  return {
    disabled: query.isFetching || !supported,
    message: query.isFetching ? "Checking reporting history…" : supported
      ? `Recorded history starts ${new Date(query.data?.availableFrom ?? "").toLocaleString()}. Leave the date empty for current records; a selected date uses the end of that UTC day, capped at server time.`
      : "Historical reports require the companion backend history update and migration. Current reports remain available. Retry by reopening filters after the server is updated.",
  };
}
