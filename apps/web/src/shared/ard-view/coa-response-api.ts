import { formsApi } from "@/shared/api/generated/forms";
import { addTags } from "@/shared/api/add-tags";

/** Keep mounted unapproved certificates current after their product's reporting settings change. */
export const coaResponseApi = formsApi.enhanceEndpoints({ addTagTypes: ["ProductCoaReporting"], endpoints: {
  getApiV1FormResponsesByFormResponseId: definition => {
    definition.providesTags = addTags(definition.providesTags, result => result?.batchManufacturingRecord && !result.approved
      ? [{ type: "ProductCoaReporting" as const, id: "all" }] : []);
  },
} });
