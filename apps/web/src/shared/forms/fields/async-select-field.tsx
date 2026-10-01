import { useId, useState } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import { isSelectOption } from "../select-option";
import { usePagedSelectOptions } from "../use-paged-select-options";
import type { SingleSelectField } from "../form-wizard-types";

export default function AsyncSelectInputField({ field }: {
  field: SingleSelectField<FieldValues> & { source: "async" };
}) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const result = usePagedSelectOptions(field.loadOptions, open, search, page, revision, field.debounceMs);
  const selected = isSelectOption(control.value) ? control.value : null;
  const error = fieldState.error?.message;

  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <Combobox items={result.options} value={selected} onValueChange={control.onChange}
      itemToStringLabel={(option) => option.label} isItemEqualToValue={(a, b) => a.value === b.value} filter={null}
      onInputValueChange={(value) => { setSearch(value); setPage(1); }}
      onOpenChange={(next) => { setOpen(next); if (next) setRevision((current) => current + 1); else control.onBlur(); }}>
      <ComboboxInput id={id} placeholder={field.searchPlaceholder ?? field.placeholder ?? "Search options"}
        className="w-full" disabled={field.disabled ?? false} aria-required={field.required}
        aria-invalid={Boolean(error)} aria-describedby={fieldDescription(id, field.description, error)} />
      <ComboboxContent>
        {result.loading ? <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"><Spinner />Loading options…</p> : null}
        {result.error ? <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-destructive">
          <span>Could not load options</span><Button type="button" variant="ghost" size="xs" onClick={() => setRevision((current) => current + 1)}>Retry</Button>
        </div> : null}
        {!result.loading && !result.error ? <><ComboboxEmpty>No records found</ComboboxEmpty>
          <ComboboxList>{result.options.map((option) => <ComboboxItem key={option.value} value={option} disabled={option.disabled ?? false}>{option.label}</ComboboxItem>)}</ComboboxList>
          <div className="flex justify-end gap-1 border-t border-border p-1">
            <Button type="button" size="xs" variant="ghost" disabled={!result.hasPrevious} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
            <Button type="button" size="xs" variant="ghost" disabled={!result.hasNext} onClick={() => setPage((current) => current + 1)}>Next</Button>
          </div></> : null}
      </ComboboxContent>
    </Combobox>
  </FieldFrame>;
}
