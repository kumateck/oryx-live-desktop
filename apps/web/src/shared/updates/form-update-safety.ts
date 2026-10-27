import { useEffect } from "react";
/** Covers drafts and pending submits even on forms without a navigation guard. */
export function useFormUpdateSafety(pending: boolean): void {
  useEffect(() => {
    if (!pending) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending]);
}
