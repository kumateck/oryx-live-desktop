import { api } from "@/shared/api/base-api";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import type { MoveRequest } from "../lib/move-stock";
import { addTags } from "@/shared/api/add-tags";

const shelves = { type: "StockOnShelves" as const, id: "all" };

export const locationApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1WarehouseRackByRackId: (definition) => { definition.providesTags = addTags(definition.providesTags, [shelves]); },
    getApiV1WarehouseRackByDepartmentSummary: (definition) => { definition.providesTags = addTags(definition.providesTags, [shelves]); },
  },
});
export const { useGetApiV1WarehouseRackByRackIdQuery, useGetApiV1WarehouseRackByDepartmentSummaryQuery } = locationApi;

// The backend's contract declares no response for this request, so it is left out of the generated API and declared here.
const moveApi = api.injectEndpoints({
  endpoints: (build) => ({
    moveShelfStock: build.mutation<void, MoveRequest>({
      query: (body) => ({ url: "/api/v1/material/batch/move/v2", method: "POST", body, headers: { Module: "Warehouse", SubModule: "Location Chart Record" } }),
      invalidatesTags: (_result, error) => error ? [] : [shelves],
    }),
  }),
});
export const { useMoveShelfStockMutation } = moveApi;
