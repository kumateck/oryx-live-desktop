import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { PurchaseOrderLines } from "@/modules/proforma-requests/components/purchase-order-lines";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { amountInWords } from "@/shared/format/amount-words";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatMoney } from "@/shared/procurement/price";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdMutation } from "../api/order-api";
import { finaliseRequest, grandTotal, totalLabels, type OrderCharges } from "../lib/order-totals";
import { audit } from "../lib/purchase-order-access";
import { chargesSchema, type ChargesValues } from "../schemas/order-form-schema";
import { OrderTerms } from "./order-terms";

const amount = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? value : null;

/** Adds the charges to an order whose proforma invoice is in, which fixes its total and sends it to be checked. */
export function FinaliseOrderDialog({ order, type, onClose }: { order: PurchaseOrder; type: SupplierType; onClose: () => void }) {
  const [save, mutation] = usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdMutation();
  const [message, setMessage] = useState("");
  const currency = order.supplier.currency;
  const [schema] = useState(() => chargesSchema(type));
  const form = useForm<ChargesValues>({ resolver: zodResolver(schema),
    defaultValues: type === 1 ? { tax: order.recorded.freightOrTax } : { insurance: order.recorded.insurance ?? Number.NaN, freight: order.recorded.freightOrTax ?? Number.NaN } });
  const fields = useMemo((): WizardField<ChargesValues>[] => type === 1
    ? [{ type: InputTypes.NUMBER, name: "tax", label: `Tax${currency ? ` (${currency})` : ""}`, min: 0, placeholder: "None" }]
    : [{ type: InputTypes.NUMBER, name: "insurance", label: `Insurance${currency ? ` (${currency})` : ""}`, required: true, min: 0 },
      { type: InputTypes.NUMBER, name: "freight", label: `Freight${currency ? ` (${currency})` : ""}`, required: true, min: 0 }], [type, currency]);
  const watched = useWatch({ control: form.control });
  const charges: OrderCharges = { insurance: amount(watched.insurance), freight: amount(watched.freight), tax: amount(watched.tax) };
  // Without a value for every line there is no total to finalise.
  const value = order.total;
  const total = value === null ? null : grandTotal(type, value, charges);
  const labels = totalLabels[type];

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (value === null) return;
    const result = await save({ ...audit, purchaseOrderId: order.id, domainEntitiesPurchaseOrdersRequestUpdatePurchaseOrderRequest:
      finaliseRequest(type, value, { insurance: amount(values.insurance), freight: amount(values.freight), tax: amount(values.tax) }, order.supplier.currencyName) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Order finalised", { description: `${order.code} is waiting to be checked.` });
    onClose();
  });
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const busy = mutation.isLoading;

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>Finalise purchase order · {order.code}</DialogTitle>
        <DialogDescription>{type === 1 ? "Add any tax to the value of the lines." : "Add insurance and freight to the value of the lines."} The total is worked out for you, and the order then goes to be checked.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <SupplierSummary supplier={order.supplier} />
          <OrderTerms order={order} />
          <PurchaseOrderLines order={order} />
          {value === null ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">A line on this order cannot be costed, so the order has no value to finalise. Its price needs a unit the quantity can be converted to.</p> : <>
            <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
            <div role="status" className="ml-auto w-full max-w-sm space-y-1 rounded-md border p-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">{labels.value}</span><span>{formatMoney(value, currency)}</span></div>
              <div className="flex justify-between gap-4 border-t pt-1 font-semibold"><span>{labels.grand}</span><span>{formatMoney(total, currency)}</span></div>
              <p className="pt-1 text-xs text-muted-foreground">{amountInWords(total, order.supplier.currencyName)}</p>
            </div></>}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || value === null}>{busy ? <><Spinner />Saving…</> : "Finalise order"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
