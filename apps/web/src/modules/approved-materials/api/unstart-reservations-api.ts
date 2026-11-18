import { materialsApi } from "@/shared/api/generated/materials";
import { addTags } from "@/shared/api/add-tags";

const refresh = ["StockOnShelves", "MaterialList", "ActivityBoard", "ScheduleBatch", "Requisition", "StockIssue"] as const;
export const unstartReservationsApi = materialsApi.enhanceEndpoints({ endpoints: {
  releaseRawUnstartReservations: definition => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : refresh); },
  releasePackagingUnstartReservations: definition => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : refresh); },
} });
export const { usePreviewRawUnstartReservationsQuery, usePreviewPackagingUnstartReservationsQuery,
  useReleaseRawUnstartReservationsMutation, useReleasePackagingUnstartReservationsMutation } = unstartReservationsApi;
