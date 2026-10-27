import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { ActivityPageState, CancelledNotice } from "@/modules/activities/components/activity-page-state";
import { FinalPackingForm } from "@/modules/activities/components/final-packing/final-packing-form";
import { RecordedPackingView } from "@/modules/activities/components/final-packing/recorded-packing";
import { useActivity } from "@/modules/activities/hooks/use-activity";
import { useFinalPacking } from "@/modules/activities/hooks/use-final-packing";
import { batchBoardPath } from "@/modules/activities/lib/activity-access";
import { stepPolicy } from "@/modules/activities/lib/step-policy";
import type { Activity } from "@/modules/activities/schemas/activity-schema";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";

function Packing({ activity, batchId }: { activity: Activity; batchId: string }) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const state = useFinalPacking(batchId, activity);
  useEffect(() => { if (state.completed) void navigate(batchBoardPath(activity.id)); }, [state.completed, activity.id, navigate]);
  const step = activity.steps.find((item) => item.id === activity.currentStepId);
  // The same rule as the button that leads here, so the address alone does not open the form.
  const policy = step ? stepPolicy({ step, currentStepId: activity.currentStepId, cancelled: activity.batch.cancelled, userId: user?.id ?? null, extraMaterialPending: false, extraMaterialOpen: false, atrExists: false }) : null;
  const processing = state.saving || state.pendingReturn || state.uncertain || state.completed;
  if (state.loading && !processing) return <FormPageSkeleton label="Loading final packing" sections={[6, 4]} />;
  if (state.error && !processing) return <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">{state.error}<Button type="button" size="sm" variant="outline" onClick={state.retry}>Retry</Button></div>;
  if (state.recorded && !processing) return <RecordedPackingView recorded={state.recorded} />;
  if (!processing && (!step || !policy?.canFinalPack)) return <div role="alert" className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 p-3 text-sm">
    {policy?.blocked ?? "Final packing can be recorded only while the batch is at its final packing step and that step is in progress."}
    <Button asChild size="sm" variant="outline"><Link to={batchBoardPath(activity.id)}>Back to the batch</Link></Button></div>;
  return <FinalPackingForm activity={activity} stepId={step?.id ?? ""} state={state} />;
}

function FinalPacking({ id }: { id: string }) {
  const state = useActivity(id);
  const batch = state.activity?.batch;
  return <section className="min-w-0 space-y-4">
    <PageHeader title={state.loading ? null : "Final packing"} crumbs={[{ label: state.loading ? null : batch?.batchNumber ?? batch?.productName ?? "Batch", to: batchBoardPath(id) }, { label: "Final packing" }]} />
    <ActivityPageState state={state}>{(activity) => <>
      <p className="text-sm text-muted-foreground">{activity.batch.productName}{activity.batch.batchNumber ? ` · batch ${activity.batch.batchNumber}` : ""}{activity.batch.scheduleCode ? ` · ${activity.batch.scheduleCode}` : ""}</p>
      <CancelledNotice activity={activity} />
      {activity.batch.id ? <Packing activity={activity} batchId={activity.batch.id} /> : <p role="alert" className="text-sm">The batch could not be identified.</p>}
    </>}</ActivityPageState>
  </section>;
}

export default function FinalPackingPage() {
  const { id } = useParams();
  return id ? <FinalPacking id={id} /> : null;
}
