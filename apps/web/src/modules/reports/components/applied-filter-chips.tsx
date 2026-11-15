const unset = new Set(["All", "Current snapshot"]);

/** The filters behind the report on screen. Filters left at "All" are summarised in one chip. */
export function AppliedFilterChips({ filters }: { filters: readonly { label: string; value: string }[] }) {
  const set = filters.filter((filter) => !unset.has(filter.value));
  return <ul aria-label="Applied filters" className="flex min-w-0 flex-wrap items-center gap-1.5">
    {set.map((filter) => <li key={filter.label} className="inline-flex max-w-full items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs">
      <span className="text-muted-foreground">{filter.label}:</span><span className="truncate">{filter.value}</span>
    </li>)}
    {set.length < filters.length ? <li className="rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground">{set.length ? "Everything else: all" : "All records"}</li> : null}
  </ul>;
}
