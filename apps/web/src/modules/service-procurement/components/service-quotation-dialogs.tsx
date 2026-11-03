import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { servicesApi } from "@/shared/api/generated/services";
import { settingsApi } from "@/shared/api/generated/settings";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formDate, utcBoundary } from "@/shared/format/date-boundary";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { Store, stores, storeValue } from "@/shared/inventory/stores";
import { useItemChoices } from "@/shared/inventory/use-item-choices";
import { quotationSchema, serviceAudit, serviceKeys, type Quotation } from "../lib/service-procurement";
import { editQuotationFormSchema, quotationFormSchema, type EditQuotationFormValues, type QuotationFormValues } from "../schemas/procurement-forms";
import { ChargeFields, MaterialFields, QuotationFields, materialStoreFields, quotationNotes } from "./service-quotation-fields";

export interface ProviderRow { id: string; jobOrderId: string; providerId: string; provider: string; sentAt: string | null; responded: boolean; respondedAt: string | null }
const send = { kind: "all" as const, permissions: [serviceKeys.responsesView, serviceKeys.responseSend] };
function useCollections() {
  const [load, state] = settingsApi.usePostApiV1CollectionMutation();
  useEffect(() => { void load({ ...serviceAudit, body: ["Currency", "Charge"] }); }, [load]);
  return useMemo(() => ({
    currencies: (state.data?.Currency ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.name ?? "Unnamed" }] : []),
    charges: (state.data?.Charge ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.name ?? "Unnamed" }] : []),
  }), [state.data]);
}
export function RecordQuotationDialog({ row, onClose }: { row: ProviderRow; onClose: () => void }) {
  const permission = usePermissionAction(send);
  const collections = useCollections();
  const form = useForm<QuotationFormValues>({ resolver: zodResolver(quotationFormSchema), defaultValues: {
    number: "", submitted: formDate(new Date().toISOString()), currency: null, days: "", completion: null, notes: "",
    store: { value: String(Store.General), label: stores[Store.General] ?? "General store" }, charges: [{ name: null, cost: "" }], materials: [],
  } });
  const store = useWatch({ control: form.control, name: "store" });
  const items = useItemChoices(storeValue(store.value) ?? Store.General, serviceAudit);
  const charges = useFieldArray({ control: form.control, name: "charges" });
  const materials = useFieldArray({ control: form.control, name: "materials" });
  const [create, creating] = servicesApi.usePostApiV1ServiceQuotationsMutation();
  const [message, setMessage] = useState("");
  const busy = creating.isLoading || form.formState.isSubmitting;
  const save = form.handleSubmit(async (values) => {
    if (!values.currency || !values.submitted || !values.completion) return;
    setMessage("");
    const mappedItems = [];
    for (const material of values.materials) {
      const item = items.lookup(material.item?.value);
      if (!item) { setMessage("A selected material could not be read. Choose it again."); return; }
      mappedItems.push({ itemId: item.id, quantity: Number(material.quantity), unitOfMeasureId: item.unitId, unitPrice: Number(material.price) });
    }
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const result = await create({ ...serviceAudit, domainEntitiesJobRequestsCreateServiceQuotationRequest: {
      jobOrderId: row.jobOrderId, serviceProviderId: row.providerId, quotationNumber: values.number.trim() || null, submittedDate: utcBoundary(values.submitted), currencyId: values.currency.value,
      estimatedDays: Number(values.days), estimatedCompletionDate: utcBoundary(values.completion), notes: values.notes.trim() || null,
      serviceCharges: values.charges.map((charge) => ({ name: charge.name?.label ?? "", cost: Number(charge.cost) })), items: mappedItems,
    } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Quotation recorded", { description: "It is now in the service price comparison." }); onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-4xl">
    <DialogHeader><DialogTitle>Quotation from {row.provider}</DialogTitle><DialogDescription>What the provider quoted for the job: service charges, any materials, and how long it will take.</DialogDescription></DialogHeader>
    <form noValidate onSubmit={(event) => { event.stopPropagation(); void save(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <DialogBody className="space-y-4"><fieldset disabled={busy} className="space-y-4">
        <QuotationFields form={form} currencies={collections.currencies} />
        <fieldset className="space-y-2"><legend className="text-sm font-medium">Service charges</legend>
          {charges.fields.map((charge, index) => <div key={charge.id} className="flex items-start gap-2"><ChargeFields form={form} index={index} options={collections.charges} />
            <Button type="button" size="icon" variant="ghost" aria-label={`Remove charge ${index + 1}`} disabled={charges.fields.length === 1} onClick={() => charges.remove(index)}><Trash2 /></Button></div>)}
          <Button type="button" size="sm" variant="outline" onClick={() => charges.append({ name: null, cost: "" })}><Plus />Add charge</Button></fieldset>
        <fieldset className="space-y-2"><legend className="text-sm font-medium">Materials</legend>
          <FormWizard form={form} fields={materialStoreFields} className="md:max-w-xs" />
          {materials.fields.map((material, index) => <div key={material.id} className="flex items-start gap-2"><MaterialFields form={form} index={index} loadOptions={items.loadOptions} />
            <Button type="button" size="icon" variant="ghost" aria-label={`Remove material ${index + 1}`} onClick={() => materials.remove(index)}><Trash2 /></Button></div>)}
          <Button type="button" size="sm" variant="outline" onClick={() => materials.append({ item: null, quantity: "", price: "" })}><Plus />Add material</Button></fieldset>
        <FormWizard form={form} fields={quotationNotes} />
      </fieldset>{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving…</> : "Record quotation"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
const editFields = [
  { type: InputTypes.TEXT, name: "charge", label: "Service charge", inputMode: "decimal", required: true },
  { type: InputTypes.TEXT, name: "days", label: "Estimated days", inputMode: "numeric", required: true },
  { type: InputTypes.DATE, name: "completion", label: "Estimated completion", required: true },
  { type: InputTypes.TEXTAREA, name: "notes", label: "Notes", rows: 2, className: "md:col-span-2" },
] as const satisfies readonly WizardField<EditQuotationFormValues>[];
export function EditQuotationDialog({ quotation, onClose }: { quotation: Quotation; onClose: () => void }) {
  const permission = usePermissionAction(send);
  const [read] = servicesApi.useLazyGetApiV1ServiceQuotationsByIdQuery();
  const [update, updating] = servicesApi.usePutApiV1ServiceQuotationsByIdMutation();
  const form = useForm<EditQuotationFormValues>({ resolver: zodResolver(editQuotationFormSchema), defaultValues: { charge: String(quotation.charge), days: String(quotation.days), completion: formDate(quotation.completion), notes: quotation.notes ?? "" } });
  const [message, setMessage] = useState("");
  const busy = updating.isLoading || form.formState.isSubmitting;
  const save = form.handleSubmit(async ({ charge, days, completion, notes }) => {
    if (!completion) return;
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await read({ ...serviceAudit, id: quotation.id }, false);
    const current = fresh.data ? quotationSchema.safeParse(fresh.data) : null;
    if (!current?.success || current.data.status !== quotation.status || current.data.total !== quotation.total) { setMessage("This quotation changed after you opened it. Close this and check it again."); return; }
    const writeDenied = permission.check(); if (writeDenied) { setMessage(writeDenied); return; }
    const result = await update({ ...serviceAudit, id: quotation.id, domainEntitiesJobRequestsUpdateServiceQuotationRequest: { serviceCharge: Number(charge), estimatedDays: Number(days), estimatedCompletionDate: utcBoundary(completion), notes: notes.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Quotation updated"); onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Edit {quotation.provider}'s quotation</DialogTitle><DialogDescription>Only open quotations can change; once one is selected they are fixed.</DialogDescription></DialogHeader>
    <form noValidate onSubmit={(event) => { event.stopPropagation(); void save(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <DialogBody className="space-y-3"><fieldset disabled={busy}><FormWizard form={form} fields={editFields} className="md:grid-cols-2" /></fieldset>{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || !permission.allowed}>Save quotation</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
