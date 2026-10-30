import { PackagePlus } from "lucide-react";
import { extraMaterialTone, recordedBoolean, recordPerson, recordQuantity } from "../../../lib/step-record-details";
import { extraMaterialStatusLabel } from "../../../lib/step-status";
import type { ExtraMaterialRecord as Extra } from "../../../schemas/step-records-schema";
import { ActionRecord, RecordFacts, RecordFigures, RecordTimeline } from "./record-layout";

export function ExtraMaterialRecord({ record }: { record: Extra }) {
  const status = record.status === null || record.status === undefined ? null : extraMaterialStatusLabel(record.status);
  return <ActionRecord icon={PackagePlus} title="Extra material request" code={record.material?.code} status={status} tone={extraMaterialTone(record.status)}
    recorded={{ at: record.createdAt, by: recordPerson(record.createdBy) }} batchScoped>
    <RecordFigures figures={[["Material", record.material?.name], ["Quantity", recordQuantity(record.quantity, record.unit?.name)]]} />
    <RecordFacts facts={[["Approval complete", recordedBoolean(record.approved)]]} />
    <RecordTimeline events={[{ label: "Requested", at: record.createdAt, by: recordPerson(record.createdBy) },
      { label: "Issued", at: record.issuedAt, by: recordPerson(record.issuedBy) }]} />
  </ActionRecord>;
}
