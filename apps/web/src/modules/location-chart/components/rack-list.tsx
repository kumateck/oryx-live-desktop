import { cn } from "cn";
import type { RackSummary } from "../schemas/rack-schema";

/** The department's racks; the open one is marked. */
export function RackList({ racks, active, onSelect }: { racks: readonly RackSummary[]; active: string | null; onSelect: (id: string) => void }) {
  return <nav aria-label="Racks" className="min-h-0 overflow-y-auto rounded-lg border bg-card p-1 max-lg:max-h-40">
    <ul className="space-y-0.5">{racks.map((rack) => <li key={rack.id}>
      <button type="button" aria-current={rack.id === active ? "true" : undefined} onClick={() => onSelect(rack.id)}
        className={cn("flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-2", rack.id === active && "bg-muted font-medium")}>
        <span className="min-w-0 break-words">{rack.label}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{rack.shelves.length} {rack.shelves.length === 1 ? "shelf" : "shelves"}</span>
      </button></li>)}</ul>
  </nav>;
}
