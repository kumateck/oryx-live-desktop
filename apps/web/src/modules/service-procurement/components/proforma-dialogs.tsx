import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { servicesApi } from "@/shared/api/generated/services";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formDate, utcBoundary } from "@/shared/format/date-boundary";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { requestProformaFormSchema, approveProformaFormSchema, respondProformaFormSchema, type RespondProformaFormValues } from "../schemas/procurement-forms";
import { amount, proformaSchema, quotationSchema, serviceAudit, serviceKeys, type Proforma, type Quotation } from "../lib/service-procurement";

export const proformaRules = {
  request: { kind: "all" as const, permissions: [serviceKeys.proformaRequestsView, serviceKeys.proformaRequestSend] },
  respond: { kind: "all" as const, permissions: [serviceKeys.proformaResponsesView, serviceKeys.proformaResponseSend] },
  approve: { kind: "all" as const, permissions: [serviceKeys.ordersView, serviceKeys.orderCreate] },
};
const SELECTED = 3;
const requestFields = [{ type: InputTypes.TEXTAREA, name: "notes", label: "Notes to the provider", rows: 3 }] as const satisfies readonly WizardField<{ notes: string }>[];
const approveFields = [{ type: InputTypes.TEXTAREA, name: "comments", label: "Comments", rows: 3 }] as const satisfies readonly WizardField<{ comments: string }>[];
const responseFields = [
  { type: InputTypes.TEXT, name: "invoice", label: "Invoice number", required: true },
  { type: InputTypes.DATE, name: "date", label: "Received", required: true },
] as const satisfies readonly WizardField<RespondProformaFormValues>[];
const responseNotes = [{ type: InputTypes.TEXTAREA, name: "notes", label: "Notes", rows: 2 }] as const satisfies readonly WizardField<RespondProformaFormValues>[];

function Shell({ title, description, busy, submit, label, onClose, children, message }: {
  title: string; description: string; busy: boolean; submit: (event: React.FormEvent<HTMLFormElement>) => void; label: string; onClose: () => void; children: React.ReactNode; message: string;
}) {
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.stopPropagation(); submit(event); }}>
        <DialogBody className="space-y-3">{children}{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : label}</Button></DialogFooter>
      </form></DialogContent></Dialog>;
}

