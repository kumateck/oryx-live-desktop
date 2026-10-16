import { z } from "zod";
import { api } from "@/shared/api/base-api";
import type { DomainEntitiesFormsRequestCreateQuestionRequest } from "@/shared/api/generated/forms";
import type { FormulaRevisionDraft } from "./builder/definition-adapter";
import { FormulaEvaluationStatus } from "./core/evaluation-contracts";
import { FORMULA_TEST_CASES_V1, FormulaTestCategory } from "./core/test-contracts";

// Governed formula revisions. The server publishes these operations without typed responses
// (docs/api-untyped-operations.md), so they are declared here and every response is validated.

export const FormulaRevisionStatus = { Draft: 0, InReview: 1, Approved: 2, Retired: 3 } as const;
export type FormulaRevisionStatus = (typeof FormulaRevisionStatus)[keyof typeof FormulaRevisionStatus];
/** The server finished every calculation check; it does not mean they all passed. */
export const formulaServiceCompleted = 5;

const status = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
const evaluationStatus = z.enum(FormulaEvaluationStatus);
const category = z.enum(FormulaTestCategory);
const text = z.string().nullish().transform((value) => value ?? null);
const testCase = z.object({ schemaVersion: z.literal(FORMULA_TEST_CASES_V1).catch(FORMULA_TEST_CASES_V1), id: z.string(), name: z.string(), category,
  resolvedInputs: z.record(z.string(), z.string().nullable()), expectedStatus: evaluationStatus, expectedResults: z.record(z.string(), z.string()) });
const evaluationError = z.object({ status: evaluationStatus, path: z.string().catch(""), message: z.string().catch(""), variableKey: z.string().optional() });
const testOutcome = z.object({ id: z.string(), name: z.string(), category, resolvedInputs: z.record(z.string(), z.string().nullable()), passed: z.boolean(),
  expectedStatus: evaluationStatus, actualStatus: evaluationStatus, expectedResults: z.record(z.string(), z.string()), actualResults: z.record(z.string(), z.string()), errors: z.array(evaluationError).catch([]) });

export const formulaRevisionSchema = z.object({
  id: z.string(), formulaDefinitionId: z.string().catch(""), questionId: z.string().catch(""), revision: z.number(), definitionHash: z.string(),
  formulaLanguageVersion: z.string().catch(""), numericPolicyVersion: z.string().catch(""), presentationPreset: z.string().catch(""),
  authoringPayload: text, status, statusName: z.string().catch(""), testCases: z.array(testCase).catch([]),
  createdById: text, reviewedById: text, reviewedAt: text, approvedById: text, approvedAt: text, effectiveAt: text,
});
export type FormulaRevision = z.infer<typeof formulaRevisionSchema>;
const issue = z.object({ path: z.string().catch(""), message: z.string().catch("") });
export const formulaValidationSchema = z.object({ status: z.number(), statusName: z.string().catch(""), definitionIssues: z.array(issue).catch([]), requestIssues: z.array(issue).catch([]),
  evaluatorVersion: z.string().catch(""), engineBuildHash: z.string().catch(""), testOutcomes: z.array(testOutcome).catch([]) });
export type FormulaValidation = z.infer<typeof formulaValidationSchema>;
export const governedQuestionSchema = z.object({ questionId: z.string(), revision: formulaRevisionSchema, validation: formulaValidationSchema.nullish().transform((value) => value ?? null) });
export type GovernedQuestion = z.infer<typeof governedQuestionSchema>;
const validationResultSchema = z.object({ revision: formulaRevisionSchema, validation: formulaValidationSchema });
const queueSchema = z.array(z.object({ revisionId: z.string(), questionId: z.string(), questionLabel: z.string().catch("Untitled question"), questionReference: text, revision: z.number(),
  definitionHash: z.string(), status, statusName: z.string().catch(""), createdById: text, reviewedById: text, reviewedAt: text, createdAt: z.string().catch("") }));
export type FormulaQueueItem = z.infer<typeof queueSchema>[number];

/** Every check passed: the server completed them and none failed. */
export const validationPassed = (validation: FormulaValidation | null | undefined) =>
  validation?.status === formulaServiceCompleted && validation.testOutcomes.length > 0 && validation.testOutcomes.every((outcome) => outcome.passed);

