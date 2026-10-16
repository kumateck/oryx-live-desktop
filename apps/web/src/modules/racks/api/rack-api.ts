import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const racks = { type: "StorageRacks" as const, id: "all" };
const shelves = { type: "StorageShelves" as const, id: "all" };
// The stock pages list racks and shelves too, so they are read again after any change here.
const stock = { type: "StockOnShelves" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [racks, shelves, stock];

export const rackApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1WarehouseRack: (definition) => { definition.providesTags = addTags(definition.providesTags, [racks]); },
    getApiV1WarehouseLocation: (definition) => { definition.providesTags = addTags(definition.providesTags, [racks]); },
    getApiV1WarehouseShelf: (definition) => { definition.providesTags = addTags(definition.providesTags, [shelves]); },
    getApiV1WarehouseShelfByShelfId: (definition) => { definition.providesTags = addTags(definition.providesTags, [shelves, stock]); },
    postApiV1WarehouseByLocationIdRack: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    putApiV1WarehouseRackByRackId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    deleteApiV1WarehouseRackByRackId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    postApiV1WarehouseByRackIdShelf: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    putApiV1WarehouseShelfByShelfId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    deleteApiV1WarehouseShelfByShelfId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
  },
});
export const {
  useGetApiV1WarehouseRackQuery, useLazyGetApiV1WarehouseRackQuery, useGetApiV1WarehouseLocationQuery, useGetApiV1WarehouseShelfQuery, useGetApiV1WarehouseShelfByShelfIdQuery,
  usePostApiV1WarehouseByLocationIdRackMutation, usePutApiV1WarehouseRackByRackIdMutation, useDeleteApiV1WarehouseRackByRackIdMutation,
  usePostApiV1WarehouseByRackIdShelfMutation, usePutApiV1WarehouseShelfByShelfIdMutation, useDeleteApiV1WarehouseShelfByShelfIdMutation,
} = rackApi;
