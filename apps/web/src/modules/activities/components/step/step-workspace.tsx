import { useEffect, useRef, useState } from "react";
import { Check, FlaskConical, PackageCheck, PackagePlus, Play, RotateCcw, Send, Truck } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog } from "@/shared/actions";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useStepCommands } from "../../hooks/use-step-commands";
import { useStepRecords } from "../../hooks/use-step-records";
import { extraMaterialPath, finalPackingPath } from "../../lib/activity-access";
import { configuredTestStage } from "../../lib/atr";
import { stepPolicy } from "../../lib/step-policy";
import { stepActionLabel, stepStatus } from "../../lib/step-status";
import type { Activity, ActivityStep } from "../../schemas/activity-schema";
import { AtrDialog } from "./atr-dialog";
import { FinishedGoodsDialog } from "./finished-goods-dialog";
import { ReasonDialog } from "./reason-dialog";
import { StepRecordsView } from "./step-records-view";
import { StockRequisitionDialog } from "./stock-requisition-dialog";

type Open = "complete" | "return" | "stock" | "atr" | "goods" | null;

/**
 * Everything that can be done on a step: start it, finish it, and the records its instructions
 * call for. Used on the batch board for the current step and on the step's own page.
 */
export function StepWorkspace({ activity, step }: { activity: Activity; step: ActivityStep }) {
  const user = useCurrentUser();
  const batchId = activity.batch.id;
  const active = step.id === activity.currentStepId && !activity.batch.cancelled && step.status !== stepStatus.completed;
  const needs = { stockRequisition: step.team.some((member) => member.action === 1), bmr: step.team.some((member) => member.action === 0), atr: step.team.some((member) => member.action === 7) };
  const records = useStepRecords({ batchId, stepId: step.id, enabled: active, needs });
  const policy = stepPolicy({ step, currentStepId: activity.currentStepId, cancelled: activity.batch.cancelled, userId: user?.id ?? null,
    extraMaterialPending: records.extraMaterialPending, extraMaterialOpen: records.extraMaterialOpen, atrExists: Boolean(records.atr) });
  const commands = useStepCommands(step.id, batchId);
  const [open, setOpen] = useState<Open>(null);
  const autoStartAttempted = useRef<string | null>(null);
  const busy = commands.busy !== null;
  const running = step.status === stepStatus.inProgress;
  const batchLabel = `${activity.batch.productName}${activity.batch.batchNumber ? `, batch ${activity.batch.batchNumber}` : ""}`;
  const hasRequisition = Boolean(records.rawRequisition || records.packagingRequisition);

  useEffect(() => {
    if (!policy.shouldAutoStart || !records.ready || busy || autoStartAttempted.current === step.id) return;
    autoStartAttempted.current = step.id;
    void commands.start();
  }, [policy.shouldAutoStart, records.ready, busy, step.id, commands.start]);

  if (!policy.open) return policy.blocked && !policy.completed ? <p className="text-sm text-muted-foreground">{policy.blocked}</p> : null;

  return <div className="min-w-0 space-y-3">
    {policy.blocked ? <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm">{policy.blocked}</p> : null}
    {running && policy.waitsFor !== null ? <p className="text-sm text-muted-foreground">This step finishes by itself when its {stepActionLabel(policy.waitsFor).toLowerCase()} is done.</p> : null}

    <StepRecordsView policy={policy} records={records} />
    {records.error ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
      <span>This step's records could not be verified. Start and completion remain unavailable.</span>
      <Button type="button" size="sm" variant="outline" onClick={records.retry}>Retry step check</Button>
    </div> : null}

    <div className="flex flex-wrap gap-2">
      {policy.canStart ? <Button type="button" size="sm" disabled={busy || !records.ready} onClick={() => void commands.start()}>{commands.busy === "start" ? <><Spinner />Starting…</> : <><Play />Start step</>}</Button> : null}
      {policy.canManuallyComplete ? <Button type="button" size="sm" disabled={busy || !records.ready || !policy.canComplete} onClick={() => setOpen("complete")}>{commands.busy === "complete" ? <><Spinner />Completing…</> : <><Check />Complete step</>}</Button> : null}
      {policy.canRequestStock && !records.loading && !hasRequisition && batchId ? <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpen("stock")}><Send />Request stock</Button> : null}
      {policy.canRequestAtr && !records.loading && batchId ? <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpen("atr")}><FlaskConical />Request analysis</Button> : null}
      {policy.canRequestExtraMaterial ? <Button asChild size="sm" variant="outline"><Link to={extraMaterialPath(activity.id)}><PackagePlus />Request extra material</Link></Button> : null}
      {policy.canFinalPack ? <Button asChild size="sm"><Link to={finalPackingPath(activity.id)}><PackageCheck />Record final packing</Link></Button> : null}
      {policy.canTransferFinishedGoods && batchId ? <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpen("goods")}><Truck />Transfer finished goods</Button> : null}
      {policy.canFullReturn ? <Button type="button" size="sm" variant="outline" className="text-destructive" disabled={busy} onClick={() => setOpen("return")}><RotateCcw />Full return</Button> : null}
    </div>
    {commands.message ? <p role="alert" className="text-sm text-destructive">{commands.message}</p> : null}

    {open === "complete" ? <ConfirmActionDialog require={{ kind: "all", permissions: ["CanViewPlannedProducts"], departmentType: 0 }} title={`Complete "${step.name}"?`} description={`The batch moves on to its next step. A completed step cannot be reopened. ${batchLabel}.`}
      confirmLabel="Complete step" busyLabel="Completing…" destructive={false} onClose={() => setOpen(null)}
      onConfirm={async () => !records.ready || !policy.canComplete ? "This step cannot be completed until its records are verified and all extra material is issued." : (await commands.complete()) ? null : "The step was not completed. The reason is shown on the page."} /> : null}
    {open === "return" ? <ReasonDialog title="Return all materials?" description={`Every material issued to ${batchLabel} goes back to the warehouse and the batch's production is cancelled. This cannot be undone.`}
      confirmLabel="Return and cancel" busyLabel="Returning…" onClose={() => setOpen(null)} onConfirm={async (reason) => policy.canFullReturn ? commands.fullReturn(reason) : "Materials can no longer be returned from this step."} /> : null}
    {open === "atr" && batchId ? <AtrDialog stage={configuredTestStage(step)} record={records.bmr} batchId={batchId} stepId={step.id} productName={activity.batch.productName}
      // Raising the request is what begins the step, so the same action records the start.
      onRaised={async () => { if (step.status === stepStatus.new) await commands.start(); }} onClose={() => setOpen(null)} /> : null}
    {open === "goods" && batchId ? <FinishedGoodsDialog batchId={batchId} stepId={step.id} productName={activity.batch.productName} onClose={() => setOpen(null)} /> : null}
    {open === "stock" && batchId ? <StockRequisitionDialog batchId={batchId} stepId={step.id} batchLabel={batchLabel} onClose={() => setOpen(null)} /> : null}
  </div>;
}
