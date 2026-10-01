import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { usePageSearchTarget } from "./page-search";
import { isSearchShortcut, isTypingTarget, normalizeSearchTerm, searchParam, withSearchTerm } from "./search-term";

/** State of the header search box: what is typed, where it is sent, and the keyboard shortcut. */
export function useHeaderSearch() {
  const target = usePageSearchTarget();
  const [params, setParams] = useSearchParams();
  const applied = normalizeSearchTerm(params.get(searchParam));
  const [draft, setDraft] = useState(applied);
  const [open, setOpen] = useState(applied !== "");
  const input = useRef<HTMLInputElement>(null);
  const settled = useDebouncedValue(normalizeSearchTerm(draft), 300);

  // Typing filters the open page once the user pauses. Pages that take no search are left alone.
  useEffect(() => {
    if (!target || settled === applied) return;
    setParams((current) => withSearchTerm(current, settled), { replace: true });
  }, [target, settled, applied, setParams]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event, isTypingTarget(event.target))) return;
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => { input.current?.focus(); input.current?.select(); });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clear = () => {
    setDraft("");
    if (target && applied) setParams((current) => withSearchTerm(current, ""), { replace: true });
  };
  return {
    target, input, draft, setDraft, open, applied,
    pending: Boolean(target) && (normalizeSearchTerm(draft) !== applied || target?.busy === true),
    show: () => { setOpen(true); requestAnimationFrame(() => input.current?.focus()); },
    hide: () => { clear(); setOpen(false); },
    clear,
  };
}
