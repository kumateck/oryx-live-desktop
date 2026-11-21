import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/shared/forms/form-dialog";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useLazyGetApiV1FinishedGoodsRecallBatchesQuery, usePostApiV1FinishedGoodsRecallsMutation,
  usePostApiV1FinishedGoodsRecallsByIdContactsMutation, usePostApiV1FinishedGoodsRecallsByIdRecoveriesMutation,
  usePostApiV1FinishedGoodsRecallsByIdRecoveriesAndRecoveryIdDisposeMutation, usePostApiV1FinishedGoodsRecallsByIdDisposeStockMutation,
  usePostApiV1FinishedGoodsRecallsByIdAuthorityDecisionMutation, usePostApiV1FinishedGoodsRecallsByIdCloseMutation, usePostApiV1FinishedGoodsRecallsByIdReopenMutation } from "@/modules/fg-dispatch/public";
import { recallAudit, recallKeys, type Recall } from "../lib";

export type RecallAction = "decision" | "create" | "notify" | "recover" | "dispose" | "disposeStock" | "close" | "reopen";
const labels = { decision: "Record authority decision", create: "Initiate recall", notify: "Record notification", recover: "Receive recalled goods", dispose: "Dispose recovered goods", disposeStock: "Dispose held stock", close: "Close recall", reopen: "Reopen recall" };
const choice = z.object({ value: z.string(), label: z.string() }).nullable();
const schema = z.object({ number: z.string(), batch: choice, reason: z.string(), classification: z.string(), authority: z.string(), selection: choice,
  packs: z.number().int().min(0), units: z.number().min(0), evidence: z.string(), condition: z.string(), acknowledged: z.boolean(), effectiveness: z.boolean(), unrecoverable: z.number().min(0), unrecoverableReason: z.string() });
