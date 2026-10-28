import { ReportWorkbench } from "@/modules/reports/components/report-workbench";
import { ReportKey } from "@/modules/reports/lib/report-model";
const allowedKeys = [ReportKey.DepartmentAttendance, ReportKey.DailyAttendance];
export default function Page() { return <ReportWorkbench group="hr" initialKey={ReportKey.DepartmentAttendance} allowedKeys={allowedKeys} requirement="CanViewAttendanceReportUpload" />; }
