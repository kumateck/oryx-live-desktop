import { LegacyReportRedirect } from "@/modules/reports/components/legacy-report-redirect";
import { ReportKey } from "@/modules/reports/lib/report-model";

export default function Page() { return <LegacyReportRedirect report={ReportKey.LeaveOverview} />; }
