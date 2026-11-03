import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { servicesApi } from "@/shared/api/generated/services";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formDate, utcBoundary } from "@/shared/format/date-boundary";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { memoFormSchema, type MemoFormValues } from "../schemas/procurement-forms";
import { amount, memoSchema, proformaPageSchema, serviceAudit, serviceKeys, type Proforma, type ServiceMemo } from "../lib/service-procurement";

export const memoRules = {
  create: { kind: "all" as const, permissions: [serviceKeys.memoView, serviceKeys.memoCreate] },
  pay: { kind: "all" as const, permissions: [serviceKeys.memoView, serviceKeys.orderCreate] },
};
function MemoFields({ form, issueDate }: { form: UseFormReturn<MemoFormValues>; issueDate: boolean }) {
  const fields = useMemo<readonly WizardField<MemoFormValues>[]>(() => [
    ...(issueDate ? [{ type: InputTypes.DATE, name: "issued", label: "Issued", required: true } satisfies WizardField<MemoFormValues>] : []),
    { type: InputTypes.TEXT, name: "charge", label: "Agreed service charge", inputMode: "decimal", required: true },
    { type: InputTypes.TEXT, name: "materials", label: "Agreed materials cost", inputMode: "decimal", required: true },
    { type: InputTypes.DATE, name: "start", label: "Expected start", required: true },
    { type: InputTypes.DATE, name: "completion", label: "Expected completion", required: true },
    { type: InputTypes.TEXTAREA, name: "terms", label: "Terms and conditions", rows: 3, className: "md:col-span-2" },
    { type: InputTypes.TEXTAREA, name: "instructions", label: "Special instructions", rows: 2, className: "md:col-span-2" },
  ], [issueDate]);
  return <FormWizard form={form} fields={fields} className="md:grid-cols-2" />;
}

function MemoDialog({ title, description, busy, label, message, onClose, onSubmit, children }: {
  title: string; description: string; busy: boolean; label: string; message: string; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; children: React.ReactNode;
}) {
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.stopPropagation(); onSubmit(event); }}>
        <DialogBody className="space-y-3">{children}{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : label}</Button></DialogFooter>
      </form></DialogContent></Dialog>;
}

/** Raise the service memo for an approved proforma. */
export function CreateMemoDialog({ proforma, onClose, onCreated }: { proforma: Proforma; onClose: () => void; onCreated: (id: string) => void }) {
  const permission = usePermissionAction(memoRules.create);
  const user = useCurrentUser();
  const [readPending] = servicesApi.useLazyGetApiV1ServiceProformaInvoicesQuery();
  const [create, creating] = servicesApi.usePostApiV1ServiceMemosMutation();
  const form = useForm<MemoFormValues>({ resolver: zodResolver(memoFormSchema), defaultValues: { issued: formDate(new Date().toISOString()), charge: String(proforma.charge), materials: String(Math.max(0, proforma.total - proforma.charge)), start: null, completion: null, terms: "", instructions: "" } });
  const [message, setMessage] = useState("");
  const submit = form.handleSubmit(async (values) => {
    if (!values.issued || !values.start || !values.completion) return;
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    if (!user) { setMessage("Sign in again before raising a memo."); return; }
    const fresh = await readPending({ ...serviceAudit, jobOrderId: proforma.jobOrderId, memoPending: true, page: 1, pageSize: 5 }, false);
    const pending = fresh.data ? proformaPageSchema.safeParse(fresh.data) : null;
    const still = pending?.success ? pending.data.data.find((p) => p.id === proforma.id) : undefined;
    if (!still || still.total !== proforma.total) { setMessage("This proforma changed or already has a memo. Close this and check it again."); return; }
    const writeDenied = permission.check(); if (writeDenied) { setMessage(writeDenied); return; }
    const result = await create({ ...serviceAudit, domainEntitiesJobRequestsCreateServiceMemoRequest: {
      jobOrderId: proforma.jobOrderId, serviceQuotationId: proforma.quotationId, serviceProviderId: proforma.providerId, issuedById: user.id, issuedDate: utcBoundary(values.issued),
      agreedServiceCharge: Number(values.charge), agreedMaterialsCost: Number(values.materials), expectedStartDate: utcBoundary(values.start), expectedCompletionDate: utcBoundary(values.completion),
      termsAndConditions: values.terms.trim() || null, specialInstructions: values.instructions.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Service memo raised", { description: "It stays a draft until you issue it to the provider." });
    onCreated(result.data);
  });
  return <MemoDialog title={`Service memo for ${proforma.provider}`} description={`Job order ${proforma.jobOrder} · approved proforma ${proforma.invoice ?? ""} of ${amount(proforma.total, proforma.currency)}.`}
    busy={creating.isLoading || form.formState.isSubmitting} label="Raise memo" message={message} onClose={onClose} onSubmit={(event) => void submit(event)}>
    <fieldset disabled={form.formState.isSubmitting}><MemoFields form={form} issueDate /></fieldset>
  </MemoDialog>;
}

/** Change a draft memo before it is issued. */
export function EditMemoDialog({ memo, onClose }: { memo: ServiceMemo; onClose: () => void }) {
  const permission = usePermissionAction(memoRules.create);
  const [read] = servicesApi.useLazyGetApiV1ServiceMemosByIdQuery();
  const [update, updating] = servicesApi.usePutApiV1ServiceMemosByIdMutation();
  const form = useForm<MemoFormValues>({ resolver: zodResolver(memoFormSchema), defaultValues: { issued: formDate(memo.issued), charge: String(memo.charge), materials: String(memo.materials), start: formDate(memo.start), completion: formDate(memo.completion), terms: memo.terms ?? "", instructions: memo.instructions ?? "" } });
  const [message, setMessage] = useState("");
  const submit = form.handleSubmit(async (values) => {
    if (!values.issued || !values.start || !values.completion) return;
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await read({ ...serviceAudit, id: memo.id }, false);
    const current = fresh.data ? memoSchema.safeParse(fresh.data) : null;
    if (!current?.success || current.data.status !== 0 || current.data.total !== memo.total) { setMessage("This memo changed after you opened it. Close this and check it again."); return; }
    const writeDenied = permission.check(); if (writeDenied) { setMessage(writeDenied); return; }
    const result = await update({ ...serviceAudit, id: memo.id, domainEntitiesJobRequestsUpdateServiceMemoRequest: {
      agreedServiceCharge: Number(values.charge), agreedMaterialsCost: Number(values.materials), expectedStartDate: utcBoundary(values.start), expectedCompletionDate: utcBoundary(values.completion),
      termsAndConditions: values.terms.trim() || null, specialInstructions: values.instructions.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Memo updated"); onClose();
  }, (errors) => {
    if (errors.issued) setMessage("This memo's issue date could not be read, so it cannot be saved. Close this and check it again.");
  });
  return <MemoDialog title={`Edit ${memo.number}`} description="Only draft memos can change." busy={updating.isLoading || form.formState.isSubmitting} label="Save memo" message={message} onClose={onClose} onSubmit={(event) => void submit(event)}>
    <fieldset disabled={form.formState.isSubmitting}><MemoFields form={form} issueDate={false} /></fieldset>
  </MemoDialog>;
}
