import { warehouseApi } from "@/shared/api/generated/warehouse";

const racks = { type: "StorageRacks" as const, id: "all" };
const shelves = { type: "StorageShelves" as const, id: "all" };
// The stock pages list racks and shelves too, so they are read again after any change here.
const stock = { type: "StockOnShelves" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [racks, shelves, stock];

export const rackApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1WarehouseRack: { providesTags: [racks] },
    getApiV1WarehouseLocation: { providesTags: [racks] },
    getApiV1WarehouseShelf: { providesTags: [shelves] },
    getApiV1WarehouseShelfByShelfId: { providesTags: [shelves, stock] },
    postApiV1WarehouseByLocationIdRack: { invalidatesTags: changed },
    putApiV1WarehouseRackByRackId: { invalidatesTags: changed },
    deleteApiV1WarehouseRackByRackId: { invalidatesTags: changed },
    postApiV1WarehouseByRackIdShelf: { invalidatesTags: changed },
    putApiV1WarehouseShelfByShelfId: { invalidatesTags: changed },
    deleteApiV1WarehouseShelfByShelfId: { invalidatesTags: changed },
  },
});
export const {
  useGetApiV1WarehouseRackQuery, useLazyGetApiV1WarehouseRackQuery, useGetApiV1WarehouseLocationQuery, useGetApiV1WarehouseShelfQuery, useGetApiV1WarehouseShelfByShelfIdQuery,
  usePostApiV1WarehouseByLocationIdRackMutation, usePutApiV1WarehouseRackByRackIdMutation, useDeleteApiV1WarehouseRackByRackIdMutation,
  usePostApiV1WarehouseByRackIdShelfMutation, usePutApiV1WarehouseShelfByShelfIdMutation, useDeleteApiV1WarehouseShelfByShelfIdMutation,
} = rackApi;
