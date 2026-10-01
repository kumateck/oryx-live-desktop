import { analyticalApi } from "@/shared/api/generated/analytical";
import { formsApi } from "@/shared/api/generated/forms";
import { settingsApi } from "@/shared/api/generated/settings";

const byProduct = { type: "ProductSpecification" as const, id: "by-product" };

export const specificationApi = analyticalApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductSpecificationsProductById: { providesTags: [byProduct] },
    postApiV1ProductSpecifications: { invalidatesTags: (_result, error) => error ? [] : [byProduct] },
    putApiV1ProductSpecificationsById: { invalidatesTags: (_result, error) => error ? [] : [byProduct] },
  },
});

export const {
  useGetApiV1ProductSpecificationsProductByIdQuery, usePostApiV1ProductSpecificationsMutation, usePutApiV1ProductSpecificationsByIdMutation,
} = specificationApi;
export const { useLazyGetApiV1FormQuery } = formsApi;
export const { useLazyGetApiV1ConfigurationByModelTypeCountQuery } = settingsApi;
