import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionDialog } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { performanceApi } from "@/shared/performance/api";
import { PerformanceRating, ratingLabels, ReviewStatus, type Goal, type Review } from "@/shared/performance/contracts";

type Part = "self" | "manager";
interface Line { achievement: string; comments: string }
const ratings = [PerformanceRating.Unsatisfactory, PerformanceRating.NeedsImprovement, PerformanceRating.MeetsExpectations, PerformanceRating.ExceedsExpectations, PerformanceRating.Outstanding];
const rule = { self: { kind: "all" as const, permissions: ["CanSubmitSelfAssessment"] }, manager: { kind: "all" as const, permissions: ["CanSubmitManagerReview"] } };
const stage = { self: ReviewStatus.SelfAssessment, manager: ReviewStatus.ManagerReview };

/** What a set of ratings is missing, or null. Achievement is a whole percentage from 0 to 100. */
export function ratingsProblem(goals: readonly Goal[], lines: Record<string, Line>, comments: string, rating: PerformanceRating | null, part: Part): string | null {
  if (!comments.trim()) return part === "self" ? "Describe how the period went in your comments." : "Write the manager's comments.";
  if (part === "manager" && rating === null) return "Choose an overall rating.";
  for (const goal of goals) {
    const value = lines[goal.id]?.achievement.trim() ?? "";
    if (!/^\d{1,3}$/.test(value) || Number(value) > 100) return `Enter a whole achievement percentage from 0 to 100 for “${goal.title}”.`;
  }
  return null;
}

/** The self-assessment or the manager's assessment of a review, sent once after a fresh read. */
export function AssessmentForm({ review, goals, part }: { review: Review; goals: readonly Goal[]; part: Part }) {
  const [read] = performanceApi.useLazyPerformanceReviewQuery();
  const [submitSelf] = performanceApi.useSubmitSelfAssessmentMutation();
  const [submitManager] = performanceApi.useSubmitManagerReviewMutation();
  const earlier = new Map(review.goalRatings.map((r) => [r.goalId, r]));
  const [lines, setLines] = useState<Record<string, Line>>(() => Object.fromEntries(goals.map((g) => {
    const prior = part === "manager" ? earlier.get(g.id) : undefined;
    return [g.id, { achievement: prior ? String(prior.achievementPercentage) : "", comments: "" }];
  })));
  const [comments, setComments] = useState("");
  const [rating, setRating] = useState<PerformanceRating | null>(null);
  const [problem, setProblem] = useState("");
  const [confirming, setConfirming] = useState(false);
  const line = (id: string, change: Partial<Line>) => setLines((all) => ({ ...all, [id]: { achievement: all[id]?.achievement ?? "", comments: all[id]?.comments ?? "", ...change } }));
  const send = async (): Promise<string | null> => {
    const fresh = await read(review.id, false);
    if (fresh.error) return apiErrorMessage(fresh.error);
    if (fresh.data?.status !== stage[part] || fresh.data.employeeId !== review.employeeId || fresh.data.reviewerId !== review.reviewerId)
      return "This review moved on after you opened it. Close this and check it again.";
    const goalRatings = goals.map((g) => ({ goalId: g.id, achievementPercentage: Number(lines[g.id]?.achievement ?? 0), comments: lines[g.id]?.comments.trim() ?? "" }));
    const body = { comments: comments.trim(), goalRatings };
    const result = part === "self" ? await submitSelf({ id: review.id, body }) : await submitManager({ id: review.id, body: { ...body, overallRating: rating ?? PerformanceRating.MeetsExpectations } });
    return "error" in result ? apiErrorMessage(result.error) : null;
  };
  return <section aria-label={part === "self" ? "Your self-assessment" : "Manager assessment"} className="space-y-3 rounded-lg border bg-card p-4">
    <h2 className="font-semibold">{part === "self" ? "Your self-assessment" : `Assess ${review.employeeName ?? "the employee"}`}</h2>
    {goals.length === 0 ? <p className="text-sm text-muted-foreground">No goals are set for this cycle; only comments will be sent.</p> : null}
    {goals.map((g) => <fieldset key={g.id} className="grid gap-2 border-t pt-3 sm:grid-cols-[1fr_8rem]">
      <legend className="sr-only">{g.title}</legend>
      <div><p className="text-sm font-medium">{g.title}</p><p className="text-xs text-muted-foreground">Weight {g.weight}% · progress {g.progressPercentage}%{earlier.get(g.id) && part === "manager" ? ` · self-rated ${String(earlier.get(g.id)?.achievementPercentage)}%` : ""}</p></div>
      <Input aria-label={`Achievement for ${g.title} (%)`} inputMode="numeric" value={lines[g.id]?.achievement ?? ""} onChange={(e) => line(g.id, { achievement: e.target.value })} />
      <Input aria-label={`Comments on ${g.title}`} className="sm:col-span-2" placeholder="Comments (optional)" value={lines[g.id]?.comments ?? ""} onChange={(e) => line(g.id, { comments: e.target.value })} />
    </fieldset>)}
    {part === "manager" ? <div className="max-w-xs space-y-1.5"><Label>Overall rating</Label>
      <Select value={rating === null ? "" : String(rating)} onValueChange={(v) => setRating(ratings.find((r) => String(r) === v) ?? null)}><SelectTrigger aria-label="Overall rating"><SelectValue placeholder="Choose a rating" /></SelectTrigger>
        <SelectContent position="popper">{ratings.map((r) => <SelectItem key={r} value={String(r)}>{ratingLabels[r]}</SelectItem>)}</SelectContent></Select></div> : null}
    <div className="space-y-1.5"><Label htmlFor="assessment-comments">Comments</Label><Textarea id="assessment-comments" rows={4} value={comments} onChange={(e) => setComments(e.target.value)} /></div>
    {problem ? <p role="alert" className="text-sm text-destructive">{problem}</p> : null}
    <Button onClick={() => { const found = ratingsProblem(goals, lines, comments, rating, part); setProblem(found ?? ""); if (!found) setConfirming(true); }}>
      {part === "self" ? "Submit self-assessment" : "Submit manager assessment"}</Button>
    {confirming ? <ConfirmActionDialog destructive={false} require={rule[part]} title={part === "self" ? "Submit your self-assessment?" : "Submit the manager assessment?"}
      description={part === "self" ? "It goes to your reviewer and cannot be changed afterwards." : "The review goes for approval and cannot be changed afterwards."}
      confirmLabel="Submit" busyLabel="Submitting…" onClose={() => setConfirming(false)} onConfirm={send} /> : null}
  </section>;
}
