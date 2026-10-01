import { useId } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { fieldDescription } from "../field-description";
import type { SwitchField } from "../form-wizard-types";

export default function SwitchInputField({ field }: { field: SwitchField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const error = fieldState.error?.message;
  return <Field orientation="horizontal" data-invalid={Boolean(error)} className={field.className}>
    <Switch id={id} name={control.name} ref={control.ref} checked={Boolean(control.value)}
      onCheckedChange={control.onChange} onBlur={control.onBlur} disabled={field.disabled}
      aria-required={field.required} aria-invalid={Boolean(error)} aria-describedby={fieldDescription(id, field.description, error)} />
    <FieldContent>
      <FieldLabel htmlFor={id}>{field.label}{field.required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}</FieldLabel>
      {field.description ? <FieldDescription id={`${id}-description`}>{field.description}</FieldDescription> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </FieldContent>
  </Field>;
}
