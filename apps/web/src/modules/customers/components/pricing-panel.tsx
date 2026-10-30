import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { customerPermissions } from "../lib/customers";
import { utcBoundary } from "@/shared/format/date-boundary";
import { formatDate } from "@/shared/format/dates";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { formatMoney } from "@/shared/procurement/price";
import { useCreateCustomerPricingMutation, useDeleteCustomerPricingMutation, useGetCustomerPricingQuery, useUpdateCustomerPricingMutation } from "../api/customer-api";
import { useCustomerCollections } from "../hooks/use-customer-collections";
import { useProductChoices } from "../hooks/use-product-choices";
import { pricingFormSchema, pricingSchema, type PricingAgreement, type PricingFormValues } from "../schemas/customer-schema";
import { FormDialog } from "./form-dialog";

function PricingDialog({ customerId, agreement, currencies, onClose }: { customerId: string; agreement: PricingAgreement | null; currencies: readonly SelectOption[]; onClose: () => void }) {
  const [create, creating] = useCreateCustomerPricingMutation();
  const [update, updating] = useUpdateCustomerPricingMutation();
  const choices = useProductChoices();
  const [message, setMessage] = useState("");
  const form = useForm<PricingFormValues>({ resolver: zodResolver(pricingFormSchema), defaultValues: {
    product: agreement ? { value: agreement.productId, label: agreement.productName ?? "" } : null, packing: agreement ? { value: agreement.productPackingId, label: agreement.productPackingName ?? "" } : null,
    currency: agreement?.currency?.id ? { value: agreement.currency.id, label: agreement.currency.name ?? agreement.currency.symbol ?? "" } : null, price: agreement?.agreedPrice ?? Number.NaN,
    from: agreement ? new Date(agreement.effectiveFrom) : null, to: agreement?.effectiveTo ? new Date(agreement.effectiveTo) : null, notes: agreement?.notes ?? "" } });
  const product = useWatch({ control: form.control, name: "product" });
  const { ensurePacking } = choices;
  // The packing styles belong to the product, so another product starts with none chosen.
  useEffect(() => {
    if (!product) return;
    void ensurePacking(product.value);
    if (form.formState.dirtyFields.product) form.setValue("packing", null);
  }, [product?.value]); // eslint-disable-line react-hooks/exhaustive-deps
  const fields: WizardField<PricingFormValues>[] = [
    { type: InputTypes.SELECT, name: "product", label: "Product", mode: "single", source: "async", loadOptions: choices.products, required: true, placeholder: "Search for a product" },
    { type: InputTypes.SELECT, name: "packing", label: "Packing style", mode: "single", source: "sync", options: choices.packingsOf(product?.value), required: true, disabled: !product, placeholder: product ? "Select a packing style" : "Choose the product first" },
    { type: InputTypes.SELECT, name: "currency", label: "Currency", mode: "single", source: "sync", options: currencies, required: true, placeholder: "Select a currency" },
    { type: InputTypes.NUMBER, name: "price", label: "Agreed price per pack", description: "The price of one pack of this packing style.", min: 0, required: true },
    { type: InputTypes.DATE, name: "from", label: "Effective from", required: true },
    { type: InputTypes.DATE, name: "to", label: "Effective to", description: "Leave empty for an open-ended price." },
    { type: InputTypes.TEXTAREA, name: "notes", label: "Notes", rows: 2, className: "md:col-span-2" },
  ];
  const permission = usePermissionAction(customerPermissions.contracts);
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    if (!values.product || !values.packing || !values.currency || !values.from) return;
    const body = { productId: values.product.value, productPackingId: values.packing.value, currencyId: values.currency.value, agreedPrice: values.price, effectiveFrom: utcBoundary(values.from), effectiveTo: values.to ? utcBoundary(values.to, true) : null, ...(values.notes ? { notes: values.notes } : {}) };
    const result = agreement ? await update({ customerId, id: agreement.id, body }) : await create({ customerId, body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(agreement ? "Pricing agreement updated" : "Pricing agreement added");
    onClose();
  });
  return <FormDialog allowed={permission.allowed} wide title={agreement ? "Edit pricing agreement" : "Add pricing agreement"} description="An agreed price applies to quotations for this product and packing style while it is in effect." form={form} fields={fields} submitLabel={agreement ? "Save agreement" : "Add agreement"}
    busy={creating.isLoading || updating.isLoading} message={message} onSubmit={(event) => void submit(event)} onClose={onClose} />;
}

