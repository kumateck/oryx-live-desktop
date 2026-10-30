import { useEffect, useMemo, useState } from "react";
import { PackQuantity } from "@/shared/packing/pack-quantity";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { utcBoundary } from "@/shared/format/date-boundary";
import { formatDate } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { formatMoney } from "@/shared/procurement/price";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useConvertCustomerQuotationMutation, useCreateCustomerQuotationMutation, useGetCustomerProfileQuery, useGetCustomerQuotationQuery, useLazyResolveQuotationPriceQuery, useSendCustomerQuotationMutation } from "../api/customer-api";
import { useProductChoices } from "../hooks/use-product-choices";
import { approvalStatusLabels, customerPath, customerPermissions, customersPath, lineTotal, quotationNextStep, quotationPath, quotationStatusLabels } from "../lib/customers";
import { profileSchema, quotationFormSchema, quotationSchema, orderedPacks, type CustomerQuotation, type QuotationFormValues, type QuotationLineValues } from "../schemas/customer-schema";

const emptyLine = (): QuotationLineValues => ({ product: null, packing: null, perShipper: 0, shippers: Number.NaN, loose: Number.NaN, unitPrice: Number.NaN, discount: 0, fromAgreement: null });

function Line({ form, index, customerId, currency, choices, onRemove }: { form: UseFormReturn<QuotationFormValues>; index: number; customerId: string; currency: string | null; choices: ReturnType<typeof useProductChoices>; onRemove: (() => void) | null }) {
  const [resolve, resolving] = useLazyResolveQuotationPriceQuery();
  const [product, packing, shippers, loose, unitPrice, discount, perShipper, fromAgreement] = useWatch({ control: form.control, name: [`items.${index}.product`, `items.${index}.packing`, `items.${index}.shippers`, `items.${index}.loose`, `items.${index}.unitPrice`, `items.${index}.discount`, `items.${index}.perShipper`, `items.${index}.fromAgreement`] });
  const quantity = orderedPacks({ shippers, loose, perShipper });
  const { ensurePacking, packingsOf } = choices;
  // Packing styles belong to the product: another product starts with none chosen and no price.
  useEffect(() => {
    if (!product) return;
    void ensurePacking(product.value);
    if (form.getFieldState(`items.${index}.product`).isDirty) { form.setValue(`items.${index}.packing`, null); form.setValue(`items.${index}.unitPrice`, Number.NaN); form.setValue(`items.${index}.fromAgreement`, null); }
  }, [product?.value]); // eslint-disable-line react-hooks/exhaustive-deps
  // Choosing the packing style looks up the price: the customer's agreed price if one is in effect, otherwise the list price.
  useEffect(() => {
    if (!product || !packing) return;
    form.setValue(`items.${index}.perShipper`, packingsOf(product.value).find((item) => item.value === packing.value)?.perShipper ?? 0);
    let current = true;
    void resolve({ customerId, productId: product.value, productPackingId: packing.value }).then((result) => {
      if (!current || !result.data || typeof result.data.unitPrice !== "number") return;
      form.setValue(`items.${index}.unitPrice`, result.data.unitPrice, { shouldValidate: true });
      form.setValue(`items.${index}.fromAgreement`, result.data.fromAgreement === true);
    });
    return () => { current = false; };
  }, [product?.value, packing?.value]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = lineTotal(quantity > 0 ? quantity : null, Number.isNaN(unitPrice) ? null : unitPrice, discount);
  const hasShippers = perShipper > 0;
  const fields: WizardField<QuotationFormValues>[] = [
    { type: InputTypes.SELECT, name: `items.${index}.product`, label: `Product ${index + 1}`, mode: "single", source: "async", loadOptions: choices.products, required: true, placeholder: "Search for a product", className: "md:col-span-2" },
    { type: InputTypes.SELECT, name: `items.${index}.packing`, label: "Packing style", mode: "single", source: "sync", options: packingsOf(product?.value), required: true, disabled: !product, placeholder: product ? "Select a packing style" : "Choose the product first" },
    { type: InputTypes.NUMBER, name: `items.${index}.shippers`, label: "Shippers", min: 0, step: 1, disabled: !packing || !hasShippers,
      ...(hasShippers ? { description: `${perShipper.toLocaleString()} packs each.` } : packing ? { description: "This packing style has no shipper size." } : {}) },
    { type: InputTypes.NUMBER, name: `items.${index}.loose`, label: "Loose packs", min: 0, step: 1, disabled: !packing,
      ...(hasShippers ? { description: `Fewer than ${perShipper.toLocaleString()}.` } : {}) },
    { type: InputTypes.NUMBER, name: `items.${index}.unitPrice`, label: `Price per pack${currency ? ` (${currency})` : ""}`, min: 0, description: "The price of one pack. Leave empty to use the price on record." },
    { type: InputTypes.NUMBER, name: `items.${index}.discount`, label: "Discount %", min: 0, max: 100 },
  ];
  return <li className="space-y-2 rounded-md border p-3">
    <div className="flex items-start gap-2"><FormWizard form={form} fields={fields} className="min-w-0 flex-1 md:grid-cols-3 xl:grid-cols-6" />
      <Button type="button" size="icon-sm" variant="ghost" className="mt-6" aria-label={`Remove item ${index + 1}`} disabled={!onRemove} onClick={() => onRemove?.()}><Trash2 /></Button></div>
    <p role="status" className="text-sm text-muted-foreground">{quantity > 0 ? <>Total packs <span className="font-medium text-foreground">{quantity.toLocaleString()}</span>{hasShippers ? ` (${(Number.isFinite(shippers) ? shippers : 0).toLocaleString()} × ${perShipper.toLocaleString()} + ${(Number.isFinite(loose) ? loose : 0).toLocaleString()} loose)` : ""} · </> : null}
      {!packing ? "Choose the packing style to see the price." : resolving.isFetching ? "Looking up the price…" : fromAgreement === true ? "The customer's agreed price is filled in." : fromAgreement === false ? "The product's list price is filled in." : "No price on record."}
      {total !== null ? <> · line total <span className="font-medium text-foreground">{formatMoney(total, currency)}</span></> : null}</p>
  </li>;
}

/** Drafts a quotation for a customer. It is saved as a draft and submitted for approval from its own page. */
export function CreateQuotationPage() {
  const { id: customerId = "" } = useParams();
  const navigate = useNavigate();
  const profileQuery = useGetCustomerProfileQuery(customerId, { skip: !customerId });
  const profile = useMemo(() => { const parsed = profileSchema.safeParse(profileQuery.data ?? null); return parsed.success ? parsed.data : null; }, [profileQuery.data]);
  const currency = profile?.currency?.symbol ?? null;
  const choices = useProductChoices();
  const [create, mutation] = useCreateCustomerQuotationMutation();
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const form = useForm<QuotationFormValues>({ resolver: zodResolver(quotationFormSchema), defaultValues: { code: "", validUntil: null, items: [emptyLine()] } });
  const errors = form.formState.errors;
  const lines = useFieldArray({ control: form.control, name: "items" });
  const items = useWatch({ control: form.control, name: "items" });
  const totals = items.map((line) => { const packs = orderedPacks(line); return lineTotal(packs > 0 ? packs : null, Number.isNaN(line.unitPrice) ? null : line.unitPrice, line.discount); });
  const total = totals.every((value) => value !== null) ? totals.reduce<number>((sum, value) => sum + (value ?? 0), 0) : null;
  const header: WizardField<QuotationFormValues>[] = [
    { type: InputTypes.TEXT, name: "code", label: "Quotation number", required: true },
    { type: InputTypes.DATE, name: "validUntil", label: "Valid until", required: true, minDate: new Date() },
  ];
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (!values.validUntil) return;
    const result = await create({ customerId, body: { code: values.code, validUntil: utcBoundary(values.validUntil, true),
      items: values.items.flatMap((line) => line.product && line.packing ? [{ productId: line.product.value, productPackingId: line.packing.value, quantity: orderedPacks(line), ...(Number.isNaN(line.unitPrice) ? {} : { unitPrice: line.unitPrice }), discountPercent: line.discount }] : []) } });
    if ("error" in result) { const reason = apiErrorMessage(result.error); if (/code/i.test(reason) && /exist/i.test(reason)) form.setError("code", { message: "A quotation with this number already exists" }); else setMessage(reason); return; }
    toast.success("Quotation saved as a draft");
    setSaved(true);
    void navigate(typeof result.data === "string" && result.data ? quotationPath(result.data) : customerPath(customerId));
  });
  const saving = mutation.isLoading;
  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !saving && !saved} />
    <PageHeader title="New quotation" crumbs={[{ label: "Customers", to: customersPath }, { label: profile?.name ?? "Customer", to: customerPath(customerId) }, { label: "New quotation" }]}
      actions={<><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(customerPath(customerId))}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : "Save draft"}</Button></>} />
    <section className="rounded-lg border bg-card p-4"><FormWizard form={form} fields={header} className="md:grid-cols-2" /></section>
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Items</h2>
        <span role="status" className="text-sm">Quotation value <span className="font-semibold">{total === null ? "not complete" : formatMoney(total, currency)}</span></span></div>
      <ul className="space-y-2">{lines.fields.map((field, index) => <Line key={field.id} form={form} index={index} customerId={customerId} currency={currency} choices={choices} onRemove={lines.fields.length > 1 ? () => lines.remove(index) : null} />)}</ul>
      {errors.items?.message ?? errors.items?.root?.message ? <p role="alert" className="text-sm text-destructive">{errors.items?.message ?? errors.items?.root?.message}</p> : null}
      <Button type="button" size="sm" variant="outline" onClick={() => lines.append(emptyLine())}><Plus />Add item</Button>
    </section>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
  </form>;
}

