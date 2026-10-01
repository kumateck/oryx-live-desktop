import { useId, useState } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import { isSelectOption } from "../select-option";
import { usePagedSelectOptions } from "../use-paged-select-options";
import { useVisibleSelectLabels } from "../use-visible-select-labels";
import type { MultiSelectField, SelectOption } from "../form-wizard-types";

interface SelectionProps {
  field: MultiSelectField<FieldValues>;
  selected: readonly SelectOption[];
  onChange: (options: readonly SelectOption[]) => void;
}

interface OptionsProps extends SelectionProps {
  open: boolean;
  search: string;
}

function MultiSelectOptions({ field, selected, onChange, open, search }: OptionsProps) {
  if (field.source === "async") return <AsyncOptions key={search} field={field} selected={selected} onChange={onChange}
    open={open} search={search} />;
  const options = field.options.filter((option) => option.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <OptionList options={options} selected={selected} onChange={onChange} />;
}

function AsyncOptions({ field, selected, onChange, open, search }: OptionsProps & { field: MultiSelectField<FieldValues> & { source: "async" } }) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const result = usePagedSelectOptions(field.loadOptions, open, search, page, revision, field.debounceMs);
  return <>
    {result.loading ? <div className="flex items-center gap-2 px-2 py-3 text-muted-foreground"><Spinner />Loading options…</div> : null}
    {result.error ? <div className="flex items-center justify-between gap-2 px-2 py-2 text-destructive">Could not load options
      <Button type="button" size="xs" variant="ghost" onClick={() => setRevision((value) => value + 1)}>Retry</Button>
    </div> : null}
    {!result.loading && !result.error ? <><OptionList options={result.options} selected={selected} onChange={onChange} />
      <div className="flex justify-end gap-1 border-t border-border pt-1">
        <Button type="button" size="xs" variant="ghost" disabled={!result.hasPrevious} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
        <Button type="button" size="xs" variant="ghost" disabled={!result.hasNext} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div></> : null}
  </>;
}

function OptionList({ options, selected, onChange }: {
  options: readonly SelectOption[];
  selected: readonly SelectOption[];
  onChange: (options: readonly SelectOption[]) => void;
}) {
  const enabled = options.filter((option) => !option.disabled);
  const selectedValues = new Set(selected.map((option) => option.value));
  const allSelected = enabled.length > 0 && enabled.every((option) => selectedValues.has(option.value));
  const toggle = (option: SelectOption) => onChange(selectedValues.has(option.value)
    ? selected.filter((item) => item.value !== option.value) : [...selected, option]);
  const toggleAll = () => onChange(allSelected
    ? selected.filter((item) => !enabled.some((option) => option.value === item.value))
    : [...selected, ...enabled.filter((option) => !selectedValues.has(option.value))]);
  return <><div className="flex justify-end"><Button type="button" size="xs" variant="ghost" disabled={!enabled.length} onClick={toggleAll}>
    {allSelected ? "Unselect page" : "Select page"}</Button></div>
    <div className="max-h-56 overflow-y-auto" role="group" aria-label="Options">
      {options.length ? options.map((option) => <label key={option.value} className="flex min-h-8 cursor-pointer items-center gap-2 rounded-md px-2 hover:bg-accent has-disabled:cursor-not-allowed has-disabled:opacity-50">
        <Checkbox checked={selectedValues.has(option.value)} onCheckedChange={() => toggle(option)} disabled={option.disabled ?? false} />
        <span className="truncate">{option.label}</span>
      </label>) : <p className="px-2 py-3 text-muted-foreground">No records found</p>}
    </div></>;
}

export default function MultiSelectInputField({ field }: { field: MultiSelectField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const selected: readonly SelectOption[] = Array.isArray(control.value) ? control.value.filter(isSelectOption) : [];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { triggerRef, measureRef, visibleCount } = useVisibleSelectLabels(selected);
  const hidden = selected.length - visibleCount;
  const error = fieldState.error?.message;
  const change = (options: readonly SelectOption[]) => control.onChange(options);
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) control.onBlur(); }}>
      <InputGroup data-disabled={field.disabled} className="min-w-0">
        <PopoverTrigger asChild><button id={id} ref={triggerRef} type="button" disabled={field.disabled} aria-invalid={Boolean(error)}
          aria-describedby={fieldDescription(id, field.description, error)}
          className="flex h-full min-w-0 flex-1 items-center gap-1 overflow-hidden pl-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          {selected.length ? <>{selected.slice(0, visibleCount).map((option) => <Badge key={option.value} variant="secondary" className="max-w-36 shrink-0 truncate">{option.label}</Badge>)}
            {hidden > 0 ? <Badge variant="secondary" className="shrink-0">+{hidden}</Badge> : null}</>
            : <span className="truncate text-muted-foreground">{field.placeholder ?? "Select options"}</span>}
        </button></PopoverTrigger>
        {selected.length ? <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label={`Clear ${field.label}`} disabled={field.disabled}
          onClick={() => change([])}><XIcon /></InputGroupButton></InputGroupAddon> : null}
        <InputGroupAddon align="inline-end" className="pl-0"><ChevronDownIcon aria-hidden="true" /></InputGroupAddon>
        <div ref={measureRef} className="pointer-events-none invisible absolute flex gap-1 whitespace-nowrap" aria-hidden="true">
          {selected.map((option) => <Badge key={option.value} variant="secondary" className="max-w-36 shrink-0 truncate">{option.label}</Badge>)}
        </div>
      </InputGroup>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-56 gap-2 p-2">
        <div className="relative"><SearchIcon className="pointer-events-none absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={field.searchPlaceholder ?? "Search options"} className="pl-8" aria-label={`Search ${field.label}`} />
        </div>
        <MultiSelectOptions field={field} selected={selected} onChange={change} open={open} search={search} />
      </PopoverContent>
    </Popover>
  </FieldFrame>;
}
