import { formsApi } from "@/shared/api/generated/forms";
import { addTags } from "@/shared/api/add-tags";

export const templateRepairApi = formsApi.enhanceEndpoints({ endpoints: {
  applyTemplateRepair: (definition) => {
    definition.invalidatesTags = addTags(definition.invalidatesTags, (result, error, arg) => error ? [] : [
      { type: "template-repair/form" as const, id: arg.formId },
      { type: "form" as const, id: arg.formId },
      // Assignment readers use these families across product, GRN and retest worksheets.
      { type: "form/assignee" as const, id: "LIST" },
      ...(result?.formAssigneeIds ?? []).map(id => ({ type: "form/assignee" as const, id })),
    ]);
  },
} });
export const { useGetTemplateRepairContextQuery, usePreviewTemplateRepairMutation, useApplyTemplateRepairMutation, useGetTemplateRepairHistoryQuery } = templateRepairApi;
