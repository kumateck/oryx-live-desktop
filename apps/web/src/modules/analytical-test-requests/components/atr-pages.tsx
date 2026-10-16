import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { CertificatePreview } from "@/shared/ard-view/certificate-preview";
import { buildCoaCompliancePayload, type CoaComplianceItem } from "@/shared/ard-view/raw-data/coa-compliance";
import { ProductSummary } from "@/shared/ard-view/templates/sumary/product";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorCode, apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { AssignmentSheet, type FieldAssignment } from "@/shared/qc/assignment-sheet";
import { ReassignPanel } from "@/shared/qc/assignment-views";
import { assignedFieldIds } from "@/shared/qc/assignments";
import { issueNumber, useNextSerial } from "@/shared/qc/qc-numbers";
import { TestEntry, TestEntryEmpty } from "@/shared/qc/test-entry";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { atrFormsApi } from "../api/atr-api";
import { useAtrWorksheet } from "../hooks/use-atr-worksheet";
import { atrAudit, atrListPath, atrPermissions, atrStepPath, stageLabels } from "../lib/atr";
import { AtrWorksheet } from "./atr-worksheet";

type Sheet = ReturnType<typeof useAtrWorksheet>;
const useAtrId = () => useParams().id ?? "";

function Frame({ sheet, title, children }: { sheet: Sheet; title: string; children: ReactNode }) {
  if (sheet.loading) return <DetailPageSkeleton label="Loading test request" />;
  if (sheet.error || !sheet.atr) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Test request unavailable</h1>
    <p className="text-sm text-muted-foreground">{sheet.error ?? "The request could not be found."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={sheet.retry}>Retry</Button><Button asChild size="sm"><Link to={atrListPath(1)}>Test requests</Link></Button></div></div>;
  const atr = sheet.atr;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`${title} · ${atr.product}`} crumbs={[{ label: "Analytical test requests", to: atrListPath(atr.status ?? 1) }, { label: `${atr.batchNumber ?? "Batch"} · ${stageLabels[atr.stage ?? -1] ?? ""}` }, { label: title }]} />
    {children}
  </article>;
}
const summary = (sheet: Sheet) => <ProductSummary title="Product analytical worksheet" data={sheet.rawAtr ?? undefined} specNumber={sheet.ard?.specNumber ?? undefined} stpNumber={sheet.ard?.productStandardTestProcedure?.stpNumber ?? undefined} />;
const back = (sheet: Sheet) => atrListPath(sheet.atr?.status ?? 1);

export function AtrAssignPage() {
  const id = useAtrId();
  const navigate = useNavigate();
  const sheet = useAtrWorksheet(id);
  const [assign, assigning] = atrFormsApi.usePostApiV1FormAssigneesMutation();
  const permission = usePermissionAction(atrPermissions.assign);
  const nextSerial = useNextSerial();
  const submit = async (assignments: FieldAssignment[]): Promise<string | null> => {
    const denied = permission.check();
    if (denied) return denied;
    const atr = sheet.atr;
    if (!sheet.form || !atr?.bmrId || !atr.stepId) return "This request has no test form or production step.";
    const year = new Date().getFullYear();
    const serial = await nextSerial("AtrIssueNumber", `${String(year).slice(-2)}/`);
    const result = await assign({ ...atrAudit, domainEntitiesFormsRequestCreateFormAssigneeRequest: { formId: sheet.form.id, batchManufacturingRecordId: atr.bmrId, productionActivityStepId: atr.stepId,
      ...(atr.stage === 0 || atr.stage === 1 || atr.stage === 2 ? { stage: atr.stage } : {}), formFieldAssignees: assignments, ...(serial === null ? {} : { issueNumber: issueNumber(year, serial) }) } });
    if ("error" in result) {
      if (apiErrorCode(result.error) === "FormAssignee.NotFound") { toast.error("Analysts are already assigned to this test. Reassign them instead."); void navigate(atrStepPath(id, "reassign")); return null; }
      return apiErrorMessage(result.error);
    }
    toast.success("Test assigned");
    void navigate(back(sheet));
    return null;
  };
  return <Frame sheet={sheet} title="Assign test">{sheet.form ? <AssignmentSheet form={sheet.form} summary={summary(sheet)} require={atrPermissions.assign} saving={assigning.isLoading} onSubmit={submit} onCancel={() => void navigate(back(sheet))} />
    : <TestEntryEmpty kind="no-form" details={[{ label: "Product", value: sheet.atr?.product ?? null }, { label: "Stage", value: stageLabels[sheet.atr?.stage ?? -1] ?? null }]} onBack={() => void navigate(back(sheet))} />}</Frame>;
}

export function AtrReassignPage() {
  const sheet = useAtrWorksheet(useAtrId());
  return <Frame sheet={sheet} title="Reassign analysts">{summary(sheet)}
    {sheet.assignees ? <ReassignPanel assignees={sheet.assignees} require={atrPermissions.reassign} audit={atrAudit} onDone={sheet.reload} /> : <p className="text-sm text-muted-foreground">No analysts are assigned to this test yet.</p>}</Frame>;
}

