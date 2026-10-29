import { FlaskConical } from "lucide-react";
import { formatMonthYear } from "@/shared/format/dates";
import { atrTone, recordPerson, recordedBoolean } from "../../../lib/step-record-details";
import { atrStatusLabel, testStageLabel } from "../../../lib/step-status";
import type { AnalysisRecord as Analysis } from "../../../schemas/step-records-schema";
import { ActionRecord, RecordFacts, RecordFigures, RecordTimeline } from "./record-layout";

export function AnalysisRecord({ record }: { record: Analysis }) {
  const request = record.request;
  return <ActionRecord icon={FlaskConical} title="Analytical test request" code={request.arNumber} status={atrStatusLabel(request.status)} tone={atrTone(request.status)}
    flags={[request.isRetest === true && "Retest"]} recorded={{ at: request.createdAt, by: recordPerson(request.createdBy) }} batchScoped={false}>
    <RecordFigures figures={[
      ["Test stage", request.stage === null || request.stage === undefined ? null : testStageLabel(request.stage)],
      ["Sampled quantity", request.sampledQuantity], ["Containers", request.numberOfContainers], ["Filled volume", request.filled],
    ]} />
    <RecordFacts facts={[
      ["Batch number", request.batchManufacturingRecord?.batchNumber], ["Product state", request.state?.name],
      ["Manufactured", formatMonthYear(request.manufacturingDate)], ["Expires", formatMonthYear(request.expiryDate)],
      ["Issue number", request.issueNumber], ["Microbial analysis required", recordedBoolean(record.microbialRequired)],
      ["Assigned analysts", (request.assignees ?? []).map(recordPerson).filter(Boolean).join(", ") || null],
    ]} />
    <RecordTimeline events={[
      { label: "Requested", at: request.createdAt, by: recordPerson(request.createdBy) },
      { label: "Sampled", at: request.sampledAt, by: recordPerson(request.sampledBy) },
      { label: "Acknowledged", at: request.acknowledgedAt, by: recordPerson(request.acknowledgedBy) },
      { label: "Assigned", at: request.assignedAt }, { label: "Issued", at: request.issuedAt, by: recordPerson(request.issuedBy) },
      { label: "Testing started", at: record.testedAt, by: recordPerson(record.testedBy) },
      { label: "Released", at: request.releasedAt, by: recordPerson(request.releasedBy) },
    ]} />
  </ActionRecord>;
}
