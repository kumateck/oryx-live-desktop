import { useId } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import type { MonthRange } from "@/shared/date-pickers/date-utils";
import { MonthYearRangePicker } from "@/shared/date-pickers/month-year-range-picker";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import type { MonthRangeField } from "../form-wizard-types";

function isMonthRange(value: object | null | undefined): value is MonthRange {
  return Boolean(value) && typeof (value as MonthRange).from === "string" && typeof (value as MonthRange).to === "string";
}

export default function MonthRangeInputField({ field }: { field: MonthRangeField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const error = fieldState.error?.message;
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <MonthYearRangePicker id={id} label={field.label} value={isMonthRange(control.value) ? control.value : null}
      onChange={control.onChange} onBlur={control.onBlur} placeholder={field.placeholder} disabled={field.disabled}
      invalid={Boolean(error)} describedBy={fieldDescription(id, field.description, error)}
      minMonth={field.minMonth} maxMonth={field.maxMonth} fromYear={field.fromYear} toYear={field.toYear} />
  </FieldFrame>;
}
