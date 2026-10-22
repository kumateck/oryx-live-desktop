import { useParams } from "react-router";
import { ReportWorkbench } from "@/modules/reports/components/report-workbench";
import { ReportKey } from "@/modules/reports/lib/report-model";
const allowedKeys = [ReportKey.DailyAttendance];
export default function Page() { const { departmentName } = useParams(); return departmentName ? <ReportWorkbench key={departmentName} group="hr" initialKey={ReportKey.DailyAttendance} allowedKeys={allowedKeys} requirement="CanViewAttendanceReportUpload" initialFilters={{ department: { value: departmentName, label: departmentName } }} /> : <p role="alert">Choose a department.</p>; }
