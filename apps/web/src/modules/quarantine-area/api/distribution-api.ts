import { procurementApi } from "@/shared/api/generated/procurement";
import { addTags } from "@/shared/api/add-tags";

const grns = { type: "Grns" as const, id: "all" };
const writing = procurementApi.enhanceEndpoints({ endpoints: {
  postApiV1ProcurementDistributeMaterial: (definition) => {
    definition.invalidatesTags = addTags(definition.invalidatesTags,
      (_result, error) => error ? [] : [grns, { type: "DistributedStock", id: "all" }]);
  },
} });


export const { usePostApiV1ProcurementDistributeMaterialMutation } = writing;
