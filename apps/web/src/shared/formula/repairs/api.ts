import { formsApi, type AppServicesFormulasFormulaRepairContextDto, type AppServicesFormulasFormulaRepairTestDto,
  type GetFormulaRepairContextApiArg } from "@/shared/api/generated/forms";
import { addTags } from "@/shared/api/add-tags";

/** A test field the formula is on, with the formula that test calculates with now. */
export type FormulaRepairTestContext = AppServicesFormulasFormulaRepairTestDto & { currentDefinition?: string | null };
/**
 * The repair context, with the question's approved revision. When `approvedDefinition` is set a repair applies exactly that
 * formula: corrections are made through a new revision, not typed into the repair.
 */
export type FormulaRepairContextResponse = Omit<AppServicesFormulasFormulaRepairContextDto, "tests"> & {
  tests?: FormulaRepairTestContext[] | null; approvedDefinition?: string | null; approvedRevision?: number | null;
};

/** Explicit transport contract shared by Questions and ATR; feature hooks stay in their owning modules. */
export const formulaRepairsApi = formsApi.enhanceEndpoints({ endpoints: {
  applyFormulaRepair: (definition) => {
    definition.invalidatesTags = addTags(definition.invalidatesTags, (result, error, arg) => error ? [] : [
      { type: "form/question" as const, id: arg.questionId }, { type: "form/question" as const, id: "LIST" },
      { type: "formula-repair/question" as const, id: arg.questionId },
      ...(result?.formIds ?? []).map(id => ({ type: "form" as const, id })),
      ...(result?.responseIds ?? []).map(id => ({ type: "form/response" as const, id })),
    ]);
  },
} }).injectEndpoints({ endpoints: (build) => ({
  /** The repair context; opened from a test (`atrId`) it lists every field of the formula on that test, with any reason it cannot be repaired. */
  readFormulaRepairContext: build.query<FormulaRepairContextResponse, GetFormulaRepairContextApiArg & { atrId?: string | null }>({
    query: ({ questionId, atrId, module, subModule }) => ({
      url: `/api/v1/formula-repairs/questions/${encodeURIComponent(questionId)}`, params: atrId ? { atrId } : undefined,
      headers: { Module: module, SubModule: subModule },
    }),
    providesTags: (_result, _error, arg) => [{ type: "formula-repair/question", id: arg.questionId }],
  }),
}) });
export const { useReadFormulaRepairContextQuery, usePreviewFormulaRepairMutation, useApplyFormulaRepairMutation,
  useGetFormulaRepairHistoryQuery, useEvaluateRepairedFormulaMutation } = formulaRepairsApi;
