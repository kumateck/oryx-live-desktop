import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { hrApi } from "@/shared/api/generated/hr";
import { useAccess } from "@/shared/auth/use-access";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { performanceApi } from "@/shared/performance/api";
import { performanceAudit, ratingLabels, reviewStatuses, ReviewStatus } from "@/shared/performance/contracts";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { AssessmentForm } from "./assessment-form";

function Review({ id }: { id: string }) {
  const { has } = useAccess();
  const me = hrApi.useGetApiV1EmployeeMeQuery(performanceAudit);
  const query = performanceApi.usePerformanceReviewQuery(id, { refetchOnMountOrArgChange: true });
  const row = query.currentData;
  const goals = performanceApi.usePerformanceGoalsQuery(row ? { employeeId: row.employeeId, cycleId: row.cycleId, page: 1, pageSize: 100 } : { page: 1, pageSize: 1 }, { skip: !row });
  const crumbs = [{ label: "Goals", to: "/hr/goals" }, { label: "Performance review" }];
  if (query.isLoading || me.isLoading) return <DetailPageSkeleton label="Loading performance review" groups={3} />;
  if (query.error || row?.id !== id || !me.data?.id)
    return <section role="alert" className="space-y-3"><PageHeader title="Performance review" crumbs={crumbs} />
      <p>{query.error ? apiErrorMessage(query.error) : me.error ? apiErrorMessage(me.error) : "The server did not return this review."}</p>
      <Button variant="outline" onClick={() => { void query.refetch(); void me.refetch(); }}>Retry</Button></section>;
  const self = me.data.id;
  const part = row.employeeId === self && row.status === ReviewStatus.SelfAssessment && has("CanSubmitSelfAssessment") ? "self"
    : row.reviewerId === self && row.status === ReviewStatus.ManagerReview && has("CanSubmitManagerReview") ? "manager" : null;
  const goalRows = (goals.currentData?.data ?? []).filter((g) => g.employeeId === row.employeeId && g.cycleId === row.cycleId);
  return <article className="space-y-5">
    <PageHeader title={row.employeeId === self ? "Your performance review" : `${row.employeeName ?? "Employee"} · Performance review`} crumbs={crumbs} />
    <KeyFacts>
      <KeyFact label="Cycle" value={row.cycleName ?? row.cycleId} />
      <KeyFact label="Status" value={reviewStatuses[row.status]} />
      <KeyFact label="Reviewer" value={row.reviewerName ?? "Not assigned"} />
      <KeyFact label="Overall rating" value={row.overallRating === null || row.overallRating === undefined ? "Not rated" : ratingLabels[row.overallRating]} />
    </KeyFacts>
    <section className="space-y-1"><h2 className="font-semibold">Self-assessment</h2>
      <p className="text-sm text-muted-foreground">{row.selfAssessmentSubmittedAt ? `Submitted ${formatDateTime(row.selfAssessmentSubmittedAt)}` : "Not submitted"}</p>
      {row.selfAssessmentComments ? <p className="whitespace-pre-wrap break-words text-sm">{row.selfAssessmentComments}</p> : null}</section>
    <section className="space-y-1"><h2 className="font-semibold">Manager assessment</h2>
      <p className="text-sm text-muted-foreground">{row.managerSubmittedAt ? `Submitted ${formatDateTime(row.managerSubmittedAt)}` : "Not submitted"}</p>
      {row.managerComments ? <p className="whitespace-pre-wrap break-words text-sm">{row.managerComments}</p> : null}</section>
    {part ? goals.isLoading ? <p role="status" className="text-sm text-muted-foreground">Loading the goals to rate…</p>
      : goals.error ? <p role="alert" className="text-sm">{apiErrorMessage(goals.error)} <Button size="sm" variant="outline" onClick={() => void goals.refetch()}>Retry goals</Button></p>
      : <AssessmentForm key={`${row.id}-${String(row.status)}`} review={row} goals={goalRows} part={part} />
      : row.status === ReviewStatus.SelfAssessment || row.status === ReviewStatus.ManagerReview
        ? <p className="text-sm text-muted-foreground">{row.status === ReviewStatus.SelfAssessment ? "Waiting for the employee's self-assessment." : "Waiting for the reviewer's assessment."}</p> : null}
  </article>;
}

/** A review the signed-in employee takes part in, with their assessment form when it is their turn. */
export function MyReviewPage() {
  const { id } = useParams();
  return id ? <Review key={id} id={id} /> : <p role="alert">Review ID is missing.</p>;
}
