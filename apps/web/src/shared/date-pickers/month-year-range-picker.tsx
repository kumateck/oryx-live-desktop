import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMonthRange, isMonthAllowed, monthYearValue, parseMonthYear, type MonthRange } from "./date-utils";
import { MonthYearSelects } from "./month-year-selects";
import { PickerTrigger } from "./picker-trigger";

interface MonthYearRangePickerProps {
  id: string;
  label: string;
  value: MonthRange | null | undefined;
  onChange: (value: MonthRange | null) => void;
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

/** A period of whole months: from one month and year to another, both included. */
export function MonthYearRangePicker({ id, label, value, onChange, onBlur, placeholder = "Select months",
  minMonth, maxMonth, fromYear, toYear, disabled, invalid, describedBy }: MonthYearRangePickerProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const first = parseMonthYear(value?.from);
  const last = parseMonthYear(value?.to);
  const selected = first && last ? value : null;
  const minYear = fromYear ?? parseMonthYear(minMonth)?.year ?? 1900;
  const maxYear = toYear ?? parseMonthYear(maxMonth)?.year ?? today.getFullYear() + 30;
  const current = { year: Math.min(maxYear, Math.max(minYear, today.getFullYear())), month: today.getMonth() + 1 };
  const [start, setStart] = useState(first ?? current);
  const [end, setEnd] = useState(last ?? current);
  const from = monthYearValue(start.year, start.month);
  const to = monthYearValue(end.year, end.month);
  const backwards = to < from;
  const canApply = !backwards && isMonthAllowed(from, minMonth, maxMonth) && isMonthAllowed(to, minMonth, maxMonth);

  return <Popover open={open} onOpenChange={(next) => {
    if (next) { setStart(first ?? current); setEnd(last ?? current); } else onBlur?.();
    setOpen(next);
  }}>
    <PopoverTrigger asChild><PickerTrigger id={id} label={label} value={selected ? formatMonthRange(selected) : null}
      placeholder={placeholder} disabled={disabled} invalid={invalid} describedBy={describedBy} /></PopoverTrigger>
    {open ? <PopoverContent align="start" className="w-72 gap-3 p-3">
      <MonthYearSelects id={`${id}-from`} caption="From" year={start.year} month={start.month} minYear={minYear} maxYear={maxYear} minMonth={minMonth} maxMonth={maxMonth}
        onYear={(year) => setStart((value) => ({ ...value, year }))} onMonth={(month) => setStart((value) => ({ ...value, month }))} />
      <MonthYearSelects id={`${id}-to`} caption="To" year={end.year} month={end.month} minYear={minYear} maxYear={maxYear} minMonth={minMonth} maxMonth={maxMonth}
        onYear={(year) => setEnd((value) => ({ ...value, year }))} onMonth={(month) => setEnd((value) => ({ ...value, month }))} />
      {backwards ? <p role="alert" className="text-xs text-destructive">The last month cannot be before the first.</p> : null}
      <div className="flex justify-between gap-2 border-t border-border pt-2">
        <Button type="button" size="xs" variant="ghost" disabled={!selected} onClick={() => { onChange(null); setOpen(false); }}>Clear</Button>
        <Button type="button" size="xs" disabled={!canApply} onClick={() => { onChange({ from, to }); setOpen(false); }}>Apply</Button>
      </div>
    </PopoverContent> : null}
  </Popover>;
}
