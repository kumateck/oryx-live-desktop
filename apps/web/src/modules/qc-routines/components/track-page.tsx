import { storedAnswerRowsSchema } from "@/shared/form-response/stored-answer-schema";
import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog } from "@/shared/actions";
import { formsApi } from "@/shared/api/generated/forms";
import ArdTemplateBody from "@/shared/ard-view/templates/body";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { formFields, formSchema } from "@/shared/form-response/form-model";
import { latestAnswers } from "@/shared/form-response/use-answer-form";
import { PageHeader } from "@/shared/navigation/page-header";
import { TestEntry } from "@/shared/qc/test-entry";
import { useAnalystOptions } from "@/shared/qc/use-analyst-options";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { routinesApi } from "../api/routines-api";
import { analysisLabel, audit, routinePath, routinePermissions, routinesPath } from "../lib/routines";

const answerRows = storedAnswerRowsSchema;
const performers = [routinePermissions.perform] as const;

/** Gives the whole worksheet to one analyst, as routines are tested by one person per analysis. */
function AssignPanel({ trackId, formId, fieldIds }: { trackId: string; formId: string; fieldIds: readonly string[] }) {
  const loadAnalysts = useAnalystOptions(performers);
  const permission = usePermissionAction(routinePermissions.create);
  const [assign] = routinesApi.useAssignTrackMutation();
  const [analyst, setAnalyst] = useState<SelectOption | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async () => {
    if (!analyst) { setMessage("Choose the analyst."); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setBusy(true);
    const result = await assign({ trackId, formId, fieldIds, assigneeId: analyst.value });
    setBusy(false);
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Worksheet assigned");
  };
  return <section aria-label="Assign" className="space-y-3 rounded-lg border bg-card p-4"><h2 className="font-semibold">Assign the worksheet</h2>
    <p className="text-sm text-muted-foreground">All {fieldIds.length} fields go to one analyst for this analysis.</p>
    <PermissionGuard require={routinePermissions.create} fallback={<p className="text-sm text-muted-foreground">A supervisor assigns this worksheet before results can be entered.</p>}>
      <div className="flex flex-wrap items-end gap-2"><div className="min-w-64 flex-1"><AsyncOptionPicker label="Analyst" value={analyst} onChange={setAnalyst} loadOptions={loadAnalysts} placeholder="Choose an analyst" /></div>
        <Button disabled={busy || fieldIds.length === 0} onClick={() => void submit()}>{busy ? <><Spinner />Assigning…</> : "Assign"}</Button></div>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    </PermissionGuard>
  </section>;
}

/** One analysis of a routine sample: assign it, enter the results, submit for approval, then read it back. */
export function RoutineTrackPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const track = routinesApi.useGetTrackQuery(id, { skip: !id });
  const assignment = routinesApi.useGetTrackAssignmentQuery(id, { skip: !id });
  const responseId = routinesApi.useGetTrackResponseQuery(id, { skip: !id });
  const formQuery = formsApi.useGetApiV1FormByFormIdQuery(track.data ? { ...audit, formId: track.data.formId } : skipToken);
  const known = responseId.data ?? track.data?.responseId ?? null;
  const response = formsApi.useGetApiV1FormResponsesByFormResponseIdQuery(known ? { ...audit, formResponseId: known } : skipToken);
  const [submit] = routinesApi.useSubmitTrackMutation();
  const [submitting, setSubmitting] = useState(false);
  const form = useMemo(() => { const parsed = formSchema.safeParse(formQuery.data ?? null); return parsed.success ? parsed.data : null; }, [formQuery.data]);
  const stored = useMemo(() => {
    const rows = answerRows.safeParse(response.data?.formResponses ?? []);
    return latestAnswers((rows.success ? rows.data : []).map((row) => ({ ...row, value: row.value ?? null, responseId: row.responseId ?? known, createdAt: row.createdAt ?? null })));
  }, [response.data, known]);
  const fieldIds = useMemo(() => form ? formFields(form).map((field) => field.id) : [], [form]);
  // Every field is the assigned analyst's: the server keeps one assignee per routine worksheet and reads back no per-field list.
  const mine = useMemo(() => new Set(fieldIds), [fieldIds]);
  const context = useMemo(() => ({ routineTrackId: id }), [id]);
  const reload = () => { void responseId.refetch(); if (known) void response.refetch(); void track.refetch(); };

  if (track.isLoading || assignment.isLoading || responseId.isLoading || formQuery.isLoading || response.isLoading) return <DetailPageSkeleton label="Loading worksheet" />;
  const failure = track.error ?? formQuery.error ?? assignment.error ?? response.error;
  if (!track.data || !form || failure) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Worksheet unavailable</h1>
    <p className="text-sm text-muted-foreground">{failure ? apiErrorMessage(failure) : "The analysis or its worksheet could not be read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={reload}>Retry</Button><Button asChild size="sm"><Link to={routinesPath}>Routine tests</Link></Button></div></div>;
  const context0 = track.data;
  const detail = response.data;
  const locked = Boolean(detail?.checkedAt || detail?.approved || detail?.rejected || detail?.hasPendingApproval || context0.approved || context0.rejected);
  const state = context0.rejected || detail?.rejected ? "Rejected" : context0.approved || detail?.approved ? "Approved" : detail?.hasPendingApproval ? "Awaiting approval" : known ? "In progress" : assignment.data ? "Assigned" : "Not assigned";
  const header = <DetailGroup title="Analysis">
    <DetailItem label="Routine" value={<Link className="text-primary underline-offset-2 hover:underline" to={routinePath(context0.routineExecutionId)}>{context0.routineCode ?? "Routine"}</Link>} />
    <DetailItem label="Sample or area" value={context0.sampleIdentity} />
    <DetailItem label="Worksheet" value={form.name} />
    <DetailItem label="State" value={<Badge variant="outline">{state}</Badge>} />
    {detail?.checkedAt ? <DetailItem label="Checked" value={formatDateTime(detail.checkedAt)} /> : null}
  </DetailGroup>;
  const title = `${analysisLabel(context0.analysisType)} analysis · ${context0.sampleIdentity ?? "Sample"}`;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={[{ label: "Routine tests", to: routinesPath }, { label: context0.routineCode ?? "Routine", to: routinePath(context0.routineExecutionId) }, { label: analysisLabel(context0.analysisType) }]}
      actions={known && !locked ? <PermissionGuard require={routinePermissions.perform}><Button onClick={() => setSubmitting(true)}><Send />Submit for approval</Button></PermissionGuard> : undefined} />
    {!assignment.data ? <>{header}<AssignPanel trackId={id} formId={form.id} fieldIds={fieldIds} /></>
      : locked ? <>{header}
        {detail?.rejected || context0.rejected ? <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">This worksheet was rejected. A retest or revision is recorded as a new routine sample.</p> : null}
        <div className="overflow-x-auto rounded-lg border bg-card p-3"><ArdTemplateBody sections={formQuery.data?.sections} responses={detail?.formResponses ?? []} /></div></>
      : <PermissionGuard require={routinePermissions.perform} fallback={<>{header}<p className="text-sm text-muted-foreground">Results are entered by the analyst the worksheet was given to.</p></>}>
        <TestEntry form={form} mine={mine} stored={stored} context={context} audit={audit} require={routinePermissions.perform} summary={header} onReload={reload} onDone={() => void navigate(routinePath(context0.routineExecutionId))} />
      </PermissionGuard>}
    {known && !locked ? <p className="text-sm text-muted-foreground">Submit the worksheet for QA approval once its results are complete and submitted above.</p> : null}
    {submitting ? <ConfirmActionDialog require={routinePermissions.perform} destructive={false} title="Submit this worksheet for approval?" description="The worksheet is locked while QA reviews it."
      confirmLabel="Submit for approval" busyLabel="Submitting…" onClose={() => setSubmitting(false)}
      onConfirm={async () => { const result = await submit(id); if ("error" in result) return apiErrorMessage(result.error); setSubmitting(false); toast.success("Submitted for approval"); reload(); return null; }} /> : null}
  </article>;
}
