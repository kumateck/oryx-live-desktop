import { useId } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useOptionPicker } from "../hooks/use-option-picker";
import { selectionSummary, type CellOption } from "../lib/options";

export interface OptionPickerProps {
  label: string;
  options: readonly CellOption[];
  selected: readonly string[];
  multiple: boolean;
  onPick: (value: string) => void;
  onClear: (() => void) | null;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  loading?: boolean | undefined;
  placeholder: string;
  emptyText: string;
}

function OptionList({ options, selected, current, onPick, onHover }: {
  options: readonly CellOption[];
  selected: readonly string[];
  current: number;
  onPick: (option: CellOption) => void;
  onHover: (index: number) => void;
}) {
  return options.map((option, index) => {
    const isSelected = selected.includes(option.value);
    return <button key={option.value} type="button" role="option" aria-selected={isSelected} disabled={option.disabled}
      onClick={() => onPick(option)} onMouseEnter={() => onHover(index)}
      className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm disabled:opacity-50", index === current && "bg-muted")}>
      <Check aria-hidden="true" className={cn("size-3.5 shrink-0", !isSelected && "invisible")} />
      <span className="min-w-0 break-words">{option.label}</span>
    </button>;
  });
}

/** Searchable option list in a popover, shared by the single and multiple choice cells. */
export function OptionPicker({ label, options, selected, multiple, onPick, onClear, disabled, invalid, loading, placeholder, emptyText }: OptionPickerProps) {
  const listId = useId();
  const picker = useOptionPicker(options, (option) => { onPick(option.value); if (!multiple) picker.close(); });
  const summary = selectionSummary(options, selected, multiple);
  return <Popover open={picker.open} onOpenChange={picker.onOpenChange}>
    <PopoverTrigger asChild><Button type="button" variant="outline" size="sm" role="combobox" aria-label={label} aria-expanded={picker.open}
      aria-controls={listId} aria-invalid={invalid || undefined} disabled={disabled}
      className="h-8 w-full min-w-0 justify-between gap-2 px-2 font-normal">
      <span className={cn("min-w-0 truncate", !summary && "text-muted-foreground")}>{summary ?? placeholder}</span>
      <ChevronsUpDown aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
    </Button></PopoverTrigger>
    <PopoverContent align="start" className="w-64 p-2">
      <Input autoFocus aria-label={`Search ${label}`} placeholder="Search" className="mb-2 h-8" value={picker.search}
        onChange={(event) => picker.onSearchChange(event.target.value)} onKeyDown={picker.onKeyDown} />
      <div id={listId} role="listbox" aria-label={label} aria-multiselectable={multiple || undefined} className="max-h-56 overflow-y-auto">
        {loading ? <p className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground"><Spinner />Loading options…</p> :
          picker.matches.length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">{emptyText}</p> :
            <OptionList options={picker.matches} selected={selected} current={picker.current} onPick={picker.pick} onHover={picker.setActive} />}
      </div>
      {onClear && selected.length > 0 ? <Button type="button" size="sm" variant="ghost" className="mt-2 w-full justify-start"
        onClick={() => { onClear(); if (!multiple) picker.close(); }}><X aria-hidden="true" />Clear</Button> : null}
    </PopoverContent>
  </Popover>;
}
