import { formsApi } from "@/shared/api/generated/forms";

const list = { type: "Questions" as const, id: "all" };
const one = (id: string) => ({ type: "Questions" as const, id });

export const questionsApi = formsApi.enhanceEndpoints({ addTagTypes: ["Questions"], endpoints: {
  getApiV1FormQuestion: { providesTags: [list] },
  getApiV1FormQuestionByQuestionId: { providesTags: (_result, _error, arg) => [one(arg.questionId)] },
  postApiV1FormQuestion: { invalidatesTags: (_result, error) => error ? [] : [list] },
  putApiV1FormQuestionByQuestionId: { invalidatesTags: (_result, error, arg) => error ? [] : [list, one(arg.questionId)] },
  deleteApiV1FormQuestionByQuestionId: { invalidatesTags: (_result, error) => error ? [] : [list] },
} });
export const { useGetApiV1FormQuestionQuery, useGetApiV1FormQuestionByQuestionIdQuery, usePostApiV1FormQuestionMutation, usePutApiV1FormQuestionByQuestionIdMutation,
  useDeleteApiV1FormQuestionByQuestionIdMutation } = questionsApi;
