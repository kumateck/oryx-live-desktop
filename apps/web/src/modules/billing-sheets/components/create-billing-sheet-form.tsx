import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InvoiceLinesTable } from "@/modules/shipment-invoices/components/invoice-lines-table";
import { useGetApiV1ProcurementShipmentDocumentQuery } from "@/modules/shipment-documents/api/shipment-api";
import { shipmentStatus } from "@/modules/shipment-documents/lib/shipment-kinds";
import { shipmentRowsSchema } from "@/modules/shipment-documents/schemas/shipment-schema";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { formatMoney } from "@/shared/procurement/price";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import { usePostApiV1ProcurementBillingSheetMutation, useUploadBillingSheetFilesMutation } from "../api/billing-api";
import { useBillingCollections } from "../hooks/use-billing-collections";
import { audit, billingFileLimit, billingFileTypes, billingSheetPath, billingSheetsPath } from "../lib/billing-access";
import { detailsRequest } from "../lib/billing-rules";
import { createSheetSchema, type CreateSheetValues } from "../schemas/billing-schema";
import { ChargesEditor, emptyCharge } from "./charges-editor";
import { SheetDetailsFields } from "./sheet-details-fields";

/** Creates the billing sheet for a shipment that has not been cleared: its container, free time, charges and papers. */
export function CreateBillingSheetForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preset = params.get("invoiceId");
  // A sheet is for the invoice of a shipment still on its way or at the port, that has none yet.
  const shipments = useGetApiV1ProcurementShipmentDocumentQuery({ ...audit, page: 1, pageSize: 200 });
  const waiting = useMemo(() => { const parsed = shipmentRowsSchema.safeParse(shipments.data?.data ?? []);
    return parsed.success ? parsed.data.filter((item) => item.invoice && !item.hasBillingSheet && item.status <= shipmentStatus.atPort) : []; }, [shipments.data]);
  const collections = useBillingCollections();
  const code = useGeneratedCode("BillingSheet");
  const [create, creating] = usePostApiV1ProcurementBillingSheetMutation();
  const [upload, uploading] = useUploadBillingSheetFilesMutation();
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  // Once the sheet exists it must not be created again; a retry only attaches the papers.
  const created = useRef<string | null>(null);
  const form = useForm<CreateSheetValues>({ resolver: zodResolver(createSheetSchema), defaultValues: { code: "", billOfLading: "", arrival: null, freeDays: Number.NaN, containerNumber: "", packages: Number.NaN, packageStyle: null,
    packageDescription: "", invoice: null, charges: [emptyCharge(null)], attachments: [] } });
  // Read here so the form re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const chosen = useWatch({ control: form.control, name: "invoice" });
  const shipment = waiting.find((item) => item.invoice?.id === chosen?.value) ?? null;
  const invoice = shipment?.invoice ?? null;
  const supplierCurrency = useMemo(() => collections.currencies.find((item) => item.value === invoice?.supplier.currencyId) ?? null, [collections.currencies, invoice?.supplier.currencyId]);

  const options = useMemo(() => waiting.flatMap((item) => item.invoice ? [{ value: item.invoice.id, label: `${item.invoice.code} · ${item.invoice.supplier.name} · shipment ${item.code}` }] : []), [waiting]);
  // The invoice named in the address is chosen once the shipments are in; one that is not waiting is left out.
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current || !preset || shipments.isLoading) return;
    applied.current = true;
    const match = options.find((item) => item.value === preset);
    if (match) form.setValue("invoice", match, { shouldValidate: true });
    else setMessage("The invoice this page was opened for has no shipment waiting for a billing sheet. Choose one below.");
  }, [preset, shipments.isLoading, options, form]);
  // Charges with no currency yet take the supplier's once an invoice is chosen.
  useEffect(() => {
    if (!supplierCurrency) return;
    form.getValues("charges").forEach((line, index) => { if (!line.currency) form.setValue(`charges.${index}.currency`, supplierCurrency); });
  }, [supplierCurrency, form]);
  const suggested = useRef(false);
  useEffect(() => {
    if (!code.ready || suggested.current) return;
    suggested.current = true;
    void code.suggest().then((next) => { if (next && !form.getValues("code")) form.setValue("code", next, { shouldValidate: true }); });
  }, [code, form]);

  const fields = useMemo((): WizardField<CreateSheetValues>[] => [
    { type: InputTypes.SELECT, name: "invoice", label: "Shipment invoice", mode: "single", source: "sync", required: true, options,
      placeholder: shipments.isLoading ? "Loading…" : options.length ? "Select an invoice" : "No shipment is waiting for a billing sheet" },
  ], [options, shipments.isLoading]);
  const papers = useMemo((): WizardField<CreateSheetValues>[] => [
    { type: InputTypes.UPLOAD, name: "attachments", label: "Supporting documents", mode: "multiple", accept: billingFileTypes, maxSizeBytes: billingFileLimit, description: "Optional. PDF, image, Word or Excel, up to 10 MB each." },
  ], []);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (!values.invoice || !values.arrival || !invoice) return;
    if (!created.current) {
      const result = await create({ ...audit, domainEntitiesPurchaseOrdersRequestCreateBillingSheetRequest: {
        ...detailsRequest({ ...values, arrival: values.arrival, packageStyleId: values.packageStyle?.value ?? null }, values.invoice.value, invoice.supplier.id),
        charges: values.charges.flatMap((line) => line.charge && line.currency ? [{ chargeId: line.charge.value, currencyId: line.currency.value, amount: line.amount }] : []) } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      if (typeof result.data !== "string" || !result.data) { setMessage("The server did not say which billing sheet it created."); return; }
      created.current = result.data;
    }
    if (values.attachments.length > 0) {
      const attached = await upload({ ...audit, billingSheetId: created.current, files: values.attachments });
      if ("error" in attached) { setMessage(`The billing sheet was created, but its documents could not be attached: ${apiErrorMessage(attached.error)} Try again to attach them.`); return; }
    }
    toast.success("Billing sheet created", { description: "It is waiting for approval." });
    setSaved(true);
    void navigate(billingSheetPath(created.current));
  });
  const saving = creating.isLoading || uploading.isLoading;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !saving && !saved} />
    <PageHeader title="New billing sheet" crumbs={[{ label: "Billing sheets", to: billingSheetsPath }, { label: "New" }]}
      actions={<><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(billingSheetsPath)}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : created.current ? "Attach documents" : "Create billing sheet"}</Button></>} />
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    {shipments.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(shipments.error)}</p> : null}
    {collections.error ? <p role="alert" className="text-sm text-destructive">{collections.error} <Button type="button" size="sm" variant="link" onClick={collections.retry}>Retry</Button></p> : null}
    <section className="space-y-3 rounded-lg border bg-card p-4"><FormWizard form={form} fields={fields} />
      {invoice ? <><SupplierSummary supplier={invoice.supplier} />
        <p className="text-sm">Invoice value <span className="font-semibold">{invoice.total === null ? "not available" : formatMoney(invoice.total, invoice.currency)}</span> · {invoice.items.length} {invoice.items.length === 1 ? "material" : "materials"} · purchase orders {invoice.orders.join(", ") || "–"}</p></> : null}</section>
    {invoice ? <section className="space-y-2"><h2 className="text-sm font-semibold">Shipment invoice items</h2><InvoiceLinesTable label="Materials on the invoice" lines={invoice.items} currency={invoice.currency} /></section> : null}
    <SheetDetailsFields form={form} styles={collections.packageStyles} loading={collections.loading} />
    <ChargesEditor form={form} charges={collections.charges} currencies={collections.currencies} loading={collections.loading} defaultCurrency={supplierCurrency} />
    <section className="rounded-lg border bg-card p-4"><FormWizard form={form} fields={papers} /></section>
  </form>;
}
