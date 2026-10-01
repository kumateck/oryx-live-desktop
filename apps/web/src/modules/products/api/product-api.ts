import { authApi } from "@/shared/api/generated/auth";
import { productsApi } from "@/shared/api/generated/products";

const list = { type: "ProductList" as const, id: "all" };

export const productApi = productsApi.enhanceEndpoints({
  endpoints: {
    getApiV1Product: { providesTags: [list] },
  },
});

// Verifying ("checking") a product is the shared verification endpoint; it changes the product list.
export const verificationApi = authApi.enhanceEndpoints({
  endpoints: {
    postApiV1Verification: { invalidatesTags: (_result, error) => error ? [] : [list] },
  },
});

export const { useGetApiV1ProductQuery } = productApi;
export const { usePostApiV1VerificationMutation } = verificationApi;
