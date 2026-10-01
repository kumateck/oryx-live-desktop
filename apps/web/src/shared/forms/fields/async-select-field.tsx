import { useId, useState, type KeyboardEvent } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import { isSelectOption } from "../select-option";
import { usePagedSelectOptions } from "../use-paged-select-options";
import type { SelectOption, SingleSelectField } from "../form-wizard-types";
import { OptionPager } from "./option-pager";

function OptionRow({ option, selected, active, onPick, onHover }: {
  option: SelectOption; selected: boolean; active: boolean; onPick: () => void; onHover: () => void;
}) {
  return <button type="button" role="option" aria-selected={selected} disabled={option.disabled ?? false} onClick={onPick} onMouseEnter={onHover}
    className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm disabled:opacity-50", active && "bg-accent")}>
    <CheckIcon aria-hidden="true" className={cn("size-3.5 shrink-0", !selected && "invisible")} />
    <span className="min-w-0 break-words">{option.label}</span>
  </button>;
}

/** Searchable single choice whose options are loaded page by page. */
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
  const [active, setActive] = useState(0);
  const result = usePagedSelectOptions(field.loadOptions, open, search, page, revision, field.debounceMs);
  const selected = isSelectOption(control.value) ? control.value : null;
  const error = fieldState.error?.message;
  // The chosen option stays visible at the top even when it is on another page or outside the search.
  const pinned = selected && !result.options.some((option) => option.value === selected.value) ? selected : null;
  const current = Math.min(active, Math.max(0, result.options.length - 1));

  const pick = (option: SelectOption | undefined) => {
    if (!option || option.disabled) return;
    control.onChange(option);
    setOpen(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive(Math.min(current + 1, result.options.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive(Math.max(current - 1, 0)); }
    // Enter chooses the highlighted option; it must never submit the form the field sits in.
    if (event.key === "Enter") { event.preventDefault(); if (!result.stale) pick(result.options[current]); }
  };

  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <Popover open={open} onOpenChange={(next) => {
      setOpen(next);
      if (next) { setSearch(""); setPage(1); setActive(0); setRevision((value) => value + 1); } else control.onBlur();
    }}>
      <InputGroup data-disabled={field.disabled} className="min-w-0">
        <PopoverTrigger asChild><button id={id} ref={control.ref} type="button" role="combobox" aria-expanded={open} aria-controls={`${id}-list`}
          disabled={field.disabled} aria-required={field.required} aria-invalid={Boolean(error)} aria-describedby={fieldDescription(id, field.description, error)}
          className="flex h-full min-w-0 flex-1 items-center overflow-hidden pl-2.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected?.label ?? field.placeholder ?? "Select an option"}</span>
        </button></PopoverTrigger>
        {selected && !field.required ? <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label={`Clear ${field.label}`}
          disabled={field.disabled} onClick={() => control.onChange(null)}><XIcon /></InputGroupButton></InputGroupAddon> : null}
        <InputGroupAddon align="inline-end" className="pl-0"><ChevronDownIcon aria-hidden="true" /></InputGroupAddon>
      </InputGroup>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 gap-2 p-2">
        <div className="relative"><SearchIcon className="pointer-events-none absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input autoFocus value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setActive(0); }} onKeyDown={onKeyDown}
            placeholder={field.searchPlaceholder ?? "Search options"} className="pl-8" aria-label={`Search ${field.label}`} />
        </div>
        {pinned ? <div className="border-b border-border pb-1">
          <p className="px-2 pb-0.5 text-xs text-muted-foreground">Selected</p>
          <OptionRow option={pinned} selected active={false} onPick={() => setOpen(false)} onHover={() => {}} />
        </div> : null}
        <div id={`${id}-list`} role="listbox" aria-label={field.label} aria-busy={result.loading}
          className={cn("max-h-56 overflow-y-auto", result.stale && "opacity-60")}>
          {result.error ? <div className="flex items-center justify-between gap-2 px-2 py-2 text-sm text-destructive">
            <span>Could not load options</span><Button type="button" variant="ghost" size="xs" onClick={() => setRevision((value) => value + 1)}>Retry</Button>
          </div> : result.options.length ? result.options.map((option, index) => <OptionRow key={option.value} option={option}
            selected={option.value === selected?.value} active={index === current} onPick={() => pick(option)} onHover={() => setActive(index)} />)
            : result.loading ? null : <p className="px-2 py-3 text-sm text-muted-foreground">No records found</p>}
        </div>
        <OptionPager page={page} hasPrevious={result.hasPrevious} hasNext={result.hasNext} loading={result.loading}
          onPageChange={(next) => { setPage(next); setActive(0); }} />
      </PopoverContent>
    </Popover>
  </FieldFrame>;
}
