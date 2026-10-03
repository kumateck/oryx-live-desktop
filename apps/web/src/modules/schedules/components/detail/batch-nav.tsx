import { cn } from "cn";
import { batchLabel, batchState, batchStateLabels, type BatchGroup, type BatchState } from "../../lib/schedule-batches";

const dots: Record<BatchState, string> = { started: "bg-primary", waiting: "border border-foreground/40", missed: "bg-muted-foreground/40", cancelled: "bg-destructive" };

/** Every batch on the schedule, grouped by product. Choosing one shows it beside the list. */
export function BatchNav({ groups, scheduleEnd, active, onSelect }: { groups: readonly BatchGroup[]; scheduleEnd: string | null | undefined; active: string | null; onSelect: (batchId: string) => void }) {
  return <nav aria-label="Batches" className="min-w-0 space-y-3 rounded-lg border bg-card p-3 xl:max-h-[calc(100dvh-14rem)] xl:overflow-y-auto">
    {groups.map((group) => <div key={group.key} className="min-w-0 space-y-1">
      <p className="break-words px-1 text-sm font-semibold">{group.name}</p>
      <p className="px-1 text-xs text-muted-foreground">{group.detail}</p>
      <ul className="space-y-0.5">{group.batches.map((batch, index) => {
        if (!batch.id) return null;
        const id = batch.id;
        const state = batchState(batch, scheduleEnd);
        return <li key={id}><button type="button" aria-current={id === active ? "true" : undefined} onClick={() => onSelect(id)}
          className={cn("flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-2",
            id === active && "bg-accent font-medium")}>
          <span className="min-w-0 break-words">{batchLabel(batch, index)}</span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"><span aria-hidden="true" className={cn("size-2 rounded-full", dots[state])} />{batchStateLabels[state]}</span>
        </button></li>;
      })}</ul>
    </div>)}
  </nav>;
}
