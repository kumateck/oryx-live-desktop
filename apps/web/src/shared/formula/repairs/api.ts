import { formsApi } from "@/shared/api/generated/forms";
import { addTags } from "@/shared/api/add-tags";

/** Explicit transport contract shared by Questions and ATR; feature hooks stay in their owning modules. */
export const formulaRepairsApi = formsApi.enhanceEndpoints({ endpoints: {
  applyFormulaRepair: (definition) => {
    definition.invalidatesTags = addTags(definition.invalidatesTags, (result, error, arg) => error ? [] : [
      { type: "form/question" as const, id: arg.questionId }, { type: "form/question" as const, id: "LIST" },
      ...(result?.formIds ?? []).map(id => ({ type: "form" as const, id })),
      ...(result?.responseIds ?? []).map(id => ({ type: "form/response" as const, id })),
    ]);
  },
} });
export const { useGetFormulaRepairContextQuery, usePreviewFormulaRepairMutation, useApplyFormulaRepairMutation,
  useGetFormulaRepairHistoryQuery, useEvaluateRepairedFormulaMutation } = formulaRepairsApi;
