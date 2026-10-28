import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import type { EmployeeValues } from "../schemas/employee-schema";
import { genderOptions } from "../lib/employee-payload";
export function EmploymentHistoryFields({ form }: { form: UseFormReturn<EmployeeValues> }) {
  const array = useFieldArray({ control: form.control, name: "employmentHistory" });
  return <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Employment history</h2><Button type="button" variant="outline" size="sm" onClick={() => array.append({ companyName: "", position: "", startDate: null, endDate: null })}>Add record</Button></div>
    {array.fields.map((field, index) => {
      const fields: WizardField<EmployeeValues>[] = [
        { type: I.TEXT, name: `employmentHistory.${index}.companyName`, label: "Company name" },
        { type: I.TEXT, name: `employmentHistory.${index}.position`, label: "Position" },
        { type: I.DATE, name: `employmentHistory.${index}.startDate`, label: "Start date" },
        { type: I.DATE, name: `employmentHistory.${index}.endDate`, label: "End date" },
      ];
      return <div key={field.id} className="space-y-2 rounded-md border p-3"><div className="flex justify-between gap-3"><h3 className="text-sm font-medium">Record {index + 1}</h3><Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => array.remove(index)}>Remove record {index + 1}</Button></div><div className="grid gap-3 sm:grid-cols-2"><FormWizard form={form} fields={fields} /></div></div>;
    })}
  </section>;
}
