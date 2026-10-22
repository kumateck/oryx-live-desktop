import { ReviewStatus, type Goal, type Review } from "@/shared/performance/contracts";
export function reviewDecisionProblem(original: Review, fresh: Review, goals: Goal[]): string | null {
  if (JSON.stringify(original) !== JSON.stringify(fresh)) return "This review changed. Close the dialog and review the current assessment.";
  if (fresh.status !== ReviewStatus.PendingApproval || fresh.approved) return "This review is not awaiting approval.";
  if (!fresh.selfAssessmentSubmittedAt || !fresh.managerSubmittedAt || fresh.overallRating === null || fresh.overallRating === undefined)
    return "Both assessments and an explicit overall rating must be submitted before approval.";
  if (!fresh.reviewerId || fresh.reviewerId === fresh.employeeId) return "The review must identify a different employee as its reviewer.";
  return reviewGoalsProblem(fresh, goals);
}
export function reviewGoalsProblem(review: Review, goals: Goal[]): string | null {
  if (!goals.length || goals.some((g) => g.employeeId !== review.employeeId || g.cycleId !== review.cycleId))
    return "The review goals are missing or belong to another employee or cycle.";
  if (goals.some((g) => g.weight < 1 || g.weight > 100) || goals.reduce((sum, g) => sum + g.weight, 0) !== 100)
    return "Reconcile the employee's goal weights to 100% before completing the review.";
  const ids = new Set(goals.map((g) => g.id));
  const ratings = review.goalRatings;
  if (
    new Set(ratings.map((r) => r.goalId)).size !== ratings.length ||
    ratings.length !== goals.length ||
    ratings.some((r) => !ids.has(r.goalId) || !Number.isInteger(r.achievementPercentage) || r.achievementPercentage < 0 || r.achievementPercentage > 100)
  )
    return "Every current goal needs one valid achievement rating from 0% to 100%. Reconcile the complete assessment before approval.";
  return null;
}
