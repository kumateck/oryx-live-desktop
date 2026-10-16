import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { CertificatePreview } from "@/shared/ard-view/certificate-preview";
import { buildCoaCompliancePayload, type CoaComplianceItem } from "@/shared/ard-view/raw-data/coa-compliance";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { qcGrnAnalyticalApi, qcGrnFormsApi, qcGrnMaterialsApi } from "../api/qc-grn-api";
import { useBatchRoute } from "../hooks/use-batch-route";
import { useBatchWorksheet } from "../hooks/use-batch-worksheet";
import { qcGrnAudit, qcPermissions } from "../lib/qc-grn";
import { BatchFrame } from "./batch-pages";
import { BatchWorksheet } from "./batch-worksheet";

const samplingSchema = z.object({ arNumber: z.string().nullish(), sampleDate: z.string().nullish() }).nullish();
const batchSchema = z.object({ batchNumber: z.string().nullish(), manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(), material: z.object({ name: z.string().nullish() }).nullish() }).nullish();

/** QC checking a tested batch: the full analytical raw data, its print, and the certificate of analysis generated from it. */
export function BatchResultsPage() {
  const route = useBatchRoute();
  const navigate = useNavigate();
  const sheet = useBatchWorksheet(route.batchId, { assignees: false });
  const sampling = qcGrnAnalyticalApi.useGetApiV1MaterialSamplingsByGrnIdAndBatchIdQuery({ ...qcGrnAudit, grnId: route.grnId, batchId: route.batchId });
  const batchQuery = qcGrnMaterialsApi.useGetApiV1MaterialBatchByBatchIdQuery({ ...qcGrnAudit, batchId: route.batchId });
  const [generate, generating] = qcGrnFormsApi.usePostApiV1FormGenerateCertificateByMaterialBatchIdMutation();
  const permission = usePermissionAction(qcPermissions.check[route.kind]);
  const [printing, setPrinting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState("");
  const sections = useMemo(() => sheet.rawForm?.sections ?? [], [sheet.rawForm]);
  const inferred = useMemo(() => buildCoaCompliancePayload(sections, sheet.responses), [sections, sheet.responses]);
  const [compliance, setCompliance] = useState<CoaComplianceItem[]>([]);
  useEffect(() => { setCompliance(inferred); }, [inferred]);
  const sample = samplingSchema.safeParse(sampling.data ?? null);
  const batch = batchSchema.safeParse(batchQuery.data ?? null);
  const facts = { batchNumber: batch.success ? batch.data?.batchNumber ?? null : null, made: batch.success ? batch.data?.manufacturingDate ?? null : null, expires: batch.success ? batch.data?.expiryDate ?? null : null,
    arNumber: sample.success ? sample.data?.arNumber ?? null : null, sampled: sample.success ? sample.data?.sampleDate ?? null : null, analysed: sample.success ? sample.data?.sampleDate ?? null : null,
    subject: (batch.success ? batch.data?.material?.name : null) ?? "Material" };
  const issue = async () => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const result = await generate({ ...qcGrnAudit, materialBatchId: route.batchId, body: compliance.flatMap((item) => item.formSectionId ? [{ formSectionId: item.formSectionId, complies: item.complies ?? false }] : []) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Certificate of analysis generated");
    void navigate(route.notePath);
  };
  return <BatchFrame sheet={sheet} title="Analytical raw data" crumb="Results">
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="outline" disabled={!sheet.rawForm} onClick={() => setPrinting(true)}>Print</Button>
      <PermissionGuard require={qcPermissions.check[route.kind]}><Button type="button" disabled={!sheet.rawForm} onClick={() => { void sheet.reload(); setPreviewing(true); }}>Preview certificate</Button></PermissionGuard>
    </div>
    {sheet.formMissing ? <p className="text-sm text-muted-foreground">This material has no test form linked.</p> : <BatchWorksheet details={sheet.details} form={sheet.rawForm} responses={sheet.responses} blank={false} />}
    {printing ? <PrintPreviewDialog title="Analytical raw data" onClose={() => setPrinting(false)}><BatchWorksheet details={sheet.details} form={sheet.rawForm} responses={sheet.responses} blank={false} /></PrintPreviewDialog> : null}
    {previewing ? <Dialog open onOpenChange={(open) => { if (!open && !generating.isLoading) setPreviewing(false); }}><DialogContent className="sm:max-w-5xl">
      <DialogHeader><DialogTitle>Certificate of analysis</DialogTitle><DialogDescription>Check each test's compliance, then generate the certificate. The batch is approved or rejected through its approval.</DialogDescription></DialogHeader>
      <DialogBody><CertificatePreview kind="Material" facts={facts} sections={sections} responses={sheet.responses} compliance={compliance}
        onCompliance={(sectionId, complies) => setCompliance((list) => list.map((item) => item.formSectionId === sectionId ? { ...item, complies, requiresReview: false } : item))} />
        {message ? <p role="alert" className="mt-2 text-sm text-destructive">{message}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={generating.isLoading} onClick={() => setPreviewing(false)}>Cancel</Button>
        <Button type="button" disabled={generating.isLoading || compliance.length === 0} onClick={() => void issue()}>{generating.isLoading ? <><Spinner />Generating…</> : "Generate certificate"}</Button></DialogFooter>
    </DialogContent></Dialog> : null}
  </BatchFrame>;
}
