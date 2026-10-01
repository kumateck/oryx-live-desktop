import { useId } from "react";
import { useFormContext, type FieldValues } from "react-hook-form";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import { useFieldError } from "../field-state";
import type { TextField } from "../form-wizard-types";
import { PasswordInput } from "../password-input";

export default function PasswordInputField({ field }: { field: TextField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const error = useFieldError(field.name);
  return <FieldFrame id={id} label={field.label} required={field.required} description={field.description} error={error} className={field.className}>
    <PasswordInput id={id} placeholder={field.placeholder} autoComplete={field.autoComplete ?? "current-password"} readOnly={field.readOnly}
      disabled={field.disabled} aria-required={field.required} aria-invalid={Boolean(error)}
      aria-describedby={fieldDescription(id, field.description, error)} {...form.register(field.name)} />
  </FieldFrame>;
}
