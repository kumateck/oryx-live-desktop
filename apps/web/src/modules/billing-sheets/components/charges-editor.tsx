import { useEffect, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import type { AddChargesValues, ChargeLineValues } from "../schemas/billing-schema";

export const emptyCharge = (): ChargeLineValues => ({ charge: null, amount: Number.NaN });

function ChargeLine({ form, index, charges, loading, onRemove }: {
  form: UseFormReturn<AddChargesValues>; index: number; charges: readonly SelectOption[]; loading: boolean; onRemove: (() => void) | null;
}) {
  const fields = [
    { type: InputTypes.SELECT, name: `charges.${index}.charge`, label: "Charge", mode: "single", source: "sync", options: charges, required: true, placeholder: loading ? "Loading…" : "Select a charge" },
    { type: InputTypes.NUMBER, name: `charges.${index}.amount`, label: "Amount", min: 0, step: 0.01, required: true },
  ] satisfies WizardField<AddChargesValues>[];
  return <li className="flex items-start gap-2 rounded-md border p-3">
    <FormWizard form={form} fields={fields} className="min-w-0 flex-1 md:grid-cols-2" />
    <Button type="button" size="icon-sm" variant="ghost" className="mt-6" aria-label={`Remove charge ${index + 1}`} disabled={!onRemove} onClick={() => onRemove?.()}><Trash2 /></Button>
  </li>;
}

/** One currency for the charges being entered; selected charges are offered only on their own row. */
export function ChargesEditor({ charges, currencies, loading, defaultCurrency }: {
  charges: readonly SelectOption[]; currencies: readonly SelectOption[]; loading: boolean; defaultCurrency: SelectOption | null;
}) {
  // Both enclosing forms provide this shared currency/charges contract through FormProvider.
  const form = useFormContext<AddChargesValues>();
  const lines = useFieldArray({ control: form.control, name: "charges" });
  const selected = useWatch({ control: form.control, name: "charges" });
  const selectedIds = new Set(selected.flatMap((line) => line.charge ? [line.charge.value] : []));
  const currencyFields = useMemo((): WizardField<AddChargesValues>[] => [
    { type: InputTypes.SELECT, name: "currency", label: "Currency", mode: "single", source: "sync", options: currencies, required: true,
      description: "Applies to all charges below.", placeholder: loading ? "Loading…" : "Select a currency" },
  ], [currencies, loading]);
  useEffect(() => {
    if (defaultCurrency && !form.getValues("currency")) form.setValue("currency", defaultCurrency);
  }, [defaultCurrency, form]);
  const message = form.formState.errors.charges;
  return <section className="space-y-3">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Charges <span className="font-normal text-muted-foreground">({lines.fields.length})</span></h2>
      <Button type="button" size="sm" variant="outline" disabled={loading || lines.fields.length >= charges.length} onClick={() => lines.append(emptyCharge())}><Plus />Add charge</Button></div>
    <FormWizard form={form} fields={currencyFields} className="md:max-w-sm" />
    <ul className="space-y-2">{lines.fields.map((field, index) => <ChargeLine key={field.id} form={form} index={index}
      charges={charges.filter((charge) => charge.value === selected[index]?.charge?.value || !selectedIds.has(charge.value))} loading={loading}
      onRemove={lines.fields.length > 1 ? () => lines.remove(index) : null} />)}</ul>
    {message?.message ?? message?.root?.message ? <p role="alert" className="text-sm text-destructive">{message?.message ?? message?.root?.message}</p> : null}
  </section>;
}
