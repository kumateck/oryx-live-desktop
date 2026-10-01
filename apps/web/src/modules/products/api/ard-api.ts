import { api } from "@/shared/api/base-api";
import { analyticalApi } from "@/shared/api/generated/analytical";

const byProduct = { type: "ProductArd" as const, id: "by-product" };

export const ardApi = analyticalApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductArdProductByProductId: { providesTags: [byProduct] },
    postApiV1ProductArd: { invalidatesTags: (_result, error) => error ? [] : [byProduct] },
    putApiV1ProductArdById: { invalidatesTags: (_result, error) => error ? [] : [byProduct] },
  },
});

/** Attaching files is a multipart request; the generated endpoint would send its body as JSON, so it is declared here. */
const fileApi = api.injectEndpoints({
  endpoints: (build) => ({
    uploadArdAttachments: build.mutation<void, { ardId: string; files: readonly File[] }>({
      query: ({ ardId, files }) => {
        const body = new FormData();
        for (const file of files) body.append("files", file, file.name);
        return { url: `/api/v1/file/ProductAnalyticalRawData/${ardId}`, method: "POST", body, headers: { Module: "General", SubModule: "File Upload" } };
      },
      invalidatesTags: (_result, error) => error ? [] : [byProduct],
    }),
  }),
});

export const {
  useGetApiV1ProductArdProductByProductIdQuery, usePostApiV1ProductArdMutation, usePutApiV1ProductArdByIdMutation,
  useGetApiV1ProductSpecificationsProductByIdQuery,
} = ardApi;
export const { useUploadArdAttachmentsMutation } = fileApi;
