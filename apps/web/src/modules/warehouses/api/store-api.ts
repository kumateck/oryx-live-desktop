import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const stores = { type: "StorageRacks" as const, id: "stores" };
// Racks are set up against locations, so the rack pages read locations again after a change here.
const racks = { type: "StorageRacks" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [stores, racks];

export const storeApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1Warehouse: (definition) => { definition.providesTags = addTags(definition.providesTags, [stores]); },
    postApiV1Warehouse: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    putApiV1WarehouseByWarehouseId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    deleteApiV1WarehouseByWarehouseId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    postApiV1WarehouseByWarehouseIdLocation: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    putApiV1WarehouseLocationByLocationId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    deleteApiV1WarehouseLocationByLocationId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
  },
});
export const { useGetApiV1WarehouseQuery, usePostApiV1WarehouseMutation, usePutApiV1WarehouseByWarehouseIdMutation, useDeleteApiV1WarehouseByWarehouseIdMutation,
  useGetApiV1WarehouseLocationQuery, usePostApiV1WarehouseByWarehouseIdLocationMutation, usePutApiV1WarehouseLocationByLocationIdMutation, useDeleteApiV1WarehouseLocationByLocationIdMutation } = storeApi;
