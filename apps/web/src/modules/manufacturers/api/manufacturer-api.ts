import { procurementApi } from "@/shared/api/generated/procurement";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "ManufacturerList" as const, id: "all" };
export const manufacturerApi = procurementApi.enhanceEndpoints({ endpoints: {
  getApiV1ProcurementManufacturer: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
  getApiV1ProcurementManufacturerByManufacturerId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "Manufacturer", id: arg.manufacturerId }]); },
  postApiV1ProcurementManufacturer: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list]); },
  putApiV1ProcurementManufacturerByManufacturerId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, { type: "Manufacturer", id: arg.manufacturerId }]); },
  deleteApiV1ProcurementManufacturerByManufacturerId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, { type: "Manufacturer", id: arg.manufacturerId }]); },
} });

export const {
  useGetApiV1ProcurementManufacturerQuery, useGetApiV1ProcurementManufacturerByManufacturerIdQuery,
  usePostApiV1ProcurementManufacturerMutation, usePutApiV1ProcurementManufacturerByManufacturerIdMutation,
  useDeleteApiV1ProcurementManufacturerByManufacturerIdMutation,
} = manufacturerApi;
