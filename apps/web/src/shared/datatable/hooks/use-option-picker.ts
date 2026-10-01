import { useMemo, useState, type KeyboardEvent } from "react";
import { filterOptions, type CellOption } from "../lib/options";

/** Open state, search text, and keyboard navigation for a searchable option list. */
export function useOptionPicker(options: readonly CellOption[], onPick: (option: CellOption) => void) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const matches = useMemo(() => filterOptions(options, search), [options, search]);
  const current = Math.min(active, Math.max(0, matches.length - 1));
  const pick = (option: CellOption | undefined) => { if (option && !option.disabled) onPick(option); };
  return {
    open, search, matches, current, pick,
    setActive,
    close: () => setOpen(false),
    onOpenChange: (next: boolean) => { setOpen(next); setSearch(""); setActive(0); },
    onSearchChange: (text: string) => { setSearch(text); setActive(0); },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") { event.preventDefault(); setActive(Math.min(current + 1, matches.length - 1)); }
      if (event.key === "ArrowUp") { event.preventDefault(); setActive(Math.max(current - 1, 0)); }
      if (event.key === "Enter") { event.preventDefault(); pick(matches[current]); }
    },
  };
}
