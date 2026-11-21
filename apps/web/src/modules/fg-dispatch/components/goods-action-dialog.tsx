import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { FormDialog } from "@/shared/forms/form-dialog";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { Allocation } from "../schemas/dispatch-schema";
import { audit } from "../lib/dispatch";
import { usePostApiV1FinishedGoodsAllocationsByIdLoadMutation, usePostApiV1FinishedGoodsAllocationsByIdClearanceMutation,
  usePostApiV1FinishedGoodsAllocationsByIdDispatchMutation, usePostApiV1FinishedGoodsAllocationsByIdDeliveryMutation,
  usePostApiV1FinishedGoodsAllocationsByIdCancelMutation } from "../api/goods-api";

export type GoodsAction = "load" | "clear" | "dispatch" | "deliver" | "cancel";
export const goodsKeys = { costing: "CanConfirmFinishedGoodsCosting", load: "CanLoadFinishedGoods", clear: "CanClearFinishedGoodsDispatch", dispatch: "CanDispatchFinishedGoods", deliver: "CanDeliverFinishedGoods", cancel: "CanCancelFinishedGoodsAllocation" } as const;
const labels = { load: "Record loading", clear: "Clear for departure", dispatch: "Record departure", deliver: "Record delivery", cancel: "Cancel packing list" };
const schema = z.object({ vehicle: z.string(), driver: z.string(), phone: z.string(), location: z.string(), inspection: z.string(), confirmed: z.boolean(),
  reason: z.string(), authorisation: z.string(), shelfLife: z.number().int().min(0).max(3650), exit: z.string(), receiver: z.string(), evidence: z.string(), condition: z.string(),
  lines: z.array(z.object({ noteId: z.string(), unitsPerPack: z.number(), accepted: z.number().min(0), damaged: z.number().min(0), short: z.number().min(0) })) });
type Values = z.infer<typeof schema>;

