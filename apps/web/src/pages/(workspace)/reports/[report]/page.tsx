import { useParams } from "react-router";
import { ReportPage } from "@/modules/reports/components/report-page";

export default function Page() {
  const { report } = useParams();
  return <ReportPage slug={report} />;
}
