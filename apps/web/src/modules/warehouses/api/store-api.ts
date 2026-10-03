import { warehouseApi } from "@/shared/api/generated/warehouse";

const stores = { type: "StorageRacks" as const, id: "stores" };
// Racks are set up against locations, so the rack pages read locations again after a change here.
const racks = { type: "StorageRacks" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [stores, racks];

export const storeApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1Warehouse: { providesTags: [stores] },
    postApiV1Warehouse: { invalidatesTags: changed },
    putApiV1WarehouseByWarehouseId: { invalidatesTags: changed },
    deleteApiV1WarehouseByWarehouseId: { invalidatesTags: changed },
    postApiV1WarehouseByWarehouseIdLocation: { invalidatesTags: changed },
    putApiV1WarehouseLocationByLocationId: { invalidatesTags: changed },
    deleteApiV1WarehouseLocationByLocationId: { invalidatesTags: changed },
  },
});
export const { useGetApiV1WarehouseQuery, usePostApiV1WarehouseMutation, usePutApiV1WarehouseByWarehouseIdMutation, useDeleteApiV1WarehouseByWarehouseIdMutation,
  useGetApiV1WarehouseLocationQuery, usePostApiV1WarehouseByWarehouseIdLocationMutation, usePutApiV1WarehouseLocationByLocationIdMutation, useDeleteApiV1WarehouseLocationByLocationIdMutation } = storeApi;
