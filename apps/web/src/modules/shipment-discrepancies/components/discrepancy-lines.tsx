import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatQuantityNumber } from "@/shared/units/quantity";
import type { DiscrepancyDocument } from "../schemas/discrepancy";
const choice = z.object({ value: z.string().min(1), label: z.string() });
export const shipmentCountSchema = z.object({ lines: z.array(z.object({ line: choice.nullable().refine((value): boolean => value !== null, "Choose an invoice line"),
  count: z.number().finite().nonnegative(), reason: z.string().trim().min(3).max(255),
})).min(1) }).superRefine((values, context) => {
  const ids = values.lines.flatMap((line) => line.line ? [line.line.value] : []);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", path: ["lines"], message: "Report each invoice line only once" });
});
export type ShipmentCountValues = z.infer<typeof shipmentCountSchema>;
export function DiscrepancyLines({ form, document }: { form: UseFormReturn<ShipmentCountValues>; document: DiscrepancyDocument }) {
  const lines = useFieldArray({ control: form.control, name: "lines" });
  return <section className="space-y-3"><h2 className="font-semibold">Physical counts</h2>
    {lines.fields.map((field, index) => {
      const fields: WizardField<ShipmentCountValues>[] = [
        { type: InputTypes.SELECT, name: `lines.${index}.line`, label: "Invoice line and unit", mode: "single", source: "sync", required: true,
          options: document.shipmentInvoice.items.map((line) => ({ value: line.id, label: `${line.material.name ?? "Material"} · declared ${formatQuantityNumber(line.expectedQuantity, "entered")} ${line.uoM.symbol ?? ""}` })) },
        { type: InputTypes.NUMBER, name: `lines.${index}.count`, label: "Physical quantity (selected invoice unit)", min: 0, step: 0.000001, required: true },
        { type: InputTypes.TEXTAREA, name: `lines.${index}.reason`, label: "Observation / reason", required: true, className: "md:col-span-2" },
      ];
      return <div key={field.id} className="space-y-2 border-t pt-3"><FormWizard form={form} fields={fields} className="md:grid-cols-2" />
        <Button type="button" variant="ghost" size="sm" disabled={lines.fields.length < 2} onClick={() => lines.remove(index)}>Remove line {index + 1}</Button></div>;
    })}
    {form.formState.errors.lines?.root?.message || form.formState.errors.lines?.message ? <p role="alert" className="text-sm text-destructive">{form.formState.errors.lines.root?.message ?? form.formState.errors.lines.message}</p> : null}
    <Button type="button" variant="outline" size="sm" onClick={() => lines.append({ line: null, count: Number.NaN, reason: "" })}>Add invoice line</Button>
  </section>;
}
