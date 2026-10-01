import { analyticalApi } from "@/shared/api/generated/analytical";
import { authApi } from "@/shared/api/generated/auth";
import { identityApi } from "@/shared/api/generated/identity";
import { materialsApi } from "@/shared/api/generated/materials";
import { productsApi } from "@/shared/api/generated/products";
import { settingsApi } from "@/shared/api/generated/settings";

const list = { type: "ProductList" as const, id: "all" };

export const productApi = productsApi.enhanceEndpoints({
  endpoints: {
    getApiV1Product: { providesTags: [list] },
    getApiV1ProductByProductId: { providesTags: (_result, _error, arg) => [{ type: "Product", id: arg.productId }] },
    postApiV1Product: { invalidatesTags: (_result, error) => error ? [] : [list] },
    putApiV1ProductByProductId: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Product", id: arg.productId }] },
    getApiV1ProductByProductIdBom: { providesTags: (_result, _error, arg) => [{ type: "ProductBom", id: arg.productId }] },
    putApiV1ProductByProductIdBomArchive: { invalidatesTags: (_result, error, arg) => error ? [] : [
      { type: "ProductBom", id: arg.productId }, { type: "Product", id: arg.productId },
    ] },
    putApiV1ProductPackageDescriptionByProductId: { invalidatesTags: (_result, error, arg) => error ? [] : [{ type: "Product", id: arg.productId }] },
    getApiV1ProductByProductIdRoutes: { providesTags: (_result, _error, arg) => [{ type: "ProductRoutes", id: arg.productId }] },
    postApiV1ProductByProductIdRoutes: { invalidatesTags: (_result, error, arg) => error ? [] : [
      { type: "ProductRoutes", id: arg.productId }, { type: "Product", id: arg.productId },
    ] },
    getApiV1ProductByProductIdPackages: { providesTags: (_result, _error, arg) => [{ type: "ProductPackages", id: arg.productId }] },
    postApiV1ProductByProductIdPackages: { invalidatesTags: (_result, error, arg) => error ? [] : [
      { type: "ProductPackages", id: arg.productId }, { type: "Product", id: arg.productId },
    ] },
    getApiV1ProductByProductIdPacking: { providesTags: (_result, _error, arg) => [{ type: "ProductPacking", id: arg.productId }] },
    postApiV1ProductByProductIdPacking: { invalidatesTags: (_result, error, arg) => error ? [] : [
      { type: "ProductPacking", id: arg.productId }, { type: "Product", id: arg.productId },
    ] },
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

export const {
  useGetApiV1ProductQuery, useGetApiV1ProductByProductIdQuery, useGetApiV1ProductByProductIdRoutesQuery,
  usePostApiV1ProductMutation, usePutApiV1ProductByProductIdMutation, useGetApiV1ProductEquipmentAllQuery,
  useGetApiV1ProductByProductIdPackingQuery, usePostApiV1ProductByProductIdPackingMutation,
  useGetApiV1ProductByProductIdPackagesQuery, usePostApiV1ProductByProductIdPackagesMutation,
  usePutApiV1ProductPackageDescriptionByProductIdMutation, usePostApiV1ProductByProductIdRoutesMutation, useLazyGetApiV1ProductQuery,
  useGetApiV1ProductByProductIdBomQuery, usePutApiV1ProductByProductIdBomArchiveMutation,
} = productApi;
export const { usePostApiV1VerificationMutation } = verificationApi;
// Quality documents attached to a product, shown on its detail page.
export const {
  useGetApiV1ProductStpsByProductIdProductQuery,
  useGetApiV1ProductSpecificationsProductByIdQuery,
  useGetApiV1ProductArdProductByProductIdQuery,
  useGetApiV1MaterialSpecificationsMaterialByMaterialIdQuery,
} = analyticalApi;
// Reference lists the product form chooses from.
export const { useGetApiV1DepartmentQuery } = identityApi;
export const { usePostApiV1CollectionMutation, usePostApiV1CollectionUomPaginatedMutation, useGetApiV1CollectionOperationsQuery } = settingsApi;

// Saving a bill of materials is a materials endpoint; it changes the product it belongs to.
export const bomApi = materialsApi.enhanceEndpoints({
  endpoints: {
    postApiV1Bom: { invalidatesTags: (_result, error, arg) => {
      const productId = arg.domainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest.productId;
      return error || !productId ? [] : [{ type: "ProductBom", id: productId }, { type: "Product", id: productId }];
    } },
  },
});
export const { usePostApiV1BomMutation, useLazyGetApiV1MaterialDepartmentQuery } = bomApi;
