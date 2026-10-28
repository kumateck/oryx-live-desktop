import type { ReactNode } from "react";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { varianceLimitPercent, type YieldFigures } from "../../lib/final-packing";

const count = (value: number) => formatQuantityNumber(value, "calculated");

function Figure({ label, value, note, alert = false }: { label: string; value: ReactNode; note?: string | undefined; alert?: boolean }) {
  return <div className="min-w-0 rounded-md border p-3"><dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className={`text-lg font-semibold ${alert ? "text-destructive" : ""}`}>{value}</dd>{note ? <dd className="text-xs text-muted-foreground">{note}</dd> : null}</div>;
}

/** What the entered figures add up to. These are worked out, never typed. */
export function YieldFiguresView({ figures, countUnit, packsPerShipper, entered }: { figures: YieldFigures; countUnit: string; packsPerShipper: number | null; entered: boolean }) {
  const blank = "–";
  return <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Worked out from what was entered">
    <Figure label="Expected yield" value={figures.expected > 0 ? `${count(figures.expected)} ${countUnit}` : blank} />
    <Figure label="Total packed including samples" value={entered ? `${count(figures.afterSamples + figures.samples)} ${countUnit}` : blank} note={figures.samples ? `${count(figures.samples)} set aside as samples` : undefined} />
    <Figure label="Gain or loss" value={entered && figures.expected > 0 ? `${figures.gainOrLoss > 0 ? "+" : ""}${count(figures.gainOrLoss)} ${countUnit}` : blank}
      note={entered && figures.percent !== null ? `${figures.percent > 0 ? "+" : ""}${count(figures.percent)}% (limit ±${varianceLimitPercent}%)` : undefined} alert={figures.needsReason} />
    <Figure label="Available for warehouse transfer" value={entered && packsPerShipper ? `${count(figures.totalPacked)} ${countUnit}` : blank} alert={entered && figures.afterSamples <= 0}
      note={entered && packsPerShipper ? `${figures.fullShippers} full ${figures.fullShippers === 1 ? "shipper" : "shippers"} of ${packsPerShipper}${figures.leftOver ? ` and ${count(figures.leftOver)} left over` : ""}` : undefined} />
  </dl>;
}
