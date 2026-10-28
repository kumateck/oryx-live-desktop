import { useMemo, useState, type ReactNode } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { BadgeCheck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formsApi } from "@/shared/api/generated/forms";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { buildFormResponsesFromSections } from "@/shared/ard-view/raw-data/form-utils";
import ArdTemplateBody from "@/shared/ard-view/templates/body";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import type { PageCrumb } from "@/shared/navigation/page-breadcrumbs";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { ardAudit, type ArdRecord } from "./ard-record";

/** The record's template, as the blank worksheet analysts fill in. */
function useTemplate(formId: string | null) {
  const query = formsApi.useGetApiV1FormByFormIdQuery(formId ? { ...ardAudit, formId } : skipToken);
  const sections = query.data?.sections ?? undefined;
  const responses = useMemo(() => buildFormResponsesFromSections(sections), [sections]);
  return { sections, responses, loading: query.isLoading, error: query.error ? apiErrorMessage(query.error) : null, retry: () => { void query.refetch(); } };
}

/** An analytical raw data record: what it links, its blank worksheet (printable), and its attachments. */
export function ArdDetail({ record, title, crumbs, actions, facts, summary }: {
  record: ArdRecord; title: string; crumbs: readonly PageCrumb[]; actions?: ReactNode; facts: ReactNode;
  /** The worksheet's header block, as printed. */ summary: ReactNode;
}) {
  const template = useTemplate(record.form?.id ?? null);
  const [printing, setPrinting] = useState(false);
  const sheet = <div className="ard-print-root min-w-0 space-y-2">{summary}<ArdTemplateBody sections={template.sections} responses={template.responses} noResponse /></div>;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={crumbs} actions={<>{actions}<Button variant="outline" disabled={!template.sections} onClick={() => setPrinting(true)}><Printer />Print</Button></>} />
    <KeyFacts>
      {facts}
      <KeyFact label="STP" value={record.stp?.number ?? "–"} />
      <KeyFact label="Specification" value={record.specNumber ?? "–"} note={record.form?.name} />
      <KeyFact label="Status" value={record.isVerified ? <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-5 text-emerald-600" aria-hidden />Approved</span> : "Not approved"}
        note={record.createdAt ? `Created ${formatDate(record.createdAt) ?? ""}` : undefined} />
    </KeyFacts>
    {record.description ? <section aria-label="Description" className="rounded-lg border bg-card p-4 text-sm"><h2 className="mb-1 text-sm font-semibold">Description</h2><RichTextView html={record.description} /></section> : null}
    <section aria-label="Worksheet" className="space-y-2"><h2 className="text-sm font-semibold">Worksheet</h2>
      {!record.form ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">This record has no template, so there is no worksheet.</p>
        : template.loading ? <Skeleton className="h-64 w-full" />
        : template.error ? <div role="alert" className="space-y-2 rounded-lg border p-4 text-sm"><p className="text-destructive">{template.error}</p><Button size="sm" variant="outline" onClick={template.retry}>Retry</Button></div>
        : <div className="overflow-x-auto rounded-lg border bg-card p-3">{sheet}</div>}
    </section>
    <AttachmentList title="Attachments" files={record.attachments} empty="Nothing is attached to this record." />
    {printing ? <PrintPreviewDialog title="Analytical raw data" ready={Boolean(template.sections)} onClose={() => setPrinting(false)}>{sheet}</PrintPreviewDialog> : null}
  </article>;
}
