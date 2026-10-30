import { formatCount, formatShippers, shipperSplit } from "./packs";

/**
 * A finished goods quantity as the store counts it: shippers and loose packs first, total packs under it.
 * Pass `split` when the packs come from several shipper sizes; otherwise it is worked out from `perShipper`.
 */
export function PackQuantity({ packs, perShipper, split, className }: {
  packs: number; perShipper?: number | null | undefined; split?: { shippers: number; loose: number } | undefined; className?: string | undefined;
}) {
  return <div className={className}><div className="font-medium">{formatShippers(split ?? shipperSplit(packs, perShipper))}</div>
    <div className="text-xs text-muted-foreground">{formatCount(packs)} {packs === 1 ? "pack" : "packs"}</div></div>;
}
