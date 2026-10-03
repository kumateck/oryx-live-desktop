import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { usePutApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderIdMutation, useUploadPurchaseOrderFilesMutation } from "@/modules/proforma-requests/api/purchase-order-api";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { utcBoundary } from "@/shared/format/date-boundary";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import { useOrderTerms } from "../hooks/use-order-terms";
import { audit, proformaFileLimit, proformaFileTypes } from "../lib/proforma-response-access";
import { proformaInvoiceFormSchema, type ProformaInvoiceFormValues } from "../schemas/proforma-invoice-schema";

function startOfToday(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); }

/** Records the proforma invoice a supplier sent back: its number, terms, delivery and the document itself. */
export function ProformaInvoiceDialog({ order, onClose }: { order: PurchaseOrder; onClose: () => void }) {
  const terms = useOrderTerms();
  const [saveDetails, details] = usePutApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderIdMutation();
  const [upload, uploading] = useUploadPurchaseOrderFilesMutation();
  const [message, setMessage] = useState("");
  const [today] = useState(startOfToday);
  const form = useForm<ProformaInvoiceFormValues>({ resolver: zodResolver(proformaInvoiceFormSchema),
    defaultValues: { invoiceNumber: order.proformaNumber ?? "", termsOfPayment: null, deliveryMode: null, attachments: [] } });
  const fields = useMemo((): WizardField<ProformaInvoiceFormValues>[] => [
    { type: InputTypes.TEXT, name: "invoiceNumber", label: "Proforma invoice number", required: true },
    { type: InputTypes.DATE, name: "estimatedDeliveryDate", label: "Estimated delivery", required: true, minDate: today },
    { type: InputTypes.SELECT, name: "termsOfPayment", label: "Terms of payment", mode: "single", source: "sync", options: terms.termsOfPayment, required: true, placeholder: terms.loading ? "Loading…" : "Select terms" },
    { type: InputTypes.SELECT, name: "deliveryMode", label: "Delivery mode", mode: "single", source: "sync", options: terms.deliveryModes, required: true, placeholder: terms.loading ? "Loading…" : "Select a mode" },
    { type: InputTypes.UPLOAD, name: "attachments", label: "Proforma invoice document", mode: "multiple", accept: proformaFileTypes, maxSizeBytes: proformaFileLimit, required: true,
      description: "PDF, image, Word or Excel, up to 10 MB each.", className: "md:col-span-2" },
  ], [terms.termsOfPayment, terms.deliveryModes, terms.loading, today]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (!values.termsOfPayment || !values.deliveryMode) return;
    // The details first, the document second: attaching the document is what moves the order on, so an order
    // can never leave this list with its details missing. If the upload fails the order stays here to be retried.
    const saved = await saveDetails({ ...audit, purchaseOrderId: order.id, domainEntitiesPurchaseOrdersRequestUpdatePurchaseOrderFirstStep: {
      proFormaInvoiceNumber: values.invoiceNumber, termsOfPaymentId: values.termsOfPayment.value, deliveryModeId: values.deliveryMode.value, estimatedDeliveryDate: utcBoundary(values.estimatedDeliveryDate) } });
    if ("error" in saved) { setMessage(apiErrorMessage(saved.error)); return; }
    const attached = await upload({ ...audit, purchaseOrderId: order.id, files: values.attachments });
    if ("error" in attached) { setMessage(`The details were saved, but the document could not be attached: ${apiErrorMessage(attached.error)} Try again to attach it.`); return; }
    toast.success("Proforma invoice recorded", { description: `${order.code} moves on to purchase orders.` });
    onClose();
  });
  const busy = details.isLoading || uploading.isLoading;

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Record proforma invoice · {order.code}</DialogTitle>
        <DialogDescription>Enter what the supplier's proforma invoice says and attach the document.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <SupplierSummary supplier={order.supplier} />
          {terms.error ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{terms.error}<Button type="button" size="sm" variant="outline" onClick={terms.retry}>Retry</Button></p> : null}
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : "Record proforma invoice"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
