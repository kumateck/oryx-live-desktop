import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { storeIds, stores } from "@/shared/inventory/stores";
import type { QuotationFormValues } from "../schemas/procurement-forms";

export const quotationNotes = [{ type: InputTypes.TEXTAREA, name: "notes", label: "Notes", rows: 2 }] as const satisfies readonly WizardField<QuotationFormValues>[];
export const materialStoreFields = [{ type: InputTypes.SELECT, name: "store", label: "Materials store", mode: "single", source: "sync", options: storeIds.map((store) => ({ value: String(store), label: stores[store] ?? "Store" })) }] as const satisfies readonly WizardField<QuotationFormValues>[];
export function QuotationFields({ form, currencies }: { form: UseFormReturn<QuotationFormValues>; currencies: readonly SelectOption[] }) {
  const fields = useMemo<readonly WizardField<QuotationFormValues>[]>(() => [
    { type: InputTypes.TEXT, name: "number", label: "Quotation number" },
    { type: InputTypes.DATE, name: "submitted", label: "Submitted", required: true },
    { type: InputTypes.SELECT, name: "currency", label: "Currency", mode: "single", source: "sync", options: currencies, required: true },
    { type: InputTypes.TEXT, name: "days", label: "Estimated days", inputMode: "numeric", required: true },
    { type: InputTypes.DATE, name: "completion", label: "Estimated completion", required: true },
  ], [currencies]);
  return <FormWizard form={form} fields={fields} className="md:grid-cols-3" />;
}
export function ChargeFields({ form, index, options }: { form: UseFormReturn<QuotationFormValues>; index: number; options: readonly SelectOption[] }) {
  const fields = useMemo<readonly WizardField<QuotationFormValues>[]>(() => [
    { type: InputTypes.SELECT, name: `charges.${index}.name`, label: `Charge ${index + 1}`, mode: "single", source: "sync", options, required: true },
    { type: InputTypes.TEXT, name: `charges.${index}.cost`, label: `Cost of charge ${index + 1}`, inputMode: "decimal", required: true },
  ], [index, options]);
  return <FormWizard form={form} fields={fields} className="min-w-0 flex-1 sm:grid-cols-2" />;
}
export function MaterialFields({ form, index, loadOptions }: { form: UseFormReturn<QuotationFormValues>; index: number; loadOptions: SelectLoader }) {
  const fields = useMemo<readonly WizardField<QuotationFormValues>[]>(() => [
    { type: InputTypes.SELECT, name: `materials.${index}.item`, label: `Material ${index + 1}`, mode: "single", source: "async", loadOptions, placeholder: "Search for an item", required: true },
    { type: InputTypes.TEXT, name: `materials.${index}.quantity`, label: `Quantity of material ${index + 1}`, inputMode: "decimal", required: true },
    { type: InputTypes.TEXT, name: `materials.${index}.price`, label: `Unit price of material ${index + 1}`, inputMode: "decimal", required: true },
  ], [index, loadOptions]);
  return <FormWizard form={form} fields={fields} className="min-w-0 flex-1 md:grid-cols-3" />;
}
