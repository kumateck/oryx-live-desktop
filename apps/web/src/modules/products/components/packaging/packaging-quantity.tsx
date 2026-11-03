import { Skeleton } from "@/shared/skeleton/skeleton";
import { formatQuantityNumber, toLargestUnit, type QuantityOrigin } from "@/shared/units/quantity";
import { usePackagingUnit } from "../../hooks/use-packaging-unit";
import type { PackagingLine } from "../../lib/packaging";

export function PackagingQuantity({ line, value, origin }: { line: PackagingLine; value: number; origin: QuantityOrigin }) {
  const linked = usePackagingUnit(line.material.value, line.unit);
  if (linked.status === "loading") return <Skeleton className="h-4 w-20" />;
  if (linked.status === "error") return <span>{formatQuantityNumber(value, origin)} <button type="button" className="text-destructive underline" onClick={linked.retry}>Retry unit</button></span>;
  if (!linked.unit) return <span>{formatQuantityNumber(value, origin)} <span className="text-destructive">(unit not set)</span></span>;
  return <span className="tabular-nums">{toLargestUnit(value, linked.unit.symbol, origin)?.text ?? "–"}</span>;
}
