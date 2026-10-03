import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1ApprovalMyPendingByModelTypeAndModelIdQuery } from "../api/approval-api";
import { approvalListPath, approvalPermissions, approvalsPath, audit, decidedElsewhere, documentLabel, isReadable, type Decision } from "../lib/approval-documents";
import { approvalSchema } from "../schemas/approval-schema";
import { ActivityTimeline } from "./activity-timeline";
import { ApprovalContent } from "./approval-content";
import { DecisionDialog } from "./decision-dialog";

function Detail({ type, id }: { type: string; id: string }) {
  const navigate = useNavigate();
  const { has } = useAccess();
  const query = useGetApiV1ApprovalMyPendingByModelTypeAndModelIdQuery({ ...audit, modelType: type, modelId: id });
  const approval = useMemo(() => { const parsed = approvalSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const label = documentLabel(type);
  const back = approvalListPath(type);
  if (query.isLoading) return <DetailPageSkeleton label="Loading request" groups={3} />;
  // The server only returns a request that is waiting for this user, so a decided one, or someone else's, ends here.
  if (!approval) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Not waiting for you</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "This request is not waiting for your decision. It may already have been decided."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={approvalsPath}>My pending approvals</Link></Button></div></div>;
  const place = decidedElsewhere(type);
  // A document is decided here only when it can be read here first.
  const block = place ? `This is decided in ${place}.` : isReadable(type) ? null : `The desktop app cannot show a ${label.toLowerCase()} yet, so it cannot be decided here. Review and decide it in the web app.`;
  const rejected = approval.logs.at(-1)?.status === 2 ? approval.logs.at(-1) : null;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`${label}${approval.code ? ` · ${approval.code}` : ""}`} crumbs={[{ label: "My pending approvals", to: approvalsPath }, { label, to: back }, { label: approval.code ?? "Request" }]}
      actions={<>{has(approvalPermissions.reject) ? <Button type="button" variant="outline" className="text-destructive" disabled={block !== null} onClick={() => setDecision("reject")}><X />Reject</Button> : null}
        {has(approvalPermissions.approve) ? <Button type="button" disabled={block !== null} onClick={() => setDecision("approve")}><Check />Approve</Button> : null}</>} />
    {block ? <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
    {rejected ? <p role="status" className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">This request was rejected earlier by {rejected.by ?? "an approver"} and has been sent again. Their reason is in the history below.</p> : null}
    <KeyFacts>
      <KeyFact label="Request" value={label} note={approval.code ?? undefined} />
      <KeyFact label="Requested by" value={approval.requestedBy ?? "Not recorded"} note={approval.department ?? undefined} />
      <KeyFact label="Requested on" value={formatDateTime(approval.createdAt) ?? "–"} />
      <KeyFact label="Earlier decisions" value={approval.logs.length === 0 ? "None" : String(approval.logs.length)} note={approval.logs.length === 0 ? "You are the first approver" : undefined} />
    </KeyFacts>
    <section aria-label={`${label} details`} className="space-y-3"><h2 className="text-sm font-semibold">{label} details</h2><ApprovalContent type={type} id={id} supplierId={approval.supplierId} /></section>
    <section className="space-y-3"><h2 className="text-sm font-semibold">Approval history</h2><ActivityTimeline logs={approval.logs} /></section>
    {decision ? <DecisionDialog approval={approval} decision={decision} onClose={() => setDecision(null)} onDone={() => { setDecision(null); void navigate(back); }} /> : null}
  </article>;
}

/** One request waiting for the user: what it is, the document itself, what earlier approvers said, and the decision. */
export function ApprovalDetailPage() {
  const { type, id } = useParams();
  return type && id ? <Detail key={`${type}/${id}`} type={type} id={id} /> : null;
}
