import { analyticalApi } from "@/shared/api/generated/analytical";
import { authApi } from "@/shared/api/generated/auth";
import { identityApi } from "@/shared/api/generated/identity";
import { materialsApi } from "@/shared/api/generated/materials";
import { productsApi } from "@/shared/api/generated/products";
import { settingsApi } from "@/shared/api/generated/settings";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "ProductList" as const, id: "all" };

export const productApi = productsApi.enhanceEndpoints({
  endpoints: {
    getApiV1Product: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProductByProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "Product", id: arg.productId }]); },
    postApiV1Product: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list]); },
    putApiV1ProductByProductId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, { type: "Product", id: arg.productId }]); },
    getApiV1ProductByProductIdBom: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "ProductBom", id: arg.productId }]); },
    putApiV1ProductByProductIdBomArchive: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [
      { type: "ProductBom", id: arg.productId }, { type: "Product", id: arg.productId },
    ]); },
    putApiV1ProductPackageDescriptionByProductId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [{ type: "Product", id: arg.productId }]); },
    getApiV1ProductByProductIdRoutes: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "ProductRoutes", id: arg.productId }]); },
    postApiV1ProductByProductIdRoutes: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [
      { type: "ProductRoutes", id: arg.productId }, { type: "Product", id: arg.productId },
    ]); },
    getApiV1ProductByProductIdPackages: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "ProductPackages", id: arg.productId }]); },
    postApiV1ProductByProductIdPackages: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [
      { type: "ProductPackages", id: arg.productId }, { type: "Product", id: arg.productId },
    ]); },
    getApiV1ProductByProductIdPacking: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "ProductPacking", id: arg.productId }]); },
    postApiV1ProductByProductIdPacking: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [
      { type: "ProductPacking", id: arg.productId }, { type: "Product", id: arg.productId },
    ]); },
  },
});

// Verifying ("checking") a product is the shared verification endpoint; it changes the product and its list entry.
export const verificationApi = authApi.enhanceEndpoints({
  endpoints: {
    postApiV1Verification: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [
      list, ...(arg.sharedRequestsVerifyRequest.modelId ? [{ type: "Product" as const, id: arg.sharedRequestsVerifyRequest.modelId }] : []),
    ]); },
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
    postApiV1Bom: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => {
      const productId = arg.domainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest.productId;
      return error || !productId ? [] : [{ type: "ProductBom", id: productId }, { type: "Product", id: productId }];
    }); },
  },
});
export const { usePostApiV1BomMutation, useLazyGetApiV1MaterialDepartmentQuery } = bomApi;
