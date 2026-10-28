import { api } from "@/shared/api/base-api";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { addTags } from "@/shared/api/add-tags";

const byProduct = { type: "ProductArd" as const, id: "by-product" };

export const ardApi = analyticalApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductArdProductByProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, [byProduct]); },
    postApiV1ProductArd: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [byProduct]); },
    putApiV1ProductArdById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [byProduct]); },
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
