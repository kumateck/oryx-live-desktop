import { useParams } from "react-router";
import { PageHeader } from "@/shared/navigation/page-header";
import { RemoveProductsPanel } from "../../../../../../../modules/schedules/components/products/remove-products-panel";
import { SchedulePageState } from "../../../../../../../modules/schedules/components/schedule-page-state";
import { ScheduleSummary } from "../../../../../../../modules/schedules/components/schedule-summary";
import { useSchedule } from "../../../../../../../modules/schedules/hooks/use-schedule";
import { scheduleDetailPath } from "../../../../../../../modules/schedules/lib/schedule-access";

function RemoveProducts({ id }: { id: string }) {
  const state = useSchedule(id);
  const code = state.schedule?.code ?? null;
  return <section className="min-w-0 space-y-4">
    <PageHeader title={state.loading ? null : `Remove products from ${code ?? "schedule"}`} crumbs={[{ label: state.loading ? null : code ?? "Schedule", to: scheduleDetailPath(id) }, { label: "Remove products" }]} />
    <SchedulePageState state={state} changing="Products cannot be removed">{(schedule, phase) => <>
      <ScheduleSummary schedule={schedule} phase={phase} showProducts={false} />
      <RemoveProductsPanel schedule={schedule} />
    </>}</SchedulePageState>
  </section>;
}

export default function RemoveScheduleProductsPage() {
  const { id } = useParams();
  return id ? <RemoveProducts id={id} /> : null;
}
