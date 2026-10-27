import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useParams } from "react-router";
import { qcApi } from "@/shared/api/generated/qc";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { RecordState } from "@/shared/workflows/record-state";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { retestSchema, retestAudit as audit, retestPath } from "../schemas/retest";
import { worksheetSchema } from "./worksheet-model";
import { WorksheetEditor } from "./worksheet-editor";
import { RecordSampleDialog } from "./record-sample-dialog";
import { WorksheetOosCase } from "./oos-case";
import { z } from "zod";
const requestSchema = z.object({ id: z.string().min(1), arNumber: z.string().nullish(), specificationCode: z.string().nullish(), specificationVersion: z.number().int(), status: z.number().int(), blocksRelease: z.boolean(),
  subjects: z.array(z.object({ id: z.string().min(1), materialBatchId: z.string().nullish(), subjectRef: z.string().nullish(), collectedAt: z.string().nullish(),
    worksheetInstances: z.array(z.object({ id: z.string().min(1), worksheetTemplateCode: z.string().nullish(), status: z.number().int(), assignedToId: z.string().nullish() })),
  })),
});
export function RetestTestingPage() {
  const { id = "" } = useParams();
  const retest = qcApi.useGetApiV1QcMaterialRetestsByIdQuery({ ...audit, id });
  const parsed = retestSchema.safeParse(retest.data);
  const testId = parsed.success ? parsed.data.testRequestId : null;
  const query = qcApi.useGetApiV1QcWorksheetsTestRequestsByIdQuery(testId ? { ...audit, id: testId } : skipToken);
  const request = requestSchema.safeParse(query.data);
  const [chosen, setChosen] = useState<string | null>(null);
  const [sample, setSample] = useState(false);
  const [revision, setRevision] = useState(0);
  const subjects = request.success && parsed.success && request.data.subjects.length > 0 && request.data.subjects.every((item) => item.materialBatchId === parsed.data.materialBatchId) ? request.data.subjects : [];
  const instances = subjects.flatMap((item) => item.worksheetInstances);
  const instanceId = instances.find((item) => item.id === chosen)?.id ?? instances[0]?.id;
  const subject = subjects.find((item) => item.worksheetInstances.some((instance) => instance.id === instanceId)) ?? subjects[0];
  const worksheet = qcApi.useGetApiV1QcWorksheetsInstancesByIdQuery(instanceId ? { ...audit, id: instanceId } : skipToken);
  const definition = worksheetSchema.safeParse(worksheet.data);
  const matchingWorksheet = definition.success && definition.data.testRequestSubjectId === subject?.id ? definition.data : null;
  return <article className="min-w-0 space-y-4"><PageHeader title="Retest testing" crumbs={[{ label: "Material retests", to: "/qc/material-retests" }, { label: "Retest", to: retestPath(id) }, { label: "Testing" }]} />
    <RecordState loading={retest.isLoading || query.isLoading} data={subject && request.success ? request.data : null} error={retest.error ? apiErrorMessage(retest.error) : query.error ? apiErrorMessage(query.error) : null} retry={() => { void retest.refetch(); if (testId) void query.refetch(); }}>{(test) => <>
      <DetailGroup title="Pinned testing round"><DetailItem label="AR number" value={test.arNumber} /><DetailItem label="Specification" value={`${test.specificationCode ?? ""} · version ${test.specificationVersion}`} /><DetailItem label="Batch" value={subject?.subjectRef} /><DetailItem label="Release hold" value={test.blocksRelease ? "Blocked by OOS" : "No open OOS hold"} /></DetailGroup>
      <div className="flex flex-wrap gap-2">{test.status === 0 ? <PermissionGuard require="CanRecordQcSample"><Button size="sm" onClick={() => setSample(true)}>Record collection for testing round</Button></PermissionGuard> : null}
        <PermissionGuard require="CanViewQcCertificate"><Button asChild size="sm" variant="outline"><Link to={`${retestPath(id)}/certificate`}>Find linked certificate</Link></Button></PermissionGuard>
        {instances.map((item) => <Button key={item.id} size="sm" variant={instanceId === item.id ? "default" : "outline"} onClick={() => setChosen(item.id)}>{item.worksheetTemplateCode ?? "Worksheet"} · {item.id.slice(0, 8)}</Button>)}
      </div>
      {instanceId ? <RecordState loading={worksheet.isLoading} data={matchingWorksheet} error={worksheet.error ? apiErrorMessage(worksheet.error) : null} retry={() => void worksheet.refetch()}>{(record) => <>
        <PrintButton preview={(close) => <WorksheetPrint record={record} close={close} />} />
        <WorksheetEditor key={`${record.id}:${revision}`} record={record} onDone={() => { void worksheet.refetch().then(() => setRevision((current) => current + 1)); void query.refetch(); }} />
        {record.oosCases?.map((item) => <WorksheetOosCase key={item.id} id={item.id} testRequestId={testId ?? ""} onWorksheet={setChosen} onDone={() => { void worksheet.refetch(); void query.refetch(); }} />)}
      </>}</RecordState> : <p role="status">This round has no worksheet instances. Check its specification before continuing.</p>}
      {sample && query.data ? <RecordSampleDialog request={query.data} onClose={() => setSample(false)} onDone={() => { setSample(false); void query.refetch(); }} /> : null}
    </>}</RecordState>
  </article>;
}
function WorksheetPrint({ record, close }: { record: z.infer<typeof worksheetSchema>; close: () => void }) {
  return <PrintPreviewDialog title={record.worksheetTemplateCode ?? "Worksheet"} onClose={close}><section className="space-y-3"><h1>{record.worksheetTemplateCode} · version {record.worksheetTemplateVersion}</h1>
    {record.sections.map((section) => <section key={section.id}><h2>{section.name}</h2>{section.fields.map((field) => <div key={field.id} className="break-inside-avoid py-2"><strong>{field.label ?? field.fieldKey}</strong><p>{field.constantValue}</p>{field.values.map((entry, index) => <p key={index}>{entry.rowIndex == null ? "" : `Row ${entry.rowIndex + 1}`} {entry.columnKey} · {entry.value} {field.unit}</p>)}</div>)}</section>)}
  </section></PrintPreviewDialog>;
}
