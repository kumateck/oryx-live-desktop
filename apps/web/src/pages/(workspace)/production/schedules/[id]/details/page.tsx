import { useParams } from "react-router";
import { DropdownButton } from "@/shared/actions";
import { PageHeader } from "@/shared/navigation/page-header";
import { ScheduleDetail } from "../../../../../../modules/schedules/components/detail/schedule-detail";
import { SchedulePageState } from "../../../../../../modules/schedules/components/schedule-page-state";
import { useSchedule } from "../../../../../../modules/schedules/hooks/use-schedule";
import { scheduleActions } from "../../../../../../modules/schedules/lib/schedule-actions";

function ScheduleDetails({ id }: { id: string }) {
  const state = useSchedule(id);
  const code = state.schedule?.code ?? null;
  return <section className="min-w-0 space-y-4">
    <PageHeader title={state.loading ? null : code ?? "Production schedule"} crumbs={[{ label: state.loading ? null : code ?? "Schedule" }]}
      actions={state.schedule ? <DropdownButton label="Manage schedule" items={scheduleActions(id, state.phase === "ended", false)} /> : undefined} />
    <SchedulePageState state={state}>{(schedule, phase) => <ScheduleDetail schedule={schedule} phase={phase} />}</SchedulePageState>
  </section>;
}

export default function ScheduleDetailsPage() {
  const { id } = useParams();
  return id ? <ScheduleDetails id={id} /> : null;
}
