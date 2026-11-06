import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { FieldFrame } from "@/shared/forms/field-frame";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { path } from "../lib/white-placebo";
import { recipeFormSchema, type RecipeFormValues, type Workspace } from "../schemas/white-placebo";
import { QuantityInput } from "./quantity-input";

export function RecipeForm({ workspace, saving, save }: { workspace: Workspace; saving: boolean; save: (values: RecipeFormValues, revision: number) => Promise<string | null> }) {
  const [recipe] = useState(workspace.recipe);
  const [revision, setRevision] = useState(recipe?.revision ?? 0);
  const form = useForm<RecipeFormValues>({ resolver: zodResolver(recipeFormSchema), defaultValues: {
    material: recipe ? { value: recipe.materialId, label: recipe.materialName } : null,
    reference: recipe?.reference ?? "", instructions: recipe?.instructions ?? "", storageConditions: recipe?.storageConditions ?? "",
    holdHours: recipe?.holdHours ?? Number.NaN, expectedQuantity: recipe?.expectedQuantity ?? Number.NaN,
    ingredients: recipe?.ingredients.map((item) => ({ materialId: item.materialId, quantity: item.quantity })) ?? [],
  } });
  const array = useFieldArray({ control: form.control, name: "ingredients" });
  const materialId = form.watch("material")?.value;
  const selected = workspace.materials.find((item) => item.id === materialId);
  const ingredients = workspace.materials.filter((item) => !item.isWhitePlacebo && item.id !== materialId);
  const [error, setError] = useState<string | null>(null);
  const fields: WizardField<RecipeFormValues>[] = [
    { name: "material", label: "White Placebo material", type: InputTypes.SELECT, mode: "single", source: "sync", required: true, disabled: revision > 0,
      options: workspace.materials.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })) },
    { name: "reference", label: "Approved recipe reference", type: InputTypes.TEXT, required: true },
    { name: "instructions", label: "Approved preparation instructions", type: InputTypes.TEXTAREA, required: true, rows: 4 },
    { name: "storageConditions", label: "Storage conditions", type: InputTypes.TEXTAREA, required: true, rows: 3 },
    { name: "holdHours", label: "Permitted holding period (hours)", type: InputTypes.NUMBER, required: true, min: 1, max: 8760, step: 1,
      description: "Use the period established by Quality. It starts at the actual preparation time." },
  ];
  return <form noValidate className="space-y-5" onSubmit={form.handleSubmit(async (values) => {
    setError(null);
    const problem = await save(values, revision);
    if (problem) setError(problem); else { setRevision((value) => value + 1); form.reset(values); }
  })}>
    <fieldset disabled={saving} className="min-w-0 space-y-4">
      <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
      <Controller control={form.control} name="expectedQuantity" render={({ field, fieldState }) => <FieldFrame id="recipe-output" label="Expected output" required error={fieldState.error?.message}>
        {selected ? <QuantityInput id="recipe-output" label="Expected output" value={field.value} unit={selected.unitSymbol} onChange={field.onChange} invalid={Boolean(fieldState.error)} />
          : <p className="text-sm text-muted-foreground">Choose the material to use its linked weight unit.</p>}
      </FieldFrame>} />
      <section className="space-y-3" aria-labelledby="recipe-ingredients"><h2 id="recipe-ingredients" className="font-semibold">Ingredients for this expected output</h2>
        {array.fields.map((item, index) => <div key={item.id} className="grid min-w-0 items-start gap-3 border-b pb-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Controller control={form.control} name={`ingredients.${index}.materialId`} render={({ field, fieldState }) => <FieldFrame id={`ingredient-${index}`} label={`Ingredient ${index + 1}`} required error={fieldState.error?.message}>
            <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id={`ingredient-${index}`} className="w-full" aria-invalid={Boolean(fieldState.error)}><SelectValue placeholder="Choose an excipient" /></SelectTrigger>
              <SelectContent>{ingredients.map((material) => <SelectItem key={material.id} value={material.id}>{material.code} · {material.name}</SelectItem>)}</SelectContent></Select>
          </FieldFrame>} />
          <Controller control={form.control} name={`ingredients.${index}.quantity`} render={({ field, fieldState }) => {
            const ingredient = ingredients.find((material) => material.id === form.watch(`ingredients.${index}.materialId`));
            return <FieldFrame id={`recipe-quantity-${index}`} label={`Ingredient ${index + 1} quantity`} required error={fieldState.error?.message}>
              {ingredient ? <QuantityInput key={ingredient.id} id={`recipe-quantity-${index}`} label={`Ingredient ${index + 1} quantity`} value={field.value} unit={ingredient.unitSymbol} onChange={field.onChange} invalid={Boolean(fieldState.error)} /> : <p className="text-sm text-muted-foreground">Choose an ingredient first.</p>}
            </FieldFrame>;
          }} />
          <Button type="button" variant="ghost" className="self-end" onClick={() => array.remove(index)} aria-label={`Remove ingredient ${index + 1}`}>Remove</Button>
        </div>)}
        {form.formState.errors.ingredients?.root?.message ? <p role="alert">{form.formState.errors.ingredients.root.message}</p> : null}
        <Button type="button" variant="outline" onClick={() => array.append({ materialId: "", quantity: Number.NaN })}>Add ingredient</Button>
      </section>
    </fieldset>
    {error ? <p role="alert" className="text-destructive">{error}</p> : null}
    <div className="flex flex-wrap justify-end gap-2"><Button asChild variant="outline"><Link to={path}>Back to White Placebo</Link></Button>
      <Button disabled={saving} type="submit">{saving ? "Saving…" : "Save recipe"}</Button></div>
    <UnsavedChangesGuard when={form.formState.isDirty} />
  </form>;
}
