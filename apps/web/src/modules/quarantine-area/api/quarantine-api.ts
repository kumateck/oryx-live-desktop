import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const grns = { type: "Grns" as const, id: "all" };
const reading = warehouseApi.enhanceEndpoints({ endpoints: {
  getApiV1WarehouseGrns: (definition) => { definition.providesTags = addTags(definition.providesTags, [grns]); },
  getApiV1WarehouseGrnById: (definition) => { definition.providesTags = addTags(definition.providesTags, [grns]); },
} });

export const { useGetApiV1WarehouseGrnByIdQuery, useLazyGetApiV1WarehouseGrnByIdQuery, useGetApiV1WarehouseGrnsQuery } = reading;
