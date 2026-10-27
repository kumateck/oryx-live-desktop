import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useParams } from "react-router";
import { qcApi, type DomainEntitiesQcWorksheetsCoaDetailDto } from "@/shared/api/generated/qc";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ConfirmActionDialog } from "@/shared/actions";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RecordState } from "@/shared/workflows/record-state";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { formatDate } from "@/shared/format/dates";
import { retestSchema, retestAudit as audit, retestPath } from "../schemas/retest";
function CertificateContent({ record }: { record: DomainEntitiesQcWorksheetsCoaDetailDto }) {
  return <div className="space-y-4"><h2 className="font-semibold">{record.certificateCode ?? "Certificate of analysis"}</h2>
    <DetailGroup title="Frozen certificate"><DetailItem label="AR number" value={record.arNumber} /><DetailItem label="Specification" value={`${record.specificationCode ?? ""} · version ${record.specificationVersion}`} /><DetailItem label="Issued" value={formatDate(record.issuedAt)} /><DetailItem label="Overall compliance" value={record.overallComplies ? "Complies" : "Does not comply"} /></DetailGroup>
    {(record.subjects ?? []).map((subject, index) => <section key={subject.testRequestSubjectId ?? index} className="space-y-3"><h3 className="font-medium">{subject.subjectLabel ?? subject.subjectRef}</h3>{(subject.groups ?? []).map((group, groupIndex) => <section key={groupIndex} className="space-y-2"><h4>{group.groupName}</h4>
      {(group.rows ?? []).map((row, rowIndex) => <dl key={row.id ?? rowIndex} className="grid min-w-0 gap-2 border-t pt-2 sm:grid-cols-3"><div><dt className="font-medium">{row.displayLabel}</dt><dd className="break-words text-muted-foreground">{row.acceptanceCriteria}</dd></div><div><dt>Result</dt><dd className="break-words">{row.resultValue ?? "Not recorded"}</dd></div><div><dt>Compliance</dt><dd>{row.complianceLabel ?? (row.complies ? "Complies" : "Does not comply")}</dd></div></dl>)}
    </section>)}</section>)}
  </div>;
}
function Certificate({ record, onDone }: { record: DomainEntitiesQcWorksheetsCoaDetailDto; onDone: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const command = useVerifiedMutation<DomainEntitiesQcWorksheetsCoaDetailDto>("CanIssueQcCertificate", record);
  const [read] = qcApi.useLazyGetApiV1QcWorksheetsCertificatesByIdQuery();
  const [issue] = qcApi.usePostApiV1QcWorksheetsCertificatesByIdIssueMutation();
  return <section className="space-y-4"><CertificateContent record={record} />
    <div className="flex flex-wrap justify-end gap-2"><PrintButton preview={(close) => <PrintPreviewDialog title="Retest certificate" onClose={close}><CertificateContent record={record} /></PrintPreviewDialog>} />
      {record.status === 0 ? <PermissionGuard require="CanIssueQcCertificate"><Button onClick={() => setConfirm(true)}>Issue retest certificate</Button></PermissionGuard> : null}</div>
    {confirm ? <ConfirmActionDialog title="Issue this retest certificate?" description={record.overallComplies ? "Issuing locks the reviewed worksheets and completes the retest. The backend changes expiry only when all governed retest gates pass." : "This certificate does not comply. Issuance records rejection and does not extend expiry."}
      require="CanIssueQcCertificate" confirmLabel="Issue certificate" busyLabel="Verifying…" onClose={() => setConfirm(false)} onConfirm={async () => {
        if (!record.id) return "The certificate identity is missing.";
        const failure = await command.run(record, () => read({ ...audit, id: record.id ?? "" }, false).unwrap(), async (fresh) => {
          if (!fresh.id || fresh.status !== 0) throw new Error("This certificate is no longer a draft.");
          const result = await issue({ ...audit, id: fresh.id });
          if ("error" in result) throw new Error(apiErrorMessage(result.error));
        });
        if (!failure) { setConfirm(false); onDone(); } return failure;
      }} /> : null}
  </section>;
}
export function RetestCertificatePage() {
  const { id = "" } = useParams();
  const retest = qcApi.useGetApiV1QcMaterialRetestsByIdQuery({ ...audit, id });
  const parsed = retestSchema.safeParse(retest.data);
  const query = qcApi.useGetApiV1QcMaterialRetestsByIdCertificatesQuery({ ...audit, id }, { skip: !parsed.success || !parsed.data.testRequestId });
  const options = (query.data ?? []).filter((record) => parsed.success && record.testRequestId === parsed.data.testRequestId);
  const [selected, setSelected] = useState<string | null>(null);
  const certificateId = parsed.success && parsed.data.coaId ? parsed.data.coaId : options.find((record) => record.id === selected)?.id ?? options.find((record) => record.status === 0)?.id ?? options[0]?.id;
  const certificate = qcApi.useGetApiV1QcWorksheetsCertificatesByIdQuery(certificateId ? { ...audit, id: certificateId } : skipToken);
  const matching = certificate.data && parsed.success && certificate.data.testRequestId === parsed.data.testRequestId ? certificate.data : null;
  return <article className="min-w-0 space-y-4"><PageHeader title="Retest certificate" crumbs={[{ label: "Material retests", to: "/qc/material-retests" }, { label: "Retest", to: retestPath(id) }, { label: "Certificate" }]} />
    <div className="flex flex-wrap gap-2">{options.map((record) => record.id ? <Button key={record.id} size="sm" variant={record.id === certificateId ? "default" : "outline"} onClick={() => setSelected(record.id ?? null)}>{record.certificateCode} · revision {record.revisionNumber}</Button> : null)}</div>
    {!retest.isLoading && !query.isLoading && !certificateId ? <p role="status">The server generates a certificate after every required worksheet is reviewed and no OOS hold remains. Complete the linked testing round, then refresh this page.</p> : <RecordState loading={retest.isLoading || query.isLoading || certificate.isLoading} data={matching} error={retest.error ? apiErrorMessage(retest.error) : query.error ? apiErrorMessage(query.error) : certificate.error ? apiErrorMessage(certificate.error) : null} retry={() => { void retest.refetch(); void query.refetch(); if (certificateId) void certificate.refetch(); }}>{(record) => <Certificate record={record} onDone={() => { void certificate.refetch(); void retest.refetch(); }} />}</RecordState>}
  </article>;
}
