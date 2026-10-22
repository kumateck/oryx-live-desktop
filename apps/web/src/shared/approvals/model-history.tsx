import { Button } from "@/components/ui/button";
import { approvalsApi } from "@/shared/api/generated/approvals";
import { formatDateTime } from "@/shared/format/dates";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
export function ModelApprovalHistory({ id, model, audit }: { id: string; model: string; audit: { module: string; subModule: string } }) {
  const query = approvalsApi.useGetApiV1ApprovalByModelTypeAndModelIdQuery({ ...audit, modelType: model, modelId: id });
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Approval history</h2>
      {query.isLoading ? (
        <p role="status">Loading approval history…</p>
      ) : query.error ? (
        <div role="alert">
          <p>{apiErrorMessage(query.error)}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Retry history
          </Button>
        </div>
      ) : !query.currentData?.approvalLogs?.length ? (
        <p className="text-sm text-muted-foreground">No approval decisions recorded.</p>
      ) : (
        <ol className="space-y-2">
          {query.currentData.approvalLogs.map((log, index) => (
            <li key={`${log.approvedAt}-${index}`} className="rounded-md border p-3">
              <p>
                {log.status === 1 ? "Approved" : log.status === 2 ? "Rejected" : log.status === 0 ? "Pending" : "Decision recorded"} ·{" "}
                {log.user?.name ?? "Unnamed user"} · {formatDateTime(log.approvedAt) ?? "Date not recorded"}
              </p>
              {log.comments ? <RichTextView html={log.comments} className="mt-1 text-sm" /> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
