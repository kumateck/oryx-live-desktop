import { useParams } from "react-router";
import { PageHeader } from "@/shared/navigation/page-header";
import { AddProductsForm } from "../../../../../../../modules/schedules/components/products/add-products-form";
import { SchedulePageState } from "../../../../../../../modules/schedules/components/schedule-page-state";
import { ScheduleSummary } from "../../../../../../../modules/schedules/components/schedule-summary";
import { useSchedule } from "../../../../../../../modules/schedules/hooks/use-schedule";
import { scheduleDetailPath } from "../../../../../../../modules/schedules/lib/schedule-access";

function AddProducts({ id }: { id: string }) {
  const state = useSchedule(id);
  const code = state.schedule?.code ?? null;
  return <section className="min-w-0 space-y-4">
    <PageHeader title={state.loading ? null : `Add products to ${code ?? "schedule"}`} crumbs={[{ label: state.loading ? null : code ?? "Schedule", to: scheduleDetailPath(id) }, { label: "Add products" }]} />
    <SchedulePageState state={state} changing="Products cannot be added">{(schedule, phase) => <>
      <ScheduleSummary schedule={schedule} phase={phase} />
      <AddProductsForm scheduleId={schedule.id} />
    </>}</SchedulePageState>
  </section>;
}

export default function AddScheduleProductsPage() {
  const { id } = useParams();
  return id ? <AddProducts id={id} /> : null;
}
