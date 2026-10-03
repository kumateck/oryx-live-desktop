import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, type Control, type FieldValues, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import type { ChargeLineValues } from "../schemas/billing-schema";

/** Any form that holds a list of charges under `charges`. */
interface WithCharges extends FieldValues { charges: ChargeLineValues[] }
export const emptyCharge = (currency: SelectOption | null): ChargeLineValues => ({ charge: null, currency, amount: Number.NaN });

function ChargeLine<TValues extends WithCharges>({ form, index, charges, currencies, loading, onRemove }: {
  form: UseFormReturn<TValues>; index: number; charges: readonly SelectOption[]; currencies: readonly SelectOption[]; loading: boolean; onRemove: (() => void) | null;
}) {
  // The names are built from the row's position; the form type only knows them as paths under `charges`.
  const fields = [
    { type: InputTypes.SELECT, name: `charges.${index}.charge`, label: "Charge", mode: "single", source: "sync", options: charges, required: true, placeholder: loading ? "Loading…" : "Select a charge" },
    { type: InputTypes.NUMBER, name: `charges.${index}.amount`, label: "Amount", min: 0, step: 0.01, required: true },
    { type: InputTypes.SELECT, name: `charges.${index}.currency`, label: "Currency", mode: "single", source: "sync", options: currencies, required: true, placeholder: loading ? "Loading…" : "Select a currency" },
  ] as unknown as WizardField<TValues>[];
  return <li className="flex items-start gap-2 rounded-md border p-3">
    <FormWizard form={form} fields={fields} className="min-w-0 flex-1 md:grid-cols-3" />
    <Button type="button" size="icon-sm" variant="ghost" className="mt-6" aria-label={`Remove charge ${index + 1}`} disabled={!onRemove} onClick={() => onRemove?.()}><Trash2 /></Button>
  </li>;
}

/** The charges on a sheet being written: what each is for, how much, and in which currency. */
export function ChargesEditor<TValues extends WithCharges>({ form, charges, currencies, loading, defaultCurrency }: {
  form: UseFormReturn<TValues>; charges: readonly SelectOption[]; currencies: readonly SelectOption[]; loading: boolean; defaultCurrency: SelectOption | null;
}) {
  const lines = useFieldArray({ control: form.control as unknown as Control<WithCharges>, name: "charges" });
  const message = (form.formState.errors.charges as { message?: string; root?: { message?: string } } | undefined);
  return <section className="space-y-2">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Charges <span className="font-normal text-muted-foreground">({lines.fields.length})</span></h2>
      <Button type="button" size="sm" variant="outline" onClick={() => lines.append(emptyCharge(defaultCurrency))}><Plus />Add charge</Button></div>
    <ul className="space-y-2">{lines.fields.map((field, index) => <ChargeLine key={field.id} form={form} index={index} charges={charges} currencies={currencies} loading={loading}
      onRemove={lines.fields.length > 1 ? () => lines.remove(index) : null} />)}</ul>
    {message?.message ?? message?.root?.message ? <p role="alert" className="text-sm text-destructive">{message?.message ?? message?.root?.message}</p> : null}
  </section>;
}
