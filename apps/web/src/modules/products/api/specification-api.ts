import { analyticalApi } from "@/shared/api/generated/analytical";
import { formsApi } from "@/shared/api/generated/forms";
import { settingsApi } from "@/shared/api/generated/settings";
import { addTags } from "@/shared/api/add-tags";

const byProduct = { type: "ProductSpecification" as const, id: "by-product" };

export const specificationApi = analyticalApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductSpecificationsProductById: (definition) => { definition.providesTags = addTags(definition.providesTags, [byProduct]); },
    postApiV1ProductSpecifications: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [byProduct]); },
    putApiV1ProductSpecificationsById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [byProduct]); },
  },
});

export const {
  useGetApiV1ProductSpecificationsProductByIdQuery, usePostApiV1ProductSpecificationsMutation, usePutApiV1ProductSpecificationsByIdMutation,
} = specificationApi;
export const { useLazyGetApiV1FormQuery } = formsApi;
export const { useLazyGetApiV1ConfigurationByModelTypeCountQuery } = settingsApi;
