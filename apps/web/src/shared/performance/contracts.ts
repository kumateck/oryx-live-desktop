import { z } from "zod";
export enum CycleType {
  Annual,
  SemiAnnual,
  Quarterly,
}
export enum CycleStatus {
  Draft,
  Active,
  Closed,
}
export enum GoalStatus {
  NotStarted,
  InProgress,
  Completed,
  Missed,
}
export enum ReviewStatus {
  Draft,
  SelfAssessment,
  ManagerReview,
  PendingApproval,
  Completed,
}
export enum PerformanceRating {
  Unsatisfactory,
  NeedsImprovement,
  MeetsExpectations,
  ExceedsExpectations,
  Outstanding,
}
export const cycleTypes = ["Annual", "Semi-annual", "Quarterly"];
export const cycleStatuses = ["Draft", "Active", "Closed"];
export const goalStatuses = ["Not started", "In progress", "Completed", "Missed"];
export const reviewStatuses = ["Draft", "Self-assessment", "Manager review", "Pending approval", "Completed"];
export const ratingLabels = ["Unsatisfactory", "Needs improvement", "Meets expectations", "Exceeds expectations", "Outstanding"];
const date = z.string().refine((v) => Number.isFinite(Date.parse(v)), "Invalid date returned by the server.");
const text = z.string().nullish();
export const cycleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  periodStart: date,
  periodEnd: date,
  type: z.enum(CycleType),
  status: z.enum(CycleStatus),
  goalCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
});
export const cyclesSchema = z.array(cycleSchema).refine((rows) => new Set(rows.map((r) => r.id)).size === rows.length, "Repeated cycle identity.");
export const goalSchema = z.object({
  id: z.uuid(),
  employeeId: z.uuid(),
  employeeName: text,
  cycleId: z.uuid(),
  cycleName: text,
  title: z.string(),
  description: text,
  weight: z.number().int(),
  targetDate: date,
  status: z.enum(GoalStatus),
  progressPercentage: z.number().int(),
  managerComments: text,
});
export const goalRatingSchema = z.object({ goalId: z.uuid(), goalTitle: text, achievementPercentage: z.number().int(), comments: text });
export const reviewSchema = z.object({
  id: z.uuid(),
  employeeId: z.uuid(),
  employeeName: text,
  cycleId: z.uuid(),
  cycleName: text,
  reviewerId: z.uuid().nullish(),
  reviewerName: text,
  status: z.enum(ReviewStatus),
  selfAssessmentComments: text,
  selfAssessmentSubmittedAt: date.nullish(),
  managerComments: text,
  managerSubmittedAt: date.nullish(),
  overallRating: z.enum(PerformanceRating).nullish(),
  approved: z.boolean(),
  goalRatings: z.array(goalRatingSchema),
});
const meta = { pageIndex: z.number().int().positive(), pageCount: z.number().int().nonnegative(), totalRecordCount: z.number().int().nonnegative() };
export const goalsSchema = z.object({ ...meta, data: z.array(goalSchema) });
export const reviewsSchema = z.object({ ...meta, data: z.array(reviewSchema) });
export type Cycle = z.infer<typeof cycleSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Review = z.infer<typeof reviewSchema>;
export interface CreateCycle {
  name: string;
  type: CycleType;
  periodStart: string;
  periodEnd: string;
}
export interface CreateGoal {
  employeeId: string;
  cycleId: string;
  title: string;
  description: string;
  weight: number;
  targetDate: string;
}
export interface UpdateGoal {
  title: string;
  description: string;
  weight: number;
  targetDate: string;
  status: GoalStatus;
  progressPercentage: number;
  managerComments: string;
}
export interface CreateReview {
  employeeId: string;
  cycleId: string;
  reviewerId: string;
}
export interface GoalRating {
  goalId: string;
  achievementPercentage: number;
  comments: string;
}
export interface SelfAssessment {
  comments: string;
  goalRatings: GoalRating[];
}
export interface ManagerAssessment extends SelfAssessment {
  overallRating: PerformanceRating;
}
export interface PerformanceFilter {
  employeeId?: string;
  cycleId?: string;
  page: number;
  pageSize: number;
}
export const performanceAudit = { module: "HR Management", subModule: "Performance Management" };
export const performanceHeaders = { Module: performanceAudit.module, SubModule: performanceAudit.subModule };
