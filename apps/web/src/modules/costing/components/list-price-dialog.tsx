import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormDialog } from "@/shared/forms/form-dialog";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { usePutApiV1CostingListPricesByProductIdMutation, type ListPrice } from "../api/costing-api";
import { costingAudit, costingPermissions } from "../lib/costing";
import { listPriceFormSchema, type ListPriceFormValues } from "../schemas/costing-schema";
import { PriceHistory } from "./price-history";

/** Sets a product's list price from now on, in the currency it is priced in. Earlier prices are kept. */
export function ListPriceDialog({ item, currencies, onClose }: { item: ListPrice; currencies: readonly SelectOption[]; onClose: () => void }) {
  const [save, saving] = usePutApiV1CostingListPricesByProductIdMutation();
  const [message, setMessage] = useState("");
  const current = item.currency?.id ? currencies.find((option) => option.value === item.currency?.id) ?? { value: item.currency.id, label: item.currency.name ?? item.currency.symbol ?? "" } : null;
  const form = useForm<ListPriceFormValues>({ resolver: zodResolver(listPriceFormSchema), defaultValues: { currency: current, price: item.pricedAt ? item.price ?? Number.NaN : Number.NaN, unit: item.priceUoM ?? "" } });
  const fields: WizardField<ListPriceFormValues>[] = [
    { type: InputTypes.SELECT, name: "currency", label: "Priced in", mode: "single", source: "sync", options: currencies, required: true, placeholder: "Select a currency", description: "The amount is saved in this currency as entered. Nothing is converted." },
    { type: InputTypes.NUMBER, name: "price", label: "List price", min: 0, required: true },
    { type: InputTypes.TEXT, name: "unit", label: "Priced per", placeholder: "For example, pack", className: "md:col-span-2" },
  ];
  const permission = usePermissionAction(costingPermissions.manage);
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (!values.currency || !item.productId) return;
    setMessage("");
    const result = await save({ ...costingAudit, productId: item.productId, domainEntitiesCostingSetListPriceRequest: { price: values.price, currencyId: values.currency.value, ...(values.unit ? { priceUoM: values.unit } : {}) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("List price saved");
    onClose();
  });
  return <FormDialog allowed={permission.allowed} title={`List price of ${item.productName ?? "product"}`} description="Quotations, orders and invoices use this price when the customer has no agreement for the product. A quotation in another currency is refused rather than converted."
    form={form} fields={fields} submitLabel="Save price" busy={saving.isLoading} message={message} onSubmit={(event) => void submit(event)} onClose={onClose}
    footnote={item.productId ? <PriceHistory productId={item.productId} /> : null} />;
}