export function GoodsActionDialog({ action, allocation, onClose }: { action: GoodsAction; allocation: Allocation; onClose: () => void }) {
  const permission = usePermissionAction(goodsKeys[action]);
  const [message, setMessage] = useState("");
  const [load, loading] = usePostApiV1FinishedGoodsAllocationsByIdLoadMutation();
  const [clear, clearing] = usePostApiV1FinishedGoodsAllocationsByIdClearanceMutation();
  const [dispatch, dispatching] = usePostApiV1FinishedGoodsAllocationsByIdDispatchMutation();
  const [deliver, delivering] = usePostApiV1FinishedGoodsAllocationsByIdDeliveryMutation();
  const [cancel, cancelling] = usePostApiV1FinishedGoodsAllocationsByIdCancelMutation();
  const sources = allocation.products.flatMap((p) => p.sources.map((s) => ({ ...s, name: `${p.name} · ${s.batch ?? "batch"}` })));
  const unique = sources.filter((s, index) => sources.findIndex((other) => other.noteId === s.noteId) === index);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { vehicle: allocation.loadedVehicle ?? "", driver: allocation.loadedDriver ?? "", phone: allocation.loadedDriverPhone ?? "",
    location: allocation.loadingLocation ?? "", inspection: "", confirmed: false, reason: "", authorisation: "", shelfLife: 0, exit: "", receiver: "", evidence: "", condition: "",
    lines: unique.map((s) => ({ noteId: s.noteId ?? "", unitsPerPack: s.unitsPerPack, accepted: sources.filter((other) => other.noteId === s.noteId).reduce((sum, other) => sum + other.quantity, 0), damaged: 0, short: 0 })) } });
  const fields: WizardField<Values>[] = [];
  if (action === "load") fields.push(
    { type: InputTypes.TEXT, name: "vehicle", label: "Vehicle registration", required: true }, { type: InputTypes.TEXT, name: "driver", label: "Driver", required: true },
    { type: InputTypes.TEXT, name: "phone", label: "Driver contact", required: true }, { type: InputTypes.TEXT, name: "location", label: "Loading bay / location", required: true },
    { type: InputTypes.TEXT, name: "inspection", label: "Vehicle inspection reference", required: true }, { type: InputTypes.CHECKBOX, name: "confirmed", label: "Vehicle and loading/storage conditions are suitable" });
  if (action === "clear") fields.push(
    { type: InputTypes.TEXTAREA, name: "reason", label: "Payment or approved credit basis", required: true },
    { type: InputTypes.TEXT, name: "authorisation", label: "Customer authorisation / licence evidence", required: true },
    { type: InputTypes.NUMBER, name: "shelfLife", label: "Minimum remaining shelf life (days)", required: true },
    { type: InputTypes.CHECKBOX, name: "confirmed", label: "Agreed payment or credit terms are confirmed" });
  if (action === "dispatch") fields.push({ type: InputTypes.TEXT, name: "exit", label: "Gate / departure reference", required: true },
    { type: InputTypes.CHECKBOX, name: "confirmed", label: "Vehicle suitability and required transport conditions checked at departure" });
  if (action === "cancel") fields.push({ type: InputTypes.TEXTAREA, name: "evidence", label: "Reason and unloading/count-back evidence", required: true });
  if (action === "deliver") {
    fields.push({ type: InputTypes.TEXT, name: "receiver", label: "Customer receiver", required: true }, { type: InputTypes.TEXT, name: "evidence", label: "Signed proof of delivery reference", required: true },
      { type: InputTypes.TEXTAREA, name: "condition", label: "Product and transport condition, shortages or damage", required: true });
    unique.forEach((source, index) => {
      fields.push({ type: InputTypes.NUMBER, name: `lines.${index}.accepted`, label: `${source.name}: packs accepted`, required: true },
        { type: InputTypes.NUMBER, name: `lines.${index}.damaged`, label: `${source.name}: packs damaged`, required: true },
        { type: InputTypes.NUMBER, name: `lines.${index}.short`, label: `${source.name}: packs short`, required: true });
    });
  }
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    setMessage(""); const base = { ...audit, id: allocation.id };
    if (action === "deliver" && values.lines.some((l) => !l.noteId || l.unitsPerPack <= 0)) { setMessage("Reconcile the historical batch/pack conversion before recording delivery."); return; }
    const result = action === "load" ? await load({ ...base, domainEntitiesProductionOrdersLoadFinishedGoodsRequest: { vehicleRegistration: values.vehicle, driverName: values.driver, driverPhone: values.phone, loadingLocation: values.location, inspectionReference: values.inspection, conditionsConfirmed: values.confirmed } })
      : action === "clear" ? await clear({ ...base, domainEntitiesProductionOrdersClearFinishedGoodsDispatchRequest: { reason: values.reason, customerAuthorisationReference: values.authorisation, minimumRemainingShelfLifeDays: values.shelfLife, paymentOrCreditConfirmed: values.confirmed } })
      : action === "dispatch" ? await dispatch({ ...base, domainEntitiesProductionOrdersDispatchFinishedGoodsRequest: { exitReference: values.exit, vehicleInspected: values.confirmed, conditionsConfirmed: values.confirmed } })
      : action === "cancel" ? await cancel({ ...base, domainEntitiesFinishedGoodsRecallEvidenceRequest: { evidence: values.evidence } })
      : await deliver({ ...base, domainEntitiesProductionOrdersDeliverFinishedGoodsRequest: { receiverName: values.receiver, evidenceReference: values.evidence, conditionNotes: values.condition,
        lines: values.lines.map((l) => ({ finishedGoodsTransferNoteId: l.noteId, acceptedYield: l.accepted * l.unitsPerPack, damagedYield: l.damaged * l.unitsPerPack, shortYield: l.short * l.unitsPerPack })) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    onClose();
  });
  return <FormDialog allowed={permission.allowed} title={`${labels[action]} · ${allocation.orderCode ?? "order"}`} description={action === "load" ? "Goods remain on site and reserved while the waybill is prepared." : "The server verifies the document, stock and quality requirements before saving."}
    form={form} fields={fields} submitLabel={labels[action]} busy={loading.isLoading || clearing.isLoading || dispatching.isLoading || delivering.isLoading || cancelling.isLoading}
    message={message} onSubmit={(event) => void submit(event)} onClose={onClose} />;
}
