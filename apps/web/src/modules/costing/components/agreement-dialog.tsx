import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { utcBoundary } from "@/shared/format/date-boundary";
import { FormDialog } from "@/shared/forms/form-dialog";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { usePostApiV1CustomersByIdPricingAgreementsMutation, usePutApiV1CustomersByIdPricingAgreementsAndAgreementIdMutation, type PricingAgreement } from "../api/costing-api";
import { useAgreementChoices } from "../hooks/use-costing-choices";
import { costingAudit, costingPermissions } from "../lib/costing";
import { agreementFormSchema, type AgreementFormValues } from "../schemas/costing-schema";

const chosen = (value: string | null | undefined, label: string | null | undefined) => value ? { value, label: label ?? "" } : null;

/** Adds or edits a customer's agreed price for one product and packing style, in the currency it is priced in. */
export function AgreementDialog({ agreement, customer, currencies, onSaved, onClose }: { agreement: PricingAgreement | null; customer?: SelectOption | null;
  currencies: readonly SelectOption[]; onSaved?: (id: string) => void; onClose: () => void }) {
  const [create, creating] = usePostApiV1CustomersByIdPricingAgreementsMutation();
  const [update, updating] = usePutApiV1CustomersByIdPricingAgreementsAndAgreementIdMutation();
  const choices = useAgreementChoices();
  const [message, setMessage] = useState("");
  const form = useForm<AgreementFormValues>({ resolver: zodResolver(agreementFormSchema), defaultValues: {
    customer: agreement ? chosen(agreement.customerId, agreement.customerName) : customer ?? null, product: chosen(agreement?.productId, agreement?.productName),
    packing: chosen(agreement?.productPackingId, agreement?.productPackingName), currency: chosen(agreement?.currency?.id, agreement?.currency?.name ?? agreement?.currency?.symbol),
    price: agreement?.agreedPrice ?? Number.NaN, from: agreement?.effectiveFrom ? new Date(agreement.effectiveFrom) : null,
    to: agreement?.effectiveTo ? new Date(agreement.effectiveTo) : null, notes: agreement?.notes ?? "" } });
  const product = useWatch({ control: form.control, name: "product" });
  const { ensurePacking } = choices;
  // Packing styles belong to the product, so another product starts with none chosen.
  useEffect(() => {
    if (!product) return;
    void ensurePacking(product.value);
    if (form.formState.dirtyFields.product) form.setValue("packing", null);
  }, [product?.value]); // eslint-disable-line react-hooks/exhaustive-deps
  const fields: WizardField<AgreementFormValues>[] = [
    { type: InputTypes.SELECT, name: "customer", label: "Customer", mode: "single", source: "async", loadOptions: choices.customers, required: true, disabled: Boolean(agreement), placeholder: "Search for a customer" },
    { type: InputTypes.SELECT, name: "product", label: "Product", mode: "single", source: "async", loadOptions: choices.products, required: true, placeholder: "Search for a product" },
    { type: InputTypes.SELECT, name: "packing", label: "Packing style", mode: "single", source: "sync", options: choices.packingsOf(product?.value), required: true, disabled: !product, placeholder: product ? "Select a packing style" : "Choose the product first" },
    { type: InputTypes.SELECT, name: "currency", label: "Priced in", mode: "single", source: "sync", options: currencies, required: true, placeholder: "Select a currency", description: "Saved in this currency as entered. Nothing is converted." },
    { type: InputTypes.NUMBER, name: "price", label: "Agreed price per pack", description: "The price of one pack of this packing style.", min: 0, required: true },
    { type: InputTypes.DATE, name: "from", label: "Effective from", required: true },
    { type: InputTypes.DATE, name: "to", label: "Effective to", description: "Leave empty for an open-ended price." },
    { type: InputTypes.TEXTAREA, name: "notes", label: "Notes", rows: 2, className: "md:col-span-2" },
  ];
  const permission = usePermissionAction(costingPermissions.manage);
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (!values.customer || !values.product || !values.packing || !values.currency || !values.from) return;
    setMessage("");
    const body = { productId: values.product.value, productPackingId: values.packing.value, currencyId: values.currency.value, agreedPrice: values.price,
      effectiveFrom: utcBoundary(values.from), effectiveTo: values.to ? utcBoundary(values.to, true) : null, ...(values.notes ? { notes: values.notes } : {}) };
    const result = agreement?.id
      ? await update({ ...costingAudit, id: values.customer.value, agreementId: agreement.id, domainEntitiesCustomersCustomerPricingAgreementRequest: body })
      : await create({ ...costingAudit, id: values.customer.value, domainEntitiesCustomersCustomerPricingAgreementRequest: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(agreement ? "Pricing agreement updated" : "Pricing agreement added");
    onSaved?.(typeof result.data === "string" ? result.data : agreement?.id ?? "");
    onClose();
  });
  return <FormDialog allowed={permission.allowed} wide title={agreement ? "Edit pricing agreement" : "Add pricing agreement"} description="While it is in effect, this price replaces the product's list price on the customer's quotations, orders and invoices."
    form={form} fields={fields} submitLabel={agreement ? "Save agreement" : "Add agreement"} busy={creating.isLoading || updating.isLoading} message={message} onSubmit={(event) => void submit(event)} onClose={onClose} />;
}
