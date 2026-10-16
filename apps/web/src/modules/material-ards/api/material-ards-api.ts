import { analyticalApi } from "@/shared/api/generated/analytical";

const all = { type: "MaterialArds" as const, id: "all" };
const one = (id: string) => ({ type: "MaterialArds" as const, id });
const after = (tags: { type: "MaterialArds"; id: string }[]) => (_result: unknown, error: unknown) => error ? [] : tags;

export const materialArdsApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["MaterialArds"], endpoints: {
  getApiV1MaterialArd: { providesTags: [all] },
  getApiV1MaterialArdById: { providesTags: (_result, _error, arg) => [one(arg.id)] },
  postApiV1MaterialArd: { invalidatesTags: after([all]) },
  putApiV1MaterialArdById: { invalidatesTags: (_result, error, arg) => after([all, one(arg.id)])(_result, error) },
  deleteApiV1MaterialArdById: { invalidatesTags: after([all]) },
} });
/** After an approval or attached files, which are shared endpoints without these tags. */
export const materialArdChanged = (id: string) => materialArdsApi.util.invalidateTags([all, one(id)]);