interface Audit { module: string; subModule: string }
const headers = (audit: Audit) => ({ Module: audit.module, SubModule: audit.subModule });
const revisionsTag = (questionId: string) => ({ type: "FormulaRevisions" as const, id: questionId });
type Transition = Audit & { revisionId: string; questionId: string; body: { expectedDefinitionHash: string; reason: string } };
export type GovernedQuestionBody = { question: DomainEntitiesFormsRequestCreateQuestionRequest; formula: FormulaRevisionDraft };

const parsed = <T>(schema: z.ZodType<T>) => (response: unknown): T => schema.parse(response);

export const governanceApi = api.enhanceEndpoints({ addTagTypes: ["FormulaRevisions", "FormulaQueues", "Questions"] }).injectEndpoints({
  endpoints: (build) => ({
    getFormulaRevisions: build.query<FormulaRevision[], Audit & { questionId: string }>({
      query: ({ questionId, ...audit }) => ({ url: `/api/v1/formula-definitions/questions/${questionId}/revisions`, headers: headers(audit) }),
      transformResponse: parsed(z.array(formulaRevisionSchema)), providesTags: (_result, _error, arg) => [revisionsTag(arg.questionId)],
    }),
    createGovernedQuestion: build.mutation<GovernedQuestion, Audit & { body: GovernedQuestionBody }>({
      query: ({ body, ...audit }) => ({ url: "/api/v1/formula-questions", method: "POST", body, headers: headers(audit) }),
      transformResponse: parsed(governedQuestionSchema), invalidatesTags: (_result, error) => error ? [] : ["Questions", "FormulaQueues"],
    }),
    updateGovernedQuestion: build.mutation<GovernedQuestion, Audit & { questionId: string; body: GovernedQuestionBody }>({
      query: ({ questionId, body, ...audit }) => ({ url: `/api/v1/formula-questions/${questionId}`, method: "PUT", body, headers: headers(audit) }),
      transformResponse: parsed(governedQuestionSchema), invalidatesTags: (_result, error, arg) => error ? [] : ["Questions", "FormulaQueues", revisionsTag(arg.questionId)],
    }),
    validateFormulaRevision: build.mutation<z.infer<typeof validationResultSchema>, Audit & { revisionId: string; questionId: string }>({
      query: ({ revisionId, questionId: _questionId, ...audit }) => ({ url: `/api/v1/formula-definitions/revisions/${revisionId}/validate`, method: "POST", headers: headers(audit) }),
      transformResponse: parsed(validationResultSchema),
    }),
    submitFormulaReview: build.mutation<FormulaRevision, Transition>({
      query: ({ revisionId, body, questionId: _questionId, ...audit }) => ({ url: `/api/v1/formula-definitions/revisions/${revisionId}/submit-review`, method: "POST", body, headers: headers(audit) }),
      transformResponse: parsed(formulaRevisionSchema), invalidatesTags: (_result, error, arg) => error ? [] : [revisionsTag(arg.questionId), "FormulaQueues"],
    }),
    recordFormulaReview: build.mutation<FormulaRevision, Transition>({
      query: ({ revisionId, body, questionId: _questionId, ...audit }) => ({ url: `/api/v1/formula-definitions/revisions/${revisionId}/record-review`, method: "POST", body, headers: headers(audit) }),
      transformResponse: parsed(formulaRevisionSchema), invalidatesTags: (_result, error, arg) => error ? [] : [revisionsTag(arg.questionId), "FormulaQueues"],
    }),
    approveFormulaRevision: build.mutation<FormulaRevision, Transition>({
      query: ({ revisionId, body, questionId: _questionId, ...audit }) => ({ url: `/api/v1/formula-definitions/revisions/${revisionId}/approve`, method: "POST", body, headers: headers(audit) }),
      transformResponse: parsed(formulaRevisionSchema), invalidatesTags: (_result, error, arg) => error ? [] : [revisionsTag(arg.questionId), "FormulaQueues"],
    }),
    getApprovedFormulaRevisions: build.query<FormulaRevision[], Audit & { questionId: string }>({
      query: ({ questionId, ...audit }) => ({ url: `/api/v1/formula-definitions/questions/${questionId}/approval-revisions`, headers: headers(audit) }),
      transformResponse: parsed(z.array(formulaRevisionSchema)), providesTags: (_result, _error, arg) => [revisionsTag(arg.questionId)],
    }),
    getFormulaReviewQueue: build.query<FormulaQueueItem[], Audit>({
      query: (audit) => ({ url: "/api/v1/formula-definitions/review-queue", headers: headers(audit) }), transformResponse: parsed(queueSchema), providesTags: ["FormulaQueues"],
    }),
  }),
});