type QuotationLine = CustomerQuotation["items"][number];
const column = dataTableColumns<QuotationLine>();

function Detail({ quotation }: { quotation: CustomerQuotation }) {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [send] = useSendCustomerQuotationMutation();
  const [convert] = useConvertCustomerQuotationMutation();
  const [confirming, setConfirming] = useState<"send" | "convert" | null>(null);
  const step = quotationNextStep(quotation);
  const currency = quotation.currency;
  const columns = useMemo(() => column.columns([
    column.accessor("product", { header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.product}</div><div className="text-xs text-muted-foreground">{row.original.packing ?? "No packing style"}</div></div> }),
    column.accessor("quantity", { header: "Quantity", size: 190, cell: ({ row }) => <PackQuantity packs={row.original.quantity} split={{ shippers: row.original.shippers, loose: row.original.loose }} /> }),
    column.accessor("unitPrice", { header: "Price per pack", size: 150, cell: ({ row }) => formatMoney(row.original.unitPrice, currency) }),
    column.accessor("discount", { header: "Discount", size: 110, cell: ({ row }) => `${row.original.discount}%` }),
    column.accessor("total", { header: "Total", size: 160, cell: ({ row }) => <span className="font-medium">{formatMoney(row.original.total, currency)}</span> }),
  ]), [currency]);
  const back = quotation.customerId ? customerPath(quotation.customerId) : customersPath;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Quotation ${quotation.code}`} crumbs={[{ label: "Customers", to: customersPath }, { label: quotation.customerName, to: back }, { label: quotation.code }]} actions={<>
      {step.action === "send" && has(customerPermissions.createQuotation) ? <Button type="button" size="sm" onClick={() => setConfirming("send")}>Submit for approval</Button> : null}
      {step.action === "convert" && has(customerPermissions.convertQuotation) ? <Button type="button" size="sm" onClick={() => setConfirming("convert")}>Convert to production order</Button> : null}
    </>} />
    <div className="flex flex-wrap items-center gap-2"><Badge variant={quotation.status === 3 ? "destructive" : quotation.status === 2 ? "default" : "outline"}>{quotationStatusLabels[quotation.status] ?? "Unknown"}</Badge>
      <span className="text-sm text-muted-foreground">{quotation.customerName} · valid until {formatDate(quotation.validUntil) ?? "a date not recorded"}</span>
      <span className="ml-auto text-lg font-semibold">{formatMoney(quotation.total, currency)}</span></div>
    <p role="status" className="rounded-md border bg-muted/50 p-3 text-sm">{step.note}{quotation.status === 1 ? <> <Link className="text-primary underline-offset-2 hover:underline" to="/qa/pending-approvals">Open pending approvals</Link></> : null}</p>
    <ClientDataTable label="Quotation items" columns={columns} rows={quotation.items} getRowId={(row) => row.id} fill={false} emptyTitle="No items on this quotation" />
    <section className="space-y-2 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Approval trail</h2>
      {quotation.approvals.length === 0 ? <p className="text-sm text-muted-foreground">No approval stages recorded yet.</p>
        : <ol className="divide-y">{quotation.approvals.map((stage) => <li key={stage.id} className="flex items-center justify-between gap-3 py-2 text-sm"><div className="min-w-0"><p className="font-medium">Stage {stage.order}{stage.required ? " · required" : ""}</p>
          <p className="break-words text-xs text-muted-foreground">{stage.comments ?? "No comments"}</p></div><Badge variant={stage.status === 2 ? "destructive" : stage.status === 1 ? "default" : "outline"}>{approvalStatusLabels[stage.status] ?? "Unknown"}</Badge></li>)}</ol>}</section>
    {confirming === "send" ? <ConfirmActionDialog require={customerPermissions.createQuotation} destructive={false} title={`Submit ${quotation.code} for approval?`} description="It goes to its approval stages and can no longer be changed." confirmLabel="Submit for approval" busyLabel="Submitting…" onClose={() => setConfirming(null)}
      onConfirm={async () => { const result = await send(quotation.id); if ("error" in result) return apiErrorMessage(result.error); toast.success(`${quotation.code} submitted for approval`); return null; }} /> : null}
    {confirming === "convert" ? <ConfirmActionDialog require={customerPermissions.convertQuotation} destructive={false} title={`Convert ${quotation.code} to a production order?`} description="A production order is created for this customer at the approved prices and discounts. This cannot be undone." confirmLabel="Convert" busyLabel="Converting…" onClose={() => setConfirming(null)}
      onConfirm={async () => { const result = await convert(quotation.id); if ("error" in result) return apiErrorMessage(result.error); toast.success(`${quotation.code} converted to a production order`);
        if (typeof result.data === "string" && result.data) void navigate(`/crm/production-order/${result.data}`); return null; }} /> : null}
  </article>;
}

/** One quotation: its lines, its approval trail, and what can be done with it next. */
export function QuotationDetailPage() {
  const { id = "" } = useParams();
  const query = useGetCustomerQuotationQuery(id, { skip: !id });
  const quotation = useMemo(() => { const parsed = quotationSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading quotation" groups={3} />;
  if (!quotation) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Quotation unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a quotation the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={customersPath}>Customers</Link></Button></div></div>;
  return <Detail quotation={quotation} />;
}
