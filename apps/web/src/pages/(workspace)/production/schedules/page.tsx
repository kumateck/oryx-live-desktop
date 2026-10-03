import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { SchedulesTable } from "../../../../modules/schedules/components/schedules-table";
import { useSchedulesList } from "../../../../modules/schedules/hooks/use-schedules-list";
import { scheduleCreatePath, scheduleDetailPath, schedulePermissions } from "../../../../modules/schedules/lib/schedule-access";

export default function SchedulesPage() {
  const list = useSchedulesList();
  const navigate = useNavigate();
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PRODUCTION</p><h1 className="text-xl font-semibold">Production schedules</h1></div>
      <PermissionGuard require={schedulePermissions.create}><Button asChild size="sm"><Link to={scheduleCreatePath}>Create</Link></Button></PermissionGuard>
    </div>
    <SchedulesTable rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      onOpen={(schedule) => void navigate(scheduleDetailPath(schedule.id))} />
  </section>;
}
