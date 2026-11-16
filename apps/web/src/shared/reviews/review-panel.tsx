import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/shared/skeleton/skeleton";
import type { PermissionRequirement } from "../auth/access";
import { useAccess } from "../auth/use-access";
import { apiErrorMessage } from "../errors/api-error-message";
import { formatDateTime } from "../format/dates";
import { useConfirmDocumentReviewMutation, useReadDocumentReviewQuery, useResubmitDocumentReviewMutation, useReturnDocumentReviewMutation, type ReviewRecord } from "./review-api";
import { ReviewActionDialog } from "./review-action-dialog";
import { reviewActionLabels, reviewStatus, reviewStatusLabels, type DocumentReviewState } from "./review-schema";

/** The keys for this record's review tasks, chosen by the caller from the record's stored kind. */
export interface ReviewKeys { confirm: PermissionRequirement; return: PermissionRequirement; resubmit: PermissionRequirement }
/** A way to correct the record while it is in review, such as its edit dialog. */
export interface ReviewCorrection { label: string; require: PermissionRequirement; dialog: (close: () => void) => ReactNode }

type Acting = "confirm" | "return" | "resubmit" | "correct" | null;
const tone: Record<number, "secondary" | "destructive" | "default"> = { 0: "secondary", 1: "destructive", 2: "default" };

/**
 * The Review panel on a document's page: whether it waits for review, who prepared and checked it, its history,
 * and the review actions the server says the caller may take. Nothing shows for a type with no review step.
 */
export function ReviewPanel({ record, keys, correction, label = "record", onChanged }: {
  record: ReviewRecord; keys: ReviewKeys; correction?: ReviewCorrection | undefined; label?: string;
  /** Called after a review action succeeds, for pages whose own data the action changes. */
  onChanged?: (() => void) | undefined;
}) {
  const query = useReadDocumentReviewQuery(record);
  const [acting, setActing] = useState<Acting>(null);
  if (query.isLoading) return <Skeleton className="h-24 w-full" />;
  if (query.error) return <section aria-label="Review" className="space-y-2 rounded-lg border p-4"><p role="alert" className="text-sm">{apiErrorMessage(query.error)}</p>
    <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Retry</Button></section>;
  const state = query.data;
  // Nothing to show for a type with no review step, or for a record (such as an order checked before reviews existed) with no review and nothing to do.
  if (!state || (!state.review && (!state.reviewRequired || (!state.canConfirm && !state.canReturn)))) return null;
  return <section aria-label="Review" className="space-y-3 rounded-lg border bg-card p-4">
    <ReviewSummary state={state} />
    <ReviewButtons state={state} correction={correction} onAct={setActing} />
    {state.review?.events.length ? <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">History</summary>
      <ol className="mt-2 space-y-1">{state.review.events.map((event, index) => <li key={`${event.at}-${index}`} className="break-words">
        <span className="font-medium">{reviewActionLabels[event.action] ?? "Changed"}</span>
        {event.actor?.name ? ` by ${event.actor.name}` : ""}<span className="text-muted-foreground"> · {formatDateTime(event.at) ?? ""}</span>
        {event.comments ? <span className="block text-muted-foreground">“{event.comments}”</span> : null}</li>)}</ol></details> : null}
    <ReviewDialogs state={state} record={record} keys={keys} correction={correction} acting={acting} label={label} onClose={() => setActing(null)} onChanged={onChanged} />
  </section>;
}

