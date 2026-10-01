/** Shown when a refetch failed but earlier rows are still on screen. */
export function StaleRowsNotice({ error, onRetry }: { error: string; onRetry: (() => void) | undefined }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-b bg-destructive/10 px-3 py-2 text-sm">
    <span>Showing the last loaded rows. {error}</span>
    {onRetry ? <button type="button" className="font-medium underline underline-offset-2" onClick={onRetry}>Retry</button> : null}
  </div>;
}
