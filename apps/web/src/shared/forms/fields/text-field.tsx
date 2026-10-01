import { useId } from "react";
import { useFormContext, type FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import { useFieldError } from "../field-state";
import type { NumberField, TextField } from "../form-wizard-types";

type InputField<TValues extends FieldValues> = TextField<TValues> | NumberField<TValues>;

export default function TextInputField({ field }: {
  field: InputField<FieldValues>;
}) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const error = useFieldError(field.name);
  const registration = form.register(field.name, field.type === "number" ? { valueAsNumber: true } : {});
  return <FieldFrame id={id} label={field.label} required={field.required} description={field.description} error={error} className={field.className}>
    <Input id={id} type={field.type} placeholder={field.placeholder} autoComplete={field.type === "number" ? undefined : field.autoComplete}
      readOnly={field.readOnly} disabled={field.disabled} aria-required={field.required} aria-invalid={Boolean(error)}
      aria-describedby={fieldDescription(id, field.description, error)}
      min={field.type === "number" ? field.min : undefined} max={field.type === "number" ? field.max : undefined}
      step={field.type === "number" ? field.step : undefined} {...registration} />
  </FieldFrame>;
}
