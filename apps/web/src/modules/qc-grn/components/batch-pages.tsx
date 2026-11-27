import { TestCorrectionPanel } from "@/shared/qc/test-correction-panel";
import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { qcGrnAnalyticalApi, qcGrnFormsApi, qcGrnWarehouseApi } from "../api/qc-grn-api";
import { MaterialSummary } from "@/shared/ard-view/templates/sumary/material";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useAccess } from "@/shared/auth/use-access";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorCode, apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { AssignmentSheet, type FieldAssignment } from "@/shared/qc/assignment-sheet";
import { ReassignPanel } from "@/shared/qc/assignment-views";
import { WorksheetProgress } from "@/shared/qc/worksheet-progress";
import { assignedFieldIds } from "@/shared/qc/assignments";
import { issueNumber, useNextSerial } from "@/shared/qc/qc-numbers";
import { TestEntry, TestEntryEmpty } from "@/shared/qc/test-entry";
import { formFields } from "@/shared/form-response/form-model";
import { TestFormulaActions } from "@/modules/questions/formula-repair";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useBatchRoute } from "../hooks/use-batch-route";
import { useBatchWorksheet } from "../hooks/use-batch-worksheet";
import { grnListAudit, printsFilled, qcGrnAudit, qcPermissions, qcWorksheetAccess } from "../lib/qc-grn";

import { BatchWorksheetPreview } from "./batch-worksheet";

type Sheet = ReturnType<typeof useBatchWorksheet>;
const material = (sheet: Sheet) => { const batch = sheet.details?.materialBatch; return { name: batch?.material?.name ?? "Material", code: batch?.material?.code ?? null, number: batch?.batchNumber ?? null }; };

function Frame({ sheet, title, crumb, children }: { sheet: Sheet; title: string; crumb: string; children: ReactNode }) {
  const route = useBatchRoute();
  if (sheet.loading) return <DetailPageSkeleton label="Loading batch test" />;
  if (sheet.error) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Batch test unavailable</h1><p className="text-sm text-muted-foreground">{sheet.error}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={sheet.retry}>Retry</Button><Button asChild size="sm"><Link to={route.notePath}>{route.backLabel}</Link></Button></div></div>;
  const subject = material(sheet);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`${title} · ${subject.name}`} crumbs={[...route.crumbs, { label: crumb }]} />
    {children}
  </article>;
}
/** The worksheet header: batch, AR, GRN, specification and STP numbers, quantities, dates and who sampled and issued it. */
const summary = (sheet: Sheet, kind: 0 | 1) => <MaterialSummary data={sheet.details ?? undefined} title={`${kind === 1 ? "Packaging" : "Raw"} material analytical worksheet`} />;

/** Gives the fields of a sampled batch's test form to analysts. The issue number is given here. */
export function BatchAssignPage() {
  const route = useBatchRoute();
  const navigate = useNavigate();
  const sheet = useBatchWorksheet(route.batchId, { assignees: false });
  const [assign, assigning] = qcGrnFormsApi.usePostApiV1FormAssigneesMutation();
  const permission = usePermissionAction(qcPermissions.test[route.kind]);
  const nextSerial = useNextSerial();
  const submit = async (assignments: FieldAssignment[]): Promise<string | null> => {
    const denied = permission.check();
    if (denied) return denied;
    if (!sheet.form) return "This material has no test form.";
    const year = new Date().getFullYear();
    const serial = await nextSerial("MaterialBatchIssueNumber", `${String(year).slice(-2)}/`);
    const result = await assign({ ...qcGrnAudit, domainEntitiesFormsRequestCreateFormAssigneeRequest: { formId: sheet.form.id, materialBatchId: route.batchId, formFieldAssignees: assignments, ...(serial === null ? {} : { issueNumber: issueNumber(year, serial) }) } });
    if ("error" in result) {
      if (apiErrorCode(result.error) === "FormAssignee.NotFound") { toast.error("Analysts are already assigned to this test. Reassign them instead."); void navigate(route.path("reassign")); return null; }
      return apiErrorMessage(result.error);
    }
    toast.success("Test assigned");
    void navigate(route.notePath);
    return null;
  };
  return <Frame sheet={sheet} title="Assign test" crumb="Assign test">
    {sheet.form ? <AssignmentSheet form={sheet.form} summary={summary(sheet, route.kind)} require={qcPermissions.test[route.kind]} saving={assigning.isLoading} onSubmit={submit} onCancel={() => void navigate(route.notePath)} />
      : <TestEntryEmpty kind="no-form" details={[{ label: "Material", value: material(sheet).name }]} onBack={() => void navigate(route.notePath)} />}
  </Frame>;
}

/** Moves one analyst's fields to another while the test is assigned or running. */
export function BatchReassignPage() {
  const route = useBatchRoute();
  const sheet = useBatchWorksheet(route.batchId);
  return <Frame sheet={sheet} title="Reassign analysts" crumb="Reassign analysts">
    {summary(sheet, route.kind)}
    {sheet.assignees ? <ReassignPanel assignees={sheet.assignees} require={qcPermissions.reassign[route.kind]} audit={qcGrnAudit} onDone={sheet.reload} /> : <p className="text-sm text-muted-foreground">No analysts are assigned to this test yet.</p>}
  </Frame>;
}

