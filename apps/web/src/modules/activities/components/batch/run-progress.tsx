/** How far a production run is, as a bar and in words. */
export function RunProgress({ done, total, percent }: { done: number; total: number; percent: number }) {
  return <div className="min-w-0 space-y-1">
    <div className="flex items-baseline justify-between gap-2 text-sm"><span className="font-medium">{done} of {total} steps completed</span><span className="text-muted-foreground">{percent}%</span></div>
    <div role="progressbar" aria-label="Production progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={`${done} of ${total} steps completed`}
      className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} /></div>
  </div>;
}
