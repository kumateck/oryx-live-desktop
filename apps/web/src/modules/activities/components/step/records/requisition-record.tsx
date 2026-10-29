import { ClipboardCheck } from "lucide-react";
import { formatDateTime } from "@/shared/format/dates";
import { recordedBoolean, recordQuantity, requisitionTone } from "../../../lib/step-record-details";
import { requisitionStatusLabel } from "../../../lib/step-status";
import type { RequisitionRecord as Requisition } from "../../../schemas/step-records-schema";
import { ActionRecord, RecordFacts, RecordNote } from "./record-layout";
import { RecordMaterials } from "./record-materials";

const fields = [{ key: "requested", label: "Requested", numeric: true, size: 140 }, { key: "received", label: "Received", numeric: true, size: 140 }, { key: "status", label: "Status" }];
export function RequisitionRecord({ record, batchScoped }: { record: Requisition; batchScoped: boolean }) {
  return <ActionRecord icon={ClipboardCheck} title="Stock requisition" code={record.code} status={requisitionStatusLabel(record.status)} tone={requisitionTone(record.status)}
    recorded={{ at: record.createdAt, by: record.requestedBy?.name }} batchScoped={batchScoped}>
    <RecordFacts facts={[["Department", record.department?.name], ["Expected delivery", record.expectedDelivery ? formatDateTime(record.expectedDelivery) : null],
      ["Approved", recordedBoolean(record.approved)]]} />
    <RecordMaterials label={`Materials on requisition ${record.code ?? record.id}`} fields={fields} rows={(record.items ?? []).map((item, index) => ({
      id: item.id ?? `${record.id}-${index}`, name: item.material?.name ?? "Unnamed material", code: item.material?.code,
      values: { requested: recordQuantity(item.quantity, item.uoM?.symbol), received: recordQuantity(item.quantityReceived, item.uoM?.symbol), status: requisitionStatusLabel(item.status) },
    }))} />
    <RecordNote label="Comments" value={record.comments} />
  </ActionRecord>;
}
