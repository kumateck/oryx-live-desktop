import { analyticalApi } from "@/shared/api/generated/analytical";
import { addTags } from "@/shared/api/add-tags";

const all = { type: "MaterialArds" as const, id: "all" };
const one = (id: string) => ({ type: "MaterialArds" as const, id });
const after = (tags: { type: "MaterialArds"; id: string }[]) => (_result: unknown, error: unknown) => error ? [] : tags;

export const materialArdsApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["MaterialArds"], endpoints: {
  getApiV1MaterialArd: (definition) => { definition.providesTags = addTags(definition.providesTags, [all]); },
  getApiV1MaterialArdById: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [one(arg.id)]); },
  postApiV1MaterialArd: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all])); },
  putApiV1MaterialArdById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => after([all, one(arg.id)])(_result, error)); },
  deleteApiV1MaterialArdById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all])); },
} });
/** After an approval or attached files, which are shared endpoints without these tags. */
export const materialArdChanged = (id: string) => materialArdsApi.util.invalidateTags([all, one(id)]);
