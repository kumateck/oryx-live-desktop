import { analyticalApi } from "@/shared/api/generated/analytical";
import { authApi } from "@/shared/api/generated/auth";
import { productsApi } from "@/shared/api/generated/products";

const list = { type: "ProductList" as const, id: "all" };

export const productApi = productsApi.enhanceEndpoints({
  endpoints: {
    getApiV1Product: { providesTags: [list] },
    getApiV1ProductByProductId: { providesTags: (_result, _error, arg) => [{ type: "Product", id: arg.productId }] },
  },
});

// Verifying ("checking") a product is the shared verification endpoint; it changes the product and its list entry.
export const verificationApi = authApi.enhanceEndpoints({
  endpoints: {
    postApiV1Verification: { invalidatesTags: (_result, error, arg) => error ? [] : [
      list, ...(arg.sharedRequestsVerifyRequest.modelId ? [{ type: "Product" as const, id: arg.sharedRequestsVerifyRequest.modelId }] : []),
    ] },
  },
});

export const { useGetApiV1ProductQuery, useGetApiV1ProductByProductIdQuery, useGetApiV1ProductByProductIdRoutesQuery } = productApi;
export const { usePostApiV1VerificationMutation } = verificationApi;
// Quality documents attached to a product, shown on its detail page.
export const {
  useGetApiV1ProductStpsByProductIdProductQuery,
  useGetApiV1ProductSpecificationsProductByIdQuery,
  useGetApiV1ProductArdProductByProductIdQuery,
} = analyticalApi;
