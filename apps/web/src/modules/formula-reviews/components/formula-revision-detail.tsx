import { skipToken } from "@reduxjs/toolkit/query";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { governanceApi, type FormulaRevision } from "@/shared/formula/governance-api";
import { FormulaChecks } from "@/shared/formula/review/formula-checks";
import { FormulaDefinitionView } from "@/shared/formula/review/formula-definition-view";
import { useRevisionEvidence, type RevisionEvidence } from "@/shared/formula/review/revision-evidence";
import { FormulaRevisionDecision } from "@/shared/formula/review/revision-decision";
import { actorText, revisionStandingText, selectRevision, type RevisionStage } from "@/shared/formula/review/revision-review";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { formulaRevisionAudit, revisionDetailPath, stageConfig } from "../lib/formula-revisions";

function Fact({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={mono ? "break-all font-mono text-xs" : "text-sm"}>{children}</dd></div>;
}

function Integrity({ evidence }: { evidence: RevisionEvidence | null }) {
  if (!evidence || evidence.state === "checking") return <p className="text-sm text-muted-foreground">Checking the definition against its hash…</p>;
  if (evidence.state === "unreadable") return <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{evidence.problem} The formula cannot be checked in the app.</p>;
  return evidence.hashMatches
    ? <p className="text-sm text-muted-foreground">The definition shown reproduces the hash it was submitted under.</p>
    : <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">The definition shown does not reproduce the hash it was submitted under (computed {evidence.computedHash.slice(0, 12)}…). Do not decide until this is explained.</p>;
}

function History({ revision, userId }: { revision: FormulaRevision; userId: string | null }) {
  return <section aria-label="Revision history" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">History</h2>
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Fact label="Written by">{actorText(revision.createdById, userId)}</Fact>
      <Fact label="Reviewed">{revision.reviewedById ? `${actorText(revision.reviewedById, userId)} · ${formatDateTime(revision.reviewedAt) ?? "date not recorded"}` : "Not yet"}</Fact>
      <Fact label="Approved">{revision.approvedById ? `${actorText(revision.approvedById, userId)} · ${formatDateTime(revision.approvedAt) ?? "date not recorded"}` : "Not yet"}</Fact>
      <Fact label="In use from">{formatDateTime(revision.effectiveAt) ?? "Not in use"}</Fact>
    </dl></section>;
}

/** One formula revision as a reviewer or approver sees it: the exact definition, its checks and history, and the decision for this stage. */
export function FormulaRevisionDetailPage({ stage }: { stage: RevisionStage }) {
  const navigate = useNavigate();
  const config = stageConfig[stage];
  const { questionId = "" } = useParams();
  const [params] = useSearchParams();
  const revisionId = params.get("revisionId");
  const userId = useCurrentUser()?.id ?? null;
  const args = questionId ? { ...formulaRevisionAudit, questionId } : skipToken;
  const options = { refetchOnMountOrArgChange: true } as const;
  const reviewRevisions = governanceApi.useGetFormulaReviewRevisionsQuery(stage === "review" ? args : skipToken, options);
  const approvalRevisions = governanceApi.useGetFormulaApprovalRevisionsQuery(stage === "approval" ? args : skipToken, options);
  const reviewQueue = governanceApi.useGetFormulaReviewQueueQuery(stage === "review" ? formulaRevisionAudit : skipToken);
  const approvalQueue = governanceApi.useGetFormulaApprovalQueueQuery(stage === "approval" ? formulaRevisionAudit : skipToken);
  const [rereadReview] = governanceApi.useLazyGetFormulaReviewRevisionsQuery();
  const [rereadApproval] = governanceApi.useLazyGetFormulaApprovalRevisionsQuery();
  const query = stage === "review" ? reviewRevisions : approvalRevisions;
  const queue = (stage === "review" ? reviewQueue : approvalQueue).data ?? [];
  const revisions = query.data ?? [];
  const { revision, missing } = selectRevision(revisions, revisionId, stage);
  const evidence = useRevisionEvidence(revision);
  const queued = queue.find((item) => item.questionId === questionId);
  const title = queued ? queued.questionLabel : revision ? `Formula revision ${String(revision.revision)}` : config.detailTitle;
  const crumbs = [{ label: config.title, to: config.path }, { label: revision ? `Revision ${String(revision.revision)}` : config.detailTitle }];
  if (query.isLoading) return <DetailPageSkeleton label={`Loading ${config.detailTitle.toLowerCase()}`} />;
  if (query.error || !revision) return <article className="min-w-0 space-y-4"><PageHeader title={config.detailTitle} crumbs={crumbs} />
    <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h2 className="text-lg font-semibold">Revision unavailable</h2>
      <p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : missing ? "This revision is no longer available. It may have been replaced by a newer revision." : "This question has no governed formula revision."}</p>
      <div className="flex justify-center gap-2">{query.error ? <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button> : null}
        <Button size="sm" asChild><Link to={config.path}>{config.title}</Link></Button></div></div></article>;
  const reread = async () => {
    const result = await (stage === "review" ? rereadReview : rereadApproval)({ ...formulaRevisionAudit, questionId }, false);
    return result.error ? apiErrorMessage(result.error) : result.data?.find((item) => item.id === revision.id) ?? null;
  };
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={crumbs} />
    {queued?.questionReference ? <p className="-mt-2 text-sm text-muted-foreground">Ref: {queued.questionReference}</p> : null}
    <section aria-label="Revision" className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm">{revisionStandingText(revision)}</p><Badge variant="outline">{revision.statusName || "Unknown status"}</Badge></div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Revision">{revision.revision}</Fact><Fact label="Numeric policy">{revision.numericPolicyVersion || "–"}</Fact>
        <Fact label="Formula language">{revision.formulaLanguageVersion || "–"}</Fact><Fact label="Presentation">{revision.presentationPreset || "–"}</Fact>
      </dl>
      <dl><Fact label="Definition hash" mono>{revision.definitionHash}</Fact></dl>
      <Integrity evidence={evidence} />
    </section>
    <section className="space-y-3 rounded-lg border bg-card p-4"><FormulaDefinitionView definition={revision.definition} /></section>
    <div className="space-y-2"><FormulaChecks cases={revision.testCases} outcomes={evidence?.state === "checked" ? evidence.outcomes : undefined} authority="provisional" />
      <p className="text-xs text-muted-foreground">These results come from running the saved checks in this app. The author's server validation is the record.</p></div>
    <History revision={revision} userId={userId} />
    <section aria-label={stage === "review" ? "Review decision" : "Approval decision"} className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">{stage === "review" ? "Your review" : "Your approval"}</h2>
      <FormulaRevisionDecision revision={revision} stage={stage} audit={formulaRevisionAudit} reread={reread} onDecided={() => void navigate(config.path)} />
    </section>
    {revisions.length > 1 ? <section aria-label="Other revisions" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">Other revisions of this formula</h2>
      <ul className="divide-y text-sm">{revisions.filter((item) => item.id !== revision.id).map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
        <Link className="font-medium underline-offset-4 hover:underline" to={revisionDetailPath(stage, questionId, item.id)}>Revision {item.revision}</Link>
        <span className="text-muted-foreground">{item.statusName || revisionStandingText(item)}</span></li>)}</ul></section> : null}
  </article>;
}
