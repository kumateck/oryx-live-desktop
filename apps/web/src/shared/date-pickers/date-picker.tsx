import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calendarMonths, formatDate, isDateAllowed, type DateLimits } from "./date-utils";
import { PickerTrigger } from "./picker-trigger";

interface DatePickerProps extends DateLimits {
  id: string;
  label: string;
  value: Date | null | undefined;
  onChange: (value: Date | null) => void;
  onBlur?: (() => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  describedBy?: string | undefined;
}

export function DatePicker({ id, label, value, onChange, onBlur, placeholder = "Select date", disabled, invalid, describedBy, ...limits }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value instanceof Date && !Number.isNaN(value.getTime()) ? value : undefined;
  return <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) onBlur?.(); }}>
    <PopoverTrigger asChild><PickerTrigger id={id} label={label} value={selected ? formatDate(selected) : null}
      placeholder={placeholder} disabled={disabled} invalid={invalid} describedBy={describedBy} /></PopoverTrigger>
    <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] gap-0 p-0">
      <Calendar mode="single" selected={selected} {...(selected ? { defaultMonth: selected } : {})} captionLayout="dropdown"
        {...calendarMonths(limits)} disabled={(day) => !isDateAllowed(day, limits)}
        onSelect={(day) => { if (day && isDateAllowed(day, limits)) { onChange(day); setOpen(false); } }} />
      {selected ? <div className="flex justify-end border-t border-border p-1.5">
        <Button type="button" variant="ghost" size="xs" onClick={() => { onChange(null); setOpen(false); }}>Clear date</Button>
      </div> : null}
    </PopoverContent>
  </Popover>;
}
