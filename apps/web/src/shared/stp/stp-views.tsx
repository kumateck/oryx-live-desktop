import type { ReactNode } from "react";
import { Link } from "react-router";
import { FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import type { PermissionRequirement } from "@/shared/auth/access";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import type { PageCrumb } from "@/shared/navigation/page-breadcrumbs";
import { PageHeader } from "@/shared/navigation/page-header";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { DocumentEditor } from "./document-editor";
import { documentStatusLabel, DocumentStatus, type StpDocument, type StpOwnerType } from "./stp-document";
import { StpDocumentActions } from "./stp-document-actions";
import type { Stp } from "./stp-schema";
import { StpVersionHistory } from "./stp-version-history";

const statusBadge = (document: StpDocument | null) => !document ? <Badge variant="outline">No document</Badge>
  : <Badge variant={document.status === DocumentStatus.Approved ? "default" : "secondary"}>{documentStatusLabel(document.status)}</Badge>;
const lockNote = (document: StpDocument) => document.lockedByName
  ? <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Lock className="size-4" aria-hidden />Being edited by {document.lockedByName}{document.lockedAt ? ` since ${formatDateTime(document.lockedAt) ?? ""}` : ""}</p> : null;

/** An STP's record page: what it is for, its controlled document's state and versions, and older attachments. */
export function StpDetail({ stp, document, itemLabel, crumbs, documentPath, actions }: {
  stp: Stp; document: StpDocument | null; itemLabel: string; crumbs: readonly PageCrumb[]; documentPath: string; actions?: ReactNode;
}) {
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`${stp.number}${stp.item ? ` · ${stp.item.name}` : ""}`} crumbs={crumbs} actions={<>{actions}
      {document ? <Button asChild><Link to={documentPath}><FileText />Open document</Link></Button> : null}</>} />
    <KeyFacts>
      <KeyFact label={itemLabel} value={stp.item?.name ?? "–"} note={stp.item?.code ?? undefined} />
      <KeyFact label="Document" value={statusBadge(document)} note={document?.versions[0] ? `Version ${String(document.versions[0].versionNumber)}` : undefined} />
      <KeyFact label="Created" value={formatDate(stp.createdAt) ?? "–"} note={stp.createdBy ?? undefined} />
      <KeyFact label="Attachments" value={stp.attachments.length} />
    </KeyFacts>
    <DetailGroup title="Procedure">
      <DetailItem label="STP number" value={stp.number} />
      <DetailItem label={itemLabel} value={stp.item ? `${stp.item.name}${stp.item.code ? ` (${stp.item.code})` : ""}` : null} />
      <DetailItem label="Created" value={formatDateTime(stp.createdAt)} />
    </DetailGroup>
    {!document && stp.description ? <section aria-label="Description" className="rounded-lg border bg-card p-4 text-sm"><h2 className="mb-1 text-sm font-semibold">Description</h2><RichTextView html={stp.description} /></section> : null}
    {document ? <section aria-label="Versions" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Document versions</h2>{lockNote(document)}<StpVersionHistory document={document} /></section>
      : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">This STP has no controlled document yet. Edit the STP to attach its first .docx version.</p>}
    <AttachmentList title="Attachments" files={stp.attachments} empty="No attachments have been added to this procedure." />
  </article>;
}

/** The STP's controlled document: the editor, the next review step, who holds the lock, and every version. */
export function StpDocumentPage({ stp, document, ownerType, require, crumbs, detailPath }: {
  stp: Stp; document: StpDocument | null; ownerType: StpOwnerType; require: PermissionRequirement; crumbs: readonly PageCrumb[]; detailPath: string;
}) {
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`${stp.number} document`} crumbs={crumbs} actions={document ? <StpDocumentActions document={document} ownerType={ownerType} ownerId={stp.id} require={require} /> : undefined} />
    {document ? <>
      <div className="flex flex-wrap items-center gap-3 text-sm">{statusBadge(document)}{lockNote(document)}</div>
      {/* A new editor session for each state, so the editor opens in the mode the status allows. */}
      <DocumentEditor key={`${String(document.status)}:${document.currentDraftVersionId ?? ""}:${document.effectiveVersionId ?? ""}`} documentId={document.id} />
      <section aria-label="Versions" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Document versions</h2><StpVersionHistory document={document} /></section>
    </> : <div className="space-y-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground"><p>This STP has no controlled document yet. Edit the STP to attach its first .docx version.</p>
      <Button asChild size="sm" variant="outline"><Link to={detailPath}>Back to the STP</Link></Button></div>}
  </article>;
}
