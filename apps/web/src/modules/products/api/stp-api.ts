import { analyticalApi } from "@/shared/api/generated/analytical";
import { settingsApi } from "@/shared/api/generated/settings";
import { stpDocumentApi, stpDocumentExtraApi } from "@/shared/stp/stp-document-api";

const byProduct = { type: "ProductStp" as const, id: "by-product" };

export const stpApi = analyticalApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductStpsByProductIdProduct: { providesTags: [byProduct] },
    postApiV1ProductStps: { invalidatesTags: (_result, error) => error ? [] : [byProduct] },
    putApiV1ProductStpsById: { invalidatesTags: (_result, error) => error ? [] : [byProduct] },
  },
});

export const {
  useGetApiV1ProductStpsByProductIdProductQuery, usePostApiV1ProductStpsMutation, usePutApiV1ProductStpsByIdMutation,
} = stpApi;
// The document endpoints are shared with the QC STP pages, so their tags are defined once.
export const { useGetApiV1StpDocumentsByOwnerTypeAndOwnerIdQuery } = stpDocumentApi;
export const { useUploadStpDocumentVersionMutation } = stpDocumentExtraApi;
export const { useLazyGetApiV1ConfigurationByModelTypeCountQuery } = settingsApi;
