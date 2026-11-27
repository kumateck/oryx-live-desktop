import { useMemo, useState, type ReactNode } from "react";
import { FileDown, GitBranchPlus, Pencil, Printer, Send, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { TableMenu, type ActionItem } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import type { PageCrumb } from "@/shared/navigation/page-breadcrumbs";
import { PageHeader } from "@/shared/navigation/page-header";
import { ReviewPanel } from "@/shared/reviews/review-panel";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { StpContentView } from "./stp-content-view";
import { detailSchema, RevisionStatus, ReviewStatus, stageLabel, stageVariant, type RevisionDetail, type Signatory } from "./stp-content";
import { stpKindLabel, stpRevisionAudit, stpRevisionKeys, stpRevisionModelType, type StpKind, type StpRevisionRoutes, type StpRoutesFor } from "./stp-keys";
import { useStpRevisionQuery } from "./stp-revision-api";
import { DeleteStpRevisionDialog, ReviseStpDialog, SubmitStpDialog } from "./stp-revision-dialogs";
import { StpRevisionPrint } from "./stp-revision-print";
import { useRevisionFile } from "./use-revision-file";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm">{children}</dd></div>;
}
function Signed({ label, person }: { label: string; person: Signatory | null }) {
  return <Fact label={label}>{person ? <>{person.name}{person.designation ? <span className="block text-xs text-muted-foreground">{person.designation}</span> : null}
    <span className="block text-xs text-muted-foreground">{formatDate(person.signedAt) ?? ""}</span></> : "–"}</Fact>;
}

type Dialog = "submit" | "revise" | "delete" | "print" | null;
const inReview = (revision: RevisionDetail) => revision.status === RevisionStatus.Pending
  && (revision.reviewStatus === ReviewStatus.AwaitingReview || revision.reviewStatus === ReviewStatus.Returned);

function actionsFor(revision: RevisionDetail, routes: StpRevisionRoutes, open: (dialog: Dialog) => void, go: (path: string) => void, download: () => void): ActionItem[] {
  const keys = stpRevisionKeys(revision.kind);
  const items: ActionItem[] = [
    { id: "docx", label: "Download Word file", icon: FileDown, require: keys.export, onSelect: download },
    { id: "print", label: "Print", icon: Printer, require: keys.print, onSelect: () => open("print") },
  ];
  if (revision.status === RevisionStatus.Draft) {
    items.push({ id: "edit-draft", label: "Edit draft", icon: Pencil, require: keys.editDraft, onSelect: () => go(routes.draft(revision.id)) });
    items.push({ id: "submit", label: "Submit for review", icon: Send, require: keys.submit, onSelect: () => open("submit") });
  }
  if (inReview(revision)) items.push({ id: "correct", label: "Correct revision", icon: Pencil, require: keys.edit, onSelect: () => go(routes.correct(revision.id)) });
  if (revision.status === RevisionStatus.Approved) items.push({ id: "revise", label: "New revision", icon: GitBranchPlus, require: keys.revise, onSelect: () => open("revise") });
  items.push({ id: "delete", label: "Delete revision", icon: Trash2, destructive: true, separated: true, require: keys.delete, onSelect: () => open("delete") });
  return items;
}

/** One revision: its running header, content, review ("Checked by") and signatures. `kinds` are the kinds this module shows. */
export function StpRevisionDetailPage({ kinds, routes, crumbs }: { kinds: readonly StpKind[]; routes: StpRoutesFor; crumbs: readonly PageCrumb[] }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const query = useStpRevisionQuery({ ...stpRevisionAudit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const parsed = useMemo(() => query.data ? detailSchema.safeParse(query.data) : null, [query.data]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const revision = parsed?.success && kinds.includes(parsed.data.kind) ? parsed.data : null;
  const file = useRevisionFile(revision);
  if (query.isLoading) return <DetailPageSkeleton label="Loading STP revision" />;
  if (query.error || !revision) return <article className="space-y-4"><PageHeader title="STP revision" crumbs={crumbs} />
    <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The server returned a revision the app could not read."}</p></article>;
  const keys = stpRevisionKeys(revision.kind);
  const to = routes(revision.kind);
  const title = `${revision.stpNumber} · revision ${String(revision.revisionNumber)}`;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={[...crumbs, { label: revision.stpNumber, to: to.list(revision.stpNumber) }, { label: `Revision ${String(revision.revisionNumber)}` }]}
      actions={<TableMenu label={`Actions for ${title}`} items={actionsFor(revision, to, setDialog, (path) => void navigate(path), () => void file.save())} />} />
    <section aria-label="Running header" className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2"><Badge variant={stageVariant(revision.status)}>{stageLabel(revision.status, revision.reviewStatus)}</Badge>
        <span className="text-sm text-muted-foreground">{stpKindLabel[revision.kind]} STP</span></div>
      <p className="font-medium">{revision.title ?? "Untitled"}</p>
      <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Fact label="STP No.">{revision.stpNumber}</Fact><Fact label="Revision No.">{revision.revisionNumber}</Fact>
        <Fact label="Supersedes">{revision.supersedesRevision ?? "–"}</Fact><Fact label="Area">{revision.area ?? "–"}</Fact>
        <Fact label="Reference">{revision.reference ?? "–"}</Fact><Fact label="Effective date">{formatDate(revision.effectiveDate) ?? "–"}</Fact>
        <Fact label="Review date">{formatDate(revision.reviewDate) ?? "–"}</Fact><Fact label="Issue date">{formatDate(revision.issueDate) ?? "–"}</Fact>
        <Fact label="Source">{revision.source ?? "–"}</Fact>
        <Signed label="Prepared by" person={revision.preparedBySignatory} /><Signed label="Checked by" person={revision.checkedBy} /><Signed label="Approved by" person={revision.approvedBy} />
      </dl>
      {revision.reasonForChange ? <p className="text-sm"><span className="text-muted-foreground">Reason for change: </span>{revision.reasonForChange}</p> : null}
      {revision.approvedFileSha256 ? <p className="break-all text-xs text-muted-foreground">Approved Word file SHA-256: {revision.approvedFileSha256}</p> : null}
      {revision.status === RevisionStatus.Superseded ? <p className="text-sm text-muted-foreground">Superseded {formatDate(revision.supersededAt) ?? ""}.</p> : null}
    </section>
    <StpContentView revision={revision} />
    {revision.status !== RevisionStatus.Draft ? <ReviewPanel record={{ modelType: stpRevisionModelType, modelId: revision.id }} label="STP revision"
      keys={{ confirm: keys.review, return: keys.return, resubmit: keys.edit }} onChanged={() => void query.refetch()} /> : null}
    {dialog === "submit" ? <SubmitStpDialog revision={revision} version={revision.version} onClose={() => setDialog(null)} /> : null}
    {dialog === "revise" ? <ReviseStpDialog current={revision} routes={to} onClose={() => setDialog(null)} /> : null}
    {dialog === "print" ? <StpRevisionPrint id={revision.id} onClose={() => setDialog(null)} /> : null}
    {dialog === "delete" ? <DeleteStpRevisionDialog revision={revision} onClose={() => setDialog(null)} onDeleted={() => void navigate(to.list(revision.stpNumber))} /> : null}
  </article>;
}
