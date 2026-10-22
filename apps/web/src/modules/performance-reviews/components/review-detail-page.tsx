import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatDateTime } from "@/shared/format/dates";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { ModelApprovalHistory } from "@/shared/approvals/model-history";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { performanceApi } from "@/shared/performance/api";
import { reviewStatuses, ratingLabels, ReviewStatus, performanceAudit, type Review } from "@/shared/performance/contracts";
import { ReviewActions } from "./review-actions";
const c = dataTableColumns<Review["goalRatings"][number]>();
const columns = c.columns([
  c.accessor((r) => r.goalTitle ?? r.goalId, { id: "goal", header: "Goal" }),
  c.accessor((r) => `${r.achievementPercentage}%`, { id: "achievement", header: "Achievement" }),
  c.accessor((r) => r.comments ?? "No comments", { id: "comments", header: "Comments" }),
]);
function Detail({ id }: { id: string }) {
  const query = performanceApi.usePerformanceReviewQuery(id, { refetchOnMountOrArgChange: true });
  const row = query.currentData;
  if (query.isLoading) return <DetailPageSkeleton label="Loading performance review" groups={4} />;
  if (query.error || row?.id !== id)
    return (
      <section role="alert" className="space-y-3">
        <h1 className="font-semibold">Review unavailable</h1>
        <p>{query.error ? apiErrorMessage(query.error) : "The server did not return this review."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  return (
    <article className="space-y-5">
      <PageHeader
        title={`${row.employeeName ?? "Employee"} · Performance review`}
        crumbs={[{ label: "Performance reviews", to: "/hr/performance-reviews" }, { label: "Review details" }]}
        actions={<ReviewActions row={row} />}
      />
      <KeyFacts>
        <KeyFact label="Cycle" value={row.cycleName ?? row.cycleId} />
        <KeyFact label="Status" value={reviewStatuses[row.status]} />
        <KeyFact label="Reviewer" value={row.reviewerName ?? "Not assigned"} />
        <KeyFact label="Overall rating" value={row.overallRating === null || row.overallRating === undefined ? "Not rated" : ratingLabels[row.overallRating]} />
        <KeyFact label="Approved" value={row.approved ? "Yes" : "No"} />
      </KeyFacts>
      <section className="space-y-2">
        <h2 className="font-semibold">Self-assessment</h2>
        <p className="text-muted-foreground">Submitted: {row.selfAssessmentSubmittedAt ? formatDateTime(row.selfAssessmentSubmittedAt) : "Not submitted"}</p>
        <p className="whitespace-pre-wrap break-words">{row.selfAssessmentComments || "No comments"}</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Manager assessment</h2>
        <p className="text-muted-foreground">Submitted: {row.managerSubmittedAt ? formatDateTime(row.managerSubmittedAt) : "Not submitted"}</p>
        <p className="whitespace-pre-wrap break-words">{row.managerComments || "No comments"}</p>
      </section>
      <ClientDataTable
        label="Submitted goal ratings"
        rows={row.goalRatings}
        columns={columns}
        getRowId={(r) => r.goalId}
        initialPageSize={30}
        emptyTitle="No submitted goal ratings"
        emptyDescription="Goal ratings appear after an assessment is submitted."
      />
      {row.status === ReviewStatus.SelfAssessment || row.status === ReviewStatus.ManagerReview ? (
        <p className="text-sm">
          The employee and the assigned reviewer submit their assessments from{" "}
          <Link className="underline underline-offset-4" to={`/hr/goals/reviews/${encodeURIComponent(id)}`}>their own view of this review</Link>.
        </p>
      ) : null}
      <ModelApprovalHistory id={id} model="PerformanceReview" audit={performanceAudit} />
    </article>
  );
}
export function ReviewDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : <p role="alert">Review ID is missing.</p>;
}
