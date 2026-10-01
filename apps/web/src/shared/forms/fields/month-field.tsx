import { useId } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { MonthYearPicker } from "@/shared/date-pickers/month-year-picker";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import type { MonthField } from "../form-wizard-types";

export default function MonthInputField({ field }: { field: MonthField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const error = fieldState.error?.message;
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <MonthYearPicker id={id} label={field.label} value={typeof control.value === "string" ? control.value : null}
      onChange={control.onChange} onBlur={control.onBlur} placeholder={field.placeholder} disabled={field.disabled}
      invalid={Boolean(error)} describedBy={fieldDescription(id, field.description, error)}
      minMonth={field.minMonth} maxMonth={field.maxMonth} fromYear={field.fromYear} toYear={field.toYear} />
  </FieldFrame>;
}
