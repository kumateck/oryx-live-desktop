import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { qcApi } from "@/shared/api/generated/qc";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { DropdownButton } from "@/shared/actions";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import { RecordState } from "@/shared/workflows/record-state";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { utcBoundary } from "@/shared/format/date-boundary";
import { retestAudit as audit } from "../schemas/retest";

const nullableText = z.string().nullish();
const caseSchema = z.object({ id: z.string(), testRequestId: z.string(), worksheetInstanceId: z.string(), fieldKey: z.string(), status: z.number().int().min(0).max(4),
  observedValue: nullableText, breachedLimit: nullableText, acceptanceCriteria: nullableText, specificationCode: nullableText, specificationVersion: z.number(), retestPolicy: z.number(),
  investigationDetails: nullableText, rootCauseAnalysis: nullableText, correctiveActions: nullableText, preventiveActions: nullableText,
  retestWorksheetInstanceId: nullableText, blocksRelease: z.boolean(), dispositionOutcome: z.number().nullish(), dispositionComments: nullableText,
});
type OosCase = z.infer<typeof caseSchema>;
type Action = "start" | "findings" | "retest" | "escalate" | "disposition";
const permission = (action: Action) => action === "disposition" ? "CanDispositionQcOosCase" : action === "retest" || action === "escalate" ? "CanAuthorizeQcOosRetest" : "CanInvestigateQcOosCase";
const statuses = ["Open", "Investigation in progress", "Retest in progress", "Awaiting QA disposition", "Closed"];
const labels = { start: "Start investigation and quarantine", findings: "Record findings", retest: "Authorize retest", escalate: "Escalate to QA", disposition: "Sign QA disposition" };