function ReviewSummary({ state }: { state: DocumentReviewState }) {
  const review = state.review;
  return <div className="space-y-1">
    <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">Review</h2>
      {review ? <Badge variant={tone[review.status]}>{reviewStatusLabels[review.status]}</Badge> : <Badge variant="outline">Not sent for review</Badge>}
      {review && review.submission > 1 ? <span className="text-xs text-muted-foreground">Submission {review.submission}</span> : null}</div>
    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
      <div><dt className="text-muted-foreground">Prepared by</dt><dd>{state.signatures.preparedBy?.name ?? "–"}</dd></div>
      <div><dt className="text-muted-foreground">Checked by</dt><dd>{state.signatures.checkedBy?.name ?? "–"}
        {state.signatures.checkedAt ? <span className="block text-xs text-muted-foreground">{formatDateTime(state.signatures.checkedAt)}</span> : null}</dd></div>
      <div><dt className="text-muted-foreground">Approved by</dt><dd>{state.signatures.approvedBy?.name ?? "–"}</dd></div>
    </dl>
    {review?.status === reviewStatus.returned && review.comments ? <p role="note" className="break-words rounded-md bg-destructive/10 p-2 text-sm">
      Returned by {review.reviewedBy?.name ?? "the reviewer"}: “{review.comments}”</p> : null}
  </div>;
}

function ReviewButtons({ state, correction, onAct }: { state: DocumentReviewState; correction?: ReviewCorrection | undefined; onAct: (acting: Acting) => void }) {
  const { allows } = useAccess();
  const open = state.review?.status === reviewStatus.awaitingReview || state.review?.status === reviewStatus.returned;
  const mayCorrect = Boolean(correction && open && allows(correction.require));
  if (!state.canConfirm && !state.canReturn && !state.canResubmit && !mayCorrect) return null;
  return <div className="flex flex-wrap gap-2">
    {state.canConfirm ? <Button size="sm" onClick={() => onAct("confirm")}>Confirm checked</Button> : null}
    {state.canReturn ? <Button size="sm" variant="outline" onClick={() => onAct("return")}>Return for correction</Button> : null}
    {mayCorrect && correction ? <Button size="sm" variant="outline" onClick={() => onAct("correct")}>{correction.label}</Button> : null}
    {state.canResubmit ? <Button size="sm" variant="outline" onClick={() => onAct("resubmit")}>Send back for review</Button> : null}
  </div>;
}

function ReviewDialogs({ state, record, keys, correction, acting, label, onClose, onChanged }: {
  state: DocumentReviewState; record: ReviewRecord; keys: ReviewKeys; correction?: ReviewCorrection | undefined; acting: Acting; label: string; onClose: () => void;
  onChanged?: (() => void) | undefined;
}) {
  const [confirm] = useConfirmDocumentReviewMutation();
  const [send] = useReturnDocumentReviewMutation();
  const [resubmit] = useResubmitDocumentReviewMutation();
  const code = state.code ?? `This ${label}`;
  const version = state.review?.version ?? null;
  const run = (mutate: typeof confirm, done: string) => async (comments: string | null) => {
    const result = await mutate({ ...record, comments, version });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success(done, { description: code });
    onChanged?.();
    return null;
  };
  if (acting === "correct" && correction) return <>{correction.dialog(onClose)}</>;
  if (acting === "confirm") return <ReviewActionDialog title={`Confirm ${code} is checked`} commentRequired={false} require={keys.confirm} onClose={onClose}
    description={`You confirm the ${label} is correct. Your name and signature print as "Checked by", and it goes for approval.`}
    actLabel="Confirm checked" busyLabel="Confirming…" onAct={run(confirm, "Review confirmed")} />;
  if (acting === "return") return <ReviewActionDialog title={`Return ${code} for correction`} commentRequired require={keys.return} onClose={onClose}
    description={`The ${label} goes back to whoever prepared it, with your comment. It does not go for approval until it is sent back and checked.`}
    actLabel="Return" busyLabel="Returning…" onAct={run(send, "Returned for correction")} />;
  if (acting === "resubmit") return <ReviewActionDialog title={`Send ${code} back for review`} commentRequired={false} require={keys.resubmit} onClose={onClose}
    description={`Send the corrected ${label} back to its reviewers.`} actLabel="Send back" busyLabel="Sending…" onAct={run(resubmit, "Sent back for review")} />;
  return null;
}
