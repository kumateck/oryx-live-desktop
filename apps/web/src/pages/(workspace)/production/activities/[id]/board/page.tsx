import { useParams } from "react-router";
import { ActivityPageState, CancelledNotice } from "@/modules/activities/components/activity-page-state";
import { ActivityLog } from "@/modules/activities/components/batch/activity-log";
import { BatchSummary } from "@/modules/activities/components/batch/batch-summary";
import { RunProgress } from "@/modules/activities/components/batch/run-progress";
import { StepList } from "@/modules/activities/components/batch/step-list";
import { useActivity } from "@/modules/activities/hooks/use-activity";
import { PageHeader } from "@/shared/navigation/page-header";

function BatchBoard({ id }: { id: string }) {
  const state = useActivity(id);
  const title = state.activity ? `${state.activity.batch.productName}${state.activity.batch.batchNumber ? ` · ${state.activity.batch.batchNumber}` : ""}` : null;
  return <section className="min-w-0 space-y-4">
    <PageHeader title={state.loading ? null : title ?? "Production run"} crumbs={[{ label: state.loading ? null : state.activity?.batch.batchNumber ?? "Batch" }]} />
    <ActivityPageState state={state}>{(activity, progress) => <>
      <CancelledNotice activity={activity} />
      <BatchSummary activity={activity} finished={progress.finished} />
      <section className="min-w-0 space-y-2 rounded-lg border bg-card p-4">
        <RunProgress done={progress.done} total={progress.total} percent={progress.percent} />
        <p className="text-sm text-muted-foreground">{progress.finished ? "Every step is completed." : progress.current ? `Now at step ${progress.current.order}: ${progress.current.name}.` : "No step is in progress."}</p>
      </section>
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <StepList activity={activity} />
        <ActivityLog logs={activity.logs} />
      </div>
    </>}</ActivityPageState>
  </section>;
}

export default function BatchBoardPage() {
  const { id } = useParams();
  return id ? <BatchBoard id={id} /> : null;
}
