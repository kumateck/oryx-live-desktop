import { randomId } from "@/shared/ids/random-id";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldFrame } from "@/shared/forms/field-frame";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { quantity } from "../lib/white-placebo";
import { preparationFormSchema, type PreparationFormValues, type Recipe, type Stock } from "../schemas/white-placebo";
import { QuantityInput } from "./quantity-input";

const fields: WizardField<PreparationFormValues>[] = [
  { name: "batchNumber", label: "White Placebo batch number", type: InputTypes.TEXT, required: true },
  { name: "notes", label: "Ingredient variance notes", type: InputTypes.TEXTAREA, rows: 3,
    description: "Explain ingredient quantities that differ from the approved recipe. All issued quantities are recorded as consumed by this preparation." },
];

export function PreparationForm({ recipe: currentRecipe, stock, saving, save }: {
  recipe: Recipe; stock: Stock[]; saving: boolean; save: (values: PreparationFormValues, id: string, revision: number) => Promise<string | null>;
}) {
  const [recipe] = useState(currentRecipe);
  const [requestId] = useState(() => randomId());
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PreparationFormValues>({ resolver: zodResolver(preparationFormSchema), defaultValues: {
    batchNumber: "", notes: "", expectedQuantity: recipe.expectedQuantity,
    inputs: recipe.ingredients.map((item) => ({ shelfMaterialBatchId: "", quantity: item.quantity })),
  } });
  const array = useFieldArray({ control: form.control, name: "inputs" });
  const expected = form.watch("expectedQuantity");
  const eligible = stock.filter((item) => recipe.ingredients.some((ingredient) => ingredient.materialId === item.materialId));
  return <form noValidate className="space-y-5" onSubmit={form.handleSubmit(async (values) => {
    setError(null);
    const problem = await save(values, requestId, recipe.revision);
    if (problem) setError(problem); else form.reset(values);
  })}>
    <fieldset disabled={saving} className="min-w-0 space-y-4">
      <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
      <Controller control={form.control} name="expectedQuantity" render={({ field, fieldState }) => <FieldFrame id="preparation-expected" label="Expected output" required error={fieldState.error?.message}>
        <QuantityInput id="preparation-expected" label="Expected output" value={field.value} unit={recipe.unitSymbol} onChange={field.onChange} invalid={Boolean(fieldState.error)} />
      </FieldFrame>} />
      <section className="space-y-2"><h2 className="font-semibold">Approved recipe · {recipe.reference}, revision {recipe.revision}</h2>
        <ul className="space-y-1 text-sm">{recipe.ingredients.map((item) => <li key={item.materialId} className="flex flex-wrap justify-between gap-2">
          <span>{item.name}</span><span>{quantity(item.quantity * (expected / recipe.expectedQuantity), item.unitSymbol, true)}</span></li>)}</ul>
        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{recipe.instructions}</p>
      </section>
      <section className="space-y-3"><h2 className="font-semibold">Ingredient batches to issue</h2>
        <p className="text-sm text-muted-foreground">Choose released stock for every ingredient. Availability is checked again when the warehouse issues it.</p>
        {array.fields.map((item, index) => <div key={item.id} className="grid min-w-0 items-start gap-3 border-b pb-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
          <Controller control={form.control} name={`inputs.${index}.shelfMaterialBatchId`} render={({ field, fieldState }) => <FieldFrame id={`input-${index}`} label={`Ingredient batch ${index + 1}`} required error={fieldState.error?.message}>
            <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id={`input-${index}`} className="w-full" aria-invalid={Boolean(fieldState.error)}><SelectValue placeholder="Choose a batch and shelf" /></SelectTrigger>
              <SelectContent>{eligible.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.batchNumber} · {batch.materialName} · {batch.shelf} · {quantity(batch.quantity, batch.unitSymbol)} free</SelectItem>)}</SelectContent>
            </Select>
            {eligible.filter((batch) => batch.id === field.value).map((batch) => <p key={batch.id} className="break-words text-sm text-muted-foreground">{batch.materialName} · Batch {batch.batchNumber} · {batch.shelf} · {quantity(batch.quantity, batch.unitSymbol)} free</p>)}
          </FieldFrame>} />
          <Controller control={form.control} name={`inputs.${index}.quantity`} render={({ field, fieldState }) => {
            const batch = stock.find((batch) => batch.id === form.watch(`inputs.${index}.shelfMaterialBatchId`));
            return <FieldFrame id={`input-quantity-${index}`} label={`Batch ${index + 1} quantity`} required error={fieldState.error?.message}>
              {batch ? <QuantityInput key={batch.id} id={`input-quantity-${index}`} label={`Batch ${index + 1} quantity`} value={field.value} unit={batch.unitSymbol} onChange={field.onChange} invalid={Boolean(fieldState.error)} />
                : <p className="text-sm text-muted-foreground">Choose a batch first.</p>}
            </FieldFrame>;
          }} />
          <Button type="button" variant="ghost" className="self-end" aria-label={`Remove batch ${index + 1}`} onClick={() => array.remove(index)}>Remove</Button>
        </div>)}
        {form.formState.errors.inputs?.root?.message ? <p role="alert">{form.formState.errors.inputs.root.message}</p> : null}
        <Button type="button" variant="outline" onClick={() => array.append({ shelfMaterialBatchId: "", quantity: Number.NaN })}>Add another batch</Button>
      </section>
    </fieldset>
    {error ? <p role="alert" className="text-destructive">{error}</p> : null}
    <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Requesting…" : "Request ingredients"}</Button></div>
    <UnsavedChangesGuard when={form.formState.isDirty} />
  </form>;
}
