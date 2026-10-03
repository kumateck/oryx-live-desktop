import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { z } from "zod";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { formsApi } from "@/shared/api/generated/forms";
import { productionApi } from "@/shared/api/generated/production";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { audit } from "../../lib/approval-documents";
import { DetailState, fullName, quantity, queryState } from "./detail-state";

const { useGetApiV1FormResponsesByFormResponseIdQuery, useGetApiV1FormByFormIdQuery, useGetApiV1FormResponsesMaterialBatchByMaterialBatchIdQuery, useGetApiV1FormResponsesBmrByBatchManufacturingRecordIdQuery } = formsApi;
const { useGetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdQuery, useGetApiV1ProductArdProductByProductIdQuery, useGetApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordIdQuery } = analyticalApi;
const { useGetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdQuery } = productionApi;

const text = z.string().nullish().transform((value) => value?.trim() || null);
const item = z.object({ id: z.string().nullish(), name: text, code: text }).nullish();
const person = z.object({ firstName: text, lastName: text }).nullish();
const answer = z.object({ responseId: z.string().nullish(), value: text, complies: z.boolean().nullish(), formField: z.object({ id: z.string().nullish() }).nullish() });
const answers = z.array(answer).nullish().transform((value) => value ?? []);
const responseSchema = z.object({ form: item, materialBatch: item, batchManufacturingRecord: item, formResponses: answers, checkedBy: person, checkedAt: z.string().nullish() });
const formSchema = z.object({ sections: z.array(z.object({ id: z.string().nullish(), name: text, description: text, groupName: text, order: z.number().nullish(),
  fields: z.array(z.object({ id: z.string().nullish(), rank: z.number().nullish(), question: z.object({ label: text }).nullish() })).nullish() })).nullish() });
const materialSchema = z.object({ arNumber: text, grnNumber: text, specNumber: text, stpNumber: text, supplier: item, manufacturer: item, sampledDate: z.string().nullish(), sampledBy: person, quantityReceived: z.number().nullish(), quantitySampled: z.number().nullish(),
  materialBatch: z.object({ batchNumber: text, material: item, uoM: z.object({ symbol: text }).nullish(), manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish() }).nullish() });
const batchSchema = z.object({ batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(), productionScheduleProduct: z.object({ product: item }).nullish() });
const productArds = z.array(z.object({ form: item, stage: z.number().nullish(), specNumber: text, productStandardTestProcedure: z.object({ stpNumber: text }).nullish() })).nullish().transform((value) => value ?? []);
const productSchema = z.object({ arNumber: text, specNumber: text, sampledDate: z.string().nullish(), issueNumber: text, issueDate: z.string().nullish(), issuedBy: person });
function useParsed<T>(schema: z.ZodType<T>, data: unknown): T | null {
  return useMemo(() => { const parsed = schema.safeParse(data ?? null); return parsed.success ? parsed.data : null; }, [schema, data]);
}
type Answer = z.infer<typeof answer>;

/** The answer recorded for each field. Where a field was answered more than once, the last answer with a value stands. */
export function answersByField(responses: readonly Answer[]): Map<string, Answer> {
  const map = new Map<string, Answer>();
  for (const response of responses) { const field = response.formField?.id; if (field && (response.value !== null || !map.has(field))) map.set(field, response); }
  return map;
}
const failed = (value: string | null) => /does not comply|not compl/i.test(value ?? "");

/**
 * Analytical raw data for a material or product batch: what was tested, the result recorded against each
 * specification, and whether each complies.
 */
