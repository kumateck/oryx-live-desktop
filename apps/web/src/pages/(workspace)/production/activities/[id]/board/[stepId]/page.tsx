import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { ActivityPageState, CancelledNotice } from "@/modules/activities/components/activity-page-state";
import { StepDetail } from "@/modules/activities/components/step/step-detail";
import { useActivity } from "@/modules/activities/hooks/use-activity";
import { batchBoardPath } from "@/modules/activities/lib/activity-access";
import { PageHeader } from "@/shared/navigation/page-header";

function StepPage({ id, stepId }: { id: string; stepId: string }) {
  // The run carries step identity and status; its selected detail reads action evidence separately.
  const state = useActivity(id);
  const step = state.activity?.steps.find((item) => item.id === stepId) ?? null;
  const batch = state.activity?.batch;
  return <section className="min-w-0 space-y-4">
    <PageHeader title={state.loading ? null : step ? `Step ${step.order}: ${step.name}` : "Step"}
      crumbs={[{ label: state.loading ? null : batch?.batchNumber ?? batch?.productName ?? "Batch", to: batchBoardPath(id) }, { label: state.loading ? null : step?.name ?? "Step" }]} />
    <ActivityPageState state={state}>{(activity) => step ? <>
      <p className="text-sm text-muted-foreground">{activity.batch.productName}{activity.batch.batchNumber ? ` · batch ${activity.batch.batchNumber}` : ""}{activity.batch.scheduleCode ? ` · ${activity.batch.scheduleCode}` : ""}</p>
      <CancelledNotice activity={activity} />
      <StepDetail activity={activity} step={step} />
    </> : <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">This step is not part of the production run.
      <Button asChild size="sm" variant="outline"><Link to={batchBoardPath(id)}>All steps</Link></Button></div>}</ActivityPageState>
  </section>;
}

export default function ActivityStepPage() {
  const { id, stepId } = useParams();
  return id && stepId ? <StepPage id={id} stepId={stepId} /> : null;
}
