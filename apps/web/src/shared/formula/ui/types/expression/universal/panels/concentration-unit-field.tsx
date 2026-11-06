import { useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONCENTRATION_UNITS,
  isConcentrationUnit,
  type ConcentrationUnit,
} from "@/shared/formula/builder/universal-variable-keys";

/** The unit the worksheet shows for :standardConc and :sampleConc. The value itself is the weight input's. */
export function ConcentrationUnitField({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean | undefined;
  onChange: (unit: ConcentrationUnit) => void;
  value: ConcentrationUnit;
}) {
  const id = useId();
  return (
    <div className="mb-3 grid gap-1.5">
      <Label htmlFor={id} className="text-xs">
        Concentration unit
      </Label>
      <Select
        value={value}
        disabled={disabled === true}
        onValueChange={(next) => {
          if (isConcentrationUnit(next)) onChange(next);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONCENTRATION_UNITS.map((unit) => (
            <SelectItem key={unit} value={unit}>
              {unit}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
