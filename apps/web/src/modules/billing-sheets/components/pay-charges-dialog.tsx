import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { utcBoundary } from "@/shared/format/date-boundary";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatMoney } from "@/shared/procurement/price";
import { usePutApiV1ProcurementBillingSheetChargeMutation } from "../api/billing-api";
import { audit, paymentMethods } from "../lib/billing-access";
import { chargeTotals, isPayable } from "../lib/billing-rules";
import { paymentSchema, type BillingCharge, type BillingSheet, type PaymentValues } from "../schemas/billing-schema";

const top: WizardField<PaymentValues>[] = [
  { type: InputTypes.DATE, name: "date", label: "Payment date", required: true, maxDate: new Date() },
  { type: InputTypes.SELECT, name: "method", label: "Paid by", mode: "single", source: "sync", options: paymentMethods, required: true },
];

function PaymentLine({ form, index, charge }: { form: UseFormReturn<PaymentValues>; index: number; charge: BillingCharge }) {
  const include = useWatch({ control: form.control, name: `lines.${index}.include` });
  const fields: WizardField<PaymentValues>[] = [
    { type: InputTypes.CHECKBOX, name: `lines.${index}.include`, label: `Pay ${charge.name} · ${formatMoney(charge.amount, charge.currency)}`, className: "md:col-span-2" },
    ...(include ? [{ type: InputTypes.TEXT, name: `lines.${index}.reference`, label: `Reference for ${charge.name}`, required: true, placeholder: "Bank or receipt reference" },
      { type: InputTypes.TEXT, name: `lines.${index}.notes`, label: `Notes for ${charge.name}` }] satisfies WizardField<PaymentValues>[] : []),
  ];
  return <li className="rounded-md border p-3"><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></li>;
}

/** Records the payment of one or more charges. Each is paid in full, with its own reference, and counts once the payment is approved. */
export function PayChargesDialog({ sheet, onClose }: { sheet: BillingSheet; onClose: () => void }) {
  const [pay, paying] = usePutApiV1ProcurementBillingSheetChargeMutation();
  const [message, setMessage] = useState("");
  // Fixed for the life of the dialog, so a refetch behind it cannot shift the rows under what was typed.
  const [payable] = useState(() => sheet.charges.filter(isPayable));
  const form = useForm<PaymentValues>({ resolver: zodResolver(paymentSchema), defaultValues: { date: new Date(), method: null, lines: payable.map((charge) => ({ id: charge.id, include: payable.length === 1, reference: "", notes: "" })) } });
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  const errors = form.formState.errors;
  const lines = useWatch({ control: form.control, name: "lines" });
  const totals = useMemo(() => chargeTotals(payable.filter((_charge, index) => lines[index]?.include)), [payable, lines]);
  const busy = paying.isLoading;

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (!values.date || !values.method) return;
    const chosen = values.lines.filter((line) => line.include);
    const result = await pay({ ...audit, domainEntitiesPurchaseOrdersRequestMarkBillingSheetChargePaymentsRequest: { paymentDate: utcBoundary(values.date), method: Number(values.method.value) as 0 | 1 | 2 | 3 | 4,
      charges: chosen.map((line) => ({ billingSheetChargeId: line.id, reference: line.reference.trim(), notes: line.notes.trim() || null })) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    const pending = result.data?.pendingChargeIds?.length ?? 0;
    toast.success(chosen.length === 1 ? "Payment recorded" : `${chosen.length} payments recorded`,
      pending > 0 ? { description: `${pending === 1 ? "1 payment waits" : `${pending} payments wait`} for approval before the charge counts as paid.` } : undefined);
    onClose();
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Record payment · {sheet.code}</DialogTitle><DialogDescription>Each charge is paid in full and needs its own reference. A payment may wait for approval before the charge counts as paid.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3">
          <FormWizard form={form} fields={top} className="md:grid-cols-2" />
          <ul aria-label="Charges to pay" className="space-y-2">{payable.map((charge, index) => <PaymentLine key={charge.id} form={form} index={index} charge={charge} />)}</ul>
          {errors.lines?.message ?? errors.lines?.root?.message ? <p role="alert" className="text-sm text-destructive">{errors.lines?.message ?? errors.lines?.root?.message}</p> : null}
          <p role="status" className="text-sm">{totals.length === 0 ? "Nothing ticked yet." : <>Paying <span className="font-semibold">{totals.map((item) => formatMoney(item.total, item.currency)).join(" + ")}</span></>}</p>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : "Record payment"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
