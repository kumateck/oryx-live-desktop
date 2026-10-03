import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useUpdateCustomerProfileMutation } from "../api/customer-api";
import { useCustomerCollections } from "../hooks/use-customer-collections";
import { customerTypeLabels } from "../lib/customers";
import { profileFormSchema, type CustomerProfile, type ProfileFormValues } from "../schemas/customer-schema";

const types = Object.entries(customerTypeLabels).map(([value, label]) => ({ value, label }));

/** The customer's details and commercial terms: segment, currency, payment terms, credit limit and addresses. */
export function ProfilePanel({ profile }: { profile: CustomerProfile }) {
  const collections = useCustomerCollections();
  const [update, mutation] = useUpdateCustomerProfileMutation();
  const [message, setMessage] = useState("");
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema), defaultValues: { name: profile.name ?? "", email: profile.email ?? "", phone: profile.phone ?? "", address: profile.address ?? "",
    type: typeof profile.type === "number" ? { value: String(profile.type), label: customerTypeLabels[profile.type] ?? "Other" } : null,
    currency: profile.currency?.id ? { value: profile.currency.id, label: profile.currency.name ?? profile.currency.symbol ?? "" } : null,
    termsOfPayment: profile.termsOfPayment?.id ? { value: profile.termsOfPayment.id, label: profile.termsOfPayment.name ?? "" } : null,
    creditLimit: profile.creditLimit ?? Number.NaN, billingAddress: profile.billingAddress ?? "", shippingAddress: profile.shippingAddress ?? "" } });
  void form.formState.errors;
  const fields = useMemo((): WizardField<ProfileFormValues>[] => [
    { type: InputTypes.TEXT, name: "name", label: "Customer name", required: true },
    { type: InputTypes.EMAIL, name: "email", label: "Email", required: true },
    { type: InputTypes.TEXT, name: "phone", label: "Phone", required: true },
    { type: InputTypes.SELECT, name: "type", label: "Customer segment", mode: "single", source: "sync", options: types, placeholder: "Not assigned" },
    { type: InputTypes.SELECT, name: "currency", label: "Preferred currency", mode: "single", source: "sync", options: collections.currencies, placeholder: collections.loading ? "Loading…" : "Not assigned" },
    { type: InputTypes.SELECT, name: "termsOfPayment", label: "Payment terms", mode: "single", source: "sync", options: collections.terms, placeholder: collections.loading ? "Loading…" : "Not assigned" },
    { type: InputTypes.NUMBER, name: "creditLimit", label: "Credit limit", min: 0, description: "Leave empty for no limit." },
    { type: InputTypes.TEXTAREA, name: "address", label: "Main address", required: true, rows: 2, className: "md:col-span-2" },
    { type: InputTypes.TEXTAREA, name: "billingAddress", label: "Billing address", rows: 2 },
    { type: InputTypes.TEXTAREA, name: "shippingAddress", label: "Shipping address", rows: 2 },
  ], [collections]);
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await update({ customerId: profile.id, body: { name: values.name, email: values.email, phone: values.phone, address: values.address, creditLimit: Number.isNaN(values.creditLimit) ? null : values.creditLimit,
      termsOfPaymentId: values.termsOfPayment?.value ?? null, type: values.type ? Number(values.type.value) : null, currencyId: values.currency?.value ?? null, billingAddress: values.billingAddress || null, shippingAddress: values.shippingAddress || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Customer profile saved");
    form.reset(values);
  });
  return <form noValidate onSubmit={(event) => void submit(event)} className="space-y-3 rounded-lg border bg-card p-4">
    <div><h2 className="text-sm font-semibold">Profile and commercial terms</h2><p className="text-xs text-muted-foreground">These terms are used on the customer's quotations and orders.</p></div>
    <FormWizard form={form} fields={fields} className="md:grid-cols-2 xl:grid-cols-3" />
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <Button type="submit" size="sm" disabled={mutation.isLoading || !form.formState.isDirty}>{mutation.isLoading ? <><Spinner />Saving…</> : "Save profile"}</Button>
  </form>;
}
