import { z } from "zod";
import { api } from "@/shared/api/base-api";
import {
  cyclesSchema,
  cycleSchema,
  goalsSchema,
  goalSchema,
  reviewSchema,
  reviewsSchema,
  performanceHeaders as headers,
  type Cycle,
  type Goal,
  type Review,
  type CreateCycle,
  type CreateGoal,
  type UpdateGoal,
  type CreateReview,
  type ManagerAssessment,
  type PerformanceFilter,
  type SelfAssessment,
  CycleStatus,
} from "./contracts";
const tag = "HrPerformance" as const;
const list = [{ type: tag, id: "LIST" }];
const path = (kind: string, id: string) => `/api/v1/performance/${kind}/${encodeURIComponent(id)}`;
const invalid = () => ({ status: "CUSTOM_ERROR" as const, error: "The performance response could not be verified. Refresh before continuing." });
export const performanceApi = api.enhanceEndpoints({ addTagTypes: [tag] }).injectEndpoints({
  endpoints: (build) => ({
    performanceCycles: build.query<Cycle[], void>({
      query: () => ({ url: "/api/v1/performance/cycles", headers }),
      rawResponseSchema: cyclesSchema,
      catchSchemaFailure: invalid,
      providesTags: list,
    }),
    performanceCycle: build.query<Cycle, string>({
      query: (id) => ({ url: path("cycles", id), headers }),
      rawResponseSchema: cycleSchema,
      catchSchemaFailure: invalid,
      providesTags: list,
    }),
    createPerformanceCycle: build.mutation<string, CreateCycle>({
      query: (body) => ({ url: "/api/v1/performance/cycles", method: "POST", body, headers }),
      rawResponseSchema: z.uuid(),
      invalidatesTags: (_r, error) => (error ? [] : list),
    }),
    changePerformanceCycle: build.mutation<void, { id: string; status: CycleStatus }>({
      query: ({ id, status }) => ({ url: `${path("cycles", id)}/status`, method: "PUT", body: { status }, headers }),
      invalidatesTags: (_r, error) => (error ? [] : list),
    }),
    performanceGoals: build.query<z.infer<typeof goalsSchema>, PerformanceFilter>({
      query: (params) => ({ url: "/api/v1/performance/goals", params, headers }),
      rawResponseSchema: goalsSchema,
      catchSchemaFailure: invalid,
      providesTags: list,
    }),
    performanceGoal: build.query<Goal, string>({
      query: (id) => ({ url: path("goals", id), headers }),
      rawResponseSchema: goalSchema,
      catchSchemaFailure: invalid,
      providesTags: list,
    }),
    createPerformanceGoal: build.mutation<string, CreateGoal>({
      query: (body) => ({ url: "/api/v1/performance/goals", method: "POST", body, headers }),
      rawResponseSchema: z.uuid(),
      invalidatesTags: (_r, error) => (error ? [] : list),
    }),
    updatePerformanceGoal: build.mutation<void, { id: string; body: UpdateGoal }>({
      query: ({ id, body }) => ({ url: path("goals", id), method: "PUT", body, headers }),
      invalidatesTags: (_r, error) => (error ? [] : list),
    }),
    deletePerformanceGoal: build.mutation<void, string>({
      query: (id) => ({ url: path("goals", id), method: "DELETE", headers }),
      invalidatesTags: (_r, error) => (error ? [] : list),
    }),
    performanceReviews: build.query<z.infer<typeof reviewsSchema>, PerformanceFilter>({
      query: (params) => ({ url: "/api/v1/performance/reviews", params, headers }),
      rawResponseSchema: reviewsSchema,
      catchSchemaFailure: invalid,
      providesTags: list,
    }),
    performanceReview: build.query<Review, string>({
      query: (id) => ({ url: path("reviews", id), headers }),
      rawResponseSchema: reviewSchema,
      catchSchemaFailure: invalid,
      providesTags: list,
    }),
    /** Reviews the signed-in employee is reviewed in or reviews. */
    myPerformanceReviews: build.query<z.infer<typeof reviewsSchema>, { page: number; pageSize: number }>({
      query: (params) => ({ url: "/api/v1/performance/reviews/mine", params, headers }),
      rawResponseSchema: reviewsSchema,
      catchSchemaFailure: invalid,
      providesTags: list,
    }),
    submitSelfAssessment: build.mutation<void, { id: string; body: SelfAssessment }>({
      query: ({ id, body }) => ({ url: `${path("reviews", id)}/self-assessment`, method: "POST", body, headers }),
      invalidatesTags: (_r, error) => (error ? [] : list),
    }),
    submitManagerReview: build.mutation<void, { id: string; body: ManagerAssessment }>({
      query: ({ id, body }) => ({ url: `${path("reviews", id)}/manager-review`, method: "POST", body, headers }),
      invalidatesTags: (_r, error) => (error ? [] : list),
    }),
    createPerformanceReview: build.mutation<string, CreateReview>({
      query: (body) => ({ url: "/api/v1/performance/reviews", method: "POST", body, headers }),
      rawResponseSchema: z.uuid(),
      invalidatesTags: (_r, error) => (error ? [] : list),
    }),
  }),
});
