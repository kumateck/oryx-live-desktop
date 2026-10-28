import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { ActivityPageState, CancelledNotice } from "@/modules/activities/components/activity-page-state";
import { EarlierRequests } from "@/modules/activities/components/extra-material/earlier-requests";
import { ExtraMaterialForm } from "@/modules/activities/components/extra-material/extra-material-form";
import { useActivity } from "@/modules/activities/hooks/use-activity";
import { batchBoardPath } from "@/modules/activities/lib/activity-access";
import { stepPolicy } from "@/modules/activities/lib/step-policy";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { PageHeader } from "@/shared/navigation/page-header";

function ExtraMaterial({ id }: { id: string }) {
  const state = useActivity(id);
  const user = useCurrentUser();
  const batch = state.activity?.batch;
  return <section className="min-w-0 space-y-4">
    <PageHeader title={state.loading ? null : "Request extra material"} crumbs={[{ label: state.loading ? null : batch?.batchNumber ?? batch?.productName ?? "Batch", to: batchBoardPath(id) }, { label: "Extra material" }]} />
    <ActivityPageState state={state}>{(activity) => {
      const step = activity.steps.find((item) => item.id === activity.currentStepId);
      // The same rule as the button that leads here, so the address alone does not open the form.
      const policy = step ? stepPolicy({ step, currentStepId: activity.currentStepId, cancelled: activity.batch.cancelled, userId: user?.id ?? null, extraMaterialPending: false, extraMaterialOpen: false, atrExists: false }) : null;
      const batchId = activity.batch.id;
      return <>
        <p className="text-sm text-muted-foreground">{activity.batch.productName}{activity.batch.batchNumber ? ` · batch ${activity.batch.batchNumber}` : ""}{step ? ` · step ${step.order}: ${step.name}` : ""}</p>
        <CancelledNotice activity={activity} />
        {batchId ? <EarlierRequests batchId={batchId} /> : null}
        {policy?.canRequestExtraMaterial && batchId ? <ExtraMaterialForm activityId={id} batchId={batchId} />
          : <div role="alert" className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 p-3 text-sm">
            {policy?.blocked ?? "Extra material can be requested only while the batch is at a step that allows it and that step is in progress."}
            <Button asChild size="sm" variant="outline"><Link to={batchBoardPath(id)}>Back to the batch</Link></Button></div>}
      </>;
    }}</ActivityPageState>
  </section>;
}

export default function ExtraMaterialPage() {
  const { id } = useParams();
  return id ? <ExtraMaterial id={id} /> : null;
}
