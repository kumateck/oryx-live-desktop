import type { BoardColumn } from "../../schemas/activity-schema";
import { ActivityCard } from "./activity-card";

/** Running batches in columns, one per operation, in the order the server lists the operations. */
export function ActivitiesBoard({ columns }: { columns: readonly BoardColumn[] }) {
  return <div className="flex min-h-0 min-w-0 flex-1 gap-3 overflow-x-auto pb-2">
    {columns.map((column) => <section key={column.id} aria-label={`${column.name}, ${column.cards.length} ${column.cards.length === 1 ? "batch" : "batches"}`}
      className="flex max-h-full w-72 shrink-0 flex-col rounded-lg border bg-muted/40">
      <h2 className="flex items-center justify-between gap-2 border-b px-3 py-2 text-sm font-semibold">
        <span className="min-w-0 break-words">{column.name}</span>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">{column.cards.length}</span>
      </h2>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {column.cards.map((card) => <li key={card.activityId}><ActivityCard card={card} /></li>)}
        {column.cards.length === 0 ? <li className="px-1 py-4 text-center text-xs text-muted-foreground">No batches here</li> : null}
      </ul>
    </section>)}
  </div>;
}
