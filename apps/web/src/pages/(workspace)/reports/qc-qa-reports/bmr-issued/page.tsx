import { ReportWorkbench } from "@/modules/reports/components/report-workbench";
import { ReportKey } from "@/modules/reports/lib/report-model";

export default function Page() { return <ReportWorkbench group="quality" initialKey={ReportKey.IssuedBmr} />; }
