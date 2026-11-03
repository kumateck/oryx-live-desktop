import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { settingsApi } from "@/shared/api/generated/settings";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { keys, procurementAudit, type MarketRequisition } from "../lib/procurement";
import { marketQuotesFormSchema, type MarketQuotesFormValues } from "../schemas/quotation-forms";

const newQuote = () => ({ name: "", address: "", phone: "", price: "", payment: "", terms: null, delivery: "" });
function quoteFields(index: number, terms: readonly SelectOption[]): readonly WizardField<MarketQuotesFormValues>[] {
  const n = String(index + 1);
  return [
    { type: InputTypes.TEXT, name: `quotes.${index}.name`, label: `Vendor ${n} name`, required: true },
    { type: InputTypes.TEXT, name: `quotes.${index}.phone`, label: `Vendor ${n} phone`, inputMode: "tel", required: true },
    { type: InputTypes.TEXT, name: `quotes.${index}.price`, label: `Vendor ${n} unit price`, inputMode: "decimal", required: true },
    { type: InputTypes.SELECT, name: `quotes.${index}.terms`, label: `Vendor ${n} terms of payment`, mode: "single", source: "sync", options: terms, required: true },
    { type: InputTypes.TEXT, name: `quotes.${index}.address`, label: `Vendor ${n} address`, className: "md:col-span-2" },
    { type: InputTypes.TEXT, name: `quotes.${index}.payment`, label: `Vendor ${n} mode of payment` },
    { type: InputTypes.TEXT, name: `quotes.${index}.delivery`, label: `Vendor ${n} delivery mode` },
  ];
}
export function MarketQuotesDialog({ market, existing, onClose }: { market: MarketRequisition; existing: readonly string[]; onClose: () => void }) {
  const permission = usePermissionAction({ kind: "all", permissions: [keys.marketSheetsView, keys.marketSheetCreate] });
  const [loadCollections, collectionState] = settingsApi.usePostApiV1CollectionMutation();
  useEffect(() => { void loadCollections({ ...procurementAudit, body: ["TermsOfPayment"] }); }, [loadCollections]);
  const terms = useMemo(() => (collectionState.data?.TermsOfPayment ?? []).flatMap((term) => term.id ? [{ value: term.id, label: term.name ?? "Unnamed terms" }] : []), [collectionState.data]);
  const [create, creating] = inventoryApi.usePostApiV1ProcurementInventoryMarketVendorsMutation();
  const form = useForm<MarketQuotesFormValues>({ resolver: zodResolver(marketQuotesFormSchema(existing)), defaultValues: { quotes: [newQuote()] } });
  const quotes = useFieldArray({ control: form.control, name: "quotes" });
  const fields = useMemo(() => quotes.fields.map((_quote, index) => quoteFields(index, terms)), [quotes.fields, terms]);
  const [message, setMessage] = useState("");
  const busy = creating.isLoading || form.formState.isSubmitting;
  const save = form.handleSubmit(async ({ quotes }) => {
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const result = await create({ ...procurementAudit, domainEntitiesItemsRequisitionsCreateMarketRequisitionVendor: { marketRequisitionId: market.id, vendors: quotes.map((quote) => ({
      vendorName: quote.name.trim(), vendorAddress: quote.address.trim() || null, vendorPhoneNumber: quote.phone.trim(), pricePerUnit: Number(quote.price),
      modeOfPayment: quote.payment.trim() || null, termsOfPaymentId: quote.terms?.value ?? "", deliveryMode: quote.delivery.trim() || null, complete: false,
    })) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(quotes.length === 1 ? "Quote added" : `${String(quotes.length)} quotes added`); onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-5xl">
    <DialogHeader><DialogTitle>Add open-market quotes</DialogTitle><DialogDescription>{market.name}: {`${String(market.quantity)} ${market.unit}`.trim()}. One row per vendor asked.</DialogDescription></DialogHeader>
    <form noValidate onSubmit={(event) => { event.stopPropagation(); void save(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <DialogBody className="space-y-3"><fieldset disabled={busy} className="space-y-3">{quotes.fields.map((quote, index) => <fieldset key={quote.id} className="min-w-0 space-y-2 rounded-md border p-3">
        <legend className="px-1 text-xs text-muted-foreground">Vendor {index + 1}</legend>
        <FormWizard form={form} fields={fields[index] ?? []} className="md:grid-cols-2 xl:grid-cols-4" />
        <Button type="button" size="sm" variant="ghost" aria-label={`Remove vendor ${index + 1}`} disabled={quotes.fields.length === 1} onClick={() => quotes.remove(index)}><Trash2 />Remove vendor</Button>
      </fieldset>)}<Button type="button" size="sm" variant="outline" onClick={() => quotes.append(newQuote())}><Plus />Add vendor</Button></fieldset>
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving…</> : "Save quotes"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
