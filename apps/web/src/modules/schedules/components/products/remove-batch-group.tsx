import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { batchLabel, batchRemovable, firstRemovable, type BatchGroup } from "../../lib/schedule-batches";

/** One product's batches, each of which can be marked for removal unless it has started or is cancelled. */
export function RemoveBatchGroup({ group, selected, disabled, onToggle, onSelect }: {
  group: BatchGroup;
  selected: ReadonlySet<string>;
  disabled: boolean;
  onToggle: (id: string, checked: boolean) => void;
  /** Replaces this group's selection with the given batches. */
  onSelect: (group: BatchGroup, ids: string[]) => void;
}) {
  const removable = group.batches.filter(batchRemovable).length;
  const chosen = group.batches.filter((batch) => batch.id && selected.has(batch.id)).length;
  const [count, setCount] = useState("");
  const wanted = Math.min(Math.max(Math.trunc(Number(count)) || 0, 0), removable);

  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4" aria-label={`${group.name}, ${group.detail}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h2 className="break-words text-sm font-semibold">{group.name}{group.code ? <span className="font-normal text-muted-foreground"> · {group.code}</span> : null}</h2>
        <p className="text-xs text-muted-foreground">{group.detail}</p>
        <p className="text-xs text-muted-foreground">{group.batches.length} {group.batches.length === 1 ? "batch" : "batches"} · {removable} can be removed{chosen ? ` · ${chosen} selected` : ""}</p></div>
      {removable > 1 ? <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground" htmlFor={`take-${group.key}`}>Take off</label>
        <Input id={`take-${group.key}`} type="number" inputMode="numeric" min={0} max={removable} step={1} value={count} disabled={disabled}
          onChange={(event) => setCount(event.target.value)} className="h-8 w-20" />
        <Button type="button" size="sm" variant="outline" disabled={disabled || wanted === 0} onClick={() => onSelect(group, firstRemovable(group, wanted))}>Select {wanted || ""}</Button>
        <Button type="button" size="sm" variant="ghost" disabled={disabled || chosen === 0} onClick={() => onSelect(group, [])}>Clear</Button>
      </div> : null}
    </div>
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{group.batches.map((batch, index) => {
      if (!batch.id) return null;
      const id = batch.id;
      const locked = !batchRemovable(batch);
      const label = batchLabel(batch, index);
      return <li key={id}><label className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${locked ? "bg-muted/40 text-muted-foreground" : "cursor-pointer"}`}>
        <span className="flex min-w-0 items-center gap-2">
          <Checkbox checked={selected.has(id)} disabled={locked || disabled} aria-label={`Remove ${label} of ${group.name}`} onCheckedChange={(checked) => onToggle(id, checked === true)} />
          <span className="min-w-0 break-words">{label}</span></span>
        {batch.cancelled ? <Badge variant="secondary">Cancelled</Badge> : batch.started ? <Badge>In production</Badge> : null}
      </label></li>;
    })}</ul>
  </section>;
}
