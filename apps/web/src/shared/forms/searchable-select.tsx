import { useCallback, useId, useState, type Ref } from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SelectLoader, SelectOption } from "./form-wizard-types";
import { SearchableSelectList, syncListStatus, useAsyncListStatus, type SearchableSelectListProps } from "./searchable-select-list";
import { useVisibleSelectLabels } from "./use-visible-select-labels";

interface SearchableSelectBase {
  /** Accessible name of the control; also names the search box, the list and the clear button. */
  label: string;
  /** Id of the trigger, for a visible `<label htmlFor>`. */
  id?: string | undefined;
  placeholder?: string | undefined;
  searchPlaceholder?: string | undefined;
  emptyMessage?: string | undefined;
  disabled?: boolean | undefined;
  /** Shows a clear button while something is chosen. Defaults to true. */
  clearable?: boolean | undefined;
  /** `sm` matches a small shadcn Select trigger, for filter bars. */
  size?: "default" | "sm" | undefined;
  className?: string | undefined;
  contentClassName?: string | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
  "aria-invalid"?: boolean | undefined;
  "aria-required"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
}

/** An in-memory list, filtered on the device. `loading` and `error` describe where that list comes from. */
interface SyncSource {
  options: readonly SelectOption[];
  loading?: boolean | undefined;
  error?: string | null | undefined;
  onRetry?: (() => void) | undefined;
  loadOptions?: never;
  debounceMs?: never;
}

/** Options loaded page by page, the same loader FormWizard's async selects use. */
interface AsyncSource {
  loadOptions: SelectLoader;
  debounceMs?: number | undefined;
  options?: never;
  loading?: never;
  error?: never;
  onRetry?: never;
}

interface SingleValue {
  multiple?: false;
  value: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
}

interface MultipleValue {
  multiple: true;
  value: readonly SelectOption[];
  onChange: (options: readonly SelectOption[]) => void;
}

export type SearchableSelectProps = SearchableSelectBase & (SyncSource | AsyncSource) & (SingleValue | MultipleValue);

const nothing: readonly SelectOption[] = [];

type ListProps = Omit<SearchableSelectListProps, "status">;

function SyncOptions({ source, ...list }: ListProps & { source: SyncSource }) {
  return <SearchableSelectList {...list} status={syncListStatus(source.options, list.search, source.loading ?? false, source.error ?? null, source.onRetry)} />;
}

function AsyncOptions({ source, ...list }: ListProps & { source: AsyncSource }) {
  return <SearchableSelectList {...list} status={useAsyncListStatus(source.loadOptions, true, list.search, source.debounceMs)} />;
}

/**
 * A searchable select for long lists, outside FormWizard: a shadcn Combobox (Popover + Command) over
 * either an in-memory list or a paged loader. Escape or a choice closes it and returns focus to the trigger.
 */
export function SearchableSelect(props: SearchableSelectProps) {
  const { label, placeholder, disabled = false, clearable = true, size = "default", className, contentClassName, onOpenChange, ref } = props;
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected: readonly SelectOption[] = props.multiple ? props.value : props.value ? [props.value] : nothing;
  const { triggerRef, measureRef, visibleCount } = useVisibleSelectLabels(props.multiple ? selected : nothing);
  const setTrigger = useCallback((node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }, [ref, triggerRef]);

  const changeOpen = (next: boolean) => { setOpen(next); if (next) setSearch(""); onOpenChange?.(next); };
  const pick = (option: SelectOption) => {
    if (!props.multiple) { props.onChange(option); changeOpen(false); return; }
    props.onChange(selected.some((item) => item.value === option.value) ? selected.filter((item) => item.value !== option.value) : [...selected, option]);
  };
  const clear = () => {
    if (props.multiple) props.onChange([]); else props.onChange(null);
    triggerRef.current?.focus();
  };

  const loadingList = props.loadOptions === undefined && (props.loading ?? false);
  const empty = loadingList ? "Loading…" : placeholder ?? (props.multiple ? "Select options" : "Select an option");
  const hidden = selected.length - visibleCount;
  const list: ListProps = {
    label, search, onSearchChange: setSearch, selected, multiple: props.multiple ?? false, onPick: pick, onClose: () => changeOpen(false),
    searchPlaceholder: props.searchPlaceholder ?? "Search", emptyMessage: props.emptyMessage ?? "No records found",
  };

  return <Popover open={open} onOpenChange={changeOpen}>
    <PopoverAnchor asChild><InputGroup data-disabled={disabled} className={cn("min-w-0", size === "sm" && "h-control-sm rounded-md", className)}>
      <PopoverTrigger asChild><button id={id} ref={setTrigger} type="button" role="combobox" aria-label={label} aria-haspopup="listbox"
        aria-expanded={open} aria-controls={open ? `${id}-content` : undefined} disabled={disabled} aria-invalid={props["aria-invalid"]}
        aria-required={props["aria-required"]} aria-describedby={props["aria-describedby"]} data-slot="input-group-control"
        className="flex h-full min-w-0 flex-1 items-center gap-1 overflow-hidden pl-2.5 text-left text-sm outline-none">
        {props.multiple && selected.length ? <>
          {selected.slice(0, visibleCount).map((option) => <Badge key={option.value} variant="secondary" className="max-w-36 shrink-0 truncate">{option.label}</Badge>)}
          {hidden > 0 ? <Badge variant="secondary" className="shrink-0">+{hidden}</Badge> : null}
        </> : <span className={cn("truncate", !selected.length && "text-muted-foreground")}>{props.multiple ? empty : props.value?.label ?? empty}</span>}
      </button></PopoverTrigger>
      {clearable && selected.length ? <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label={`Clear ${label}`}
        disabled={disabled} onClick={clear}><XIcon /></InputGroupButton></InputGroupAddon> : null}
      <InputGroupAddon align="inline-end" className="pl-0"><ChevronDownIcon aria-hidden="true" /></InputGroupAddon>
      {props.multiple ? <div ref={measureRef} className="pointer-events-none invisible absolute flex gap-1 whitespace-nowrap" aria-hidden="true">
        {selected.map((option) => <Badge key={option.value} variant="secondary" className="max-w-36 shrink-0 truncate">{option.label}</Badge>)}
      </div> : null}
    </InputGroup></PopoverAnchor>
    <PopoverContent id={`${id}-content`} align="start" className={cn("w-(--radix-popover-trigger-width) min-w-64 gap-0 p-1", contentClassName)}>
      {props.loadOptions ? <AsyncOptions {...list} source={props} /> : <SyncOptions {...list} source={props} />}
    </PopoverContent>
  </Popover>;
}
