import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMonthYear, isMonthAllowed, monthYearValue, parseMonthYear } from "./date-utils";
import { PickerTrigger } from "./picker-trigger";

const monthNames = Array.from({ length: 12 }, (_, index) =>
  new Date(2000, index, 1).toLocaleDateString(undefined, { month: "long" }));

interface MonthYearPickerProps {
  id: string;
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  onBlur?: (() => void) | undefined;
  placeholder?: string | undefined;
  minMonth?: string | undefined;
  maxMonth?: string | undefined;
  fromYear?: number | undefined;
  toYear?: number | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  describedBy?: string | undefined;
}

export function MonthYearPicker({ id, label, value, onChange, onBlur, placeholder = "Select month and year",
  minMonth, maxMonth, fromYear, toYear, disabled, invalid, describedBy }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const selected = parseMonthYear(value);
  const minYear = fromYear ?? parseMonthYear(minMonth)?.year ?? 1900;
  const maxYear = toYear ?? parseMonthYear(maxMonth)?.year ?? today.getFullYear() + 30;
  const [year, setYear] = useState(selected?.year ?? today.getFullYear());
  const [month, setMonth] = useState(selected?.month ?? today.getMonth() + 1);
  const years = Array.from({ length: Math.max(0, maxYear - minYear + 1) }, (_, index) => minYear + index);
  const draft = monthYearValue(year, month);
  const canApply = year >= minYear && year <= maxYear && isMonthAllowed(draft, minMonth, maxMonth);

  return <Popover open={open} onOpenChange={(next) => {
    if (next) {
      setYear(selected?.year ?? Math.min(maxYear, Math.max(minYear, today.getFullYear())));
      setMonth(selected?.month ?? today.getMonth() + 1);
    } else onBlur?.();
    setOpen(next);
  }}>
    <PopoverTrigger asChild><PickerTrigger id={id} label={label} value={selected ? formatMonthYear(value ?? "") : null}
      placeholder={placeholder} disabled={disabled} invalid={invalid} describedBy={describedBy} /></PopoverTrigger>
    {open ? <PopoverContent align="start" className="w-64 gap-3 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1.5"><Label htmlFor={`${id}-month`}>Month</Label>
          <Select value={String(month)} onValueChange={(next) => setMonth(Number(next))}>
            <SelectTrigger id={`${id}-month`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{monthNames.map((name, index) => <SelectItem key={name} value={String(index + 1)}
              disabled={!isMonthAllowed(monthYearValue(year, index + 1), minMonth, maxMonth)}>{name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5"><Label htmlFor={`${id}-year`}>Year</Label>
          <Select value={String(year)} onValueChange={(next) => setYear(Number(next))}>
            <SelectTrigger id={`${id}-year`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((option) => <SelectItem key={option} value={String(option)}
              disabled={!monthNames.some((_, index) => isMonthAllowed(monthYearValue(option, index + 1), minMonth, maxMonth))}>{option}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-between gap-2 border-t border-border pt-2">
        <Button type="button" size="xs" variant="ghost" disabled={!selected} onClick={() => { onChange(null); setOpen(false); }}>Clear</Button>
        <Button type="button" size="xs" disabled={!canApply} onClick={() => { onChange(draft); setOpen(false); }}>Apply</Button>
      </div>
    </PopoverContent> : null}
  </Popover>;
}
