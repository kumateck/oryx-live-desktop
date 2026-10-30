import { Undo2 } from "lucide-react";
import { recordPerson, recordQuantity } from "../../../lib/step-record-details";
import type { ReturnRecord as Return } from "../../../schemas/step-records-schema";
import { ActionRecord, RecordTimeline } from "./record-layout";
import { RecordMaterials } from "./record-materials";

const fields = [{ key: "batch", label: "Material batch" }, { key: "quantity", label: "Quantity", numeric: true, size: 120 },
  { key: "destination", label: "Returned to" }, { key: "returned", label: "Warehouse receipt", size: 130 }];
const receipt = (returned: boolean | null | undefined) => returned === true ? "Received" : returned === false ? "Pending" : null;
export function ReturnRecord({ record }: { record: Return }) {
  const full = record.fullReturns ?? [];
  const partial = record.partialReturns ?? [];
  return <ActionRecord icon={Undo2} title={record.isFullReturn ? "Full material return" : "Leftover material return"} code={record.batchNumber}
    status={record.status === 1 ? "Returned" : record.status === 0 ? "Pending receipt" : null} tone={record.status === 1 ? "done" : "waiting"}
    recorded={{ at: record.createdAt ?? record.returnDate, by: recordPerson(record.createdBy) }} batchScoped>
    <RecordMaterials label="Returned materials" fields={fields} rows={[
      ...full.map((item, index) => {
        const stock = item.materialBatchReservedQuantity;
        return { id: `${record.id}-full-${index}`, name: stock?.materialBatch?.material?.name ?? "Unnamed material", code: stock?.materialBatch?.material?.code,
          values: { batch: stock?.materialBatch?.batchNumber ?? null, quantity: recordQuantity(stock?.quantity, stock?.uoM?.symbol),
            destination: item.destinationWarehouse?.name ?? null, returned: receipt(item.returned) } };
      }),
      ...partial.map((item, index) => ({ id: `${record.id}-partial-${index}`, name: item.material?.name ?? "Unnamed material", code: item.material?.code,
        values: { batch: item.materialBatch?.batchNumber ?? null, quantity: recordQuantity(item.quantity, item.uoM?.symbol),
          destination: item.destinationWarehouse?.name ?? null, returned: receipt(item.returned) } })),
    ]} />
    <RecordTimeline events={[{ label: "Return recorded", at: record.createdAt, by: recordPerson(record.createdBy) }, { label: "Returned", at: record.returnDate }]} />
  </ActionRecord>;
}
