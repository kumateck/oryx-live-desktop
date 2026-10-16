import { analyticalApi } from "@/shared/api/generated/analytical";

const all = { type: "MaterialStps" as const, id: "all" };
const one = (id: string) => ({ type: "MaterialStps" as const, id });
const after = (tags: { type: "MaterialStps"; id: string }[]) => (_result: unknown, error: unknown) => error ? [] : tags;

export const materialStpsApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["MaterialStps"], endpoints: {
  getApiV1MaterialStps: { providesTags: [all] },
  getApiV1MaterialStpsById: { providesTags: (_result, _error, arg) => [one(arg.id)] },
  getApiV1MaterialStpsByStpNumberMaterials: { providesTags: [all] },
  postApiV1MaterialStps: { invalidatesTags: after([all]) },
  putApiV1MaterialStpsById: { invalidatesTags: (_result, error, arg) => after([all, one(arg.id)])(_result, error) },
  deleteApiV1MaterialStpsById: { invalidatesTags: after([all]) },
  postApiV1MaterialStpsAddRemoveMaterials: { invalidatesTags: after([all]) },
} });
