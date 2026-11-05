import { useParams } from "react-router";
import { ActivityPageState, CancelledNotice } from "@/modules/activities/components/activity-page-state";
import { ActivityLog } from "@/modules/activities/components/batch/activity-log";
import { BatchSummary } from "@/modules/activities/components/batch/batch-summary";
import { RepairMenu } from "@/modules/activities/components/batch/repair-menu";
import { ProductionUnstart } from "@/modules/activities/components/batch/production-unstart";
import { IssuedMaterialRepairMenu } from "@/modules/activities/components/batch/issued-material-repair-menu";
import { ReservationRepair } from "@/modules/activities/components/batch/reservation-repair";
import { RunProgress } from "@/modules/activities/components/batch/run-progress";
import { StepList } from "@/modules/activities/components/batch/step-list";
import { useActivity } from "@/modules/activities/hooks/use-activity";
import { PageHeader } from "@/shared/navigation/page-header";

function BatchBoard({ id }: { id: string }) {
  const state = useActivity(id);
  const title = state.activity ? `${state.activity.batch.productName}${state.activity.batch.batchNumber ? ` · ${state.activity.batch.batchNumber}` : ""}` : null;
  return <section className="min-w-0 space-y-4">
    {/* A run that has finished or was cancelled has nothing left to repair. */}
    <PageHeader title={state.loading ? null : title ?? "Production run"} crumbs={[{ label: state.loading ? null : state.activity?.batch.batchNumber ?? "Batch" }]}
      actions={state.activity && title && !state.activity.batch.cancelled && state.activity.status !== 2 && state.activity.status !== 4
        ? <><RepairMenu activityId={state.activity.id} batchLabel={title} />
          {state.activity.batch.id ? <IssuedMaterialRepairMenu batchId={state.activity.batch.id} /> : null}
          {state.activity.batch.id ? <ReservationRepair batchId={state.activity.batch.id} /> : null}
          <ProductionUnstart activityId={state.activity.id} /></> : undefined} />
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
