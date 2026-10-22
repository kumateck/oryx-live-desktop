import { expect,it } from "vitest";
import { goal,review } from "@/shared/performance/test-fixtures";
import { reviewDecisionProblem,reviewGoalsProblem } from "./lib/rules";
import { reviewSchema,cyclesSchema } from "@/shared/performance/contracts";
import { cycle } from "@/shared/performance/test-fixtures";
it("preserves explicit zero rating and zero achievement",() => {
 expect(reviewSchema.parse(review).overallRating).toBe(0);
 expect(reviewDecisionProblem(review,review,[goal])).toBeNull();
});
it("refuses incomplete, foreign and duplicate goal ratings",() => {
 expect(reviewGoalsProblem({ ...review,goalRatings:[] },[goal])).toMatch(/Every/);
 expect(reviewGoalsProblem(review,[{ ...goal,employeeId:cycle.id }])).toMatch(/another employee/);
 expect(reviewGoalsProblem({ ...review,goalRatings:[...review.goalRatings,...review.goalRatings] },[goal])).toMatch(/Every/);
 expect(reviewGoalsProblem(review,[{ ...goal,weight:99 }])).toMatch(/100%/);
});
it("refuses stale, already approved, missing assessments and self reviews",() => {
 expect(reviewDecisionProblem(review,{ ...review,managerComments:"Changed" },[goal])).toMatch(/changed/);
 const noAssessment={ ...review,selfAssessmentSubmittedAt:null };
 expect(reviewDecisionProblem(noAssessment,noAssessment,[goal])).toMatch(/Both assessments/);
 const self={ ...review,reviewerId:review.employeeId };expect(reviewDecisionProblem(self,self,[goal])).toMatch(/different/);
 const approved={ ...review,approved:true };expect(reviewDecisionProblem(approved,approved,[goal])).toMatch(/not awaiting/);
});
it("rejects malformed enum values and repeated cycle IDs",() => {
 expect(reviewSchema.safeParse({ ...review,overallRating:8 }).success).toBe(false);
 expect(cyclesSchema.safeParse([cycle,cycle]).success).toBe(false);
});
