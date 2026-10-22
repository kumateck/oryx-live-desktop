import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader } from "@/shared/print/print-sheet";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { leaveApi } from "../api/leave-api";
import { leaveAudit, leaveRoot, employeeName } from "../lib/leave";
import { LeaveRecord, leaveFacts, leaveFiles } from "./leave-record";
import { LeaveActions } from "./leave-actions";
import { ModelApprovalHistory } from "@/shared/approvals/model-history";
function Detail({ id }: { id: string }) {
  const query = leaveApi.useGetApiV1LeaveRequestByIdQuery({ ...leaveAudit, id }, { refetchOnMountOrArgChange: true });
  if (query.isLoading) return <DetailPageSkeleton label="Loading leave request" groups={4} />;
  const row = query.currentData;
  if (query.error || row?.id !== id)
    return (
      <section role="alert" className="space-y-3">
        <h1 className="font-semibold">Leave request unavailable</h1>
        <p>{query.error ? apiErrorMessage(query.error) : "The server did not return this request."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  return (
    <article className="space-y-4">
      <PageHeader
        title={`Leave request · ${employeeName(row)}`}
        crumbs={[{ label: "Leave management", to: leaveRoot }, { label: "Request details" }]}
        actions={
          <>
            <PrintButton
              preview={(close) => (
                <PrintPreviewDialog
                  title="Leave request"
                  onClose={close}
                  note="The current request and supporting filenames are printed. Approval decisions and file contents are viewed separately below."
                >
                  <PrintHeader title="Leave request" reference={row.employee?.staffNumber} />
                  <PrintFacts facts={leaveFacts(row)} />
                  {row.justification ? <RichTextView html={row.justification} /> : null}
                  <p>
                    Supporting files:{" "}
                    {leaveFiles(row)
                      .map((file) => file.name)
                      .join(", ") || "None"}
                  </p>
                </PrintPreviewDialog>
              )}
            />
            <LeaveActions row={row} detail />
          </>
        }
      />
      <LeaveRecord row={row} />
      <AttachmentList title="Supporting attachments" files={leaveFiles(row)} />
      <ModelApprovalHistory id={id} model="LeaveRequest" audit={leaveAudit} />
    </article>
  );
}
export function LeaveDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : <p role="alert">Request ID is missing.</p>;
}
