import { formsApi } from "@/shared/api/generated/forms";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { RecordState } from "@/shared/workflows/record-state";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { renderPrintStoredResponseValue } from "@/shared/ard-view/raw-data/print/question-view";
import { reworkAudit as audit } from "../schemas/rework";
export function ReworkResponsePreview({ id, title }: { id: string; title: string }) {
  const query = formsApi.useGetApiV1FormResponsesByFormResponseIdQuery({ ...audit, formResponseId: id });
  return <section className="space-y-3"><h2 className="font-semibold">{title}</h2>
    <RecordState loading={query.isLoading} error={query.error ? apiErrorMessage(query.error) : null} data={query.data} retry={() => void query.refetch()}>{(record) => <>
      <p className="text-sm text-muted-foreground">{record.form?.name ?? "QC test"} · {record.approved ? "QA approved" : record.rejected ? "QA rejected" : record.checkedAt ? "Awaiting QA" : "In progress"}</p>
      <dl className="grid min-w-0 gap-3 md:grid-cols-2">{(record.formResponses ?? []).map((entry) => <div key={entry.id ?? entry.formField?.id} className="min-w-0 space-y-1">
        <dt className="font-medium"><RichTextView html={entry.formField?.question?.label ?? entry.formField?.description ?? "Test field"} /></dt>
        <dd className="min-w-0 break-words">{renderPrintStoredResponseValue(entry, entry.formField)}</dd>
      </div>)}</dl>
    </>}</RecordState>
  </section>;
}
