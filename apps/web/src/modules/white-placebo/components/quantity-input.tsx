import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertUnit, relatedUnits, toLargestUnit } from "@/shared/units/quantity";

/** Values remain in the linked stock unit; changing the entry unit preserves the amount. */
export function QuantityInput({ id, label, value, unit, onChange, invalid = false, disabled = false }: {
  id: string; label: string; value: number; unit: string; onChange: (value: number) => void; invalid?: boolean; disabled?: boolean;
}) {
  const [chosen, setChosen] = useState(() => toLargestUnit(value, unit)?.unit ?? unit);
  const units = relatedUnits(unit);
  const selected = units.includes(chosen) ? chosen : unit;
  const displayed = Number.isFinite(value) ? convertUnit(value, unit, selected) : null;
  return <div className="flex min-w-0 gap-2">
    <Input id={id} aria-label={label} type="number" inputMode="decimal" step="any" min="0" disabled={disabled}
      aria-invalid={invalid} value={displayed ?? ""} onChange={(event) => {
        const number = event.target.valueAsNumber;
        onChange(Number.isFinite(number) ? convertUnit(number, selected, unit) ?? number : Number.NaN);
      }} />
    <Select value={selected} onValueChange={setChosen} disabled={disabled}>
      <SelectTrigger className="w-20 shrink-0" aria-label={`${label} unit`}><SelectValue /></SelectTrigger>
      <SelectContent>{units.map((symbol) => <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}
