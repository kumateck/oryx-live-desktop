import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMonthYear, isMonthAllowed, monthYearValue, parseMonthYear } from "./date-utils";
import { MonthYearSelects } from "./month-year-selects";
import { PickerTrigger } from "./picker-trigger";

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
      <MonthYearSelects id={id} year={year} month={month} onYear={setYear} onMonth={setMonth} minYear={minYear} maxYear={maxYear} minMonth={minMonth} maxMonth={maxMonth} />
      <div className="flex justify-between gap-2 border-t border-border pt-2">
        <Button type="button" size="xs" variant="ghost" disabled={!selected} onClick={() => { onChange(null); setOpen(false); }}>Clear</Button>
        <Button type="button" size="xs" disabled={!canApply} onClick={() => { onChange(draft); setOpen(false); }}>Apply</Button>
      </div>
    </PopoverContent> : null}
  </Popover>;
}
