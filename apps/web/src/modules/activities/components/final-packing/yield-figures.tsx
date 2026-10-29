import type { ReactNode } from "react";
import { pluralUnit } from "@/shared/packing/packs";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { varianceLimitPercent, type YieldFigures } from "../../lib/final-packing";

const count = (value: number) => formatQuantityNumber(value, "calculated");

function Figure({ label, value, note, alert = false }: { label: string; value: ReactNode; note?: string | undefined; alert?: boolean }) {
  return <div className="min-w-0 rounded-md border p-3"><dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className={`text-lg font-semibold ${alert ? "text-destructive" : ""}`}>{value}</dd>{note ? <dd className="text-xs text-muted-foreground">{note}</dd> : null}</div>;
}

/** What the entered figures add up to. These are worked out, never typed. */
export function YieldFiguresView({ figures, countUnit, packsPerShipper, packName = null, entered }: {
  figures: YieldFigures; countUnit: string; packsPerShipper: number | null; packName?: string | null; entered: boolean;
}) {
  const blank = "–";
  // What goes to the warehouse is counted in packs: the packing style's pack unit, or the counted unit when a pack is one of them.
  const packs = (value: number) => figures.perPack > 1 || packName ? `${count(value)} ${packName ? (value === 1 ? packName : pluralUnit(packName)) : value === 1 ? "pack" : "packs"}` : `${count(value)} ${countUnit}`;
  const transferNote = [
    `${figures.fullShippers} full ${figures.fullShippers === 1 ? "shipper" : "shippers"} of ${packsPerShipper}${figures.leftOver ? ` and ${count(figures.leftOver)} loose` : ""}`,
    figures.perPack > 1 ? `${count(figures.perPack)} ${countUnit} per pack` : null,
    figures.leftoverUnits > 0 ? `${count(figures.leftoverUnits)} ${countUnit} left over, short of a full pack` : null,
  ].filter(Boolean).join(" · ");
  return <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Worked out from what was entered">
    <Figure label="Expected yield" value={figures.expected > 0 ? `${count(figures.expected)} ${countUnit}` : blank} />
    <Figure label="Total packed including samples" value={entered ? `${count(figures.afterSamples + figures.samples)} ${countUnit}` : blank} note={figures.samples ? `${count(figures.samples)} set aside as samples` : undefined} />
    <Figure label="Gain or loss" value={entered && figures.expected > 0 ? `${figures.gainOrLoss > 0 ? "+" : ""}${count(figures.gainOrLoss)} ${countUnit}` : blank}
      note={entered && figures.percent !== null ? `${figures.percent > 0 ? "+" : ""}${count(figures.percent)}% (limit ±${varianceLimitPercent}%)` : undefined} alert={figures.needsReason} />
    <Figure label="Available for warehouse transfer" value={entered && packsPerShipper ? packs(figures.totalPacked) : blank} alert={entered && (figures.afterSamples <= 0 || figures.totalPacked <= 0)}
      note={entered && packsPerShipper ? transferNote : undefined} />
  </dl>;
}
