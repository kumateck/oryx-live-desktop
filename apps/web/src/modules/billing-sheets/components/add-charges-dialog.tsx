import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1ProcurementBillingSheetChargeByBillingSheetIdMutation } from "../api/billing-api";
import { useBillingCollections } from "../hooks/use-billing-collections";
import { audit } from "../lib/billing-access";
import { addChargesSchema, type AddChargesValues, type BillingSheet } from "../schemas/billing-schema";
import { ChargesEditor, emptyCharge } from "./charges-editor";

/** Adds charges that came up after the sheet was approved. Charges already on the sheet are not offered again. */
export function AddChargesDialog({ sheet, onClose }: { sheet: BillingSheet; onClose: () => void }) {
  const collections = useBillingCollections("charges");
  const [add, adding] = usePostApiV1ProcurementBillingSheetChargeByBillingSheetIdMutation();
  const [message, setMessage] = useState("");
  const taken = useMemo(() => new Set(sheet.charges.map((charge) => charge.name.toLowerCase())), [sheet.charges]);
  const offered = useMemo(() => collections.charges.filter((charge) => !taken.has(charge.label.toLowerCase())), [collections.charges, taken]);
  const currency = useMemo(() => collections.currencies.find((item) => item.value === (sheet.charges[0]?.currencyId ?? sheet.supplier?.currencyId)) ?? null, [collections.currencies, sheet]);
  const form = useForm<AddChargesValues>({ resolver: zodResolver(addChargesSchema), defaultValues: { charges: [emptyCharge(null)] } });
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const busy = adding.isLoading;

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await add({ ...audit, billingSheetId: sheet.id, body: values.charges.flatMap((line) => line.charge && line.currency ? [{ chargeId: line.charge.value, currencyId: line.currency.value, amount: line.amount }] : []) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(values.charges.length === 1 ? "Charge added" : `${values.charges.length} charges added`);
    onClose();
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Add charges · {sheet.code}</DialogTitle><DialogDescription>The shipment cannot be cleared until every charge on its billing sheet is paid.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3">
          {collections.error ? <p role="alert" className="text-sm text-destructive">{collections.error}</p> : null}
          <ChargesEditor form={form} charges={offered} currencies={collections.currencies} loading={collections.loading} defaultCurrency={currency} />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : "Add charges"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