/** An analyst entering their results for a batch under test. */
export function BatchTestPage() {
  const route = useBatchRoute();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const sheet = useBatchWorksheet(route.batchId);
  const mine = useMemo(() => assignedFieldIds(sheet.assignees, user?.id ?? null), [sheet.assignees, user?.id]);
  const subject = material(sheet);
  const details = [{ label: "Form", value: sheet.form?.name ?? null }, { label: "You", value: user?.name ?? null }, { label: "Material", value: [subject.name, subject.code].filter(Boolean).join(" · ") }];
  const context = useMemo(() => ({ materialBatchId: route.batchId }), [route.batchId]);
  // The material test is the sample drawn from the batch; formula repair names it by the sampling's id.
  const sampling = qcGrnAnalyticalApi.useGetApiV1MaterialSamplingsByGrnIdAndBatchIdQuery(
    route.grnId && !route.sampling?.id ? { ...qcGrnAudit, grnId: route.grnId, batchId: route.batchId } : skipToken);
  const testId = route.sampling?.id ?? sampling.currentData?.id ?? null;
  const repair = testId && sheet.form ? { formulaActions: (disabled: boolean, onRepaired: (fieldId: string, configurationHash: string) => void) =>
    <TestFormulaActions testId={testId} fields={sheet.form ? formFields(sheet.form).filter(field => mine.has(field.id)) : []}
      responses={sheet.responses} disabled={disabled} onRepaired={onRepaired} onReload={sheet.reload} /> } : {};
  return <Frame sheet={sheet} title="Enter results" crumb="Enter results">
    {sheet.responseId ? <TestCorrectionPanel responseId={sheet.responseId} kind={route.kind === 0 ? "raw" : "packaging"} canReturn={false} onReturned={sheet.reload} /> : null}
    {!sheet.form ? <TestEntryEmpty kind="no-form" details={details} onBack={() => void navigate(route.notePath)} />
      : mine.size === 0 ? <>{summary(sheet, route.kind)}<TestEntryEmpty kind="not-assigned" details={details} onBack={() => void navigate(route.notePath)} /></>
      : <TestEntry progressTo={route.path("progress")} form={sheet.form} mine={mine} stored={sheet.stored} context={context} audit={qcGrnAudit} require={qcPermissions.test[route.kind]} summary={summary(sheet, route.kind)} onReload={sheet.reload} onDone={() => void navigate(route.notePath)} {...repair} />}
  </Frame>;
}
/** Check note membership and the stored kind before reading any worksheet answers. */
export function BatchProgressPage() {
  const route = useBatchRoute();
  const access = useAccess();
  const note = qcGrnWarehouseApi.useGetApiV1WarehouseGrnByIdQuery(
    route.ready && route.grnId && access.allows(qcWorksheetAccess(route.kind))
      ? { ...grnListAudit, id: route.grnId }
      : skipToken,
  );
  // A retest's batch is not on a note: the retest that provides the route already holds it.
  const onNote = route.grnId === null || note.currentData?.materialBatches?.some((batch) => batch.id === route.batchId);
  const batch = qcGrnAnalyticalApi.useGetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdQuery(
    onNote ? { ...qcGrnAudit, materialBatchId: route.batchId } : skipToken,
  );
  const kind = batch.currentData?.materialBatch?.material?.kind;
  if (note.isLoading || batch.isLoading || note.isFetching && !note.currentData)
    return <DetailPageSkeleton label="Loading batch test" />;
  const error = note.error ?? batch.error;
  if (error || !onNote || kind !== route.kind || !route.ready) return <p role="alert" className="text-sm text-muted-foreground">
    {error ? apiErrorMessage(error) : "This batch is unavailable on this goods receipt note."}
  </p>;
  return <PermissionGuard require={qcWorksheetAccess(kind)}>
    <BatchProgressSheet batchId={route.batchId} kind={kind} />
  </PermissionGuard>;
}

function BatchProgressSheet({ batchId, kind }: { batchId: string; kind: 0 | 1 }) {
  const route = useBatchRoute();
  const sheet = useBatchWorksheet(batchId, { fresh: true });
  return <Frame sheet={sheet} title="Test progress" crumb="Test progress">
    {sheet.responseId ? <TestCorrectionPanel responseId={sheet.responseId} kind={kind === 0 ? "raw" : "packaging"} canReturn={false} onReturned={sheet.reload} /> : null}
    {summary(sheet, kind)}
    <WorksheetProgress form={sheet.form} stored={sheet.stored} responses={sheet.responses}
      assignments={sheet.assignees} submitted={route.submitted ?? printsFilled(sheet.details?.materialBatch?.status ?? null)}
      preview={(close) => <BatchWorksheetPreview sheet={sheet} filled onClose={close} />} />
  </Frame>;
}

export { Frame as BatchFrame, summary as batchSummary };
