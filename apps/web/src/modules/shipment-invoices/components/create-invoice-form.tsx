import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { purchaseOrderRowsSchema } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { formatMoney } from "@/shared/procurement/price";
import { useGetApiV1ProcurementPurchaseOrderNotLinkedQuery, useGetApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinkedQuery, usePostApiV1ProcurementShipmentInvoiceMutation } from "../api/invoice-api";
import { audit, invoicesPath } from "../lib/invoice-access";
import { invoiceLineCost, invoiceLineProblems, invoiceRequest, invoiceableOrders, mergeInvoiceLines, startInvoiceLines, type InvoiceLine, type InvoiceLineProblem } from "../lib/invoice-lines";
import { invoiceFormSchema, supplierOptionsSchema, type InvoiceFormValues } from "../schemas/invoice-schema";
import { InvoiceLinesEditor } from "./invoice-lines-editor";

/** Records a supplier's invoice against one or more of their sent purchase orders. */
export function CreateInvoiceForm() {
  const navigate = useNavigate();
  const suppliers = useGetApiV1ProcurementPurchaseOrderNotLinkedQuery({ ...audit });
  const [create, mutation] = usePostApiV1ProcurementShipmentInvoiceMutation();
  const form = useForm<InvoiceFormValues>({ resolver: zodResolver(invoiceFormSchema), defaultValues: { code: "", supplier: null, orders: [] } });
  // Read here so the form re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const supplier = useWatch({ control: form.control, name: "supplier" });
  const chosen = useWatch({ control: form.control, name: "orders" });
  const open = useGetApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinkedQuery({ ...audit, supplierId: supplier?.value ?? "" }, { skip: !supplier });
  const orders = useMemo(() => { const parsed = purchaseOrderRowsSchema.safeParse(supplier ? open.data ?? null : null); return parsed.success ? invoiceableOrders(parsed.data) : []; }, [open.data, supplier]);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [problems, setProblems] = useState<readonly InvoiceLineProblem[]>([]);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const currency = orders[0]?.supplier.currency ?? null;

  // The orders belong to the supplier, so another supplier starts with none chosen.
  useEffect(() => { form.setValue("orders", []); }, [form, supplier?.value]);
  // The lines follow the chosen orders; what was typed on a line that stays is kept.
  useEffect(() => {
    const ids = new Set(chosen.map((order) => order.value));
    setLines((current) => mergeInvoiceLines(current, startInvoiceLines(orders.filter((order) => ids.has(order.id)))));
    setProblems([]);
  }, [chosen, orders]);

  const fields = useMemo((): WizardField<InvoiceFormValues>[] => [
    { type: InputTypes.TEXT, name: "code", label: "Invoice number", required: true, description: "The number on the supplier's invoice." },
    { type: InputTypes.SELECT, name: "supplier", label: "Supplier", mode: "single", source: "sync", required: true, options: supplierOptionsSchema.parse(suppliers.data ?? []),
      placeholder: suppliers.isLoading ? "Loading…" : "Select a supplier" },
    { type: InputTypes.SELECT, name: "orders", label: "Purchase orders", mode: "multiple", source: "sync", required: true, className: "md:col-span-2",
      options: orders.map((order) => ({ value: order.id, label: order.code })),
      placeholder: !supplier ? "Choose the supplier first" : open.isFetching ? "Loading…" : orders.length ? "Select purchase orders" : "This supplier has no order left to invoice" },
  ], [suppliers.data, suppliers.isLoading, orders, supplier, open.isFetching]);

  const change = useCallback((key: string, update: Partial<Pick<InvoiceLine, "quantity" | "manufacturerId" | "reason" | "included">>) => {
    setLines((current) => current.map((line) => line.key === key ? { ...line, ...update } : line));
    setProblems((current) => current.filter((problem) => problem.key !== key && problem.key !== null));
  }, []);
  const invalid = useMemo(() => new Set(problems.flatMap((problem) => problem.key ? [problem.key] : [])), [problems]);
  const costs = lines.filter((line) => line.included).map(invoiceLineCost);
  const total = costs.every((cost) => cost !== null) ? costs.reduce<number>((sum, cost) => sum + (cost ?? 0), 0) : null;

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const found = invoiceLineProblems(lines);
    setProblems(found);
    if (found.length > 0 || !values.supplier) return;
    const result = await create({ ...audit, domainEntitiesShipmentsRequestCreateShipmentInvoice: invoiceRequest(values.code, values.supplier.value, lines) });
    if ("error" in result) {
      const reason = apiErrorMessage(result.error);
      if (/code already exists/i.test(reason)) form.setError("code", { message: "An invoice with this number is already recorded" }); else setMessage(reason);
      return;
    }
    toast.success("Shipment invoice recorded");
    setSaved(true);
    void navigate(invoicesPath);
  });
  const saving = mutation.isLoading;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !saving && !saved} />
    <PageHeader title="Record a shipment invoice" crumbs={[{ label: "Shipment invoices", to: invoicesPath }, { label: "New invoice" }]}
      actions={<><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(invoicesPath)}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : "Record invoice"}</Button></>} />
    <section className="space-y-3 rounded-lg border bg-card p-4"><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></section>
    {suppliers.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(suppliers.error)}</p> : null}
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-sm font-semibold">Lines</h2>
        {lines.length > 0 ? <span role="status" className="text-sm">Invoice value <span className="font-semibold">{total === null ? "not available" : formatMoney(total, currency)}</span></span> : null}</div>
      <InvoiceLinesEditor lines={lines} invalid={invalid} currency={currency} disabled={saving} onChange={change} />
      {problems.length > 0 ? <ul role="alert" className="list-disc space-y-0.5 pl-5 text-sm text-destructive">{problems.map((problem) => <li key={`${problem.key}:${problem.message}`}>{problem.message}</li>)}</ul> : null}
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    </section>
  </form>;
}
