import { materialsApi } from "@/shared/api/generated/materials";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "MaterialList" as const, id: "all" };
const links = { type: "MaterialList" as const, id: "links" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];
const relinked = (_result: unknown, error: unknown) => error ? [] : [links];

export const materialApi = materialsApi.enhanceEndpoints({
  endpoints: {
    getApiV1Material: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1MaterialByMaterialId: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    postApiV1Material: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    putApiV1MaterialByMaterialId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    deleteApiV1MaterialByMaterialId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    getApiV1MaterialDepartment: (definition) => { definition.providesTags = addTags(definition.providesTags, [links]); },
    getApiV1MaterialDepartmentNotLinked: (definition) => { definition.providesTags = addTags(definition.providesTags, [links]); },
    postApiV1MaterialDepartment: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, relinked); },
    deleteApiV1MaterialDepartment: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, relinked); },
  },
});
export const { useGetApiV1MaterialQuery, useGetApiV1MaterialByMaterialIdQuery, usePostApiV1MaterialMutation, usePutApiV1MaterialByMaterialIdMutation, useDeleteApiV1MaterialByMaterialIdMutation,
  useGetApiV1MaterialDepartmentQuery, useGetApiV1MaterialDepartmentNotLinkedQuery, usePostApiV1MaterialDepartmentMutation, useDeleteApiV1MaterialDepartmentMutation } = materialApi;
