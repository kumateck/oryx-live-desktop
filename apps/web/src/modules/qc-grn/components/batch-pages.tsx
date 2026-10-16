import { useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formsApi } from "@/shared/api/generated/forms";
import { MaterialSummary } from "@/shared/ard-view/templates/sumary/material";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorCode, apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { AssignmentSheet, type FieldAssignment } from "@/shared/qc/assignment-sheet";
import { ReassignPanel } from "@/shared/qc/assignment-views";
import { assignedFieldIds } from "@/shared/qc/assignments";
import { issueNumber, useNextSerial } from "@/shared/qc/qc-numbers";
import { TestEntry, TestEntryEmpty } from "@/shared/qc/test-entry";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useBatchRoute } from "../hooks/use-batch-route";
import { useBatchWorksheet } from "../hooks/use-batch-worksheet";
import { qcGrnAudit, qcGrnPath, qcPermissions } from "../lib/qc-grn";

type Sheet = ReturnType<typeof useBatchWorksheet>;
const material = (sheet: Sheet) => { const batch = sheet.details?.materialBatch; return { name: batch?.material?.name ?? "Material", code: batch?.material?.code ?? null, number: batch?.batchNumber ?? null }; };

function Frame({ sheet, title, crumb, children }: { sheet: Sheet; title: string; crumb: string; children: ReactNode }) {
  const route = useBatchRoute();
  if (sheet.loading) return <DetailPageSkeleton label="Loading batch test" />;
  if (sheet.error) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Batch test unavailable</h1><p className="text-sm text-muted-foreground">{sheet.error}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={sheet.retry}>Retry</Button><Button asChild size="sm"><Link to={route.notePath}>Back to the note</Link></Button></div></div>;
  const subject = material(sheet);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`${title} · ${subject.name}`} crumbs={[{ label: "Goods receipt notes", to: `${qcGrnPath}?type=${String(route.kind)}` }, { label: "Note", to: route.notePath }, { label: crumb }]} />
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
  const [assign, assigning] = formsApi.usePostApiV1FormAssigneesMutation();
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
  return <Frame sheet={sheet} title="Enter results" crumb="Enter results">
    {!sheet.form ? <TestEntryEmpty kind="no-form" details={details} onBack={() => void navigate(route.notePath)} />
      : mine.size === 0 ? <>{summary(sheet, route.kind)}<TestEntryEmpty kind="not-assigned" details={details} onBack={() => void navigate(route.notePath)} /></>
      : <TestEntry form={sheet.form} mine={mine} stored={sheet.stored} context={context} audit={qcGrnAudit} require={qcPermissions.test[route.kind]} summary={summary(sheet, route.kind)} onReload={sheet.reload} onDone={() => void navigate(route.notePath)} />}
  </Frame>;
}
export { Frame as BatchFrame, summary as batchSummary };
