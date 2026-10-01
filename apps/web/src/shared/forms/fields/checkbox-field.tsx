import { useId } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { fieldDescription } from "../field-description";
import type { CheckboxField } from "../form-wizard-types";

export default function CheckboxInputField({ field }: {
  field: CheckboxField<FieldValues>;
}) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const error = fieldState.error?.message;
  return <Field orientation="horizontal" data-invalid={Boolean(error)} className={field.className}>
      <Checkbox id={id} ref={control.ref} name={control.name} checked={Boolean(control.value)}
        onCheckedChange={(checked) => control.onChange(checked === true)} onBlur={control.onBlur}
        disabled={field.disabled} aria-required={field.required} aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, field.description, error)} />
      <FieldContent>
        <FieldLabel htmlFor={id}>{field.label}{field.required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}</FieldLabel>
        {field.description ? <FieldDescription id={`${id}-description`}>{field.description}</FieldDescription> : null}
        {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
      </FieldContent>
  </Field>;
}
