import { useId, useState } from "react";
import { useController, type FieldPathByValue, type FieldValues, type UseFormReturn } from "react-hook-form";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldFrame } from "@/shared/forms/field-frame";
import { fieldDescription } from "@/shared/forms/field-description";
import { convertUnit, relatedUnits } from "@/shared/units/quantity";
import type { MaterialUnit } from "../lib/material-unit";

export interface MaterialQuantityField<T extends FieldValues> {
  name: FieldPathByValue<T, number | null | undefined>;
  label: string;
  required?: boolean;
  description?: string;
}

function QuantityInput<T extends FieldValues>({ form, field: definition, unit, entryUnit }: {
  form: UseFormReturn<T>; field: MaterialQuantityField<T>; unit: MaterialUnit; entryUnit: string;
}) {
  const id = useId();
  const { field, fieldState } = useController({ control: form.control, name: definition.name });
  const [text, setText] = useState(() => typeof field.value === "number" && Number.isFinite(field.value) ? String(convertUnit(field.value, unit.symbol, entryUnit) ?? "") : "");
  const { label, required, description } = definition;
  const error = fieldState.error?.message;
  return <FieldFrame id={id} label={`${label} (${entryUnit})`} required={required} description={description} error={error}>
    <InputGroup>
      <InputGroupInput id={id} name={field.name} ref={field.ref} type="number" min={0} step="any" value={text}
        onBlur={field.onBlur} aria-required={required} aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, description, error)} onChange={(event) => {
          setText(event.currentTarget.value);
          field.onChange(convertUnit(event.currentTarget.valueAsNumber, entryUnit, unit.symbol) ?? Number.NaN);
        }} />
      <InputGroupAddon align="inline-end"><InputGroupText>{entryUnit}</InputGroupText></InputGroupAddon>
    </InputGroup>
  </FieldFrame>;
}

/** Entry units change only the view; the form holds quantities in the department-linked unit. */
export function MaterialQuantityFields<T extends FieldValues>({ form, unit, fields, description }: {
  form: UseFormReturn<T>; unit: MaterialUnit; fields: readonly MaterialQuantityField<T>[]; description?: string;
}) {
  const [entryUnit, setEntryUnit] = useState(() => relatedUnits(unit.symbol).find((symbol) => symbol.toLowerCase() === unit.symbol.toLowerCase()) ?? unit.symbol);
  const id = useId();
  const convertible = ["mg", "ml"].includes(unit.symbol.toLowerCase());
  const units = convertible ? relatedUnits(unit.symbol) : [unit.symbol];
  return <div className="space-y-4">
    {convertible ? <FieldFrame id={id} label="Enter quantities in" description={description}>
      <Select value={entryUnit} onValueChange={(symbol) => { if (units.includes(symbol)) setEntryUnit(symbol); }}>
        <SelectTrigger id={id} className="w-full sm:w-40" aria-describedby={description ? `${id}-description` : undefined}><SelectValue /></SelectTrigger>
        <SelectContent>{units.map((symbol) => <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>)}</SelectContent>
      </Select>
    </FieldFrame> : null}
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((field) => <QuantityInput key={`${field.name}-${entryUnit}`} form={form} field={field} unit={unit} entryUnit={entryUnit} />)}
    </div>
  </div>;
}
