import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDateTime } from "@/shared/format/dates";
import { formatQuantityNumber } from "@/shared/units/quantity";
import type { Allocation } from "../schemas/dispatch-schema";

export function DeliveryEvidence({ allocation }: { allocation: Allocation }) {
  const sources = allocation.products.flatMap((product) => product.sources.map((source) => ({ ...source, product: product.name })));
  return <DetailGroup title="Customer delivery evidence">
    <DetailItem label="Delivered" value={formatDateTime(allocation.deliveredAt)} />
    <DetailItem label="Received by" value={allocation.deliveryReceiver} />
    <DetailItem label="Proof of delivery" value={allocation.deliveryEvidence} />
    <DetailItem label="Product / transport condition" value={allocation.deliveryCondition} />
    {allocation.deliveryLines.map((line) => {
      const source = sources.find((row) => row.noteId === line.finishedGoodsTransferNoteId);
      const quantity = (value: number) => source && source.unitsPerPack > 0
        ? `${formatQuantityNumber(value / source.unitsPerPack, "calculated")} packs`
        : `${formatQuantityNumber(value, "entered")} base units`;
      return <DetailItem key={line.finishedGoodsTransferNoteId} label={`${source?.product ?? "Product"} · ${source?.batch ?? "Batch"} · ${source?.packing ?? "Packing style"}`}
        value={`Accepted ${quantity(line.acceptedYield)} · Damaged ${quantity(line.damagedYield)} · Short ${quantity(line.shortYield)}`} />;
    })}
    {allocation.deliveryLines.length === 0 ? <p className="text-sm text-amber-700 dark:text-amber-400">This historical delivery has no saved quantity reconciliation. Resolve its source evidence during stock reconciliation.</p> : null}
  </DetailGroup>;
}
