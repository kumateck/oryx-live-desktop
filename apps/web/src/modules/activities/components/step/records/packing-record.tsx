import { PackageCheck } from "lucide-react";
import { recordPerson, recordQuantity, recordShare } from "../../../lib/step-record-details";
import type { PackingRecord as Packing } from "../../../schemas/step-records-schema";
import { ActionRecord, RecordFacts, RecordFigures, RecordNote, RecordSubheading } from "./record-layout";
import { RecordMaterials } from "./record-materials";

const fields = [
  { key: "received", label: "Initial receipt", numeric: true }, { key: "subsequent", label: "Later receipt", numeric: true },
  { key: "total", label: "Total received", numeric: true }, { key: "packed", label: "Packed", numeric: true },
  { key: "returned", label: "Returned", numeric: true }, { key: "rejected", label: "Rejected", numeric: true },
  { key: "sampled", label: "Sampled", numeric: true }, { key: "accounted", label: "Accounted for", numeric: true },
  { key: "loss", label: "Loss %", numeric: true, size: 90 }, { key: "reason", label: "Variance reason", size: 200 },
];
const count = (value: number | null | undefined) => recordQuantity(value, null, "calculated");
const signed = (value: number | null | undefined) => value === null || value === undefined ? null : `${value > 0 ? "+" : ""}${count(value)}`;
export function PackingRecord({ record, batchScoped }: { record: Packing; batchScoped: boolean }) {
  const yieldShare = recordShare(record.yieldTotalQuantityPacked, record.expectedYield);
  const shippers = record.nUmberOfFullShipperPacked !== null && record.nUmberOfFullShipperPacked !== undefined
    ? `${count(record.nUmberOfFullShipperPacked)}${record.numberOfBottlesPerShipper ? ` × ${count(record.numberOfBottlesPerShipper)} units` : ""}` : null;
  const materials = record.materials ?? [];
  return <ActionRecord icon={PackageCheck} title="Final packing" code={record.productPacking?.name}
    recorded={{ at: record.createdAt, by: recordPerson(record.createdBy) }} batchScoped={batchScoped}>
    <RecordFigures figures={[["Expected yield", count(record.expectedYield)],
      ["Packed incl. samples", count(record.yieldTotalQuantityPacked), yieldShare ? `${yieldShare} of expected` : null],
      ["Available to transfer", count(record.totalQuantityPacked)], ["Gain / loss", signed(record.totalGainOrLoss)]]} />
    <RecordFacts facts={[["QC analytical samples", recordQuantity(record.qualityControlAnalyticalSample)], ["Retained samples", recordQuantity(record.retainedSamples)],
      ["Stability samples", recordQuantity(record.stabilitySamples)], ["Full shippers", shippers], ["Loose packs", count(record.leftOver)],
      ["Total bottles / units", count(record.totalNumberOfBottles)], ["Batch size", recordQuantity(record.batchSize)],
      ["Average fill volume / weight", recordQuantity(record.averageVolumeFilledPerBottle)], ["Weight received", recordQuantity(record.totalWeightReceived)]]} />
    <RecordNote label="Yield variance reason" value={record.percentageVarianceDescription} />
    <RecordNote label="Comment" value={record.comment} />
    {materials.length ? <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3"><RecordSubheading>Material reconciliation</RecordSubheading>
        <p className="text-sm text-muted-foreground">Quantities as entered on the packing record</p></div>
      <RecordMaterials label="Final packing material reconciliation" fields={fields} rows={materials.map((item, index) => ({
        id: `${record.id}-${index}`, name: item.material?.name ?? "Unnamed material", code: item.material?.code,
        values: { received: recordQuantity(item.receivedQuantity), subsequent: recordQuantity(item.subsequentDeliveredQuantity),
          total: count(item.totalReceivedQuantity), packed: recordQuantity(item.packedQuantity), returned: recordQuantity(item.returnedQuantity),
          rejected: recordQuantity(item.rejectedQuantity), sampled: recordQuantity(item.sampledQuantity), accounted: count(item.totalAccountedForQuantity),
          loss: count(item.percentageLoss), reason: item.percentageVarianceDescription ?? null },
      }))} /></div> : null}
  </ActionRecord>;
}
