import { materialsApi } from "@/shared/api/generated/materials";

const list = { type: "MaterialList" as const, id: "all" };
const links = { type: "MaterialList" as const, id: "links" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];
const relinked = (_result: unknown, error: unknown) => error ? [] : [links];

export const materialApi = materialsApi.enhanceEndpoints({
  endpoints: {
    getApiV1Material: { providesTags: [list] },
    getApiV1MaterialByMaterialId: { providesTags: [list] },
    postApiV1Material: { invalidatesTags: changed },
    putApiV1MaterialByMaterialId: { invalidatesTags: changed },
    deleteApiV1MaterialByMaterialId: { invalidatesTags: changed },
    getApiV1MaterialDepartment: { providesTags: [links] },
    getApiV1MaterialDepartmentNotLinked: { providesTags: [links] },
    postApiV1MaterialDepartment: { invalidatesTags: relinked },
    deleteApiV1MaterialDepartment: { invalidatesTags: relinked },
  },
});
export const { useGetApiV1MaterialQuery, useGetApiV1MaterialByMaterialIdQuery, usePostApiV1MaterialMutation, usePutApiV1MaterialByMaterialIdMutation, useDeleteApiV1MaterialByMaterialIdMutation,
  useGetApiV1MaterialDepartmentQuery, useGetApiV1MaterialDepartmentNotLinkedQuery, usePostApiV1MaterialDepartmentMutation, useDeleteApiV1MaterialDepartmentMutation } = materialApi;
