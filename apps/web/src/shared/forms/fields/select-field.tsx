import { useId } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import type { SingleSelectField } from "../form-wizard-types";
import { isSelectOption } from "../select-option";

export default function SelectInputField({ field }: {
  field: SingleSelectField<FieldValues> & { source: "sync" };
}) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const error = fieldState.error?.message;
  const selected = isSelectOption(control.value) ? control.value : null;
  return <FieldFrame id={id} label={field.label} required={field.required} description={field.description} error={error} className={field.className}>
    <Select name={control.name} value={selected?.value ?? ""}
      onValueChange={(value) => control.onChange(field.options.find((option) => option.value === value) ?? null)}
      onOpenChange={(open) => { if (!open) control.onBlur(); }} disabled={field.disabled ?? false}>
      <SelectTrigger id={id} ref={control.ref} className="w-full" aria-required={field.required} aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, field.description, error)}>
        <SelectValue placeholder={field.placeholder ?? "Select an option"} />
      </SelectTrigger>
      <SelectContent>{field.options.map((option) => <SelectItem key={option.value} value={option.value} disabled={option.disabled ?? false}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  </FieldFrame>;
}
