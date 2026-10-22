import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import type { EmployeeValues } from "../schemas/employee-schema";
import { genderOptions } from "../lib/employee-payload";
export function EducationBackgroundFields({ form }: { form: UseFormReturn<EmployeeValues> }) {
  const array = useFieldArray({ control: form.control, name: "educationBackground" });
  return <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Education and training</h2><Button type="button" variant="outline" size="sm" onClick={() => array.append({ schoolName: "", startDate: null, endDate: null, major: "", qualificationEarned: "" })}>Add record</Button></div>
    {array.fields.map((field, index) => {
      const fields: WizardField<EmployeeValues>[] = [
        { type: I.TEXT, name: `educationBackground.${index}.schoolName`, label: "School name" },
        { type: I.DATE, name: `educationBackground.${index}.startDate`, label: "Start date" },
        { type: I.DATE, name: `educationBackground.${index}.endDate`, label: "End date" },
        { type: I.TEXT, name: `educationBackground.${index}.major`, label: "Major" },
        { type: I.TEXT, name: `educationBackground.${index}.qualificationEarned`, label: "Qualification earned" },
      ];
      return <div key={field.id} className="space-y-2 rounded-md border p-3"><div className="flex justify-between gap-3"><h3 className="text-sm font-medium">Record {index + 1}</h3><Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => array.remove(index)}>Remove record {index + 1}</Button></div><div className="grid gap-3 sm:grid-cols-2"><FormWizard form={form} fields={fields} /></div></div>;
    })}
  </section>;
}
