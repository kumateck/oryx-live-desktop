import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { keys, procurementAudit, vendorQuotationSchema, type VendorQuotation } from "../lib/procurement";
import { vendorPricesFormSchema, type VendorPricesFormValues } from "../schemas/quotation-forms";

function priceFields(index: number, name: string): readonly WizardField<VendorPricesFormValues>[] {
  return [
    { type: InputTypes.TEXT, name: `prices.${index}.price`, label: `Unit price for ${name}`, inputMode: "decimal", required: true },
    { type: InputTypes.TEXT, name: `prices.${index}.per`, label: `Priced per for ${name}` },
  ];
}
export function VendorPricesDialog({ quotation, onClose }: { quotation: VendorQuotation; onClose: () => void }) {
  const permission = usePermissionAction({ kind: "all", permissions: [keys.responsesView, keys.responseSend] });
  const [reread] = inventoryApi.useLazyGetApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdQuery();
  const [receive, receiving] = inventoryApi.usePostApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdReceiveMutation();
  const form = useForm<VendorPricesFormValues>({ resolver: zodResolver(vendorPricesFormSchema), defaultValues: {
    prices: quotation.items.map((item) => ({ price: item.price === null ? "" : String(item.price), per: item.priceUnit ?? item.unit })),
  } });
  const fields = useMemo(() => quotation.items.map((item, index) => priceFields(index, item.name)), [quotation.items]);
  const [message, setMessage] = useState("");
  const busy = receiving.isLoading || form.formState.isSubmitting;
  const save = form.handleSubmit(async ({ prices }) => {
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await reread({ ...procurementAudit, vendorQuotationId: quotation.id }, false);
    const current = fresh.data ? vendorQuotationSchema.safeParse(fresh.data) : null;
    if (!current?.success || current.data.received || current.data.items.length !== quotation.items.length) { setMessage("This quotation changed after you opened it. Close this and open it again."); return; }
    const writeDenied = permission.check(); if (writeDenied) { setMessage(writeDenied); return; }
    const result = await receive({ ...procurementAudit, vendorQuotationId: quotation.id, body: quotation.items.flatMap((item, index) => {
      const price = prices[index]; return price ? [{ id: item.id, price: Number(price.price), priceUoM: price.per.trim() || null }] : [];
    }) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Prices recorded", { description: "They are now in the price comparison." }); onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-3xl">
    <DialogHeader><DialogTitle>Prices from {quotation.vendor.name}</DialogTitle><DialogDescription>Enter the unit price the vendor quoted for each item{quotation.vendor.currency ? `, in ${quotation.vendor.currency}` : ""}.</DialogDescription></DialogHeader>
    <form noValidate onSubmit={(event) => { event.stopPropagation(); void save(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <DialogBody className="space-y-3"><fieldset disabled={busy} className="space-y-3">{quotation.items.map((item, index) => <section key={item.id} className="min-w-0 space-y-2 rounded-md border p-3">
        <div className="flex flex-wrap justify-between gap-2 text-sm"><div><h3 className="break-words font-medium">{item.name}</h3><p className="font-mono text-xs text-muted-foreground">{item.code}</p></div><p>{`${String(item.quantity)} ${item.unit}`.trim()}</p></div>
        <FormWizard form={form} fields={fields[index] ?? []} className="sm:grid-cols-2" />
      </section>)}</fieldset>{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving…</> : "Record prices"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
