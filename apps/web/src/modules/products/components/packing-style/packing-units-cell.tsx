import { Badge } from "@/components/ui/badge";
import { baseUnitsPerPack, formatCount, matchingPackLevel, pluralUnit, unitName, type UnitRow } from "@/shared/packing/packs";

const dash = "–";
const amount = (quantity: number, name: string) => `${formatCount(quantity)} ${quantity === 1 ? name : pluralUnit(name)}`;

/**
 * A packing style's units, outermost first, each with what it holds, ending in base units.
 * The unit that packs per shipper counts is marked as the pack.
 */
export function PackingUnitsCell({ units, baseLabel, packPerShipper }: {
  units: readonly UnitRow[]; baseLabel: string | null | undefined; packPerShipper: number | null | undefined;
}) {
  if (units.length === 0) return <>{dash}</>;
  const baseName = unitName(baseLabel) ?? "base unit";
  const pack = matchingPackLevel(units, packPerShipper);
  const nameAt = (level: number) => (level === units.length ? baseName : unitName(units[level]?.uom?.label) ?? `Unit ${level + 1}`);
  const packMark = <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[11px]">Pack</Badge>;
  return <div className="space-y-1">
    <ul className="space-y-0.5">{units.map((unit, index) => {
      const quantity = unit.quantity;
      return <li key={index} className="whitespace-nowrap">
        <span className="font-medium">{nameAt(index)}</span>{pack === index ? packMark : null}
        <span className="text-muted-foreground"> · {typeof quantity === "number" && Number.isFinite(quantity) ? amount(quantity, nameAt(index + 1)) : dash}</span>
      </li>;
    })}
      {pack === units.length ? <li className="whitespace-nowrap"><span className="font-medium">{baseName}</span>{packMark}</li> : null}
    </ul>
    {pack === null && typeof packPerShipper === "number" && packPerShipper > 0
      ? <p className="text-xs text-amber-700 dark:text-amber-400">No unit matches {formatCount(packPerShipper)} packs per shipper.</p> : null}
  </div>;
}

/** Packs per shipper with the pack's name and how many base units it holds, for example "80 Outer Cartons · 200 Tablets each". */
export function PacksPerShipperCell({ units, baseLabel, packPerShipper }: {
  units: readonly UnitRow[]; baseLabel: string | null | undefined; packPerShipper: number | null | undefined;
}) {
  if (typeof packPerShipper !== "number" || !Number.isFinite(packPerShipper)) return <>{dash}</>;
  const pack = matchingPackLevel(units, packPerShipper);
  const baseName = unitName(baseLabel);
  const packName = pack === null ? null : pack === units.length ? baseName : unitName(units[pack]?.uom?.label);
  const perPack = pack === null ? null : baseUnitsPerPack(units, pack);
  // A style with no units packs base units directly.
  const shown = units.length === 0 ? baseName : packName;
  return <div>
    <div className="tabular-nums">{shown ? amount(packPerShipper, shown) : formatCount(packPerShipper)}</div>
    {perPack !== null && perPack > 1 && baseName ? <div className="text-xs text-muted-foreground">{amount(perPack, baseName)} each</div> : null}
  </div>;
}
