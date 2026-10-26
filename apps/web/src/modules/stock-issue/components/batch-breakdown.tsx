import { cn } from "cn";
import { formatMonthYear } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import { batchNumber, expiredOrDue } from "../lib/stock-issue";

export const amount = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

/** The batches set aside for a line: how much from each, and when each expires. An expired batch is marked. */
export function BatchBreakdown({ line }: { line: { unit: string | null; batches: readonly { key: string; number: string | null; quantity: number; expires: string | null; returned: boolean }[] } }) {
  if (line.batches.length === 0) return <span className="text-sm text-destructive">No stock set aside</span>;
  return <ul className="flex flex-wrap gap-1.5">{line.batches.map((batch) => { const expired = expiredOrDue(batch.expires);
    const number = batchNumber(batch.number);
    return <li key={batch.key} className={cn("rounded-md border px-2 py-1 text-sm", expired && "border-destructive/50 bg-destructive/5")}>
      <div><span className="font-medium">{number === "–" ? "No batch" : number}</span> <span className="text-muted-foreground">· {amount(batch.quantity, line.unit)}</span>{batch.returned ? <span className="ml-1.5 rounded bg-muted px-1 text-xs">Returned stock</span> : null}</div>
      <div className={cn("text-xs", expired ? "font-medium text-destructive" : "text-muted-foreground")}>{batch.expires ? `${expired ? "Expired" : "Expires"} ${formatMonthYear(batch.expires) ?? ""}` : "No expiry date"}</div></li>; })}</ul>;
}
