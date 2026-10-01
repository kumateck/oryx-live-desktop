import { useId } from "react";
import { useFormContext, type FieldValues } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import { useFieldError } from "../field-state";
import type { TextareaField } from "../form-wizard-types";

export default function TextareaInputField({ field }: {
  field: TextareaField<FieldValues>;
}) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const error = useFieldError(field.name);
  return <FieldFrame id={id} label={field.label} required={field.required} description={field.description} error={error} className={field.className}>
    <Textarea id={id} rows={field.rows} placeholder={field.placeholder} readOnly={field.readOnly} disabled={field.disabled}
      aria-required={field.required} aria-invalid={Boolean(error)} aria-describedby={fieldDescription(id, field.description, error)}
      {...form.register(field.name)} />
  </FieldFrame>;
}
