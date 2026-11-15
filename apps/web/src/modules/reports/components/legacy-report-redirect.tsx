import { Navigate, useSearchParams } from "react-router";
import { reportCatalog } from "../lib/catalog";
import { reportLink, type ReportSectionId } from "../lib/report-directory";
import type { ReportKey } from "../lib/report-model";

/**
 * Old report addresses (one page per department, `?report=` to pick a report) now open the matching
 * report or group in the reports hub, so saved links and links from other screens keep working.
 */
export function LegacyReportRedirect({ section, report }: { section?: ReportSectionId; report?: ReportKey }) {
  const [params] = useSearchParams();
  const chosen = report ?? reportCatalog.find((definition) => String(definition.key) === params.get("report"))?.key;
  return <Navigate replace to={chosen !== undefined ? reportLink(chosen) : section ? `/reports?section=${section}` : "/reports"} />;
}
