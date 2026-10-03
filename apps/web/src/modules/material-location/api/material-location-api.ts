import { approvedMaterialApi } from "@/modules/approved-materials/api/approved-material-api";

// Shares the stock tag with the other shelf lists, so a move refreshes these too.
export const materialLocationApi = approvedMaterialApi.enhanceEndpoints({
  endpoints: { getApiV1MaterialDepartment: { providesTags: [{ type: "StockOnShelves", id: "all" }] } },
});
export const { useGetApiV1MaterialDepartmentQuery, useGetApiV1MaterialByMaterialIdShelfQuery, useGetApiV1MaterialByMaterialIdQuery } = materialLocationApi;
