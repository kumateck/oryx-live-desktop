import { analyticalApi } from "@/shared/api/generated/analytical";
import { addTags } from "@/shared/api/add-tags";

const all = { type: "MaterialStps" as const, id: "all" };
const one = (id: string) => ({ type: "MaterialStps" as const, id });
const after = (tags: { type: "MaterialStps"; id: string }[]) => (_result: unknown, error: unknown) => error ? [] : tags;

export const materialStpsApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["MaterialStps"], endpoints: {
  getApiV1MaterialStps: (definition) => { definition.providesTags = addTags(definition.providesTags, [all]); },
  getApiV1MaterialStpsById: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [one(arg.id)]); },
  getApiV1MaterialStpsByStpNumberMaterials: (definition) => { definition.providesTags = addTags(definition.providesTags, [all]); },
  postApiV1MaterialStps: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all])); },
  putApiV1MaterialStpsById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => after([all, one(arg.id)])(_result, error)); },
  deleteApiV1MaterialStpsById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all])); },
  postApiV1MaterialStpsAddRemoveMaterials: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all])); },
} });