export function AtrTestPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const sheet = useAtrWorksheet(useAtrId());
  const mine = useMemo(() => assignedFieldIds(sheet.assignees, user?.id ?? null), [sheet.assignees, user?.id]);
  const details = [{ label: "Form", value: sheet.form?.name ?? null }, { label: "You", value: user?.name ?? null }, { label: "Product", value: [sheet.atr?.product, sheet.atr?.productCode].filter(Boolean).join(" · ") }];
  return <Frame sheet={sheet} title="Enter results">
    {!sheet.form || !sheet.context ? <TestEntryEmpty kind="no-form" details={details} onBack={() => void navigate(back(sheet))} />
      : mine.size === 0 ? <>{summary(sheet)}<TestEntryEmpty kind="not-assigned" details={details} onBack={() => void navigate(back(sheet))} /></>
      : <TestEntry form={sheet.form} mine={mine} stored={sheet.stored} context={sheet.context} audit={atrAudit} require={atrPermissions.start} summary={summary(sheet)} onReload={sheet.reload} onDone={() => void navigate(back(sheet))} />}
  </Frame>;
}

/** QC checking a product test: the analytical raw data, its print, and the certificate of analysis generated from it. */
export function AtrResultsPage() {
  const navigate = useNavigate();
  const sheet = useAtrWorksheet(useAtrId());
  const [generate, generating] = atrFormsApi.usePostApiV1FormGenerateCertificateProductByBatchManufacturingRecordIdAndProductionActivityStepIdMutation();
  const permission = usePermissionAction(atrPermissions.check);
  const [printing, setPrinting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState("");
  const sections = useMemo(() => sheet.rawForm?.sections ?? [], [sheet.rawForm]);
  const inferred = useMemo(() => buildCoaCompliancePayload(sections, sheet.responses), [sections, sheet.responses]);
  const [compliance, setCompliance] = useState<CoaComplianceItem[]>([]);
  useEffect(() => { setCompliance(inferred); }, [inferred]);
  const atr = sheet.atr;
  const issue = async () => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (!atr?.bmrId || !atr.stepId) { setMessage("This request has no production step."); return; }
    const result = await generate({ ...atrAudit, batchManufacturingRecordId: atr.bmrId, productionActivityStepId: atr.stepId,
      body: compliance.flatMap((item) => item.formSectionId ? [{ formSectionId: item.formSectionId, complies: item.complies ?? false }] : []) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Certificate of analysis submitted for approval");
    void navigate(back(sheet));
  };
  const worksheet = <AtrWorksheet atr={sheet.rawAtr} specNumber={sheet.ard?.specNumber ?? null} stpNumber={sheet.ard?.productStandardTestProcedure?.stpNumber ?? null} form={sheet.rawForm} responses={sheet.responses} blank={false} />;
  return <Frame sheet={sheet} title="Analytical raw data">
    <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={!sheet.rawForm} onClick={() => setPrinting(true)}>Print</Button>
      <PermissionGuard require={atrPermissions.check}><Button type="button" disabled={!sheet.rawForm} onClick={() => { sheet.reload(); setPreviewing(true); }}>
        {sheet.certificate.canGenerate ? "Preview certificate" : `View certificate · ${sheet.certificate.label}`}</Button></PermissionGuard></div>
    {sheet.formMissing ? <p className="text-sm text-muted-foreground">This product has no test form for this stage.</p> : worksheet}
    {printing ? <PrintPreviewDialog title="Product analytical raw data" onClose={() => setPrinting(false)}>{worksheet}</PrintPreviewDialog> : null}
    {previewing && atr ? <Dialog open onOpenChange={(open) => { if (!open && !generating.isLoading) setPreviewing(false); }}><DialogContent className="sm:max-w-5xl">
      <DialogHeader><DialogTitle>Certificate of analysis</DialogTitle><DialogDescription>{sheet.certificate.canGenerate ? "Check each test's compliance, then submit the certificate for approval." : sheet.certificate.label}</DialogDescription></DialogHeader>
      <DialogBody><CertificatePreview kind="Product" sections={sections} responses={sheet.responses} compliance={compliance}
        facts={{ batchNumber: atr.batchNumber, made: atr.made, expires: atr.expires, arNumber: atr.arNumber, sampled: atr.sampledAt, analysed: atr.sampledAt, subject: `${atr.product}${atr.productCode ? ` · ${atr.productCode}` : ""}` }}
        extra={[{ label: "Composition", value: atr.composition }, { label: "Pack style", value: atr.packing }, { label: "Shelf life", value: atr.shelfLife }]}
        onCompliance={(sectionId, complies) => { if (sheet.certificate.canGenerate) setCompliance((list) => list.map((item) => item.formSectionId === sectionId ? { ...item, complies, requiresReview: false } : item)); }} />
        {message ? <p role="alert" className="mt-2 text-sm text-destructive">{message}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={generating.isLoading} onClick={() => setPreviewing(false)}>Close</Button>
        {sheet.certificate.canGenerate ? <Button type="button" disabled={generating.isLoading || compliance.length === 0} onClick={() => void issue()}>{generating.isLoading ? <><Spinner />Submitting…</> : "Generate certificate"}</Button> : null}</DialogFooter>
    </DialogContent></Dialog> : null}
  </Frame>;
}
