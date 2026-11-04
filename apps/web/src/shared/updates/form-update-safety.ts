import { useEffect } from "react";
import { useDesktopTabSafety } from "../workspace-tabs/context";
/** Covers drafts and pending submits even on forms without a navigation guard. */
export function useFormUpdateSafety(dirty: boolean, submitting = false): void {
  useDesktopTabSafety(dirty, submitting);
  const pending = dirty || submitting;
  useEffect(() => {
    if (!pending) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending]);
}
