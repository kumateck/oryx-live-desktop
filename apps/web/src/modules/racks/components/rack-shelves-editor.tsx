import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { RackFormValues } from "../schemas/rack-schema";

function ShelfLine({ form, index, onRemove }: { form: UseFormReturn<RackFormValues>; index: number; onRemove: () => void }) {
  const fields: WizardField<RackFormValues>[] = [
    { type: InputTypes.TEXT, name: `shelves.${index}.code`, label: "Code", required: true },
    { type: InputTypes.TEXT, name: `shelves.${index}.name`, label: "Name", required: true },
    { type: InputTypes.TEXT, name: `shelves.${index}.description`, label: "Description" },
  ];
  return <li className="flex items-start gap-2 rounded-md border p-3">
    <FormWizard form={form} fields={fields} className="min-w-0 flex-1 md:grid-cols-3" />
    <Button type="button" size="icon-sm" variant="ghost" className="mt-6" aria-label={`Remove shelf ${index + 1}`} onClick={onRemove}><Trash2 /></Button>
  </li>;
}

/** The shelves a new rack starts with. `suggestCode` gives the code for the shelf at a position. */
export function RackShelvesEditor({ form, suggestCode }: { form: UseFormReturn<RackFormValues>; suggestCode: (index: number) => string }) {
  const shelves = useFieldArray({ control: form.control, name: "shelves" });
  return <section className="space-y-2">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Shelves <span className="font-normal text-muted-foreground">({shelves.fields.length})</span></h3>
      <Button type="button" size="sm" variant="outline" onClick={() => { const code = suggestCode(shelves.fields.length); shelves.append({ code, name: code.split("/").at(-1) ?? "", description: "" }); }}><Plus />Add shelf</Button></div>
    {shelves.fields.length === 0 ? <p className="text-sm text-muted-foreground">No shelves yet. They can also be added later on the Shelves page.</p>
      : <ul className="space-y-2">{shelves.fields.map((field, index) => <ShelfLine key={field.id} form={form} index={index} onRemove={() => shelves.remove(index)} />)}</ul>}
  </section>;
}