export function ArdDetails({ id }: { id: string }) {
  const query = useGetApiV1FormResponsesByFormResponseIdQuery({ ...audit, formResponseId: id });
  const response = useParsed(responseSchema, query.data);
  const formId = response?.form?.id ?? null;
  const materialBatchId = response?.materialBatch?.id ?? null;
  const recordId = materialBatchId ? null : response?.batchManufacturingRecord?.id ?? null;
  const formQuery = useGetApiV1FormByFormIdQuery(formId ? { ...audit, formId } : skipToken);
  const materialQuery = useGetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdQuery(materialBatchId ? { ...audit, materialBatchId } : skipToken);
  const materialAnswers = useGetApiV1FormResponsesMaterialBatchByMaterialBatchIdQuery(materialBatchId ? { ...audit, materialBatchId } : skipToken);
  const batchQuery = useGetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdQuery(recordId ? { ...audit, batchManufacturingRecordId: recordId } : skipToken);
  const productAnswers = useGetApiV1FormResponsesBmrByBatchManufacturingRecordIdQuery(recordId ? { ...audit, batchManufacturingRecordId: recordId } : skipToken);
  const form = useParsed(formSchema, formQuery.data);
  const material = useParsed(materialSchema, materialQuery.data);
  const batch = useParsed(batchSchema, batchQuery.data);
  const productId = batch?.productionScheduleProduct?.product?.id ?? null;
  const ardsQuery = useGetApiV1ProductArdProductByProductIdQuery(productId ? { ...audit, productId } : skipToken);
  const ards = useParsed(productArds, ardsQuery.data);
  // The product's data sheet for this form says which stage was tested.
  const ard = ards?.find((entry) => entry.form?.id === formId) ?? ards?.[0] ?? null;
  const stage = ard?.stage;
  const productQuery = useGetApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordIdQuery(recordId && (stage === 0 || stage === 1 || stage === 2) ? { ...audit, batchManufacturingRecordId: recordId, testStage: stage } : skipToken);
  const product = useParsed(productSchema, productQuery.data);
  const batchAnswers = useParsed(answers, (materialBatchId ? materialAnswers.data : productAnswers.data) ?? []);
  const recorded = useMemo(() => {
    // The batch may carry answers from other data sheets; only this one's are being approved.
    const own = (batchAnswers ?? []).filter((entry) => !entry.responseId || entry.responseId === id);
    return answersByField(own.length > 0 ? own : response?.formResponses ?? []);
  }, [batchAnswers, response, id]);
  const sections = useMemo(() => [...(form?.sections ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [form]);
  const state = queryState(query);
  const loading = state.loading || formQuery.isLoading || materialQuery.isLoading || materialAnswers.isLoading || batchQuery.isLoading || productAnswers.isLoading || ardsQuery.isLoading || productQuery.isLoading;
  const failures = [...recorded.values()].filter((entry) => entry.complies === false || failed(entry.value)).length;

  return <DetailState {...state} loading={loading} value={response} label="analytical raw data">{(data) => { const unit = material?.materialBatch?.uoM?.symbol;
    return <div className="space-y-4">
      {materialBatchId ? <div className="grid gap-3 lg:grid-cols-2">
        <DetailGroup title="Material"><DetailItem label="Material" value={[material?.materialBatch?.material?.name ?? data.materialBatch?.name, material?.materialBatch?.material?.code ?? data.materialBatch?.code].filter(Boolean).join(" · ")} />
          <DetailItem label="Batch" value={material?.materialBatch?.batchNumber} /><DetailItem label="Supplier" value={material?.supplier?.name} /><DetailItem label="Manufacturer" value={material?.manufacturer?.name} />
          <DetailItem label="Manufactured" value={formatMonthYear(material?.materialBatch?.manufacturingDate)} /><DetailItem label="Expires" value={formatMonthYear(material?.materialBatch?.expiryDate)} /></DetailGroup>
        <DetailGroup title="Sample"><DetailItem label="AR number" value={material?.arNumber} /><DetailItem label="GRN" value={material?.grnNumber} /><DetailItem label="Specification" value={material?.specNumber} /><DetailItem label="Test procedure" value={material?.stpNumber} />
          <DetailItem label="Sampled" value={[formatDate(material?.sampledDate), fullName(material?.sampledBy)].filter(Boolean).join(" by ")} />
          <DetailItem label="Received / sampled" value={material ? `${quantity(material.quantityReceived, unit)} / ${quantity(material.quantitySampled, unit)}` : null} /></DetailGroup>
      </div> : <div className="grid gap-3 lg:grid-cols-2">
        <DetailGroup title="Product"><DetailItem label="Product" value={batch?.productionScheduleProduct?.product?.name ?? data.batchManufacturingRecord?.name} /><DetailItem label="Batch" value={batch?.batchNumber ?? data.batchManufacturingRecord?.code} />
          <DetailItem label="Manufactured" value={formatMonthYear(batch?.manufacturingDate)} /><DetailItem label="Expires" value={formatMonthYear(batch?.expiryDate)} /></DetailGroup>
        <DetailGroup title="Sample"><DetailItem label="AR number" value={product?.arNumber} /><DetailItem label="Specification" value={product?.specNumber ?? ard?.specNumber} /><DetailItem label="Test procedure" value={ard?.productStandardTestProcedure?.stpNumber} />
          <DetailItem label="Sampled" value={formatDate(product?.sampledDate)} /><DetailItem label="Issued" value={[product?.issueNumber, formatDate(product?.issueDate), fullName(product?.issuedBy)].filter(Boolean).join(" · ")} /></DetailGroup>
      </div>}
      {data.checkedAt || data.checkedBy ? <p className="text-sm text-muted-foreground">Checked {[formatDate(data.checkedAt), fullName(data.checkedBy)].filter(Boolean).join(" by ")}.</p> : null}
      {sections.length === 0 ? <p role="alert" className="rounded-md border border-destructive/50 p-3 text-sm">The tests on this data sheet could not be read, so the results cannot be laid out.</p> : <>
        <p role="status" className={`rounded-md border p-3 text-sm ${failures > 0 ? "border-destructive/50 bg-destructive/5" : "bg-muted/50"}`}>{failures > 0 ? `${failures} ${failures === 1 ? "result does" : "results do"} not comply with the specification.` : "No result is recorded as not complying."}</p>
        <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[720px] text-sm"><caption className="sr-only">Tests, results and specifications</caption>
          <thead><tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground"><th scope="col" className="w-12 p-2.5 font-medium">No.</th><th scope="col" className="w-[28%] p-2.5 font-medium">Test</th>
            <th scope="col" className="w-[30%] p-2.5 font-medium">Result</th><th scope="col" className="p-2.5 font-medium">Specification</th></tr></thead>
          <tbody>{sections.map((section, index) => { const fields = [...(section.fields ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
            return <tr key={section.id ?? index} className="border-b align-top last:border-0"><td className="p-2.5 text-muted-foreground">{index + 1}</td>
              <td className="p-2.5">{section.groupName ? <div className="text-xs text-muted-foreground">{section.groupName}</div> : null}<RichTextView html={section.name} className="font-medium" /></td>
              <td className="p-2.5"><ul className="space-y-1">{fields.map((field, position) => { const entry = field.id ? recorded.get(field.id) : undefined; const bad = entry?.complies === false || failed(entry?.value ?? null);
                return <li key={field.id ?? position} className={bad ? "text-destructive" : undefined}>{fields.length > 1 && field.question?.label ? <span className="text-muted-foreground">{field.question.label}: </span> : null}
                  {entry?.value ? <RichTextView html={entry.value} className="inline" /> : <span className="text-muted-foreground">No result</span>}</li>; })}
                {fields.length === 0 ? <li className="text-muted-foreground">No result</li> : null}</ul></td>
              <td className="p-2.5">{section.description ? <RichTextView html={section.description} /> : <span className="text-muted-foreground">–</span>}</td></tr>; })}</tbody></table></div></>}
    </div>; }}</DetailState>;
}
