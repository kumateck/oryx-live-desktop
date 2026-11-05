import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";

export const reservationRepairApi = productionApi.enhanceEndpoints({
  endpoints: {
    applyReservationRepair: (definition) => {
      definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [
        "Activity", { type: "ScheduleBatch", id: arg.batchId }, "Requisition", "StockIssue", "StockOnShelves",
      ]);
    },
  },
});
export const { usePreviewReservationRepairQuery, useApplyReservationRepairMutation } = reservationRepairApi;
