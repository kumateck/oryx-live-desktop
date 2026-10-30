import { formatDateTime } from "@/shared/format/dates";
import { formatQuantityNumber } from "@/shared/units/quantity";
import type { RecordedPacking } from "../../schemas/final-packing-schema";

const count = (value: number) => formatQuantityNumber(value, "calculated");

/** Final packing as it was recorded. It is recorded once; the page shows it and offers no second entry. */
export function RecordedPackingView({ recorded }: { recorded: RecordedPacking }) {
  const facts = [["Expected yield", recorded.expected > 0 ? count(recorded.expected) : "Not recorded"],
    ["Available for warehouse transfer", `${count(recorded.fullShippers)} ${recorded.fullShippers === 1 ? "shipper" : "shippers"} · ${count(recorded.leftOver)} loose`],
    ["Packs per shipper", count(recorded.perShipper)], ["Yield available to transfer", count(recorded.totalPacked)],
    ["Total packed including samples", count(recorded.actualPacked)], ["Gain or loss", `${recorded.gainOrLoss > 0 ? "+" : ""}${count(recorded.gainOrLoss)}`], ["Recorded", formatDateTime(recorded.createdAt) ?? "–"]];
  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <h2 className="text-sm font-semibold">Final packing is recorded</h2>
    <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">{facts.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm font-medium">{value}</dd></div>)}</dl>
    {recorded.reason ? <p className="text-sm"><span className="text-muted-foreground">Reason for the variance: </span>{recorded.reason}</p> : null}
  </section>;
}
