import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePartnerCollections } from "@/shared/reference-data/use-partner-collections";
import { financeApi } from "../api/finance-api";
import { financeAudit, financePermissions, paymentPath } from "../lib/access";
import { dayStartUtc, methods, payableTypes, PayableType, PaymentMethod } from "../lib/payments";
import { paymentFormSchema, type PaymentFormValues } from "../schemas/payment-schema";
import { usePayableOptions } from "../hooks/use-payable-options";

export function RecordPaymentDialog({ receipt, onClose }: { receipt: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { allowsNow } = useAccess();
  const gate = usePermissionAction(financePermissions.record);
  const collections = usePartnerCollections("currency");
  const [record, mutation] = financeApi.usePostApiV1PaymentsMutation();
  const [message, setMessage] = useState("");
  const running = useRef(false);
  const form = useForm<PaymentFormValues>({ resolver: zodResolver(paymentFormSchema), defaultValues: {
    payableType: { value: receipt ? "3" : "0", label: receipt ? payableTypes[3] : payableTypes[0] }, payable: null, currency: null, amount: Number.NaN,
    method: { value: "0", label: methods[0] }, paymentDate: new Date(), reference: "", notes: "",
  } });
  const type = useWatch({ control: form.control, name: "payableType.value" });
  const lastType = useRef(type);
  useEffect(() => { if (lastType.current !== type) { lastType.current = type; form.resetField("payable", { defaultValue: null }); } }, [type, form]);
  const loadPayables = usePayableOptions(type);
  const fields: WizardField<PaymentFormValues>[] = [
    ...(!receipt ? [{ type: InputTypes.SELECT, name: "payableType", label: "Document type", mode: "single", source: "sync", options: payableTypes.slice(0, 3).map((label, index) => ({ value: String(index), label })), required: true } as const] : []),
    { type: InputTypes.SELECT, name: "payable", label: payableTypes[Number(type)] ?? "Document", mode: "single", source: "async", loadOptions: loadPayables, required: true },
    { type: InputTypes.NUMBER, name: "amount", label: "Amount", min: 0, required: true },
    { type: InputTypes.SELECT, name: "currency", label: "Currency", mode: "single", source: "sync", options: collections.currencies, required: true },
    { type: InputTypes.DATE, name: "paymentDate", label: "Payment date", required: true },
    { type: InputTypes.SELECT, name: "method", label: "Payment method", mode: "single", source: "sync", options: methods.map((label, index) => ({ value: String(index), label })), required: true },
    { type: InputTypes.TEXT, name: "reference", label: "Reference", required: true },
    { type: InputTypes.TEXTAREA, name: "notes", label: "Notes", rows: 3, className: "md:col-span-2" },
  ];
  const save = form.handleSubmit(async (values) => {
    if (running.current) return;
    setMessage(""); const denied = gate.check(); if (denied) { setMessage(denied); return; }
    if (!values.payable || !values.currency || (receipt ? values.payableType.value !== "3" : values.payableType.value === "3")) { setMessage("Choose the correct document and currency."); return; }
    running.current = true;
    try {
      const payableType = values.payableType.value === "3" ? PayableType.CustomerInvoice : values.payableType.value === "2" ? PayableType.PurchaseOrderInvoice : values.payableType.value === "1" ? PayableType.ShipmentInvoice : PayableType.BillingSheet;
      const method = values.method.value === "4" ? PaymentMethod.Other : values.method.value === "3" ? PaymentMethod.CreditCard : values.method.value === "2" ? PaymentMethod.Cash : values.method.value === "1" ? PaymentMethod.Cheque : PaymentMethod.BankTransfer;
      const result = await record({ ...financeAudit, domainEntitiesPaymentsRecordPaymentRequest: { amount: values.amount, currencyId: values.currency.value, paymentDate: dayStartUtc(values.paymentDate), method, reference: values.reference, notes: values.notes, payableType, payableId: values.payable.value } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      if (!result.data) { setMessage("The server did not confirm the record ID. Check the register before trying again."); return; }
      toast.success(receipt ? "Receipt recorded" : "Payment recorded"); onClose(); if (allowsNow(financePermissions.view)) void navigate(paymentPath(result.data));
    } finally { running.current = false; }
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isLoading) onClose(); }}><DialogContent className="sm:max-w-2xl">
    <DialogHeader><DialogTitle>{receipt ? "Record receipt" : "Record payment"}</DialogTitle><DialogDescription>Record the transaction against its existing document. The Payment approval workflow determines when it affects the outstanding balance.</DialogDescription></DialogHeader>
    <form noValidate className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={save}><DialogBody className="space-y-3">
      <fieldset disabled={mutation.isLoading || !gate.allowed}><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></fieldset>
      {collections.error ? <p role="alert">{collections.error} <Button type="button" variant="outline" size="sm" onClick={collections.retry}>Retry currencies</Button></p> : null}
      {message ? <p role="alert" className="text-destructive">{message}</p> : null}
    </DialogBody><DialogFooter><Button type="button" variant="outline" disabled={mutation.isLoading} onClick={onClose}>Cancel</Button><Button type="submit" disabled={mutation.isLoading || collections.loading || !gate.allowed}>{mutation.isLoading ? "Recording…" : receipt ? "Record receipt" : "Record payment"}</Button></DialogFooter></form>
  </DialogContent></Dialog>;
}
