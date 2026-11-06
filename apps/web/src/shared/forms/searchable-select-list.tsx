import { useId, useState, type ReactNode } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { OptionPager } from "./fields/option-pager";
import type { SelectLoader, SelectOption } from "./form-wizard-types";
import { usePagedSelectOptions } from "./use-paged-select-options";

/** A synchronous list renders at most this many matches; typing narrows the rest. */
export const searchableSelectVisibleLimit = 100;

export interface ListStatus {
  options: readonly SelectOption[];
  loading: boolean;
  stale: boolean;
  error: string | null;
  onRetry: (() => void) | undefined;
  hidden: number;
  pager: ReactNode;
}

export interface SearchableSelectListProps {
  label: string;
  searchPlaceholder: string;
  emptyMessage: string;
  search: string;
  onSearchChange: (search: string) => void;
  selected: readonly SelectOption[];
  multiple: boolean;
  onPick: (option: SelectOption) => void;
  /** Closes the list without changing the choice. */
  onClose: () => void;
  status: ListStatus;
}

export function matchesSearch(option: SelectOption, search: string): boolean {
  const term = search.trim().toLocaleLowerCase();
  return term === "" || option.label.toLocaleLowerCase().includes(term);
}

/** Filters an in-memory list on the device, capped so a very long list stays quick to render. */
export function syncListStatus(options: readonly SelectOption[], search: string, loading: boolean, error: string | null, onRetry: (() => void) | undefined): ListStatus {
  const matches = options.filter((option) => matchesSearch(option, search));
  return { options: matches.slice(0, searchableSelectVisibleLimit), hidden: Math.max(0, matches.length - searchableSelectVisibleLimit), loading, stale: false, error, onRetry, pager: null };
}

/** One page of a loader's options: debounced search, Previous/Next paging, and aborts of superseded requests. */
export function useAsyncListStatus(loader: SelectLoader, open: boolean, search: string, debounceMs: number | undefined): ListStatus {
  // The page belongs to a search: a new search starts at page 1.
  const [position, setPosition] = useState({ search, page: 1 });
  const page = position.search === search ? position.page : 1;
  const [revision, setRevision] = useState(0);
  const result = usePagedSelectOptions(loader, open, search, page, revision, debounceMs);
  return {
    options: result.options, hidden: 0, loading: result.loading, stale: result.stale,
    error: result.error ? "Could not load options" : null, onRetry: () => setRevision((value) => value + 1),
    pager: <OptionPager page={page} hasPrevious={result.hasPrevious} hasNext={result.hasNext} loading={result.loading}
      onPageChange={(next) => setPosition({ search, page: next })} />,
  };
}

function OptionRow({ option, checked, multiple, onPick }: { option: SelectOption; checked: boolean; multiple: boolean; onPick: () => void }) {
  return <CommandItem value={option.value} disabled={option.disabled ?? false} onSelect={onPick} data-checked={checked} aria-checked={checked}
    className={cn(multiple && "[&>svg:last-child]:hidden")}>
    {multiple ? <Checkbox checked={checked} tabIndex={-1} aria-hidden="true" className="pointer-events-none" /> : null}
    <span className="min-w-0 break-words">{option.label}</span>
  </CommandItem>;
}

/**
 * The open list of a searchable select, on shadcn's Command: arrow keys move, Enter picks, and the
 * chosen options carry `aria-checked`. A single choice that is not in the current results (another page,
 * or outside the search) is shown above the list but is not an option, so the first result stays highlighted.
 * Filtering is done here (or by the loader), never by cmdk.
 */
export function SearchableSelectList({ label, searchPlaceholder, emptyMessage, search, onSearchChange, selected, multiple, onPick, onClose, status }: SearchableSelectListProps) {
  const selectedId = useId();
  const chosen = new Set(selected.map((option) => option.value));
  const pinned = !multiple && selected[0] && !status.options.some((option) => option.value === selected[0]?.value) ? selected[0] : null;
  const [highlight, setHighlight] = useState("");
  const active = status.options.some((option) => option.value === highlight && !option.disabled) ? highlight
    : status.options.find((option) => !option.disabled)?.value ?? "";
  const pick = (option: SelectOption) => { if (!status.stale && !option.disabled) onPick(option); };
  const waiting = status.loading && !status.stale;

  return <Command shouldFilter={false} loop label={`Search ${label}`} value={active} onValueChange={setHighlight} className="rounded-lg! p-0">
    <CommandInput autoFocus value={search} onValueChange={onSearchChange} placeholder={searchPlaceholder} />
    {pinned ? <div className="border-b border-border px-1 py-1">
      <p id={selectedId} className="px-2 pb-0.5 text-xs text-muted-foreground">Selected</p>
      <button type="button" aria-describedby={selectedId} onClick={() => onClose()} tabIndex={-1}
        className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted">
        <span className="min-w-0 break-words">{pinned.label}</span><CheckIcon aria-hidden="true" className="size-4 shrink-0" />
      </button>
    </div> : null}
    <CommandList label={label} aria-busy={status.loading} className={cn("max-h-64 p-1", status.stale && "opacity-60")}>
      {status.error ? <div role="alert" className="flex items-center justify-between gap-2 px-2 py-2 text-sm text-destructive">
        <span>{status.error}</span>
        {status.onRetry ? <Button type="button" variant="ghost" size="xs" onClick={status.onRetry}>Retry</Button> : null}
      </div> : waiting ? <div role="status" className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground"><Spinner />Loading options…</div>
        : status.options.length ? status.options.map((option) => <OptionRow key={option.value} option={option} checked={chosen.has(option.value)}
          multiple={multiple} onPick={() => pick(option)} />)
        : <p role="status" className="px-2 py-3 text-sm text-muted-foreground">{emptyMessage}</p>}
      {status.hidden > 0 && !status.error ? <p className="px-2 py-1.5 text-xs text-muted-foreground">{status.hidden} more. Type to narrow the list.</p> : null}
    </CommandList>
    {status.pager ? <div className="px-1 pb-1">{status.pager}</div> : null}
  </Command>;
}
