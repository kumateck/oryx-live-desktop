import { qcApi, type DomainEntitiesQcWorksheetsTestRequestDetailDto } from "@/shared/api/generated/qc";
import { ConfirmActionDialog } from "@/shared/actions";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { retestAudit as audit } from "../schemas/retest";
export function RecordSampleDialog({ request, onClose, onDone }: { request: DomainEntitiesQcWorksheetsTestRequestDetailDto; onClose: () => void; onDone: () => void }) {
  const command = useVerifiedMutation<DomainEntitiesQcWorksheetsTestRequestDetailDto>("CanRecordQcSample", request);
  const [read] = qcApi.useLazyGetApiV1QcWorksheetsTestRequestsByIdQuery();
  const [sample] = qcApi.usePostApiV1QcWorksheetsTestRequestsByIdRecordSampleMutation();
  return <ConfirmActionDialog title="Record collection for this round?" description="Confirm that the retest sample has been collected for every subject of this testing round." destructive={false} require="CanRecordQcSample" confirmLabel="Record collection" busyLabel="Verifying…" onClose={onClose} onConfirm={async () => {
    if (!request.id) return "The testing round identity is missing.";
    const failure = await command.run(request, () => read({ ...audit, id: request.id ?? "" }, false).unwrap(), async (fresh) => {
      if (!fresh.id || fresh.status !== 0) throw new Error("This round has already been sampled.");
      const result = await sample({ ...audit, id: fresh.id, domainEntitiesQcWorksheetsRecordTestRequestSampleRequest: { subjectIds: (fresh.subjects ?? []).flatMap((row) => row.id ? [row.id] : []) } });
      if ("error" in result) throw new Error(apiErrorMessage(result.error));
    });
    if (!failure) onDone(); return failure;
  }} />;
}
