import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calendarMonths, formatDate, isDateAllowed, isSameCalendarDay, type DateLimits } from "./date-utils";
import { PickerTrigger } from "./picker-trigger";

interface DateRangePickerProps extends DateLimits {
  id: string;
  label: string;
  value: DateRange | null | undefined;
  onChange: (value: DateRange | null) => void;
  onBlur?: (() => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  describedBy?: string | undefined;
}

function rangeLabel(value: DateRange | null | undefined): string | null {
  if (!value?.from) return null;
  return value.to ? `${formatDate(value.from)} – ${formatDate(value.to)}` : `${formatDate(value.from)} – …`;
}

export function DateRangePicker({ id, label, value, onChange, onBlur, placeholder = "Select date range", disabled, invalid, describedBy, ...limits }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const displayMonth = value?.from ?? limits.minDate;
  return <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) onBlur?.(); }}>
    <PopoverTrigger asChild><PickerTrigger id={id} label={label} value={rangeLabel(value)}
      placeholder={placeholder} disabled={disabled} invalid={invalid} describedBy={describedBy} /></PopoverTrigger>
    <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] gap-0 p-0">
      <Calendar mode="range" selected={value ?? undefined} {...(displayMonth ? { defaultMonth: displayMonth } : {})} captionLayout="dropdown"
        {...calendarMonths(limits)} disabled={(day) => !isDateAllowed(day, limits)}
        onSelect={(range) => {
          if (!value?.from && range?.from && range.to && isSameCalendarDay(range.from, range.to)) {
            onChange({ from: range.from, to: undefined });
            return;
          }
          onChange(range ?? null);
          if (range?.from && range.to) setOpen(false);
        }} />
      {value?.from ? <div className="flex justify-end border-t border-border p-1.5">
        {value.to ? <Button type="button" variant="ghost" size="xs" onClick={() => onChange(null)}>New range</Button> : null}
        {!value.to ? <Button type="button" variant="ghost" size="xs" onClick={() => { onChange({ from: value.from, to: value.from }); setOpen(false); }}>Use one day</Button> : null}
        <Button type="button" variant="ghost" size="xs" onClick={() => { onChange(null); setOpen(false); }}>Clear range</Button>
      </div> : null}
    </PopoverContent>
  </Popover>;
}
