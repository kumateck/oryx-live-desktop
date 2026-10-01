import { useId } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import type { SliderField } from "../form-wizard-types";

export default function SliderInputField({ field }: { field: SliderField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const error = fieldState.error?.message;
  const value = typeof control.value === "number" ? control.value : field.min;
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <div className="flex min-w-0 items-center gap-3">
      <Slider id={id} name={control.name} ref={control.ref} value={[value]} min={field.min} max={field.max}
        step={field.step ?? 1} onValueChange={(values) => { if (values[0] !== undefined) control.onChange(values[0]); }}
        onBlur={control.onBlur} disabled={field.disabled ?? false} aria-label={field.label} aria-required={field.required}
        aria-invalid={Boolean(error)} aria-describedby={fieldDescription(id, field.description, error)} />
      <output htmlFor={id} className="min-w-8 text-right text-sm tabular-nums">{value}</output>
    </div>
  </FieldFrame>;
}
