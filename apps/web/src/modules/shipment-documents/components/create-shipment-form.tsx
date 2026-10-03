import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGetApiV1ProcurementShipmentInvoiceUnattachedQuery } from "@/modules/shipment-invoices/api/invoice-api";
import { InvoiceLinesTable } from "@/modules/shipment-invoices/components/invoice-lines-table";
import { invoiceRowsSchema } from "@/modules/shipment-invoices/schemas/invoice-schema";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { formatMoney } from "@/shared/procurement/price";
import { supplierTypeLabels } from "@/shared/procurement/supplier-type";
import { useUploadShipmentFilesMutation } from "../api/shipment-api";
import { useCreateShipment } from "../hooks/use-shipments";
import { shipmentFileLimit, shipmentFileTypes, shipmentKinds, shipmentPath, type ShipmentKind } from "../lib/shipment-kinds";
import { shipmentFormSchema, type ShipmentFormValues } from "../schemas/shipment-schema";

/** Creates a shipment document or a waybill for an invoice that is not yet on a delivery, with its shipping papers. */
export function CreateShipmentForm({ kind }: { kind: ShipmentKind }) {
  const config = shipmentKinds[kind];
  const navigate = useNavigate();
  const waiting = useGetApiV1ProcurementShipmentInvoiceUnattachedQuery({ ...config.audit });
  // Foreign invoices go on shipment documents and local ones on waybills.
  const invoices = useMemo(() => { const parsed = invoiceRowsSchema.safeParse(waiting.data ?? null); return parsed.success ? parsed.data.filter((invoice) => invoice.supplier.type === config.supplierType) : []; }, [waiting.data, config.supplierType]);
  const code = useGeneratedCode(config.codeModel);
  const { create, creating } = useCreateShipment(kind);
  const [upload, uploading] = useUploadShipmentFilesMutation();
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  // Once the document exists it must not be created again; a retry only attaches the papers.
  const created = useRef<string | null>(null);
  const form = useForm<ShipmentFormValues>({ resolver: zodResolver(shipmentFormSchema), defaultValues: { code: "", invoice: null, attachments: [] } });
  // Read here so the form re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const chosen = useWatch({ control: form.control, name: "invoice" });
  const invoice = invoices.find((item) => item.id === chosen?.value) ?? null;
  const fields = useMemo((): WizardField<ShipmentFormValues>[] => [
    { type: InputTypes.TEXT, name: "code", label: "Document number", required: true },
    { type: InputTypes.SELECT, name: "invoice", label: "Shipment invoice", mode: "single", source: "sync", required: true,
      options: invoices.map((item) => ({ value: item.id, label: `${item.code} · ${item.supplier.name}` })),
      placeholder: waiting.isLoading ? "Loading…" : invoices.length ? "Select an invoice" : `No ${supplierTypeLabels[config.supplierType].toLowerCase()} invoice is waiting for a delivery` },
    { type: InputTypes.UPLOAD, name: "attachments", label: "Shipping documents", mode: "multiple", accept: shipmentFileTypes, maxSizeBytes: shipmentFileLimit, required: true, className: "md:col-span-2",
      description: "PDF, image, Word or Excel, up to 10 MB each." },
  ], [invoices, waiting.isLoading, config.supplierType]);

  const suggested = useRef(false);
  useEffect(() => {
    if (!code.ready || suggested.current) return;
    suggested.current = true;
    void code.suggest().then((next) => { if (next && !form.getValues("code")) form.setValue("code", next, { shouldValidate: true }); });
  }, [code, form]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    if (!values.invoice) return;
    if (!created.current) {
      const result = await create({ code: values.code, shipmentInvoiceId: values.invoice.value });
      if ("error" in result) {
        if (/already exists/i.test(result.error)) form.setError("code", { message: "A document with this number already exists" }); else setMessage(result.error);
        return;
      }
      created.current = result.id;
    }
    const attached = await upload({ ...config.audit, shipmentId: created.current, files: values.attachments });
    if ("error" in attached) { setMessage(`The ${config.singular} was created, but its documents could not be attached: ${apiErrorMessage(attached.error)} Try again to attach them.`); return; }
    toast.success(`${config.singular.charAt(0).toUpperCase()}${config.singular.slice(1)} created`);
    setSaved(true);
    void navigate(shipmentPath(kind, created.current));
  });
  const saving = creating || uploading.isLoading;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !saving && !saved} />
    <PageHeader title={`New ${config.singular}`} crumbs={[{ label: config.title, to: config.root }, { label: "New" }]}
      actions={<><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(config.root)}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : created.current ? "Attach documents" : `Create ${config.singular}`}</Button></>} />
    <section className="space-y-3 rounded-lg border bg-card p-4"><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></section>
    {waiting.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(waiting.error)}</p> : null}
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    {invoice ? <section className="space-y-2"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-sm font-semibold">On invoice {invoice.code}</h2>
      <span className="text-sm">Invoice value <span className="font-semibold">{invoice.total === null ? "not available" : formatMoney(invoice.total, invoice.currency)}</span></span></div>
      <InvoiceLinesTable label="Invoice lines" lines={invoice.items} currency={invoice.currency} /></section> : null}
  </form>;
}
