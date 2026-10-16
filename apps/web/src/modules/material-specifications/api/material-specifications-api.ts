import { analyticalApi } from "@/shared/api/generated/analytical";
import { addTags } from "@/shared/api/add-tags";

// One tag for the lists and one per specification, so a change refreshes both without refetching unrelated records.
const all = { type: "MaterialSpecifications" as const, id: "all" };
const one = (id: string) => ({ type: "MaterialSpecifications" as const, id });
const after = (tags: { type: "MaterialSpecifications"; id: string }[]) => (_result: unknown, error: unknown) => error ? [] : tags;

export const materialSpecificationsApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["MaterialSpecifications"], endpoints: {
  getApiV1MaterialSpecifications: (definition) => { definition.providesTags = addTags(definition.providesTags, [all]); },
  getApiV1MaterialSpecificationsById: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [one(arg.id)]); },
  getApiV1MaterialSpecificationsMaterials: (definition) => { definition.providesTags = addTags(definition.providesTags, [all]); },
  postApiV1MaterialSpecifications: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all])); },
  putApiV1MaterialSpecificationsById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => after([all, one(arg.id)])(_result, error)); },
  deleteApiV1MaterialSpecificationsById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all])); },
  postApiV1MaterialSpecificationsAddRemoveMaterials: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all])); },
} });
/** After an approval, which is a shared endpoint and so carries no tags of its own here. */
export const specificationApproved = (id: string) => materialSpecificationsApi.util.invalidateTags([all, one(id)]);
