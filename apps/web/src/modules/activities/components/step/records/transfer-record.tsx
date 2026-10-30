import { Truck } from "lucide-react";
import { recordPerson, recordQuantity, transferStatus } from "../../../lib/step-record-details";
import type { TransferRecord as Transfer } from "../../../schemas/step-records-schema";
import { ActionRecord, RecordFacts, RecordFigures, RecordNote, RecordProgress } from "./record-layout";

export function TransferRecord({ record, batchScoped }: { record: Transfer; batchScoped: boolean }) {
  const status = transferStatus(record);
  const quantity = (value: number | null | undefined) => recordQuantity(value, record.uoM?.symbol);
  const route = record.fromWarehouse?.name || record.toWarehouse?.name ? `${record.fromWarehouse?.name ?? "Not recorded"} → ${record.toWarehouse?.name ?? "Not recorded"}` : null;
  return <ActionRecord icon={Truck} title="Finished goods transfer" code={record.transferNoteNumber} status={status.label} tone={status.tone}
    flags={[record.isPartial === true && "Partial"]} recorded={{ at: record.createdAt, by: recordPerson(record.createdBy) }} batchScoped={batchScoped}>
    <RecordFigures figures={[["Transferred", quantity(record.totalQuantity)],
      ["Received", quantity(record.quantityReceived)],
      ["Allocated", quantity(record.allocatedQuantity)], ["Remaining to allocate", quantity(record.remainingQuantity)]]} />
    <RecordProgress label="Received against transferred" done={record.quantityReceived} total={record.totalQuantity}
      text={`${quantity(record.quantityReceived) ?? "0"} of ${quantity(record.totalQuantity)} received`} />
    <RecordFacts facts={[["Route", route], ["Packing style", record.productPacking?.name], ["Quantity per pack", quantity(record.quantityPerPack)],
      ["Loose packs", recordQuantity(record.loose)], ["QA release number", record.qarNumber]]} />
    <RecordNote label="Notes" value={record.notes} />
  </ActionRecord>;
}
