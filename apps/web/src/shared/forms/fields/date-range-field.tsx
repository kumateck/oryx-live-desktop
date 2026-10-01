import { useId } from "react";
import type { DateRange } from "react-day-picker";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { DateRangePicker } from "@/shared/date-pickers/date-range-picker";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import type { DateRangeField } from "../form-wizard-types";

function isDateRange(value: object | null | undefined): value is DateRange {
  if (!value || !("from" in value)) return false;
  const from = value.from;
  const to = "to" in value ? value.to : undefined;
  return (from === undefined || from instanceof Date) && (to === undefined || to instanceof Date);
}

export default function DateRangeInputField({ field }: { field: DateRangeField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const error = fieldState.error?.message;
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <DateRangePicker id={id} label={field.label} value={isDateRange(control.value) ? control.value : null}
      onChange={control.onChange} onBlur={control.onBlur} placeholder={field.placeholder} disabled={field.disabled}
      invalid={Boolean(error)} describedBy={fieldDescription(id, field.description, error)}
      minDate={field.minDate} maxDate={field.maxDate} fromYear={field.fromYear} toYear={field.toYear} />
  </FieldFrame>;
}
