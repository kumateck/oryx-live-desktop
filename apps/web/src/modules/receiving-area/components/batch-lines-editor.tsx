import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { batchDateBounds } from "@/shared/batch-dates/batch-dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { formatQuantityNumber } from "@/shared/units/quantity";
import type { ChecklistFormValues } from "../schemas/receiving-schema";

type Form = UseFormReturn<ChecklistFormValues>;
export const emptyBatch = (): ChecklistFormValues["batches"][number] => ({ number: "", containers: Number.NaN, style: null, perContainer: Number.NaN, made: null, expires: null, weights: [{ gross: Number.NaN }] });

/** The gross weights of the containers that were put on the scale; at least one is recorded. */
function Weights({ form, index }: { form: Form; index: number }) {
  const weights = useFieldArray({ control: form.control, name: `batches.${index}.weights` });
  const error = form.formState.errors.batches?.[index]?.weights as { message?: string; root?: { message?: string } } | undefined;
  const fields = weights.fields.map((_field, position): WizardField<ChecklistFormValues> => ({ type: InputTypes.NUMBER, name: `batches.${index}.weights.${position}.gross`, label: `Gross weight ${position + 1}`, min: 0, step: 0.01 }));
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-2"><h4 className="text-xs font-medium text-muted-foreground">Weight records for batch {index + 1}</h4>
      <div className="flex gap-1">{weights.fields.length > 1 ? <Button type="button" size="sm" variant="ghost" onClick={() => weights.remove(weights.fields.length - 1)}>Remove last</Button> : null}
        <Button type="button" size="sm" variant="outline" disabled={weights.fields.length >= 20} onClick={() => weights.append({ gross: Number.NaN })}><Plus />Add weight</Button></div></div>
    <FormWizard form={form} fields={fields} className="grid-cols-2 md:grid-cols-4 xl:grid-cols-5" />
    {error?.message ?? error?.root?.message ? <p role="alert" className="text-sm text-destructive">{error?.message ?? error?.root?.message}</p> : null}
  </div>;
}

function BatchLine({ form, index, kind, unit, styles, loading, onRemove }: { form: Form; index: number; kind: MaterialKind; unit: string; styles: readonly SelectOption[]; loading: boolean; onRemove: (() => void) | null }) {
  const [containers, perContainer] = useWatch({ control: form.control, name: [`batches.${index}.containers`, `batches.${index}.perContainer`] });
  const total = Number.isFinite(containers) && Number.isFinite(perContainer) ? containers * perContainer : null;
  const raw = kind === 0;
  // Each month picker only offers months that agree with the other one.
  const [made, expires] = useWatch({ control: form.control, name: [`batches.${index}.made`, `batches.${index}.expires`] });
  const bounds = batchDateBounds(made, expires);
  const fields: WizardField<ChecklistFormValues>[] = [
    { type: InputTypes.TEXT, name: `batches.${index}.number`, label: "Batch number", required: raw },
    { type: InputTypes.NUMBER, name: `batches.${index}.containers`, label: "Number of containers", min: 1, step: 1, required: true },
    { type: InputTypes.SELECT, name: `batches.${index}.style`, label: "Kind of container", mode: "single", source: "sync", options: styles, required: true, placeholder: loading ? "Loading…" : "Select" },
    { type: InputTypes.NUMBER, name: `batches.${index}.perContainer`, label: `Quantity per container${unit ? ` (${unit})` : ""}`, min: 0, required: true },
    { type: InputTypes.MONTH, name: `batches.${index}.made`, label: "Manufacturing date", required: true, ...bounds.made, placeholder: "Month and year" },
    { type: InputTypes.MONTH, name: `batches.${index}.expires`, label: "Expiry date", required: raw, ...bounds.expires, placeholder: "Month and year" },
  ];
  return <li className="space-y-3 rounded-md border p-3">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Batch {index + 1} <span className="font-normal text-muted-foreground">{total === null ? "" : `· ${formatQuantityNumber(total, "calculated")} ${unit}`}</span></h3>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove batch ${index + 1}`} disabled={!onRemove} onClick={() => onRemove?.()}><Trash2 /></Button></div>
    <FormWizard form={form} fields={fields} className="md:grid-cols-3" />
    <Weights form={form} index={index} />
  </li>;
}

/** The batches a delivery came in: how many containers of how much, when each was made and expires, and what the scale showed. */
export function BatchLinesEditor({ form, kind, unit, styles, loading }: { form: Form; kind: MaterialKind; unit: string; styles: readonly SelectOption[]; loading: boolean }) {
  const batches = useFieldArray({ control: form.control, name: "batches" });
  return <section className="space-y-2">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Batches <span className="font-normal text-muted-foreground">({batches.fields.length})</span></h2>
      <Button type="button" size="sm" variant="outline" onClick={() => batches.append(emptyBatch())}><Plus />Add batch</Button></div>
    <ul className="space-y-2">{batches.fields.map((field, index) => <BatchLine key={field.id} form={form} index={index} kind={kind} unit={unit} styles={styles} loading={loading}
      onRemove={batches.fields.length > 1 ? () => batches.remove(index) : null} />)}</ul>
  </section>;
}
