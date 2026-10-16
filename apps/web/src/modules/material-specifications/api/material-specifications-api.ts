import { analyticalApi } from "@/shared/api/generated/analytical";

// One tag for the lists and one per specification, so a change refreshes both without refetching unrelated records.
const all = { type: "MaterialSpecifications" as const, id: "all" };
const one = (id: string) => ({ type: "MaterialSpecifications" as const, id });
const after = (tags: { type: "MaterialSpecifications"; id: string }[]) => (_result: unknown, error: unknown) => error ? [] : tags;

export const materialSpecificationsApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["MaterialSpecifications"], endpoints: {
  getApiV1MaterialSpecifications: { providesTags: [all] },
  getApiV1MaterialSpecificationsById: { providesTags: (_result, _error, arg) => [one(arg.id)] },
  getApiV1MaterialSpecificationsMaterials: { providesTags: [all] },
  postApiV1MaterialSpecifications: { invalidatesTags: after([all]) },
  putApiV1MaterialSpecificationsById: { invalidatesTags: (_result, error, arg) => after([all, one(arg.id)])(_result, error) },
  deleteApiV1MaterialSpecificationsById: { invalidatesTags: after([all]) },
  postApiV1MaterialSpecificationsAddRemoveMaterials: { invalidatesTags: after([all]) },
} });
/** After an approval, which is a shared endpoint and so carries no tags of its own here. */
export const specificationApproved = (id: string) => materialSpecificationsApi.util.invalidateTags([all, one(id)]);
