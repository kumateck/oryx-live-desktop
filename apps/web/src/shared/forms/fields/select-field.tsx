import { useId, useMemo, useState } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
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
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const error = fieldState.error?.message;
  const selected = isSelectOption(control.value) ? control.value : null;
  const itemValues = useMemo(() => field.options.map((option) => option.value), [field.options]);
  return <FieldFrame id={id} label={field.label} required={field.required} description={field.description} error={error} className={field.className}>
    <Combobox items={itemValues} value={selected?.value ?? null} onValueChange={(value) => {
      const option = field.options.find((item) => item.value === value);
      if (option) control.onChange(option);
    }}
      itemToStringLabel={(value) => field.options.find((option) => option.value === value)?.label ?? value}
      filter={(value, query) => (field.options.find((option) => option.value === value)?.label ?? "").toLocaleLowerCase().includes(query.toLocaleLowerCase())}
      onOpenChange={(open) => {
        if (open) {
          const active = document.activeElement;
          setPortalContainer(active instanceof HTMLElement ? active.closest("div[data-slot='dialog-content']") : null);
        } else {
          control.onBlur();
          setPortalContainer(null);
        }
      }}
      autoHighlight disabled={field.disabled ?? false}>
      <ComboboxInput id={id} ref={control.ref} placeholder={field.placeholder ?? "Search or select an option"} showTrigger
        showClear={!field.required && selected !== null} aria-required={field.required} aria-invalid={Boolean(error)}
        aria-describedby={fieldDescription(id, field.description, error)} onBlur={control.onBlur} />
      <ComboboxContent container={portalContainer ?? undefined}><ComboboxList>{(value) => {
        const option = field.options.find((item) => item.value === value);
        return option ? <ComboboxItem key={option.value} value={value} disabled={option.disabled ?? false}>{option.label}</ComboboxItem> : null;
      }}</ComboboxList>
        <ComboboxEmpty>No options found</ComboboxEmpty></ComboboxContent>
    </Combobox>
  </FieldFrame>;
}
