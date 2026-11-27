import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { PageCrumb } from "@/shared/navigation/page-breadcrumbs";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { StpContentEditor } from "./stp-content-editor";
import { detailSchema, RevisionStatus, ReviewStatus, type RevisionDetail } from "./stp-content";
import { blankContent, contentFromRevision, contentProblem, contentRequest, type DraftContent } from "./stp-draft";
import { stpRevisionAudit, stpRevisionKeys, type StpKind, type StpRoutesFor } from "./stp-keys";
import { useCorrectStpRevisionMutation, useCreateStpRevisionMutation, useSaveStpRevisionDraftMutation, useStpRevisionQuery } from "./stp-revision-api";

export type StpEditorMode = "create" | "draft" | "correct";
const titles: Record<StpEditorMode, string> = { create: "Start STP revision", draft: "Edit draft", correct: "Correct revision" };

/** Why the loaded revision cannot be edited in this mode, or null. */
function wrongState(mode: StpEditorMode, revision: RevisionDetail | null): string | null {
  if (mode === "create") return null;
  if (!revision) return "The revision could not be loaded.";
  if (mode === "draft") return revision.status === RevisionStatus.Draft ? null : "This revision is no longer an editable draft.";
  const open = revision.status === RevisionStatus.Pending
    && (revision.reviewStatus === ReviewStatus.AwaitingReview || revision.reviewStatus === ReviewStatus.Returned);
  return open ? null : "This revision is no longer open for correction.";
}

/**
 * Starts a blank first revision (`create`, kind and `?stp=` from the module), saves a draft, or corrects a revision in
 * review. Draft saves and corrections send the version read, so a concurrent save is refused rather than overwritten.
 */
export function StpRevisionEditorPage({ mode, kind, kinds, routes, crumbs }: {
  mode: StpEditorMode; kind: StpKind | null; kinds: readonly StpKind[]; routes: StpRoutesFor; crumbs: readonly PageCrumb[];
}) {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = useStpRevisionQuery({ ...stpRevisionAudit, id }, { skip: mode === "create" || !id, refetchOnMountOrArgChange: true });
  const parsed = useMemo(() => query.data ? detailSchema.safeParse(query.data) : null, [query.data]);
  const source = parsed?.success && kinds.includes(parsed.data.kind) ? parsed.data : null;
  const effectiveKind = source?.kind ?? kind;
  const stpNumber = source?.stpNumber ?? params.get("stp")?.trim() ?? "";
  const keys = stpRevisionKeys(effectiveKind ?? 0);
  const permission = usePermissionAction(mode === "create" ? keys.create : mode === "draft" ? keys.editDraft : keys.edit);
  const [content, setContent] = useState<DraftContent>(blankContent);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [create] = useCreateStpRevisionMutation();
  const [saveDraft] = useSaveStpRevisionDraftMutation();
  const [correct] = useCorrectStpRevisionMutation();
  useEffect(() => {
    if (!source || loaded === `${source.id}:${String(source.version)}`) return;
    setLoaded(`${source.id}:${String(source.version)}`);
    setContent(contentFromRevision(source));
  }, [source, loaded]);
  const heading = [...crumbs, ...(stpNumber ? [{ label: stpNumber, to: routes(effectiveKind ?? 0).list(stpNumber) }] : []), { label: titles[mode] }];
  if (query.isLoading) return <FormPageSkeleton label="Loading STP revision" />;
  const failure = effectiveKind === null ? "You cannot prepare STP revisions of this kind."
    : mode === "create" && !stpNumber ? "Open this page from an STP number."
    : query.error ? apiErrorMessage(query.error) : wrongState(mode, source);
  if (failure || effectiveKind === null) return <article className="space-y-4"><PageHeader title={titles[mode]} crumbs={heading} />
    <p role="alert" className="text-sm text-destructive">{failure}</p></article>;

  const save = async () => {
    setMessage(null);
    const problem = contentProblem(content, mode === "correct");
    if (problem) return setMessage(problem);
    const denied = permission.check();
    if (denied) return setMessage(denied);
    setSaving(true);
    const body = contentRequest(content);
    const result = mode === "create"
      ? await create({ ...stpRevisionAudit, domainEntitiesStpRevisionsCreateStpRevisionRequest: { ...body, kind: effectiveKind, stpNumber } })
      : mode === "draft"
        ? await saveDraft({ ...stpRevisionAudit, id, domainEntitiesStpRevisionsSaveStpRevisionDraftRequest: { ...body, version: source?.version ?? null } })
        : await correct({ ...stpRevisionAudit, id, domainEntitiesStpRevisionsUpdateStpRevisionRequest: { ...body, version: source?.version ?? null } });
    setSaving(false);
    if ("error" in result) return setMessage(apiErrorMessage(result.error));
    toast.success(mode === "correct" ? "Revision corrected" : "Draft saved");
    void navigate(routes(effectiveKind).detail(typeof result.data === "string" ? result.data : id));
  };
  return <article className="min-w-0 space-y-4">
    <PageHeader title={titles[mode]} crumbs={heading} />
    <StpContentEditor value={content} onChange={setContent} stpNumber={stpNumber} fixedSupersedes={Boolean(source?.revisedFromId)} />
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => void navigate(mode === "create" ? routes(effectiveKind).list(stpNumber) : routes(effectiveKind).detail(id))}>Cancel</Button>
      <Button disabled={saving || !permission.allowed} onClick={() => void save()}>{saving ? "Saving…" : mode === "correct" ? "Save correction" : "Save draft"}</Button>
    </div>
  </article>;
}
