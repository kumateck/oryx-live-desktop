import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { allowanceLabels, type SalaryValues } from "../schemas/editor-schema";
export function AllowanceFields({ form }: { form: UseFormReturn<SalaryValues> }) {
  const rows = useFieldArray({ control: form.control, name: "allowances" });
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Allowances</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => rows.append({ type: { value: "0", label: allowanceLabels[0] }, amount: 0, description: "", taxable: true })}
        >
          Add allowance
        </Button>
      </div>
      {rows.fields.map((row, index) => {
        const fields: WizardField<SalaryValues>[] = [
          {
            type: I.SELECT,
            name: `allowances.${index}.type`,
            label: "Type",
            mode: "single",
            source: "sync",
            options: allowanceLabels.map((label, value) => ({ value: String(value), label })),
            required: true,
          },
          { type: I.TEXT, name: `allowances.${index}.description`, label: "Description" },
          { type: I.NUMBER, name: `allowances.${index}.amount`, label: "Amount (GHS)", min: 0, required: true },
          { type: I.SWITCH, name: `allowances.${index}.taxable`, label: "Taxable" },
        ];
        return (
          <div key={row.id} className="space-y-2 rounded-md border p-3">
            <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
            <Button type="button" variant="destructive" size="sm" onClick={() => rows.remove(index)}>
              Remove allowance {index + 1}
            </Button>
          </div>
        );
      })}
      {!rows.fields.length ? <p className="text-sm text-muted-foreground">No allowances. The new record will contain only its basic salary.</p> : null}
    </section>
  );
}
