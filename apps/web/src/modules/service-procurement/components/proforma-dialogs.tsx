import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { servicesApi } from "@/shared/api/generated/services";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { amount, isoDay, proformaSchema, quotationSchema, serviceAudit, serviceKeys, type Proforma, type Quotation } from "../lib/service-procurement";

export const proformaRules = {
  request: { kind: "all" as const, permissions: [serviceKeys.proformaRequestsView, serviceKeys.proformaRequestSend] },
  respond: { kind: "all" as const, permissions: [serviceKeys.proformaResponsesView, serviceKeys.proformaResponseSend] },
  approve: { kind: "all" as const, permissions: [serviceKeys.ordersView, serviceKeys.orderCreate] },
};
const SELECTED = 3;
const today = () => new Date().toISOString().slice(0, 10);

function Shell({ title, description, busy, submit, label, onClose, children, message }: {
  title: string; description: string; busy: boolean; submit: () => Promise<void>; label: string; onClose: () => void; children: React.ReactNode; message: string;
}) {
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void submit(); }}>
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
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const submit = async () => {
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await read({ ...serviceAudit, id: quotation.id }, false);
    const current = fresh.data ? quotationSchema.safeParse(fresh.data) : null;
    if (!current?.success || !current.data.selected || current.data.status !== SELECTED || current.data.total !== quotation.total) { setMessage("This quotation changed after you opened it. Close this and check it again."); return; }
    const result = await send({ ...serviceAudit, domainEntitiesJobRequestsRequestServiceProformaInvoiceRequest: { jobOrderId: quotation.jobOrderId, serviceQuotationId: quotation.id, notes: notes.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Proforma invoice requested", { description: `${quotation.provider} has been asked for a proforma invoice.` }); onClose();
  };
  return <Shell title={`Request a proforma from ${quotation.provider}`} description={`For the selected quotation of ${amount(quotation.total, quotation.currency)}.`} busy={sending.isLoading} submit={submit} label="Send request" onClose={onClose} message={message}>
    <div className="space-y-1.5"><Label htmlFor="pr-notes">Notes to the provider</Label><Textarea id="pr-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
  </Shell>;
}

/** Record what the provider sent back: the invoice number, date, and any changed line prices. */
export function RespondProformaDialog({ proforma, onClose }: { proforma: Proforma; onClose: () => void }) {
  const permission = usePermissionAction(proformaRules.respond);
  const [read] = servicesApi.useLazyGetApiV1ServiceProformaInvoicesByIdQuery();
  const [respond, responding] = servicesApi.usePostApiV1ServiceProformaInvoicesRespondMutation();
  const [invoice, setInvoice] = useState("");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>(() => Object.fromEntries(proforma.items.map((i) => [i.id, String(i.unitPrice)])));
  const [message, setMessage] = useState("");
  const submit = async () => {
    setMessage("");
    if (!invoice.trim() || !date) { setMessage("Enter the provider's invoice number and the date it arrived."); return; }
    if (Object.values(prices).some((p) => !p.trim() || !(Number(p) >= 0))) { setMessage("Every line needs a unit price of zero or more."); return; }
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await read({ ...serviceAudit, id: proforma.id }, false);
    const current = fresh.data ? proformaSchema.safeParse(fresh.data) : null;
    if (!current?.success || current.data.status !== 0) { setMessage("This proforma has already been answered. Close this and check it again."); return; }
    const updatedItems = proforma.items.filter((i) => Number(prices[i.id]) !== i.unitPrice).map((i) => ({ serviceProformaInvoiceItemId: i.id, unitPrice: Number(prices[i.id]) }));
    const result = await respond({ ...serviceAudit, domainEntitiesJobRequestsRespondServiceProformaInvoiceRequest: {
      serviceProformaInvoiceId: proforma.id, invoiceNumber: invoice.trim(), responseDate: isoDay(date), responseNotes: notes.trim() || null, updatedItems } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Proforma response recorded"); onClose();
  };
  return <Shell title={`Proforma from ${proforma.provider}`} description={`Job order ${proforma.jobOrder}.`} busy={responding.isLoading} submit={submit} label="Record response" onClose={onClose} message={message}>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1.5"><Label htmlFor="pi-number">Invoice number</Label><Input id="pi-number" value={invoice} onChange={(e) => setInvoice(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="pi-date">Received</Label><Input id="pi-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
    </div>
    {proforma.items.length ? <fieldset className="space-y-2"><legend className="text-sm font-medium">Material prices on the invoice</legend>
      {proforma.items.map((i) => <div key={i.id} className="flex items-center gap-2 text-sm"><span className="min-w-0 flex-1 truncate">{i.name} · {i.quantity} {i.unit}</span>
        <Input aria-label={`Unit price of ${i.name}`} inputMode="decimal" className="w-36" value={prices[i.id] ?? ""} onChange={(e) => setPrices((p) => ({ ...p, [i.id]: e.target.value }))} /></div>)}
    </fieldset> : null}
    <div className="space-y-1.5"><Label htmlFor="pi-notes">Notes</Label><Textarea id="pi-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
  </Shell>;
}

/** Approve a received proforma so a service memo can be raised. */
export function ApproveProformaDialog({ proforma, onClose }: { proforma: Proforma; onClose: () => void }) {
  const permission = usePermissionAction(proformaRules.approve);
  const user = useCurrentUser();
  const [read] = servicesApi.useLazyGetApiV1ServiceProformaInvoicesByIdQuery();
  const [approve, approving] = servicesApi.usePostApiV1ServiceProformaInvoicesApproveMutation();
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState("");
  const submit = async () => {
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await read({ ...serviceAudit, id: proforma.id }, false);
    const current = fresh.data ? proformaSchema.safeParse(fresh.data) : null;
    if (!current?.success || current.data.status !== 1 || current.data.total !== proforma.total) { setMessage("This proforma changed after you opened it. Close this and check it again."); return; }
    if (!user) { setMessage("Sign in again before approving."); return; }
    // The server records the signed-in user as the approver whatever is sent here.
    const result = await approve({ ...serviceAudit, domainEntitiesJobRequestsApproveServiceProformaInvoiceRequest: { serviceProformaInvoiceId: proforma.id, approvedById: user.id, approvalComments: comments.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Proforma approved", { description: "A service memo can now be raised." }); onClose();
  };
  return <Shell title={`Approve ${proforma.invoice ?? "the proforma"}`} description={`${proforma.provider} · ${amount(proforma.total, proforma.currency)} for job order ${proforma.jobOrder}.`} busy={approving.isLoading} submit={submit} label="Approve" onClose={onClose} message={message}>
    <div className="space-y-1.5"><Label htmlFor="pa-comments">Comments</Label><Textarea id="pa-comments" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} /></div>
  </Shell>;
}
