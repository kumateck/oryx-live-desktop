import { useId } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import { formatDurationValue, fromTimeInput, parseClockValue, parseDurationValue, toTimeInput } from "../time-value";
import type { TimeField } from "../form-wizard-types";
import { InputTypes } from "../input-types";

export default function TimeInputField({ field }: { field: TimeField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const value = typeof control.value === "string" ? control.value : null;
  const error = fieldState.error?.message;
  const describedBy = fieldDescription(id, field.description, error);
  if (field.type === InputTypes.MOMENT) {
    const duration = parseDurationValue(value);
    const varies = value === "Varies";
    const update = (hours: number, minutes: number) => control.onChange(hours || minutes ? formatDurationValue({ hours, minutes }) : null);
    return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
      <div id={id} className="flex min-w-0 gap-2" role="group" aria-labelledby={`${id}-label`}>
        <div className="min-w-0 flex-1"><label htmlFor={`${id}-hours`} className="text-xs text-muted-foreground">Hours</label>
          <Input id={`${id}-hours`} type="number" min={0} step={1} inputMode="numeric" value={duration?.hours ?? ""}
            onChange={(event) => update(Math.max(0, Number(event.target.value) || 0), duration?.minutes ?? 0)}
            onBlur={control.onBlur} disabled={field.disabled || varies} aria-invalid={Boolean(error)} aria-describedby={describedBy} /></div>
        <div className="min-w-0 flex-1"><label htmlFor={`${id}-minutes`} className="text-xs text-muted-foreground">Minutes</label>
          <Input id={`${id}-minutes`} type="number" min={0} max={59} step={1} inputMode="numeric" value={duration?.minutes ?? ""}
            onChange={(event) => update(duration?.hours ?? 0, Math.min(59, Math.max(0, Number(event.target.value) || 0)))}
            onBlur={control.onBlur} disabled={field.disabled || varies} aria-invalid={Boolean(error)} aria-describedby={describedBy} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={varies} disabled={field.disabled}
        onCheckedChange={(checked) => control.onChange(checked === true ? "Varies" : null)} />Time varies</label>
    </FieldFrame>;
  }
  const days = field.type === InputTypes.TIME && field.showDays ? parseClockValue(value)?.days ?? 0 : 0;
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <div className="flex min-w-0 gap-2">
      <Input id={id} type="time" value={toTimeInput(value)} onChange={(event) => control.onChange(fromTimeInput(event.target.value, days))}
        onBlur={control.onBlur} disabled={field.disabled} aria-required={field.required} aria-invalid={Boolean(error)} aria-describedby={describedBy}
        className="min-w-0 flex-1" />
      {field.type === InputTypes.TIME && field.showDays ? <div className="w-20 shrink-0">
        <label htmlFor={`${id}-days`} className="sr-only">Days</label>
        <Input id={`${id}-days`} type="number" min={0} max={field.maxDays} step={1} inputMode="numeric" title="Days"
          value={days} onChange={(event) => {
            const nextDays = Math.min(field.maxDays ?? Number.MAX_SAFE_INTEGER, Math.max(0, Number(event.target.value) || 0));
            control.onChange(fromTimeInput(toTimeInput(value) || "00:00", nextDays));
          }} onBlur={control.onBlur} disabled={field.disabled} />
      </div> : null}
    </div>
  </FieldFrame>;
}