/** Ask the selected provider for a proforma invoice. */
export function RequestProformaDialog({ quotation, onClose }: { quotation: Quotation; onClose: () => void }) {
  const permission = usePermissionAction(proformaRules.request);
  const [read] = servicesApi.useLazyGetApiV1ServiceQuotationsByIdQuery();
  const [send, sending] = servicesApi.usePostApiV1ServiceProformaInvoicesRequestMutation();
  const form = useForm<{ notes: string }>({ resolver: zodResolver(requestProformaFormSchema), defaultValues: { notes: "" } });
  const [message, setMessage] = useState("");
  const submit = form.handleSubmit(async ({ notes }) => {
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await read({ ...serviceAudit, id: quotation.id }, false);
    const current = fresh.data ? quotationSchema.safeParse(fresh.data) : null;
    if (!current?.success || !current.data.selected || current.data.status !== SELECTED || current.data.total !== quotation.total) { setMessage("This quotation changed after you opened it. Close this and check it again."); return; }
    const writeDenied = permission.check(); if (writeDenied) { setMessage(writeDenied); return; }
    const result = await send({ ...serviceAudit, domainEntitiesJobRequestsRequestServiceProformaInvoiceRequest: { jobOrderId: quotation.jobOrderId, serviceQuotationId: quotation.id, notes: notes.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Proforma invoice requested", { description: `${quotation.provider} has been asked for a proforma invoice.` }); onClose();
  });
  return <Shell title={`Request a proforma from ${quotation.provider}`} description={`For the selected quotation of ${amount(quotation.total, quotation.currency)}.`} busy={sending.isLoading || form.formState.isSubmitting} submit={(event) => void submit(event)} label="Send request" onClose={onClose} message={message}>
    <fieldset disabled={form.formState.isSubmitting}><FormWizard form={form} fields={requestFields} /></fieldset>
  </Shell>;
}

/** Record what the provider sent back: the invoice number, date, and any changed line prices. */
export function RespondProformaDialog({ proforma, onClose }: { proforma: Proforma; onClose: () => void }) {
  const permission = usePermissionAction(proformaRules.respond);
  const [read] = servicesApi.useLazyGetApiV1ServiceProformaInvoicesByIdQuery();
  const [respond, responding] = servicesApi.usePostApiV1ServiceProformaInvoicesRespondMutation();
  const form = useForm<RespondProformaFormValues>({ resolver: zodResolver(respondProformaFormSchema), defaultValues: {
    invoice: "", date: formDate(new Date().toISOString()), notes: "", prices: proforma.items.map((item) => ({ price: String(item.unitPrice) })),
  } });
  const priceFields = useMemo<readonly WizardField<RespondProformaFormValues>[]>(() => proforma.items.map((item, index) => ({
    type: InputTypes.TEXT, name: `prices.${index}.price`, label: `Unit price of ${item.name}`, inputMode: "decimal", required: true,
    description: `${item.quantity} ${item.unit}`.trim(),
  })), [proforma.items]);
  const [message, setMessage] = useState("");
  const submit = form.handleSubmit(async ({ invoice, date, notes, prices }) => {
    if (!date) return;
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await read({ ...serviceAudit, id: proforma.id }, false);
    const current = fresh.data ? proformaSchema.safeParse(fresh.data) : null;
    if (!current?.success || current.data.status !== 0) { setMessage("This proforma has already been answered. Close this and check it again."); return; }
    const updatedItems = proforma.items.flatMap((item, index) => { const price = prices[index]; return price && Number(price.price) !== item.unitPrice ? [{ serviceProformaInvoiceItemId: item.id, unitPrice: Number(price.price) }] : []; });
    const writeDenied = permission.check(); if (writeDenied) { setMessage(writeDenied); return; }
    const result = await respond({ ...serviceAudit, domainEntitiesJobRequestsRespondServiceProformaInvoiceRequest: {
      serviceProformaInvoiceId: proforma.id, invoiceNumber: invoice.trim(), responseDate: utcBoundary(date), responseNotes: notes.trim() || null, updatedItems } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Proforma response recorded"); onClose();
  });
  return <Shell title={`Proforma from ${proforma.provider}`} description={`Job order ${proforma.jobOrder}.`} busy={responding.isLoading || form.formState.isSubmitting} submit={(event) => void submit(event)} label="Record response" onClose={onClose} message={message}>
    <fieldset disabled={form.formState.isSubmitting} className="space-y-4">
      <FormWizard form={form} fields={responseFields} className="md:grid-cols-2" />
      {proforma.items.length ? <section className="space-y-2"><h3 className="text-sm font-medium">Material prices on the invoice</h3><FormWizard form={form} fields={priceFields} className="md:grid-cols-2" /></section> : null}
      <FormWizard form={form} fields={responseNotes} />
    </fieldset>
  </Shell>;
}

/** Approve a received proforma so a service memo can be raised. */
export function ApproveProformaDialog({ proforma, onClose }: { proforma: Proforma; onClose: () => void }) {
  const permission = usePermissionAction(proformaRules.approve);
  const user = useCurrentUser();
  const [read] = servicesApi.useLazyGetApiV1ServiceProformaInvoicesByIdQuery();
  const [approve, approving] = servicesApi.usePostApiV1ServiceProformaInvoicesApproveMutation();
  const form = useForm<{ comments: string }>({ resolver: zodResolver(approveProformaFormSchema), defaultValues: { comments: "" } });
  const [message, setMessage] = useState("");
  const submit = form.handleSubmit(async ({ comments }) => {
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await read({ ...serviceAudit, id: proforma.id }, false);
    const current = fresh.data ? proformaSchema.safeParse(fresh.data) : null;
    if (!current?.success || current.data.status !== 1 || current.data.total !== proforma.total) { setMessage("This proforma changed after you opened it. Close this and check it again."); return; }
    if (!user) { setMessage("Sign in again before approving."); return; }
    // The server records the signed-in user as the approver whatever is sent here.
    const writeDenied = permission.check(); if (writeDenied) { setMessage(writeDenied); return; }
    const result = await approve({ ...serviceAudit, domainEntitiesJobRequestsApproveServiceProformaInvoiceRequest: { serviceProformaInvoiceId: proforma.id, approvedById: user.id, approvalComments: comments.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Proforma approved", { description: "A service memo can now be raised." }); onClose();
  });
  return <Shell title={`Approve ${proforma.invoice ?? "the proforma"}`} description={`${proforma.provider} · ${amount(proforma.total, proforma.currency)} for job order ${proforma.jobOrder}.`} busy={approving.isLoading || form.formState.isSubmitting} submit={(event) => void submit(event)} label="Approve" onClose={onClose} message={message}>
    <fieldset disabled={form.formState.isSubmitting}><FormWizard form={form} fields={approveFields} /></fieldset>
  </Shell>;
}
