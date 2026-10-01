import { api } from "@/shared/api/base-api";
import { analyticalApi } from "@/shared/api/generated/analytical";
import type { DomainEntitiesStpDocumentsStpDocumentDto } from "@/shared/api/generated/analytical";
import { settingsApi } from "@/shared/api/generated/settings";

const byProduct = { type: "ProductStp" as const, id: "by-product" };

export const stpApi = analyticalApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductStpsByProductIdProduct: { providesTags: [byProduct] },
    postApiV1ProductStps: { invalidatesTags: (_result, error) => error ? [] : [byProduct] },
    putApiV1ProductStpsById: { invalidatesTags: (_result, error) => error ? [] : [byProduct] },
    getApiV1StpDocumentsByOwnerTypeAndOwnerId: { providesTags: (_result, _error, arg) => [{ type: "StpDocument", id: arg.ownerId }] },
  },
});

/**
 * Uploading a document version is a multipart request. The generated endpoint types its body as a
 * plain object, which would be sent as JSON, so the upload is declared here with a form body.
 */
const uploadApi = api.injectEndpoints({
  endpoints: (build) => ({
    uploadStpDocumentVersion: build.mutation<DomainEntitiesStpDocumentsStpDocumentDto,
      { ownerType: string; ownerId: string; file: File; reasonForChange?: string; module: string; subModule: string }>({
      query: ({ ownerType, ownerId, file, reasonForChange, module, subModule }) => {
        const body = new FormData();
        body.append("file", file);
        if (reasonForChange?.trim()) body.append("reasonForChange", reasonForChange.trim());
        return { url: `/api/v1/stp-documents/${ownerType}/${ownerId}/versions`, method: "POST", body, headers: { Module: module, SubModule: subModule } };
      },
      invalidatesTags: (_result, error, arg) => error ? [] : [{ type: "StpDocument", id: arg.ownerId }],
    }),
  }),
});

export const {
  useGetApiV1ProductStpsByProductIdProductQuery, usePostApiV1ProductStpsMutation, usePutApiV1ProductStpsByIdMutation,
  useGetApiV1StpDocumentsByOwnerTypeAndOwnerIdQuery,
} = stpApi;
export const { useUploadStpDocumentVersionMutation } = uploadApi;
export const { useLazyGetApiV1ConfigurationByModelTypeCountQuery } = settingsApi;