export function WorksheetOosCase({ id, testRequestId, onWorksheet, onDone }: { id: string; testRequestId: string; onWorksheet: (id: string) => void; onDone: () => void }) {
  return <PermissionGuard require="CanViewQcOosCases"><CaseDetail id={id} testRequestId={testRequestId} onWorksheet={onWorksheet} onDone={onDone} /></PermissionGuard>;
}
function CaseDetail({ id, testRequestId, onWorksheet, onDone }: { id: string; testRequestId: string; onWorksheet: (id: string) => void; onDone: () => void }) {
  const query = qcApi.useGetApiV1QcWorksheetsOosCasesByIdQuery({ ...audit, id });
  const parsed = caseSchema.safeParse(query.data);
  const [action, setAction] = useState<Action | null>(null);
  const record = parsed.success && parsed.data.testRequestId === testRequestId ? parsed.data : null;
  return <RecordState loading={query.isLoading} data={record} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(value) => <section className="min-w-0 space-y-3 border-t pt-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">OOS · {value.fieldKey} · {statuses[value.status]}</h2>
      <DropdownButton label="OOS actions" items={([
        ...(value.status === 0 ? ["start" as const] : []), ...(value.status === 1 ? ["findings" as const, "retest" as const, "escalate" as const] : []), ...(value.status === 3 ? ["disposition" as const] : []),
      ]).map((kind) => ({ id: kind, label: labels[kind], require: permission(kind), onSelect: () => setAction(kind) }))} />
    </div>
    <DetailGroup title="Breach and pinned specification"><DetailItem label="Observed result" value={value.observedValue} /><DetailItem label="Breached limit" value={value.breachedLimit} /><DetailItem label="Acceptance criteria" value={value.acceptanceCriteria} />
      <DetailItem label="Specification" value={`${value.specificationCode ?? ""} · version ${value.specificationVersion}`} /><DetailItem label="Retest sample policy" value={value.retestPolicy === 2 ? "Fresh sample" : "Same sample"} /><DetailItem label="Release hold" value={value.blocksRelease ? "Blocked" : "Closed"} /></DetailGroup>
    <DetailGroup title="Investigation and disposition"><DetailItem label="Findings" value={value.investigationDetails} /><DetailItem label="Root cause" value={value.rootCauseAnalysis} /><DetailItem label="Corrective actions" value={value.correctiveActions} /><DetailItem label="Preventive actions" value={value.preventiveActions} /><DetailItem label="QA outcome" value={value.dispositionOutcome ? ["", "Confirmed OOS", "Original invalidated", "Retest accepted"][value.dispositionOutcome] : null} /><DetailItem label="QA reason" value={value.dispositionComments} /></DetailGroup>
    <DropdownButton label="View results" items={[{ id: "original", label: "Original worksheet", onSelect: () => onWorksheet(value.worksheetInstanceId) }, ...(value.retestWorksheetInstanceId ? [{ id: "retest", label: "Linked retest worksheet", onSelect: () => onWorksheet(value.retestWorksheetInstanceId ?? "") }] : [])]} />
    {action ? <CaseAction record={value} action={action} onClose={() => setAction(null)} onDone={() => { setAction(null); void query.refetch(); onDone(); }} /> : null}
  </section>}</RecordState>;
}
const valuesSchema = z.object({ investigationDetails: z.string().trim().max(10000), rootCauseAnalysis: z.string().trim().max(10000), correctiveActions: z.string().trim().max(10000), preventiveActions: z.string().trim().max(10000), reason: z.string().trim().max(1000), password: z.string(), outcome: z.enum(["", "1", "2", "3"]), collectedAt: z.date().nullable(), arNumber: z.string().trim().max(100) });
type Values = z.infer<typeof valuesSchema>;
function CaseAction({ record, action, onClose, onDone }: { record: OosCase; action: Action; onClose: () => void; onDone: () => void }) {
  const command = useVerifiedMutation<OosCase>(permission(action), record);
  const [read] = qcApi.useLazyGetApiV1QcWorksheetsOosCasesByIdQuery();
  const [pending] = qcApi.useLazyGetApiV1QcWorksheetsApprovalsMyPendingQuery();
  const [start] = qcApi.usePostApiV1QcWorksheetsOosCasesByIdStartInvestigationMutation();
  const [findings] = qcApi.usePutApiV1QcWorksheetsOosCasesByIdInvestigationMutation();
  const [retest] = qcApi.usePostApiV1QcWorksheetsOosCasesByIdAuthorizeRetestMutation();
  const [escalate] = qcApi.usePostApiV1QcWorksheetsOosCasesByIdEscalateMutation();
  const [disposition] = qcApi.usePostApiV1QcWorksheetsOosCasesByIdDispositionMutation();
  const form = useForm<Values>({ resolver: zodResolver(valuesSchema), defaultValues: { investigationDetails: record.investigationDetails ?? "", rootCauseAnalysis: record.rootCauseAnalysis ?? "", correctiveActions: record.correctiveActions ?? "", preventiveActions: record.preventiveActions ?? "", reason: "", password: "", outcome: "", collectedAt: null, arNumber: "" } });
  const [message, setMessage] = useState("");
  const fields: WizardField<Values>[] = action === "findings" ? (["investigationDetails", "rootCauseAnalysis", "correctiveActions", "preventiveActions"] as const).map((name) => ({ type: InputTypes.TEXTAREA, name, label: { investigationDetails: "Investigation findings", rootCauseAnalysis: "Root cause analysis", correctiveActions: "Corrective actions", preventiveActions: "Preventive actions" }[name], required: true }))
    : action === "disposition" ? [{ type: InputTypes.RADIO, name: "outcome", label: "QA disposition", required: true, options: [{ value: "1", label: "Confirmed OOS — reject batch" }, { value: "2", label: "Original result invalidated" }, { value: "3", label: "Retest accepted" }] }, { type: InputTypes.PASSWORD, name: "password", label: "Your password", required: true }, { type: InputTypes.TEXTAREA, name: "reason", label: "Disposition reason", required: true }]
    : action === "retest" || action === "escalate" ? [{ type: InputTypes.TEXTAREA, name: "reason", label: "Reason", required: true }, ...(action === "retest" && record.retestPolicy === 2 ? [{ type: InputTypes.DATE, name: "collectedAt", label: "Fresh sample collected at", required: true } as const, { type: InputTypes.TEXT, name: "arNumber", label: "Fresh sample AR number" } as const] : [])] : [];
  const execute = async (values: Values) => {
    if (action === "findings" && [values.investigationDetails, values.rootCauseAnalysis, values.correctiveActions, values.preventiveActions].some((entry) => entry.length < 3)) { setMessage("Complete all four findings before saving."); return; }
    if (action !== "start" && action !== "findings" && values.reason.length < 3 || action === "disposition" && (!values.password || !values.outcome) || action === "retest" && record.retestPolicy === 2 && (!values.collectedAt || values.collectedAt.getTime() > Date.now())) { setMessage("Complete the reason, sample information or signature fields before saving."); return; }
    const failure = await command.run(record, async () => {
      const fresh = caseSchema.parse(await read({ ...audit, id: record.id }, false).unwrap());
      if (action === "disposition") { const queue = await pending(audit, false).unwrap(); if (!queue.some((row) => row.entityType === "OosCase" && row.entityId === record.id)) throw new Error("This disposition is no longer assigned to you."); }
      return fresh;
    }, async () => {
      const args = { ...audit, id: record.id };
      const outcome = values.outcome === "1" ? 1 : values.outcome === "2" ? 2 : values.outcome === "3" ? 3 : null;
      if (action === "disposition" && !outcome) throw new Error("Choose a QA disposition explicitly.");
      const result = action === "start" ? await start(args) : action === "findings" ? await findings({ ...args, domainEntitiesQcWorksheetsUpdateOosInvestigationRequest: { investigationDetails: values.investigationDetails, rootCauseAnalysis: values.rootCauseAnalysis, correctiveActions: values.correctiveActions, preventiveActions: values.preventiveActions } })
        : action === "retest" ? await retest({ ...args, domainEntitiesQcWorksheetsAuthorizeOosRetestRequest: { reason: values.reason, collectedAt: values.collectedAt ? utcBoundary(values.collectedAt) : null, arNumber: values.arNumber || null } })
        : action === "escalate" ? await escalate({ ...args, domainEntitiesQcWorksheetsEscalateOosCaseRequest: { reason: values.reason } })
        : await disposition({ ...args, domainEntitiesQcWorksheetsOosDispositionRequest: { password: values.password, ...(outcome ? { outcome } : {}), dispositionComments: values.reason } });
      if ("error" in result) throw new Error(apiErrorMessage(result.error));
    });
    form.setValue("password", "");
    if (failure) setMessage(failure); else onDone();
  };
  return <SettingsFormDialog title={labels[action]} description="Original results remain recorded. Quarantine, retest policy and signed QA disposition are enforced by the server." form={form} fields={fields} saving={command.busy} submitDisabled={command.attempted || !command.allowed} submitLabel={labels[action]} message={message} onClose={onClose} onSubmit={execute} />;
}
