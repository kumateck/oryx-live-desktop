import { useId } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { RadioField } from "../form-wizard-types";

export default function RadioInputField({ field }: { field: RadioField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const error = fieldState.error?.message;
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <RadioGroup id={id} name={control.name} ref={control.ref} value={typeof control.value === "string" ? control.value : ""}
      onValueChange={control.onChange} onBlur={control.onBlur} disabled={field.disabled}
      aria-labelledby={`${id}-label`} aria-required={field.required} aria-invalid={Boolean(error)} aria-describedby={fieldDescription(id, field.description, error)}>
      {field.options.map((option, index) => <div key={option.value} className="flex min-w-0 items-center gap-2">
        <RadioGroupItem id={`${id}-${index}`} value={option.value} disabled={option.disabled} />
        <Label htmlFor={`${id}-${index}`} className="min-w-0 font-normal">{option.label}</Label>
      </div>)}
    </RadioGroup>
  </FieldFrame>;
}
