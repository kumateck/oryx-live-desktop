import { useId, useState } from "react";
import { useController, type UseFormReturn } from "react-hook-form";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldFrame } from "@/shared/forms/field-frame";
import { fieldDescription } from "@/shared/forms/field-description";
import { convertUnit, relatedUnits } from "@/shared/units/quantity";
import type { PackagingUnit } from "../../lib/packaging";
import type { PackagingItemFormValues } from "../../schemas/packaging-schema";

type Form = UseFormReturn<PackagingItemFormValues>;
type QuantityName = "prescribedQuantity" | "packingExcessMargin";

function QuantityInput({ form, name, label, unit, entryUnit }: {
  form: Form; name: QuantityName; label: string; unit: PackagingUnit; entryUnit: string;
}) {
  const id = useId();
  const { field, fieldState } = useController({ control: form.control, name });
  const [text, setText] = useState(() => typeof field.value === "number" ? String(convertUnit(field.value, unit.symbol, entryUnit) ?? "") : "");
  const description = name === "packingExcessMargin" ? "Extra issued to cover losses during packing." : undefined;
  const error = fieldState.error?.message;
  return <FieldFrame id={id} label={`${label} (${entryUnit})`} required={name === "prescribedQuantity"} description={description} error={error}>
    <InputGroup>
      <InputGroupInput id={id} name={field.name} ref={field.ref} type="number" min={0} step="any" value={text}
        onBlur={field.onBlur} aria-required={name === "prescribedQuantity"} aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, description, error)} onChange={(event) => {
          setText(event.currentTarget.value);
          field.onChange(convertUnit(event.currentTarget.valueAsNumber, entryUnit, unit.symbol) ?? Number.NaN);
        }} />
      <InputGroupAddon align="inline-end"><InputGroupText>{entryUnit}</InputGroupText></InputGroupAddon>
    </InputGroup>
  </FieldFrame>;
}

/** Entry units change only the view; React Hook Form always holds quantities in the linked material unit. */
export function PackagingQuantityFields({ form, unit }: { form: Form; unit: PackagingUnit }) {
  const [entryUnit, setEntryUnit] = useState(() => relatedUnits(unit.symbol).find((symbol) => symbol.toLowerCase() === unit.symbol.toLowerCase()) ?? unit.symbol);
  const id = useId();
  const convertible = ["mg", "ml"].includes(unit.symbol.toLowerCase());
  const units = convertible ? relatedUnits(unit.symbol) : [unit.symbol];
  return <div className="space-y-4">
    {convertible ? <FieldFrame id={id} label="Enter quantities in" description="Applies to both prescribed quantity and packing allowance.">
      <Select value={entryUnit} onValueChange={(symbol) => { if (units.includes(symbol)) setEntryUnit(symbol); }}>
        <SelectTrigger id={id} className="w-full sm:w-40" aria-describedby={`${id}-description`}><SelectValue /></SelectTrigger>
        <SelectContent>{units.map((symbol) => <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>)}</SelectContent>
      </Select>
    </FieldFrame> : null}
    <div className="grid gap-4 md:grid-cols-2">
      <QuantityInput key={`prescribed-${entryUnit}`} form={form} name="prescribedQuantity" label="Prescribed quantity" unit={unit} entryUnit={entryUnit} />
      <QuantityInput key={`allowance-${entryUnit}`} form={form} name="packingExcessMargin" label="Packing allowance" unit={unit} entryUnit={entryUnit} />
    </div>
  </div>;
}
