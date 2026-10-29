import { ClipboardList } from "lucide-react";
import { formatMonthYear } from "@/shared/format/dates";
import { batchRecordStatus, batchRecordTone, recordPerson, recordQuantity } from "../../../lib/step-record-details";
import type { ManufacturingRecord as Manufacturing } from "../../../schemas/step-records-schema";
import { ActionRecord, RecordFigures, RecordTimeline } from "./record-layout";

export function ManufacturingRecord({ record, batchScoped, unit }: { record: Manufacturing; batchScoped: boolean; unit: string | null }) {
  return <ActionRecord icon={ClipboardList} title="Batch manufacturing record" code={record.batchNumber} status={batchRecordStatus(record.status)} tone={batchRecordTone(record.status)}
    recorded={{ at: record.createdAt, by: recordPerson(record.createdBy) }} batchScoped={batchScoped}>
    <RecordFigures figures={[["Batch quantity", recordQuantity(record.batchQuantity, unit)], ["Sampled quantity", recordQuantity(record.sampledQuantity, unit)],
      ["Manufactured", formatMonthYear(record.manufacturingDate)], ["Expires", formatMonthYear(record.expiryDate)]]} />
    <RecordTimeline events={[{ label: "Requested", at: record.createdAt, by: recordPerson(record.createdBy) }, { label: "Issued", at: record.issuedDate }]} />
  </ActionRecord>;
}
