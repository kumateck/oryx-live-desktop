import { useState, type KeyboardEvent } from "react";

/**
 * Holds what the user is typing and reports it when they leave the field or press Enter, so the
 * list is not rebuilt on every keystroke. Escape restores the saved value.
 */
export function useDraft(saved: string, commit: (text: string) => void) {
  const [draft, setDraft] = useState<string | null>(null);
  const finish = () => { if (draft !== null && draft !== saved) commit(draft); setDraft(null); };
  return {
    value: draft ?? saved,
    onChange: (text: string) => setDraft(text),
    onBlur: finish,
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") { event.preventDefault(); finish(); }
      if (event.key === "Escape") { event.preventDefault(); setDraft(null); }
    },
  };
}
