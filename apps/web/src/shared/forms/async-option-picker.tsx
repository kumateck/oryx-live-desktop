import { useId, useState, type KeyboardEvent } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OptionPager } from "./fields/option-pager";
import type { SelectLoader, SelectOption } from "./form-wizard-types";
import { usePagedSelectOptions } from "./use-paged-select-options";

/**
 * A searchable, paged single choice that is not bound to a form field, for places such as table cells.
 * It behaves like the form's async select: Enter picks the highlighted option and never submits the form.
 */
export function AsyncOptionPicker({ label, value, onChange, loadOptions, placeholder = "Select an option", disabled = false, className }: {
  label: string; value: SelectOption | null; onChange: (option: SelectOption) => void; loadOptions: SelectLoader; placeholder?: string; disabled?: boolean; className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [active, setActive] = useState(0);
  const result = usePagedSelectOptions(loadOptions, open, search, page, revision);
  const current = Math.min(active, Math.max(0, result.options.length - 1));
  const pick = (option: SelectOption | undefined) => { if (!option || option.disabled) return; onChange(option); setOpen(false); };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive(Math.min(current + 1, result.options.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive(Math.max(current - 1, 0)); }
    if (event.key === "Enter") { event.preventDefault(); if (!result.stale) pick(result.options[current]); }
  };
  return <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) { setSearch(""); setPage(1); setActive(0); setRevision((count) => count + 1); } }}>
    <PopoverTrigger asChild><button type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={`${id}-list`} disabled={disabled}
      className={cn("flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-background px-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50", className)}>
      <span className={cn("truncate", !value && "text-muted-foreground")}>{value?.label ?? placeholder}</span><ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </button></PopoverTrigger>
    <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 gap-2 p-2">
      <div className="relative"><SearchIcon className="pointer-events-none absolute left-2 top-2.5 size-4 text-muted-foreground" />
        <Input autoFocus value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setActive(0); }} onKeyDown={onKeyDown} placeholder="Search" className="pl-8" aria-label={`Search ${label}`} /></div>
      <div id={`${id}-list`} role="listbox" aria-label={label} aria-busy={result.loading} className={cn("max-h-56 overflow-y-auto", result.stale && "opacity-60")}>
        {result.error ? <div className="flex items-center justify-between gap-2 px-2 py-2 text-sm text-destructive"><span>Could not load options</span>
          <Button type="button" variant="ghost" size="xs" onClick={() => setRevision((count) => count + 1)}>Retry</Button></div>
          : result.options.length ? result.options.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={option.value === value?.value} disabled={option.disabled ?? false}
            onClick={() => pick(option)} onMouseEnter={() => setActive(index)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm disabled:opacity-50", index === current && "bg-accent")}>
            <CheckIcon aria-hidden="true" className={cn("size-3.5 shrink-0", option.value !== value?.value && "invisible")} /><span className="min-w-0 break-words">{option.label}</span></button>)
          : result.loading ? null : <p className="px-2 py-3 text-sm text-muted-foreground">No records found</p>}
      </div>
      <OptionPager page={page} hasPrevious={result.hasPrevious} hasNext={result.hasNext} loading={result.loading} onPageChange={(next) => { setPage(next); setActive(0); }} />
    </PopoverContent>
  </Popover>;
}
