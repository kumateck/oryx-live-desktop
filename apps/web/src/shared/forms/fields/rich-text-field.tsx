import { useId } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { RichTextEditor } from "@/shared/rich-text/rich-text-editor";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import type { RichTextField } from "../form-wizard-types";

export default function RichTextInputField({ field }: { field: RichTextField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const error = fieldState.error?.message;
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <RichTextEditor id={id} label={field.label} value={typeof control.value === "string" ? control.value : null}
      onChange={control.onChange} onBlur={control.onBlur} placeholder={field.placeholder} rows={field.rows}
      disabled={field.disabled || field.readOnly} invalid={Boolean(error)}
      describedBy={fieldDescription(id, field.description, error)} references={field.references} />
  </FieldFrame>;
}