type Open = { kind: "create" } | { kind: "edit" | "remove"; agreement: PricingAgreement } | null;
/** The prices negotiated with the customer, each for one product, packing style and period. */
export function PricingPanel({ customerId }: { customerId: string }) {
  const query = useGetCustomerPricingQuery(customerId);
  const agreements = useMemo(() => { const parsed = pricingSchema.safeParse(query.data ?? []); return parsed.success ? parsed.data : []; }, [query.data]);
  const collections = useCustomerCollections();
  const [remove] = useDeleteCustomerPricingMutation();
  const [open, setOpen] = useState<Open>(null);
  return <section className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Negotiated pricing</h2><p className="text-xs text-muted-foreground">Dated price agreements by product and packing style, priced per pack and used by quotations.</p></div>
      <Button type="button" size="sm" onClick={() => setOpen({ kind: "create" })}><Plus />Add agreement</Button></div>
    {query.isLoading ? <div role="status" aria-label="Loading pricing" className="h-20 animate-pulse rounded-md bg-muted" />
      : query.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)}</p>
      : agreements.length === 0 ? <p className="text-sm text-muted-foreground">No pricing agreements. Quotations use each product's list price.</p>
      : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><caption className="sr-only">Pricing agreements</caption>
        <thead><tr className="border-b text-left text-xs text-muted-foreground"><th scope="col" className="py-1.5 font-medium">Product</th><th scope="col" className="py-1.5 font-medium">Packing style</th><th scope="col" className="py-1.5 text-right font-medium">Price per pack</th><th scope="col" className="py-1.5 font-medium pl-4">In effect</th><th scope="col" className="py-1.5"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{agreements.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="py-1.5 break-words">{item.productName ?? "–"}</td><td className="py-1.5">{item.productPackingName ?? "–"}</td>
          <td className="py-1.5 text-right font-medium">{formatMoney(item.agreedPrice, item.currency?.symbol)}</td><td className="py-1.5 pl-4">{formatDate(item.effectiveFrom) ?? "–"} to {item.effectiveTo ? formatDate(item.effectiveTo) : "open"}</td>
          <td className="py-1.5 text-right"><Button type="button" size="icon-sm" variant="ghost" aria-label={`Edit the price of ${item.productName ?? "product"}`} onClick={() => setOpen({ kind: "edit", agreement: item })}><Pencil /></Button>
            <Button type="button" size="icon-sm" variant="ghost" className="text-destructive" aria-label={`Remove the price of ${item.productName ?? "product"}`} onClick={() => setOpen({ kind: "remove", agreement: item })}><Trash2 /></Button></td></tr>)}</tbody></table></div>}
    {open?.kind === "create" ? <PricingDialog customerId={customerId} agreement={null} currencies={collections.currencies} onClose={() => setOpen(null)} /> : null}
    {open?.kind === "edit" ? <PricingDialog key={open.agreement.id} customerId={customerId} agreement={open.agreement} currencies={collections.currencies} onClose={() => setOpen(null)} /> : null}
    {open?.kind === "remove" ? <ConfirmActionDialog require={customerPermissions.contracts} title="Remove this pricing agreement?" description={`Quotations for ${open.agreement.productName ?? "this product"} go back to its list price. Quotations already raised keep their prices.`} confirmLabel="Remove agreement" busyLabel="Removing…" onClose={() => setOpen(null)}
      onConfirm={async () => { const result = await remove({ customerId, id: open.agreement.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Pricing agreement removed"); return null; }} /> : null}
  </section>;
}
