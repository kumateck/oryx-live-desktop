import { useId } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { DatePicker } from "@/shared/date-pickers/date-picker";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import type { DateField } from "../form-wizard-types";

export default function DateInputField({ field }: { field: DateField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const error = fieldState.error?.message;
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <DatePicker id={id} label={field.label} value={control.value instanceof Date ? control.value : null}
      onChange={control.onChange} onBlur={control.onBlur} placeholder={field.placeholder} disabled={field.disabled}
      invalid={Boolean(error)} describedBy={fieldDescription(id, field.description, error)}
      minDate={field.minDate} maxDate={field.maxDate} fromYear={field.fromYear} toYear={field.toYear} />
  </FieldFrame>;
}
