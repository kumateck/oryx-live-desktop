import { procurementApi } from "@/shared/api/generated/procurement";

const list = { type: "ManufacturerList" as const, id: "all" };
export const manufacturerApi = procurementApi.enhanceEndpoints({ endpoints: {
  getApiV1ProcurementManufacturer: { providesTags: [list] },
  getApiV1ProcurementManufacturerByManufacturerId: { providesTags: (_result, _error, arg) => [{ type: "Manufacturer", id: arg.manufacturerId }] },
  postApiV1ProcurementManufacturer: { invalidatesTags: (_result, error) => error ? [] : [list] },
  putApiV1ProcurementManufacturerByManufacturerId: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Manufacturer", id: arg.manufacturerId }] },
  deleteApiV1ProcurementManufacturerByManufacturerId: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Manufacturer", id: arg.manufacturerId }] },
} });

export const {
  useGetApiV1ProcurementManufacturerQuery, useGetApiV1ProcurementManufacturerByManufacturerIdQuery,
  usePostApiV1ProcurementManufacturerMutation, usePutApiV1ProcurementManufacturerByManufacturerIdMutation,
  useDeleteApiV1ProcurementManufacturerByManufacturerIdMutation,
} = manufacturerApi;
