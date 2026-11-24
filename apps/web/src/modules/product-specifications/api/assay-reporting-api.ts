import { analyticalApi } from "@/shared/api/generated/analytical";
import { addTags } from "@/shared/api/add-tags";

const tag = (id: string) => ({ type: "ProductAssayReporting" as const, id });
export const assayReportingApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["ProductAssayReporting", "ProductSpecifications"], endpoints: {
  getProductAssayReporting: definition => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [tag(arg.id)]); },
  saveProductAssayReporting: definition => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [
    tag(arg.id), { type: "ProductSpecifications" as const, id: arg.id },
  ]); },
} });
