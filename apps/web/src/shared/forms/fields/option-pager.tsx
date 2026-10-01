import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Previous and Next for a paged option list. Always rendered, so a click never lands on a button
 * that has just been removed, and pressing one keeps focus in the search box instead of taking it.
 */
export function OptionPager({ page, hasPrevious, hasNext, loading, onPageChange }: {
  page: number;
  hasPrevious: boolean;
  hasNext: boolean;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const keepFocus = (event: { preventDefault: () => void }) => event.preventDefault();
  return <div className="flex items-center justify-between gap-2 border-t border-border pt-1">
    <span className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground" role="status">{loading ? <><Spinner />Loading…</> : `Page ${page}`}</span>
    <span className="flex gap-1">
      <Button type="button" size="xs" variant="ghost" disabled={loading || !hasPrevious} onMouseDown={keepFocus} onClick={() => onPageChange(Math.max(1, page - 1))}>Previous</Button>
      <Button type="button" size="xs" variant="ghost" disabled={loading || !hasNext} onMouseDown={keepFocus} onClick={() => onPageChange(page + 1)}>Next</Button>
    </span>
  </div>;
}
