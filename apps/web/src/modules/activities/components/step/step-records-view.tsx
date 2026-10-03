import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/shared/skeleton/skeleton";
import type { StepRecords } from "../../hooks/use-step-records";
import type { StepPolicy } from "../../lib/step-policy";
import { atrStatusLabel, bmrStatusLabel, requisitionStatusLabel } from "../../lib/step-status";

function Record({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0 rounded-md border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm">{children}</dd></div>;
}
const none = <span className="text-muted-foreground">Not raised yet</span>;

/** Where the records behind a step stand: the requisitions, the batch record, the test request. Only what the step involves is shown. */
export function StepRecordsView({ policy, records }: { policy: StepPolicy; records: StepRecords }) {
  const shows = policy.has.stockRequisition || policy.has.bmr || policy.has.atr;
  if (!shows && !records.extraMaterialPending) return null;
  const wait = <Skeleton className="h-5 w-24" />;
  return <div className="space-y-3">
    {shows ? <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {policy.has.stockRequisition ? <>
        <Record label="Raw material requisition">{records.loading ? wait : records.rawRequisition ? <><Badge variant="secondary">{requisitionStatusLabel(records.rawRequisition.status)}</Badge>
          {records.rawRequisition.code ? <span className="text-xs text-muted-foreground">{records.rawRequisition.code}</span> : null}</> : none}</Record>
        <Record label="Packaging requisition">{records.loading ? wait : records.packagingRequisition ? <><Badge variant="secondary">{requisitionStatusLabel(records.packagingRequisition.status)}</Badge>
          {records.packagingRequisition.code ? <span className="text-xs text-muted-foreground">{records.packagingRequisition.code}</span> : null}</> : none}</Record>
      </> : null}
      {policy.has.bmr ? <Record label="BMR and BPR">{records.loading ? wait : records.bmr ? <Badge variant="secondary">{bmrStatusLabel(records.bmr.status)}</Badge> : none}</Record> : null}
      {policy.has.atr ? <Record label="Analytical test request">{records.loading ? wait : records.atr ? <Badge variant="secondary">{atrStatusLabel(records.atr.status)}</Badge> : none}</Record> : null}
    </dl> : null}
    {records.extraMaterialPending ? <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">An extra material request for this batch is waiting for approval. The step cannot be started until it is decided.</p> : null}
  </div>;
}