type Values = z.infer<typeof schema>;
export function RecallActionDialog({ action, recall, onClose, onSaved }: { action: RecallAction; recall?: Recall; onClose: () => void; onSaved: () => void }) {
  const permission = usePermissionAction(recallKeys[action]); const [message, setMessage] = useState("");
  const [loadBatches] = useLazyGetApiV1FinishedGoodsRecallBatchesQuery();
  const [create, creating] = usePostApiV1FinishedGoodsRecallsMutation();
  const [contact, contacting] = usePostApiV1FinishedGoodsRecallsByIdContactsMutation();
  const [recover, recovering] = usePostApiV1FinishedGoodsRecallsByIdRecoveriesMutation();
  const [dispose, disposing] = usePostApiV1FinishedGoodsRecallsByIdRecoveriesAndRecoveryIdDisposeMutation();
  const [disposeStock, disposingStock] = usePostApiV1FinishedGoodsRecallsByIdDisposeStockMutation();
  const [reopen, reopening] = usePostApiV1FinishedGoodsRecallsByIdReopenMutation();
  const [decision, deciding] = usePostApiV1FinishedGoodsRecallsByIdAuthorityDecisionMutation();
  const [close, closing] = usePostApiV1FinishedGoodsRecallsByIdCloseMutation();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { number: "", batch: null, reason: "", classification: recall?.regulatoryClassification ?? "Pending authority classification", authority: recall?.authorityReference ?? "Notification pending", selection: null,
    packs: 0, units: 0, evidence: "", condition: "", acknowledged: false, effectiveness: false, unrecoverable: 0, unrecoverableReason: "" } });
  const loader = useCallback<SelectLoader>(async (search, _page, signal) => {
    const request = loadBatches({ ...recallAudit, searchQuery: search }); signal.addEventListener("abort", () => request.abort(), { once: true });
    const rows = await request.unwrap();
    return { options: rows.flatMap((row) => row.id ? [{ value: row.id, label: `${row.productName ?? "Product"} · ${row.batchNumber ?? "Batch"}` }] : []), hasNext: false, hasPrevious: false };
  }, [loadBatches]);
  const traces = recall?.consignments ?? [];
  const fields: WizardField<Values>[] = [];
  if (action === "create") fields.push(
    { type: InputTypes.TEXT, name: "number", label: "Recall number", required: true },
    { type: InputTypes.SELECT, name: "batch", label: "Product batch", mode: "single", source: "async", loadOptions: loader, required: true },
    { type: InputTypes.TEXTAREA, name: "reason", label: "Reason and defect", required: true },
    { type: InputTypes.TEXT, name: "classification", label: "Authority classification / pending classification", required: true },
    { type: InputTypes.TEXT, name: "authority", label: "Authority notification reference / pending action", required: true });
  if (action === "decision") fields.push({ type: InputTypes.TEXT, name: "classification", label: "Authority classification", required: true },
    { type: InputTypes.TEXT, name: "authority", label: "Authority notification / acknowledgement reference", required: true });
  if (action === "notify") fields.push(
    { type: InputTypes.SELECT, name: "selection", label: "Affected consignment", mode: "single", source: "sync", required: true,
      options: traces.filter((row, index) => traces.findIndex((other) => other.allocationId === row.allocationId) === index).map((row) => ({ value: row.allocationId, label: `${row.customer ?? "Customer"} · ${row.waybill ?? row.stage ?? "On site"}` })) },
    { type: InputTypes.CHECKBOX, name: "acknowledged", label: "Recipient acknowledged the recall" },
    { type: InputTypes.CHECKBOX, name: "effectiveness", label: "Effectiveness / follow-up outcome verified and documented" });
  if (action === "recover") fields.push(
    { type: InputTypes.SELECT, name: "selection", label: "Dispatched consignment and batch", mode: "single", source: "sync", required: true,
      options: traces.filter((row) => row.dispatchedAt).map((row) => ({ value: `${row.allocationId}/${row.transferNoteId}`, label: `${row.customer ?? "Customer"} · ${row.waybill ?? "Consignment"} · ${row.packingStyle ?? "Pack"}` })) },
    { type: InputTypes.NUMBER, name: "packs", label: "Complete packs recovered", required: true }, { type: InputTypes.NUMBER, name: "units", label: "Additional loose base units", required: true },
    { type: InputTypes.TEXTAREA, name: "condition", label: "Returned product condition and quarantine location", required: true });
  if (action === "dispose") fields.push({ type: InputTypes.SELECT, name: "selection", label: "Quarantined recovery", mode: "single", source: "sync", required: true,
    options: (recall?.recoveries ?? []).filter((row) => !row.disposed).map((row) => ({ value: row.id, label: `${row.evidence ?? "Recovery"} · ${row.quantity} base units` })) });
  if (action === "disposeStock") fields.push({ type: InputTypes.SELECT, name: "selection", label: "Held transfer / packing style", mode: "single", source: "sync", required: true,
    options: (recall?.stocks ?? []).map((row) => ({ value: row.transferNoteId, label: `${row.transferNoteNumber ?? "Transfer"} · ${row.packingStyle ?? "Packing"}` })) },
    { type: InputTypes.NUMBER, name: "packs", label: "Complete packs destroyed", required: true }, { type: InputTypes.NUMBER, name: "units", label: "Additional loose base units destroyed", required: true });
  if (action !== "create") fields.push({ type: InputTypes.TEXTAREA, name: "evidence", label: action === "close" ? "Final reconciliation and effectiveness report" : action === "recover" ? "Unique return receipt reference and evidence" : "Decision, notification or destruction evidence", required: true });
  if (action === "close") fields.push({ type: InputTypes.NUMBER, name: "unrecoverable", label: "Unrecoverable base units", required: true },
    { type: InputTypes.TEXTAREA, name: "unrecoverableReason", label: "Unrecoverable quantities: justification and authorised outcome" });
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    setMessage("");
    if (action !== "create" && !recall) return;
    const selected = values.selection?.value ?? "";
    const trace = traces.find((row) => `${row.allocationId}/${row.transferNoteId}` === selected);
    const stock = recall?.stocks.find((row) => row.transferNoteId === selected);
    if ((action === "recover" && (!trace || trace.packs <= 0)) || (action === "disposeStock" && (!stock || stock.unitsPerPack <= 0))) { setMessage("Choose a batch with a verified pack conversion."); return; }
    const result = action === "create" ? await create({ ...recallAudit, domainEntitiesFinishedGoodsCreateFinishedGoodsRecallRequest: { code: values.number, batchManufacturingRecordId: values.batch?.value ?? "", reason: values.reason, regulatoryClassification: values.classification, authorityReference: values.authority } })
      : action === "decision" ? await decision({ ...recallAudit, id: recall?.id ?? "", domainEntitiesFinishedGoodsUpdateFinishedGoodsRecallDecisionRequest: { regulatoryClassification: values.classification, authorityReference: values.authority, evidence: values.evidence } })
      : action === "notify" ? await contact({ ...recallAudit, id: recall?.id ?? "", domainEntitiesFinishedGoodsRecordRecallContactRequest: { allocationId: selected, acknowledged: values.acknowledged, effectivenessConfirmed: values.effectiveness, evidence: values.evidence } })
      : action === "recover" ? await recover({ ...recallAudit, id: recall?.id ?? "", domainEntitiesFinishedGoodsRecordRecallRecoveryRequest: { allocationId: trace?.allocationId ?? "", finishedGoodsTransferNoteId: trace?.transferNoteId ?? "", quantity: values.packs * ((trace?.yield ?? 0) / (trace?.packs || 1)) + values.units, condition: values.condition, evidence: values.evidence } })
      : action === "dispose" ? await dispose({ ...recallAudit, id: recall?.id ?? "", recoveryId: selected, domainEntitiesFinishedGoodsRecallEvidenceRequest: { evidence: values.evidence } })
      : action === "disposeStock" ? await disposeStock({ ...recallAudit, id: recall?.id ?? "", domainEntitiesFinishedGoodsDisposeRecalledStockRequest: { transferNoteId: selected, quantity: values.packs * (stock?.unitsPerPack ?? 0) + values.units, evidence: values.evidence } })
      : action === "reopen" ? await reopen({ ...recallAudit, id: recall?.id ?? "", domainEntitiesFinishedGoodsRecallEvidenceRequest: { evidence: values.evidence } })
      : await close({ ...recallAudit, id: recall?.id ?? "", domainEntitiesFinishedGoodsCloseFinishedGoodsRecallRequest: { evidence: values.evidence, unrecoverableYield: values.unrecoverable, unrecoverableReason: values.unrecoverableReason } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; } onSaved(); onClose();
  });
  return <FormDialog allowed={permission.allowed} title={labels[action]} description={action === "create" ? "Immediately blocks every transfer of the selected batch. Authority classification remains a human decision; pending notification is tracked explicitly." : "Physical recovery, quarantine and QA disposition are recorded separately from financial credits or replacements."}
    form={form} fields={fields} message={message} submitLabel={labels[action]} busy={creating.isLoading || contacting.isLoading || recovering.isLoading || disposing.isLoading || disposingStock.isLoading || closing.isLoading || reopening.isLoading || deciding.isLoading} onSubmit={(event) => void submit(event)} onClose={onClose} />;
}
