import { useMemo, useState } from "react";
import { FileCheck, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog } from "@/shared/actions";
import { identityApi } from "@/shared/api/generated/identity";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { apiErrorCode, apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { routinesApi } from "../api/routines-api";
import {
  analysisLabel, audit, certificatePath, environmentalReady, originLabel, RoutineStatus, RoutineType, routinePermissions, routinesPath, sampleReady, statusLabel, trackPath, trackState, typeLabel,
  type Execution,
} from "../lib/routines";

const sampleSchema = z.object({ identity: z.string({ message: "Enter it." }).trim().min(1, "Enter it."), collectedAt: z.date({ message: "Choose the date." }) });
type SampleValues = z.infer<typeof sampleSchema>;

/** Adds a water sample point or a monitored room; the server creates its analysis tracks from the verified routine ARDs. */
function SampleDialog({ run, onClose }: { run: Execution; onClose: () => void }) {
  const water = run.type === RoutineType.Water;
  const permission = usePermissionAction(routinePermissions.create);
  const [add] = routinesApi.useAddSampleMutation();
  const form = useForm<SampleValues>({ resolver: zodResolver(sampleSchema), defaultValues: { identity: "", collectedAt: new Date() } });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fields: WizardField<SampleValues>[] = [
    { type: InputTypes.TEXT, name: "identity", label: water ? "Sampling point" : "Room or area", required: true },
    { type: InputTypes.DATE, name: "collectedAt", label: water ? "Collected on" : "Observed on", required: true, fromYear: 2020, toYear: 2100 },
  ];
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setBusy(true);
    const result = await add({ routineId: run.id, ...(water ? { samplingPoint: values.identity } : { areaName: values.identity }), collectedAt: values.collectedAt.toISOString() });
    setBusy(false);
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(water ? "Sample added" : "Area added");
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Add {water ? "a water sample" : "a monitored area"}</DialogTitle>
        <DialogDescription>Each needs a verified routine ARD for every analysis it gets; the worksheets are created with it.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4"><FormWizard form={form} fields={fields} />{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Adding…</> : "Add"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

/** A routine: its facts, then each sample or area with its analysis worksheets and certificate. */
export function RoutineDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = routinesApi.useGetRoutineQuery(id ?? "", { skip: !id });
  const people = identityApi.useGetApiV1UserByPermissionQuery({ ...audit, permissionKey: [routinePermissions.perform], page: 1, pageSize: 200 });
  const [generate] = routinesApi.useGenerateCertificateMutation();
  const [adding, setAdding] = useState(false);
  const [certifying, setCertifying] = useState<{ sampleId: string; label: string } | null>(null);
  const run = query.data ?? null;
  const doneBy = useMemo(() => { const user = (people.data?.data ?? []).find((item) => item.id === run?.doneById); return user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || null : null; },
    [people.data, run?.doneById]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading routine" />;
  if (!run) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Routine unavailable</h1>
    <p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The routine could not be found."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={routinesPath}>Routine tests</Link></Button></div></div>;
  const open = run.status !== RoutineStatus.Approved && run.status !== RoutineStatus.Rejected;
  const water = run.type === RoutineType.Water;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={run.code} crumbs={[{ label: "Routine tests", to: routinesPath }, { label: run.code }]} actions={<>
      {open ? <PermissionGuard require={routinePermissions.create}><Button variant="outline" onClick={() => setAdding(true)}><Plus />Add {water ? "sample" : "area"}</Button></PermissionGuard> : null}
      {!water && run.samples[0] ? <PermissionGuard require={routinePermissions.perform}><Button disabled={!environmentalReady(run)} onClick={() => setCertifying({ sampleId: run.samples[0]?.id ?? "", label: "the monitoring certificate" })}>
        <FileCheck />Generate certificate</Button></PermissionGuard> : null}
    </>} />
    <DetailGroup title="Routine">
      <DetailItem label="Status" value={<Badge variant="outline">{statusLabel(run.status)}</Badge>} />
      <DetailItem label="Type" value={`${typeLabel(run.type)} · ${originLabel(run.origin)}`} />
      <DetailItem label="Date" value={formatDate(run.routineDate)} />
      {run.periodStart ? <DetailItem label="Period" value={`${formatDate(run.periodStart) ?? ""} – ${formatDate(run.periodEnd) ?? ""}`} /> : null}
      {run.emergencyTrigger ? <DetailItem label="Trigger" value={run.emergencyTrigger} /> : null}
      {run.emergencyReason ? <DetailItem label="Reason" value={run.emergencyReason} /> : null}
      <DetailItem label="Done by" value={doneBy ?? (run.doneById ? "Assigned analyst" : null)} />
      {run.doneAt ? <DetailItem label="Completed" value={formatDateTime(run.doneAt)} /> : null}
      {run.rndTrialBatchId ? <DetailItem label="R&D trial batch" value="Linked" /> : null}
    </DetailGroup>
    {!water && run.samples.length > 0 && !environmentalReady(run) ? <p className="text-sm text-muted-foreground">The monitoring certificate can be generated once every area's microbial worksheet is approved.</p> : null}
    {run.samples.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No {water ? "samples" : "monitored areas"} have been recorded.</p> : null}
    {run.samples.map((sample) => {
      const label = (water ? sample.samplingPoint : sample.areaName) ?? "Sample";
      return <section key={sample.id} aria-label={label} className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">{label}</h2>
          <p className="text-xs text-muted-foreground">{water ? "Collected" : "Observed"} {formatDateTime(sample.collectedAt) ?? "–"}</p></div>
          {water ? <PermissionGuard require={routinePermissions.perform}><Button size="sm" variant="outline" disabled={!sampleReady(sample)} onClick={() => setCertifying({ sampleId: sample.id, label: `the certificate for ${label}` })}>
            <FileCheck />Generate combined certificate</Button></PermissionGuard> : null}</div>
        <ul className="grid gap-2 md:grid-cols-2">{sample.tracks.map((track) => { const state = trackState(track);
          return <li key={track.id} className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm"><div><p className="font-medium">{analysisLabel(track.analysisType)} analysis</p>
            <Badge variant={state.tone} className="mt-1">{state.label}</Badge></div><Button asChild size="sm" variant="outline"><Link to={trackPath(track.id)}>Open worksheet</Link></Button></li>; })}</ul>
        {water && !sampleReady(sample) ? <p className="text-xs text-muted-foreground">The combined certificate can be generated once every analysis of this sample is approved.</p> : null}
      </section>;
    })}
    {adding ? <SampleDialog run={run} onClose={() => setAdding(false)} /> : null}
    {certifying ? <ConfirmActionDialog require={routinePermissions.perform} destructive={false} title={`Generate ${certifying.label}?`}
      description="The certificate is a fixed copy of the approved results. It can be generated only once." confirmLabel="Generate certificate" busyLabel="Generating…" onClose={() => setCertifying(null)}
      onConfirm={async () => {
        const result = await generate(certifying.sampleId);
        if ("error" in result) return apiErrorCode(result.error) === "RoutineCertificate.Exists" ? "A certificate was already generated for this sample." : apiErrorMessage(result.error);
        setCertifying(null);
        toast.success("Certificate generated");
        void navigate(certificatePath(result.data));
        return null;
      }} /> : null}
  </article>;
}
