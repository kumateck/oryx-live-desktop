import { Button } from "@/components/ui/button";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useStepActionRecords } from "../../../hooks/use-step-action-records";
import { stepStatus } from "../../../lib/step-status";
import type { Activity, ActivityStep } from "../../../schemas/activity-schema";
import type { StepActionRecordsData } from "../../../schemas/step-records-schema";
import { AnalysisRecord } from "./analysis-record";
import { ExtraMaterialRecord } from "./extra-material-record";
import { ManufacturingRecord } from "./manufacturing-record";
import { PackingRecord } from "./packing-record";
import { RequisitionRecord } from "./requisition-record";
import { ReturnRecord } from "./return-record";
import { TransferRecord } from "./transfer-record";

export function StepActionRecords({ activity, step }: { activity: Activity; step: ActivityStep }) {
  const state = useStepActionRecords({ activityId: activity.id, stepId: step.id,
    batchId: activity.batch.id, completed: step.status === stepStatus.completed || activity.batch.cancelled });
  if (state.kind === "denied") return null;
  const count = state.kind === "ready" ? recordCount(state.data) : null;
  const heading = <h2 className="text-sm font-semibold">Recorded actions{count ? <span className="font-normal text-muted-foreground"> ({count})</span> : null}</h2>;
  if (state.kind === "loading") return <section aria-label="Loading recorded actions" aria-busy="true" className="min-w-0 space-y-4 rounded-lg border bg-card p-4">
    {heading}<Skeleton className="h-5 w-40" /><div className="grid grid-cols-2 gap-4">{[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-10" />)}</div>
  </section>;
  if (state.kind === "error") return <section aria-label="Recorded actions" className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    {heading}<div role="alert" className="space-y-2 text-sm"><p>Recorded actions could not be loaded.</p><p className="break-words text-muted-foreground">{state.message}</p>
      <Button type="button" size="sm" variant="outline" onClick={state.retry}>Retry recorded actions</Button></div>
  </section>;
  return <section aria-label="Recorded actions" aria-busy={state.refreshing} className="min-w-0 space-y-4 rounded-lg border bg-card p-4">
    {heading}<StepRecordsList records={state.data} unit={activity.batch.unit} />
  </section>;
}

/** The records themselves, kept apart from loading so they can be previewed with sample data. */
export function StepRecordsList({ records, unit }: { records: StepActionRecordsData; unit: string | null }) {
  const batchScoped = (id: string) => records.batchScopedRecordIds.includes(id);
  return recordCount(records) === 0 ? <p className="text-sm text-muted-foreground">No action records are linked to this step. Manual start and completion are shown in Timing and the batch activity log.</p>
      : <div className="min-w-0 space-y-3">
        {records.analyticalTests.map((record) => <AnalysisRecord key={record.request.id} record={record} />)}
        {records.batchRecords.map((record) => <ManufacturingRecord key={record.id} record={record} batchScoped={batchScoped(record.id)} unit={unit} />)}
        {records.requisitions.map((record) => <RequisitionRecord key={record.id} record={record} batchScoped={batchScoped(record.id)} />)}
        {records.extraMaterialRequests.map((record) => <ExtraMaterialRecord key={record.id} record={record} />)}
        {records.finalPackings.map((record) => <PackingRecord key={record.id} record={record} batchScoped={batchScoped(record.id)} />)}
        {records.transfers.map((record) => <TransferRecord key={record.id} record={record} batchScoped={batchScoped(record.id)} />)}
        {records.materialReturns.map((record) => <ReturnRecord key={record.id} record={record} />)}
      </div>;
}

const recordCount = (records: StepActionRecordsData) => records.analyticalTests.length + records.batchRecords.length + records.requisitions.length
  + records.extraMaterialRequests.length + records.finalPackings.length + records.transfers.length + records.materialReturns.length;
