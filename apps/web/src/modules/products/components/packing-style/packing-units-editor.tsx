import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, type Control, type FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { parseNumberInput } from "@/shared/datatable";
import type { PackingStyleFormValues } from "../../schemas/packing-style-schema";

/** The units a packing style is built from, outermost last: for example 10 tablets per blister, 10 blisters per box. */
export function PackingUnitsEditor({ control, errors, units }: {
  control: Control<PackingStyleFormValues>;
  errors: FieldErrors<PackingStyleFormValues>;
  units: readonly SelectOption[];
}) {
  const rows = useFieldArray({ control, name: "units" });
  const listError = errors.units?.root?.message ?? errors.units?.message;
  return <fieldset className="min-w-0 space-y-2">
    <div className="flex items-center justify-between gap-2">
      <legend className="text-sm font-medium">Packing units<span className="ml-1 text-destructive" aria-hidden="true">*</span></legend>
      <Button type="button" size="sm" variant="outline" onClick={() => rows.append({ uom: { value: "", label: "" }, quantity: Number.NaN })}><Plus />Add unit</Button>
    </div>
    {rows.fields.map((row, index) => {
      const rowErrors = errors.units?.[index];
      return <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_8rem_auto] items-start gap-2">
        <Controller control={control} name={`units.${index}.uom`} render={({ field }) => <div className="min-w-0 space-y-1">
          <Select value={field.value?.value ?? ""} onValueChange={(value) => field.onChange(units.find((unit) => unit.value === value) ?? { value, label: "" })}>
            <SelectTrigger aria-label={`Unit ${index + 1}`} aria-invalid={Boolean(rowErrors?.uom)} className="w-full"><SelectValue placeholder="Select unit" /></SelectTrigger>
            <SelectContent>{units.map((unit) => <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>)}</SelectContent>
          </Select>
          {rowErrors?.uom ? <p role="alert" className="text-xs text-destructive">{rowErrors.uom.message ?? rowErrors.uom.value?.message}</p> : null}
        </div>} />
        <Controller control={control} name={`units.${index}.quantity`} render={({ field }) => <div className="space-y-1">
          <Input aria-label={`Quantity of unit ${index + 1}`} inputMode="decimal" placeholder="Quantity" className="text-right tabular-nums"
            aria-invalid={Boolean(rowErrors?.quantity)} defaultValue={Number.isFinite(field.value) ? String(field.value) : ""}
            onChange={(event) => field.onChange(parseNumberInput(event.target.value) ?? Number.NaN)} onBlur={field.onBlur} ref={field.ref} />
          {rowErrors?.quantity ? <p role="alert" className="text-xs text-destructive">{rowErrors.quantity.message}</p> : null}
        </div>} />
        <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove unit ${index + 1}`} disabled={rows.fields.length === 1}
          onClick={() => rows.remove(index)}><Trash2 /></Button>
      </div>;
    })}
    {listError ? <p role="alert" className="text-xs text-destructive">{listError}</p> : null}
  </fieldset>;
}
