import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1Product: build.mutation<
      PostApiV1ProductApiResponse,
      PostApiV1ProductApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product`,
        method: "POST",
        body: queryArg.domainEntitiesProductsCreateProductRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Product: build.query<
      GetApiV1ProductApiResponse,
      GetApiV1ProductApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          departmentId: queryArg.departmentId,
          division: queryArg.division,
          category: queryArg.category,
          isVerified: queryArg.isVerified,
        },
      }),
    }),
    getApiV1ProductByProductId: build.query<
      GetApiV1ProductByProductIdApiResponse,
      GetApiV1ProductByProductIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductByProductId: build.mutation<
      PutApiV1ProductByProductIdApiResponse,
      PutApiV1ProductByProductIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductsUpdateProductRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductByProductId: build.mutation<
      DeleteApiV1ProductByProductIdApiResponse,
      DeleteApiV1ProductByProductIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductCategories: build.query<
      GetApiV1ProductCategoriesApiResponse,
      GetApiV1ProductCategoriesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/categories`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductPackageDescriptionByProductId: build.mutation<
      PutApiV1ProductPackageDescriptionByProductIdApiResponse,
      PutApiV1ProductPackageDescriptionByProductIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/package-description/${queryArg.productId}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductsUpdateProductPackageDescriptionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductByProductIdBom: build.query<
      GetApiV1ProductByProductIdBomApiResponse,
      GetApiV1ProductByProductIdBomApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}/bom`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductByProductIdRoutes: build.mutation<
      PostApiV1ProductByProductIdRoutesApiResponse,
      PostApiV1ProductByProductIdRoutesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}/routes`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductByProductIdRoutes: build.query<
      GetApiV1ProductByProductIdRoutesApiResponse,
      GetApiV1ProductByProductIdRoutesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}/routes`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductRoutesByRouteId: build.query<
      GetApiV1ProductRoutesByRouteIdApiResponse,
      GetApiV1ProductRoutesByRouteIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/routes/${queryArg.routeId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductRoutesByRouteId: build.mutation<
      DeleteApiV1ProductRoutesByRouteIdApiResponse,
      DeleteApiV1ProductRoutesByRouteIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/routes/${queryArg.routeId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductByProductIdPackages: build.mutation<
      PostApiV1ProductByProductIdPackagesApiResponse,
      PostApiV1ProductByProductIdPackagesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}/packages`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductByProductIdPackages: build.query<
      GetApiV1ProductByProductIdPackagesApiResponse,
      GetApiV1ProductByProductIdPackagesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}/packages`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductByProductIdPacking: build.mutation<
      PostApiV1ProductByProductIdPackingApiResponse,
      PostApiV1ProductByProductIdPackingApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}/packing`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductByProductIdPacking: build.query<
      GetApiV1ProductByProductIdPackingApiResponse,
      GetApiV1ProductByProductIdPackingApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}/packing`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductPackagesByProductPackageId: build.query<
      GetApiV1ProductPackagesByProductPackageIdApiResponse,
      GetApiV1ProductPackagesByProductPackageIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/packages/${queryArg.productPackageId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductPackagesByProductPackageId: build.mutation<
      PutApiV1ProductPackagesByProductPackageIdApiResponse,
      PutApiV1ProductPackagesByProductPackageIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/packages/${queryArg.productPackageId}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductsCreateProductPackageRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductPackagesByProductPackageId: build.mutation<
      DeleteApiV1ProductPackagesByProductPackageIdApiResponse,
      DeleteApiV1ProductPackagesByProductPackageIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/packages/${queryArg.productPackageId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductByProductIdFinished: build.mutation<
      PostApiV1ProductByProductIdFinishedApiResponse,
      PostApiV1ProductByProductIdFinishedApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}/finished`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductByProductIdBomArchive: build.mutation<
      PutApiV1ProductByProductIdBomArchiveApiResponse,
      PutApiV1ProductByProductIdBomArchiveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/${queryArg.productId}/bom/archive`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductEquipment: build.mutation<
      PostApiV1ProductEquipmentApiResponse,
      PostApiV1ProductEquipmentApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/equipment`,
        method: "POST",
        body: queryArg.domainEntitiesProductsEquipmentsCreateEquipmentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductEquipment: build.query<
      GetApiV1ProductEquipmentApiResponse,
      GetApiV1ProductEquipmentApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/equipment`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1ProductEquipmentByEquipmentId: build.query<
      GetApiV1ProductEquipmentByEquipmentIdApiResponse,
      GetApiV1ProductEquipmentByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/equipment/${queryArg.equipmentId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductEquipmentByEquipmentId: build.mutation<
      PutApiV1ProductEquipmentByEquipmentIdApiResponse,
      PutApiV1ProductEquipmentByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/equipment/${queryArg.equipmentId}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductsEquipmentsCreateEquipmentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductEquipmentByEquipmentId: build.mutation<
      DeleteApiV1ProductEquipmentByEquipmentIdApiResponse,
      DeleteApiV1ProductEquipmentByEquipmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/equipment/${queryArg.equipmentId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductEquipmentAll: build.query<
      GetApiV1ProductEquipmentAllApiResponse,
      GetApiV1ProductEquipmentAllApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/equipment/all`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductDownloadStock: build.query<
      GetApiV1ProductDownloadStockApiResponse,
      GetApiV1ProductDownloadStockApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/download/stock`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          departmentDivision: queryArg.departmentDivision,
        },
      }),
    }),
    getApiV1ProductDownload: build.query<
      GetApiV1ProductDownloadApiResponse,
      GetApiV1ProductDownloadApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product/download`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          departmentDivision: queryArg.departmentDivision,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as productsApi };
export type PostApiV1ProductApiResponse = /** status 201 Created */ string;
export type PostApiV1ProductApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsCreateProductRequest: DomainEntitiesProductsCreateProductRequest;
};
export type GetApiV1ProductApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductListDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  departmentId?: string;
  division?: DomainEntitiesProductsDivision;
  category?: string;
  isVerified?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductByProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductDtoRead;
export type GetApiV1ProductByProductIdApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductByProductIdApiResponse = void;
export type PutApiV1ProductByProductIdApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsUpdateProductRequest: DomainEntitiesProductsUpdateProductRequest;
};
export type DeleteApiV1ProductByProductIdApiResponse = void;
export type DeleteApiV1ProductByProductIdApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductCategoriesApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductCategoryRead[];
export type GetApiV1ProductCategoriesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductPackageDescriptionByProductIdApiResponse = void;
export type PutApiV1ProductPackageDescriptionByProductIdApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsUpdateProductPackageDescriptionRequest: DomainEntitiesProductsUpdateProductPackageDescriptionRequest;
};
export type GetApiV1ProductByProductIdBomApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductBillOfMaterialDto;
export type GetApiV1ProductByProductIdBomApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductByProductIdRoutesApiResponse = void;
export type PostApiV1ProductByProductIdRoutesApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: DomainEntitiesRoutesCreateRouteRequest[];
};
export type GetApiV1ProductByProductIdRoutesApiResponse =
  /** status 200 OK */ DomainEntitiesRoutesRouteDtoRead[];
export type GetApiV1ProductByProductIdRoutesApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductRoutesByRouteIdApiResponse =
  /** status 200 OK */ DomainEntitiesRoutesRouteDtoRead;
export type GetApiV1ProductRoutesByRouteIdApiArg = {
  routeId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type DeleteApiV1ProductRoutesByRouteIdApiResponse = void;
export type DeleteApiV1ProductRoutesByRouteIdApiArg = {
  routeId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductByProductIdPackagesApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ProductByProductIdPackagesApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: DomainEntitiesProductsCreateProductPackageRequest[];
};
export type GetApiV1ProductByProductIdPackagesApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductPackageDto[];
export type GetApiV1ProductByProductIdPackagesApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductByProductIdPackingApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ProductByProductIdPackingApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: DomainEntitiesProductsCreateProductPacking[];
};
export type GetApiV1ProductByProductIdPackingApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductPackingDto[];
export type GetApiV1ProductByProductIdPackingApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductPackagesByProductPackageIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductPackageDto;
export type GetApiV1ProductPackagesByProductPackageIdApiArg = {
  productPackageId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductPackagesByProductPackageIdApiResponse = void;
export type PutApiV1ProductPackagesByProductPackageIdApiArg = {
  productPackageId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsCreateProductPackageRequest: DomainEntitiesProductsCreateProductPackageRequest;
};
export type DeleteApiV1ProductPackagesByProductPackageIdApiResponse = void;
export type DeleteApiV1ProductPackagesByProductPackageIdApiArg = {
  productPackageId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductByProductIdFinishedApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ProductByProductIdFinishedApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: DomainEntitiesProductsCreateFinishedProductRequest[];
};
export type PutApiV1ProductByProductIdBomArchiveApiResponse = void;
export type PutApiV1ProductByProductIdBomArchiveApiArg = {
  /** The ID of the Product for which the bom should be archived. */
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductEquipmentApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ProductEquipmentApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsEquipmentsCreateEquipmentRequest: DomainEntitiesProductsEquipmentsCreateEquipmentRequest;
};
export type GetApiV1ProductEquipmentApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsEquipmentsEquipmentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductEquipmentApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductEquipmentByEquipmentIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsEquipmentsEquipmentDto;
export type GetApiV1ProductEquipmentByEquipmentIdApiArg = {
  equipmentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductEquipmentByEquipmentIdApiResponse = void;
export type PutApiV1ProductEquipmentByEquipmentIdApiArg = {
  equipmentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsEquipmentsCreateEquipmentRequest: DomainEntitiesProductsEquipmentsCreateEquipmentRequest;
};
export type DeleteApiV1ProductEquipmentByEquipmentIdApiResponse = void;
export type DeleteApiV1ProductEquipmentByEquipmentIdApiArg = {
  equipmentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductEquipmentAllApiResponse =
  /** status 200 OK */ DomainEntitiesProductsEquipmentsEquipmentDto[];
export type GetApiV1ProductEquipmentAllApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductDownloadStockApiResponse =
  /** status 200 OK */ string;
export type GetApiV1ProductDownloadStockApiArg = {
  departmentId?: string;
  departmentDivision?: DomainEntitiesProductsDivision;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductDownloadApiResponse = /** status 200 OK */ string;
export type GetApiV1ProductDownloadApiArg = {
  departmentId?: string;
  departmentDivision?: DomainEntitiesProductsDivision;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
export type MicrosoftAspNetCoreMvcProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: JsonValue | undefined;
};
export type DomainEntitiesProductsCreateFinishedProductRequest = {
  name?: string | null;
  uoMId?: string;
  standardCost?: number;
  sellingPrice?: number;
  dosageForm?: string | null;
  strength?: string | null;
};
export type DomainEntitiesProductsDivision = 0 | 1;
export type DomainEntitiesProductsCreateProductRequest = {
  code?: string | null;
  name?: string | null;
  description?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  categoryId?: string;
  finishedProducts?:
    DomainEntitiesProductsCreateFinishedProductRequest[] | null;
  equipmentId?: string | null;
  baseQuantity?: number;
  baseUomId?: string | null;
  basePackingQuantity?: number;
  fullBatchSize?: number;
  basePackingUomId?: string | null;
  departmentId?: string | null;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  expectedYield?: number;
  documentNumber?: string | null;
  revisionNumber?: number;
};
export type SharedCollectionItemDto = {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  symbol?: string | null;
  uom?: string | null;
};
export type DomainEntitiesBaseUnitOfMeasureType = 0 | 1 | 2 | 3;
export type DomainEntitiesBaseUnitOfMeasureCategory = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesBaseUnitOfMeasureDto = {
  id?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isScalable?: boolean;
  isRawMaterial?: boolean;
  type?: DomainEntitiesBaseUnitOfMeasureType;
  category?: DomainEntitiesBaseUnitOfMeasureCategory;
  createdAt?: string;
};
export type SharedDepartmentType = 0 | 1 | 2;
export type DomainEntitiesDepartmentsDepartmentListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  type?: SharedDepartmentType;
  description?: string | null;
  division?: DomainEntitiesProductsDivision;
  parentDepartment?: SharedCollectionItemDto;
};
export type DomainEntitiesUsersUserDto = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isDisabled?: boolean;
  avatar?: string | null;
  createdAt?: string;
  signature?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
};
export type DomainEntitiesProductsEquipmentsEquipmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  equipmentNumber?: string | null;
  isStorage?: boolean;
  capacityQuantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  relevanceCheck?: boolean;
  department?: SharedCollectionItemDto;
  location?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};
export type DomainEntitiesProductsProductListDto = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  category?: SharedCollectionItemDto;
  baseQuantity?: number;
  fullBatchSize?: number;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentDto;
  department?: SharedCollectionItemDto;
  createdAt?: string;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  labelClaim?: string | null;
  isVerified?: boolean;
  documentNumber?: string | null;
  revisionNumber?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductListDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductsProductListDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialsMaterialKind = 0 | 1;
export type DomainEntitiesMaterialsMaterialCategoryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
};
export type DomainEntitiesMaterialSpecificationsMaterialSpecificationReducedDto =
  {
    id?: string;
    specificationNumber?: string | null;
  };
export type DomainEntitiesCountriesCountryDto = {
  id?: string;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
export type DomainEntitiesCurrenciesCurrencyDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isBaseCurrency?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierType = 0 | 1;
export type DomainEntitiesProcurementSuppliersSupplierStatus = 0 | 1 | 2;
export type DomainEntitiesProcurementSuppliersSupplierListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  approvedAt?: string | null;
  requalificationDueDate?: string | null;
};
export type DomainEntitiesProcurementManufacturersManufacturerListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  approvedAt?: string | null;
  validityDate?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
};
export type DomainEntitiesMaterialsMaterialDto = {
  id?: string;
  code?: string | null;
  pharmacopoeia?: string | null;
  name?: string | null;
  description?: string | null;
  alphabet?: string | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
  isUnlimited?: boolean;
  materialCategory?: DomainEntitiesMaterialsMaterialCategoryDto;
  specification?: DomainEntitiesMaterialSpecificationsMaterialSpecificationReducedDto;
  totalStock?: number;
  reservedStock?: number;
  suppliers?: DomainEntitiesProcurementSuppliersSupplierListDto[] | null;
  manufacturers?:
    DomainEntitiesProcurementManufacturersManufacturerListDto[] | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstituteDto = {
  id?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterialDto;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItemDto = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  materialType?: SharedCollectionItemDto;
  isSubstitutable?: boolean;
  grade?: string | null;
  casNumber?: string | null;
  baseQuantity?: number;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  order?: number;
  prescribedQuantity?: number;
  substitutes?:
    DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstituteDto[] | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialDto = {
  product?: SharedCollectionItemDto;
  version?: number;
  isActive?: boolean;
  items?: DomainEntitiesBillOfMaterialsBillOfMaterialItemDto[] | null;
};
export type DomainEntitiesProductsProductBillOfMaterialDto = {
  productId?: string;
  billOfMaterial?: DomainEntitiesBillOfMaterialsBillOfMaterialDto;
  version?: number;
  effectiveDate?: string;
  isActive?: boolean;
};
export type DomainEntitiesProductsProductPackingListDto = {
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  order?: number;
};
export type DomainEntitiesProductsProductPackingDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  packPerShipper?: number;
  basePackingUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  basePackingQuantity?: number;
  expectedYield?: number;
  isDefault?: boolean;
  packingLists?: DomainEntitiesProductsProductPackingListDto[] | null;
};
export type DomainEntitiesProductsProductPackageSubstituteDto = {
  id?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterialDto;
};
export type DomainEntitiesProductsProductPackageDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  materialThickness?: string | null;
  otherStandards?: string | null;
  baseQuantity?: number;
  unitCapacity?: number;
  directLinkMaterial?: SharedCollectionItemDto;
  packingExcessMargin?: number;
  prescribedQuantity?: number;
  loose?: number;
  productPacking?: DomainEntitiesProductsProductPackingDto;
  substitutes?: DomainEntitiesProductsProductPackageSubstituteDto[] | null;
};
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
};
export type DomainEntitiesQualityRoutinesAnalysisType = 0 | 1;
export type DomainEntitiesAnalyticalTestRequestsTestStage = 0 | 1 | 2;
export type DomainEntitiesFormsFormType = 0 | 1;
export type DomainEntitiesProductsEquipmentsQcEquipmentCategoryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesProductsEquipmentsQcEquipmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  equipmentId?: string | null;
  name?: string | null;
  qcEquipmentCategory?: DomainEntitiesProductsEquipmentsQcEquipmentCategoryDto;
  serialNumber?: string | null;
  make?: string | null;
  model?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  qualificationStatus?: DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus;
};
export type DomainEntitiesFormsQuestionType =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type DomainEntitiesFormsQuestionValidationType = 0 | 1 | 2 | 3;
export type DomainEntitiesFormsQuestionOptionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  question?: SharedCollectionItemDto;
  name?: string | null;
};
export type DomainEntitiesFormsQuestionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  label?: string | null;
  type?: DomainEntitiesFormsQuestionType;
  validation?: DomainEntitiesFormsQuestionValidationType;
  isMultiSelect?: boolean;
  reference?: string | null;
  description?: string | null;
  options?: DomainEntitiesFormsQuestionOptionDto[] | null;
};
export type DomainEntitiesFormsFormFieldDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  formSection?: SharedCollectionItemDto;
  question?: DomainEntitiesFormsQuestionDto;
  required?: boolean;
  description?: string | null;
  rank?: number;
};
export type DomainEntitiesFormsFormSectionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  form?: SharedCollectionItemDto;
  name?: string | null;
  description?: string | null;
  instrument?: DomainEntitiesProductsEquipmentsQcEquipmentDto;
  order?: number;
  fields?: DomainEntitiesFormsFormFieldDto[] | null;
  value?: string | null;
  groupName?: string | null;
  complies?: boolean;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
};
export type DomainEntitiesFormsFormResponseDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  responseId?: string;
  productionActivityStepId?: string | null;
  formField?: DomainEntitiesFormsFormFieldDto;
  sectionName?: string | null;
  complies?: boolean;
  value?: string | null;
  checkedBy?: DomainEntitiesUsersUserDto;
  checkedAt?: string | null;
  formulaGoverned?: boolean;
  formulaResultFinalized?: boolean;
  formulaExecutionId?: string | null;
  formulaDisplayResultsJson?: string | null;
};
export type DomainEntitiesFormsFormDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  type?: DomainEntitiesFormsFormType;
  sections?: DomainEntitiesFormsFormSectionDto[] | null;
  responses?: DomainEntitiesFormsFormResponseDto[] | null;
};
export type DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
    stpNumber?: string | null;
    product?: SharedCollectionItemDto;
    description?: string | null;
  };
export type DomainEntitiesQualityRoutinesCommercialCoaItemRequest = {
  formFieldId?: string;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
    analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
    specNumber?: string | null;
    stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
    description?: string | null;
    form?: DomainEntitiesFormsFormDto;
    productStandardTestProcedure?: DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto;
    isVerified?: boolean;
    coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItemRequest[] | null;
  };
export type DomainEntitiesRoutesOperationAction = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesRoutesRouteResponsibleUserDto = {
  user?: SharedCollectionItemDto;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteResponsibleRoleDto = {
  role?: SharedCollectionItemDto;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteWorkCenterDto = {
  workCenter?: SharedCollectionItemDto;
};
export type DomainEntitiesRoutesRouteDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  operation?: SharedCollectionItemDto;
  estimatedTime?: string | null;
  order?: number;
  responsibleUsers?: DomainEntitiesRoutesRouteResponsibleUserDto[] | null;
  responsibleRoles?: DomainEntitiesRoutesRouteResponsibleRoleDto[] | null;
  workCenters?: DomainEntitiesRoutesRouteWorkCenterDto[] | null;
  isCritical?: boolean;
};
export type DomainEntitiesRoutesRouteResourceDto = {
  resource?: SharedCollectionItemDto;
};
export type DomainEntitiesRoutesRouteDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  operation?: SharedCollectionItemDto;
  estimatedTime?: string | null;
  resources?: DomainEntitiesRoutesRouteResourceDto[] | null;
  order?: number;
  responsibleUsers?: DomainEntitiesRoutesRouteResponsibleUserDto[] | null;
  responsibleRoles?: DomainEntitiesRoutesRouteResponsibleRoleDto[] | null;
  workCenters?: DomainEntitiesRoutesRouteWorkCenterDto[] | null;
  isCritical?: boolean;
};
export type DomainEntitiesProductsProductDto = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  category?: SharedCollectionItemDto;
  baseQuantity?: number;
  fullBatchSize?: number;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentDto;
  department?: SharedCollectionItemDto;
  createdAt?: string;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  labelClaim?: string | null;
  isVerified?: boolean;
  documentNumber?: string | null;
  revisionNumber?: number;
  billOfMaterials?: DomainEntitiesProductsProductBillOfMaterialDto[] | null;
  currentBillOfMaterial?: DomainEntitiesProductsProductBillOfMaterialDto;
  outdatedBillOfMaterials?:
    DomainEntitiesProductsProductBillOfMaterialDto[] | null;
  packages?: DomainEntitiesProductsProductPackageDto[] | null;
  routes?: DomainEntitiesRoutesRouteDto[] | null;
  packings?: DomainEntitiesProductsProductPackingDto[] | null;
  createdBy?: SharedCollectionItemDto;
};
export type DomainEntitiesProductsProductDtoRead = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  category?: SharedCollectionItemDto;
  baseQuantity?: number;
  fullBatchSize?: number;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentDto;
  department?: SharedCollectionItemDto;
  createdAt?: string;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  labelClaim?: string | null;
  isVerified?: boolean;
  documentNumber?: string | null;
  revisionNumber?: number;
  billOfMaterials?: DomainEntitiesProductsProductBillOfMaterialDto[] | null;
  currentBillOfMaterial?: DomainEntitiesProductsProductBillOfMaterialDto;
  outdatedBillOfMaterials?:
    DomainEntitiesProductsProductBillOfMaterialDto[] | null;
  packages?: DomainEntitiesProductsProductPackageDto[] | null;
  routes?: DomainEntitiesRoutesRouteDtoRead[] | null;
  packings?: DomainEntitiesProductsProductPackingDto[] | null;
  createdBy?: SharedCollectionItemDto;
};
export type DomainEntitiesProductsUpdateProductRequest = {
  code?: string | null;
  name?: string | null;
  description?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  categoryId?: string;
  finishedProducts?:
    DomainEntitiesProductsCreateFinishedProductRequest[] | null;
  equipmentId?: string | null;
  baseQuantity?: number;
  baseUomId?: string | null;
  basePackingQuantity?: number;
  fullBatchSize?: number;
  basePackingUomId?: string | null;
  departmentId?: string | null;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  expectedYield?: number;
  documentNumber?: string | null;
  revisionNumber?: number;
};
export type DomainEntitiesMaterialsMaterialCategory = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
};
export type DomainEntitiesMaterialsMaterialCategoryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
};
export type DomainEntitiesMaterialsBatchKind = 0 | 1;
export type DomainEntitiesBaseUnitOfMeasure = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isScalable?: boolean;
  isRawMaterial?: boolean;
  type?: DomainEntitiesBaseUnitOfMeasureType;
  category?: DomainEntitiesBaseUnitOfMeasureCategory;
};
export type DomainEntitiesBaseUnitOfMeasureRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isScalable?: boolean;
  isRawMaterial?: boolean;
  type?: DomainEntitiesBaseUnitOfMeasureType;
  category?: DomainEntitiesBaseUnitOfMeasureCategory;
};
export type DomainEntitiesMaterialsMaterialDepartment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  density?: number;
  densityUoMId?: string | null;
  densityUoM?: DomainEntitiesBaseUnitOfMeasure;
  reOrderLevel?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
};
export type DomainEntitiesMaterialsMaterialDepartmentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  density?: number;
  densityUoMId?: string | null;
  densityUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  reOrderLevel?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
};
export type DomainEntitiesMaterialsMaterial = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  pharmacopoeia?: string | null;
  alphabet?: string | null;
  materialCategoryId?: string | null;
  materialCategory?: DomainEntitiesMaterialsMaterialCategory;
  batches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
  status?: DomainEntitiesMaterialsBatchKind;
  isUnlimited?: boolean;
  departments?: DomainEntitiesMaterialsMaterialDepartment[] | null;
};
export type DomainEntitiesMaterialsMaterialRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  pharmacopoeia?: string | null;
  alphabet?: string | null;
  materialCategoryId?: string | null;
  materialCategory?: DomainEntitiesMaterialsMaterialCategoryRead;
  batches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
  status?: DomainEntitiesMaterialsBatchKind;
  isUnlimited?: boolean;
  totalStock?: number;
  departments?: DomainEntitiesMaterialsMaterialDepartmentRead[] | null;
};
export type DomainEntitiesBaseProductionStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesProductionSchedulesProductionSchedule = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  status?: DomainEntitiesBaseProductionStatus;
  remarks?: string | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  products?:
    DomainEntitiesProductionSchedulesProductionScheduleProduct[] | null;
};
export type DomainEntitiesProductionSchedulesProductionScheduleRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  status?: DomainEntitiesBaseProductionStatus;
  remarks?: string | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  products?:
    DomainEntitiesProductionSchedulesProductionScheduleProduct[] | null;
};
export type DomainEntitiesProductsEquipmentsEquipment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  equipmentNumber?: string | null;
  isStorage?: boolean;
  capacityQuantity?: number;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  relevanceCheck?: boolean;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  location?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};
export type DomainEntitiesProductsEquipmentsEquipmentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  equipmentNumber?: string | null;
  isStorage?: boolean;
  capacityQuantity?: number;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  relevanceCheck?: boolean;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  location?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};
export type DomainEntitiesProductsFinishedProduct = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  standardCost?: number;
  sellingPrice?: number;
  dosageForm?: string | null;
  strength?: string | null;
};
export type DomainEntitiesProductsFinishedProductRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  standardCost?: number;
  sellingPrice?: number;
  dosageForm?: string | null;
  strength?: string | null;
};
export type DomainEntitiesMaterialsMaterialType = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesMaterialsMaterialTypeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstitute = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  billOfMaterialItemId?: string;
  billOfMaterialItem?: DomainEntitiesBillOfMaterialsBillOfMaterialItem;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterial;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstituteRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  billOfMaterialItemId?: string;
  billOfMaterialItem?: DomainEntitiesBillOfMaterialsBillOfMaterialItem;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterialRead;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  billOfMaterialId?: string;
  billOfMaterial?: DomainEntitiesBillOfMaterialsBillOfMaterial;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  materialTypeId?: string | null;
  materialType?: DomainEntitiesMaterialsMaterialType;
  grade?: string | null;
  casNumber?: string | null;
  order?: number;
  isSubstitutable?: boolean;
  baseQuantity?: number;
  baseUoMId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasure;
  prescribedQuantity?: number;
  substitutes?:
    DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstitute[] | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  billOfMaterialId?: string;
  billOfMaterial?: DomainEntitiesBillOfMaterialsBillOfMaterial;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  materialTypeId?: string | null;
  materialType?: DomainEntitiesMaterialsMaterialTypeRead;
  grade?: string | null;
  casNumber?: string | null;
  order?: number;
  isSubstitutable?: boolean;
  baseQuantity?: number;
  baseUoMId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  prescribedQuantity?: number;
  substitutes?:
    DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstituteRead[] | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterial = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  version?: number;
  isActive?: boolean;
  items?: DomainEntitiesBillOfMaterialsBillOfMaterialItem[] | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  version?: number;
  isActive?: boolean;
  items?: DomainEntitiesBillOfMaterialsBillOfMaterialItemRead[] | null;
};
export type DomainEntitiesProductsProductBillOfMaterial = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  billOfMaterialId?: string;
  billOfMaterial?: DomainEntitiesBillOfMaterialsBillOfMaterial;
  quantity?: number;
  version?: number;
  effectiveDate?: string;
  isActive?: boolean;
};
export type DomainEntitiesProductsProductBillOfMaterialRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  billOfMaterialId?: string;
  billOfMaterial?: DomainEntitiesBillOfMaterialsBillOfMaterialRead;
  quantity?: number;
  version?: number;
  effectiveDate?: string;
  isActive?: boolean;
};
export type DomainEntitiesProductsProductPackingList = {
  uomId?: string;
  uom?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  order?: number;
};
export type DomainEntitiesProductsProductPacking = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  name?: string | null;
  description?: string | null;
  packPerShipper?: number;
  basePackingUomId?: string | null;
  basePackingUoM?: DomainEntitiesBaseUnitOfMeasure;
  basePackingQuantity?: number;
  expectedYield?: number;
  isDefault?: boolean;
  packingLists?: DomainEntitiesProductsProductPackingList[] | null;
};
export type DomainEntitiesProductsProductPackingRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  name?: string | null;
  description?: string | null;
  packPerShipper?: number;
  basePackingUomId?: string | null;
  basePackingUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  basePackingQuantity?: number;
  expectedYield?: number;
  isDefault?: boolean;
  packingLists?: DomainEntitiesProductsProductPackingList[] | null;
};
export type DomainEntitiesProductsProductPackageSubstitute = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productPackageId?: string;
  productPackage?: DomainEntitiesProductsProductPackage;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterial;
};
export type DomainEntitiesProductsProductPackageSubstituteRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productPackageId?: string;
  productPackage?: DomainEntitiesProductsProductPackage;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterialRead;
};
export type DomainEntitiesProductsProductPackage = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  materialThickness?: string | null;
  otherStandards?: string | null;
  baseQuantity?: number;
  unitCapacity?: number;
  directLinkMaterialId?: string | null;
  directLinkMaterial?: DomainEntitiesMaterialsMaterial;
  packingExcessMargin?: number;
  prescribedQuantity?: number;
  loose?: number;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPacking;
  substitutes?: DomainEntitiesProductsProductPackageSubstitute[] | null;
};
export type DomainEntitiesProductsProductPackageRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  materialThickness?: string | null;
  otherStandards?: string | null;
  baseQuantity?: number;
  unitCapacity?: number;
  directLinkMaterialId?: string | null;
  directLinkMaterial?: DomainEntitiesMaterialsMaterialRead;
  packingExcessMargin?: number;
  prescribedQuantity?: number;
  loose?: number;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPackingRead;
  substitutes?: DomainEntitiesProductsProductPackageSubstituteRead[] | null;
};
export type DomainEntitiesBaseOperation = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  order?: number;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
};
export type DomainEntitiesBaseOperationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  order?: number;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentCategory = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentCategoryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
};
export type DomainEntitiesAttachmentsAttachment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  modelId?: string;
  modelType?: string | null;
  reference?: string | null;
  name?: string | null;
};
export type DomainEntitiesAttachmentsAttachmentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  modelId?: string;
  modelType?: string | null;
  reference?: string | null;
  name?: string | null;
};
export type DomainEntitiesProductsEquipmentsQcEquipment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  equipmentId?: string | null;
  name?: string | null;
  qcEquipmentCategoryId?: string;
  qcEquipmentCategory?: DomainEntitiesProductsEquipmentsQcEquipmentCategory;
  serialNumber?: string | null;
  make?: string | null;
  model?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  calibrationCertificateAttachment?: DomainEntitiesAttachmentsAttachment;
  qualificationStatus?: DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  equipmentId?: string | null;
  name?: string | null;
  qcEquipmentCategoryId?: string;
  qcEquipmentCategory?: DomainEntitiesProductsEquipmentsQcEquipmentCategoryRead;
  serialNumber?: string | null;
  make?: string | null;
  model?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  calibrationCertificateAttachment?: DomainEntitiesAttachmentsAttachmentRead;
  qualificationStatus?: DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus;
};
export type DomainEntitiesFormsQuestionOption = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  questionId?: string;
  question?: DomainEntitiesFormsQuestion;
  name?: string | null;
};
export type DomainEntitiesFormsQuestionOptionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  questionId?: string;
  question?: DomainEntitiesFormsQuestion;
  name?: string | null;
};
export type DomainEntitiesFormsQuestion = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  label?: string | null;
  type?: DomainEntitiesFormsQuestionType;
  validation?: DomainEntitiesFormsQuestionValidationType;
  options?: DomainEntitiesFormsQuestionOption[] | null;
  isMultiSelect?: boolean;
  reference?: string | null;
  description?: string | null;
};
export type DomainEntitiesFormsQuestionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  label?: string | null;
  type?: DomainEntitiesFormsQuestionType;
  validation?: DomainEntitiesFormsQuestionValidationType;
  options?: DomainEntitiesFormsQuestionOptionRead[] | null;
  isMultiSelect?: boolean;
  reference?: string | null;
  description?: string | null;
};
export type DomainEntitiesFormsFormField = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formSectionId?: string;
  formSection?: DomainEntitiesFormsFormSection;
  questionId?: string;
  question?: DomainEntitiesFormsQuestion;
  required?: boolean;
  description?: string | null;
  rank?: number;
};
export type DomainEntitiesFormsFormFieldRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formSectionId?: string;
  formSection?: DomainEntitiesFormsFormSection;
  questionId?: string;
  question?: DomainEntitiesFormsQuestionRead;
  required?: boolean;
  description?: string | null;
  rank?: number;
};
export type DomainEntitiesFormulasFormRevisionStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesFormulasFormulaDefinition = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  key?: string | null;
  name?: string | null;
  presentationPreset?: string | null;
  revisions?: DomainEntitiesFormulasFormulaRevision[] | null;
};
export type DomainEntitiesFormulasFormulaDefinitionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  key?: string | null;
  name?: string | null;
  presentationPreset?: string | null;
  revisions?: DomainEntitiesFormulasFormulaRevision[] | null;
};
export type DomainEntitiesFormulasFormulaRevisionStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesFormulasFormulaRevision = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formulaDefinitionId?: string;
  formulaDefinition?: DomainEntitiesFormulasFormulaDefinition;
  revision?: number;
  definitionJson?: string | null;
  testCasesJson?: string | null;
  authoringPayloadJson?: string | null;
  authoringPayloadHash?: string | null;
  definitionHash?: string | null;
  releaseEvidenceHash?: string | null;
  formulaLanguageVersion?: string | null;
  numericPolicyVersion?: string | null;
  status?: DomainEntitiesFormulasFormulaRevisionStatus;
  reviewedById?: string | null;
  reviewedBy?: DomainEntitiesUsersUser;
  reviewedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  approvedAt?: string | null;
  effectiveAt?: string | null;
  retiredAt?: string | null;
};
export type DomainEntitiesFormulasFormulaRevisionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formulaDefinitionId?: string;
  formulaDefinition?: DomainEntitiesFormulasFormulaDefinitionRead;
  revision?: number;
  definitionJson?: string | null;
  testCasesJson?: string | null;
  authoringPayloadJson?: string | null;
  authoringPayloadHash?: string | null;
  definitionHash?: string | null;
  releaseEvidenceHash?: string | null;
  formulaLanguageVersion?: string | null;
  numericPolicyVersion?: string | null;
  status?: DomainEntitiesFormulasFormulaRevisionStatus;
  reviewedById?: string | null;
  reviewedBy?: DomainEntitiesUsersUser;
  reviewedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  approvedAt?: string | null;
  effectiveAt?: string | null;
  retiredAt?: string | null;
};
export type DomainEntitiesFormulasFormFieldFormulaConfiguration = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formFieldRevisionId?: string;
  formFieldRevision?: DomainEntitiesFormulasFormFieldRevision;
  formulaRevisionId?: string;
  formulaRevision?: DomainEntitiesFormulasFormulaRevision;
  bindingsJson?: string | null;
  resultTargetsJson?: string | null;
  displayPolicyJson?: string | null;
  methodReference?: string | null;
  configurationHash?: string | null;
};
export type DomainEntitiesFormulasFormFieldFormulaConfigurationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formFieldRevisionId?: string;
  formFieldRevision?: DomainEntitiesFormulasFormFieldRevision;
  formulaRevisionId?: string;
  formulaRevision?: DomainEntitiesFormulasFormulaRevisionRead;
  bindingsJson?: string | null;
  resultTargetsJson?: string | null;
  displayPolicyJson?: string | null;
  methodReference?: string | null;
  configurationHash?: string | null;
};
export type DomainEntitiesFormulasFormFieldRevision = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formRevisionId?: string;
  formRevision?: DomainEntitiesFormulasFormRevision;
  placementKey?: string | null;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormField;
  questionId?: string;
  question?: DomainEntitiesFormsQuestion;
  required?: boolean;
  rank?: number;
  description?: string | null;
  fieldHash?: string | null;
  formulaConfiguration?: DomainEntitiesFormulasFormFieldFormulaConfiguration;
};
export type DomainEntitiesFormulasFormFieldRevisionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formRevisionId?: string;
  formRevision?: DomainEntitiesFormulasFormRevision;
  placementKey?: string | null;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormFieldRead;
  questionId?: string;
  question?: DomainEntitiesFormsQuestionRead;
  required?: boolean;
  rank?: number;
  description?: string | null;
  fieldHash?: string | null;
  formulaConfiguration?: DomainEntitiesFormulasFormFieldFormulaConfigurationRead;
};
export type DomainEntitiesFormulasFormRevision = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  sequence?: number;
  status?: DomainEntitiesFormulasFormRevisionStatus;
  contentHash?: string | null;
  reviewedById?: string | null;
  reviewedBy?: DomainEntitiesUsersUser;
  reviewedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  approvedAt?: string | null;
  retiredAt?: string | null;
  fields?: DomainEntitiesFormulasFormFieldRevision[] | null;
};
export type DomainEntitiesFormulasFormRevisionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  sequence?: number;
  status?: DomainEntitiesFormulasFormRevisionStatus;
  contentHash?: string | null;
  reviewedById?: string | null;
  reviewedBy?: DomainEntitiesUsersUser;
  reviewedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  approvedAt?: string | null;
  retiredAt?: string | null;
  fields?: DomainEntitiesFormulasFormFieldRevisionRead[] | null;
};
export type DomainEntitiesGrnsStatus = 0 | 1 | 2;
export type DomainEntitiesGrnsGrn = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  remarks?: string | null;
  grnNumber?: string | null;
  declarationNumber?: string | null;
  status?: DomainEntitiesGrnsStatus;
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesGrnsGrnRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  remarks?: string | null;
  grnNumber?: string | null;
  declarationNumber?: string | null;
  status?: DomainEntitiesGrnsStatus;
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesMaterialSamplingMaterialSampling = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  arNumber?: string | null;
  issueNumber?: string | null;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedAt?: string | null;
  grnId?: string;
  grn?: DomainEntitiesGrnsGrn;
  chemicalArdId?: string | null;
  microbialArdId?: string | null;
  microbialRequired?: boolean;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  sampleQuantity?: number;
  sampleDate?: string;
};
export type DomainEntitiesMaterialSamplingMaterialSamplingRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  arNumber?: string | null;
  issueNumber?: string | null;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedAt?: string | null;
  grnId?: string;
  grn?: DomainEntitiesGrnsGrnRead;
  chemicalArdId?: string | null;
  microbialArdId?: string | null;
  microbialRequired?: boolean;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  sampleQuantity?: number;
  sampleDate?: string;
};
export type DomainEntitiesProductsProductionProductionActivityLog = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityId?: string;
  productionActivity?: DomainEntitiesProductsProductionProductionActivity;
  message?: string | null;
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  timestamp?: string;
};
export type DomainEntitiesProductsProductionProductionActivityLogRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityId?: string;
  productionActivity?: DomainEntitiesProductsProductionProductionActivity;
  message?: string | null;
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  timestamp?: string;
};
export type DomainEntitiesProductsProductionProductionActivity = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  steps?: DomainEntitiesProductsProductionProductionActivityStep[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string;
  completedAt?: string | null;
  activityLogs?: DomainEntitiesProductsProductionProductionActivityLog[] | null;
};
export type DomainEntitiesProductsProductionProductionActivityRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  steps?: DomainEntitiesProductsProductionProductionActivityStep[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string;
  completedAt?: string | null;
  activityLogs?:
    DomainEntitiesProductsProductionProductionActivityLogRead[] | null;
};
export type DomainEntitiesBaseResource = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: string | null;
  isAvailable?: boolean;
};
export type DomainEntitiesBaseResourceRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: string | null;
  isAvailable?: boolean;
};
export type DomainEntitiesProductsProductionProductionActivityStepResource = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  resourceId?: string;
  resource?: DomainEntitiesBaseResource;
};
export type DomainEntitiesProductsProductionProductionActivityStepResourceRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    productionActivityStepId?: string;
    productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
    resourceId?: string;
    resource?: DomainEntitiesBaseResourceRead;
  };
export type DomainEntitiesBaseWorkCenter = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesBaseWorkCenterRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesProductsProductionProductionActivityStepWorkCenter = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  workCenterId?: string;
  workCenter?: DomainEntitiesBaseWorkCenter;
};
export type DomainEntitiesProductsProductionProductionActivityStepWorkCenterRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    productionActivityStepId?: string;
    productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
    workCenterId?: string;
    workCenter?: DomainEntitiesBaseWorkCenterRead;
  };
export type DomainEntitiesProductStandardTestProceduresProductStandardTestProcedure =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stpNumber?: string | null;
    productId?: string;
    product?: DomainEntitiesProductsProduct;
    description?: string | null;
  };
export type DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stpNumber?: string | null;
    productId?: string;
    product?: DomainEntitiesProductsProduct;
    description?: string | null;
  };
export type DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedure =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stpNumber?: string | null;
    materialId?: string;
    material?: DomainEntitiesMaterialsMaterial;
    description?: string | null;
  };
export type DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stpNumber?: string | null;
    materialId?: string;
    material?: DomainEntitiesMaterialsMaterialRead;
    description?: string | null;
  };
export type DomainEntitiesUniformityOfWeightsUniformityOfWeightResponse = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  uniformityOfWeightId?: string;
  uniformityOfWeight?: DomainEntitiesUniformityOfWeightsUniformityOfWeight;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  weights?: number[] | null;
  mean?: number;
  standardDeviation?: number;
  minimumStandardDeviation?: number;
  maximumStandardDeviation?: number;
  maximumWeight?: number;
  minimumWeight?: number;
};
export type DomainEntitiesUniformityOfWeightsUniformityOfWeightResponseRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  uniformityOfWeightId?: string;
  uniformityOfWeight?: DomainEntitiesUniformityOfWeightsUniformityOfWeight;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  weights?: number[] | null;
  mean?: number;
  standardDeviation?: number;
  minimumStandardDeviation?: number;
  maximumStandardDeviation?: number;
  maximumWeight?: number;
  minimumWeight?: number;
};
export type DomainEntitiesInstrumentsInstrumentQualificationStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesInstrumentsInstrument = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  calibrationCertificateAttachment?: DomainEntitiesAttachmentsAttachment;
  qualificationStatus?: DomainEntitiesInstrumentsInstrumentQualificationStatus;
};
export type DomainEntitiesInstrumentsInstrumentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  calibrationCertificateAttachment?: DomainEntitiesAttachmentsAttachmentRead;
  qualificationStatus?: DomainEntitiesInstrumentsInstrumentQualificationStatus;
};
export type DomainEntitiesUniformityOfWeightsUniformityOfWeight = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  balanceNumber?: string | null;
  numberOfItems?: number;
  nominalWeight?: number;
  itemType?: string | null;
  responses?:
    DomainEntitiesUniformityOfWeightsUniformityOfWeightResponse[] | null;
  disintegrationTest?: string | null;
  disintegrationInstrumentId?: string | null;
  disintegrationInstrument?: DomainEntitiesInstrumentsInstrument;
  disintegrationMean?: number;
  hardnessTest?: string | null;
  hardnessInstrumentId?: string | null;
  hardnessInstrument?: DomainEntitiesInstrumentsInstrument;
  hardnessMean?: number;
};
export type DomainEntitiesUniformityOfWeightsUniformityOfWeightRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  balanceNumber?: string | null;
  numberOfItems?: number;
  nominalWeight?: number;
  itemType?: string | null;
  responses?:
    DomainEntitiesUniformityOfWeightsUniformityOfWeightResponseRead[] | null;
  disintegrationTest?: string | null;
  disintegrationInstrumentId?: string | null;
  disintegrationInstrument?: DomainEntitiesInstrumentsInstrumentRead;
  disintegrationMean?: number;
  hardnessTest?: string | null;
  hardnessInstrumentId?: string | null;
  hardnessInstrument?: DomainEntitiesInstrumentsInstrumentRead;
  hardnessMean?: number;
};
export type DomainEntitiesMaterialArdMaterialAnalyticalRawData = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  stpId?: string;
  materialStandardTestProcedure?: DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedure;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItem[] | null;
  uniformityOfWeightId?: string | null;
  uniformityOfWeight?: DomainEntitiesUniformityOfWeightsUniformityOfWeight;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesMaterialArdMaterialAnalyticalRawDataRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  stpId?: string;
  materialStandardTestProcedure?: DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureRead;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItem[] | null;
  uniformityOfWeightId?: string | null;
  uniformityOfWeight?: DomainEntitiesUniformityOfWeightsUniformityOfWeightRead;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesQualityRoutinesCommercialCoaItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialArdId?: string | null;
  materialArd?: DomainEntitiesMaterialArdMaterialAnalyticalRawData;
  productArdId?: string | null;
  productArd?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormField;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesQualityRoutinesCommercialCoaItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialArdId?: string | null;
  materialArd?: DomainEntitiesMaterialArdMaterialAnalyticalRawDataRead;
  productArdId?: string | null;
  productArd?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormFieldRead;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  stpId?: string;
  productStandardTestProcedure?: DomainEntitiesProductStandardTestProceduresProductStandardTestProcedure;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItem[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
    specNumber?: string | null;
    description?: string | null;
    stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
    stpId?: string;
    productStandardTestProcedure?: DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureRead;
    formId?: string;
    form?: DomainEntitiesFormsForm;
    coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItemRead[] | null;
    isVerified?: boolean;
    verifiedAt?: string | null;
    verifiedById?: string | null;
  };
export type DomainEntitiesProductsProductionProductionActivityStepUser = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesProductsProductionProductionActivityStepUserRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataRead;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesProductsProductionProductionActivityStep = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityId?: string;
  productionActivity?: DomainEntitiesProductsProductionProductionActivity;
  operationId?: string;
  operation?: DomainEntitiesBaseOperation;
  workflowId?: string | null;
  workFlow?: DomainEntitiesFormsForm;
  order?: number;
  resources?:
    DomainEntitiesProductsProductionProductionActivityStepResource[] | null;
  workCenters?:
    DomainEntitiesProductsProductionProductionActivityStepWorkCenter[] | null;
  responsibleUsers?:
    DomainEntitiesProductsProductionProductionActivityStepUser[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  isCritical?: boolean;
};
export type DomainEntitiesProductsProductionProductionActivityStepRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityId?: string;
  productionActivity?: DomainEntitiesProductsProductionProductionActivityRead;
  operationId?: string;
  operation?: DomainEntitiesBaseOperationRead;
  workflowId?: string | null;
  workFlow?: DomainEntitiesFormsForm;
  order?: number;
  resources?:
    DomainEntitiesProductsProductionProductionActivityStepResourceRead[] | null;
  workCenters?:
    | DomainEntitiesProductsProductionProductionActivityStepWorkCenterRead[]
    | null;
  responsibleUsers?:
    DomainEntitiesProductsProductionProductionActivityStepUserRead[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  isCritical?: boolean;
};
export type DomainEntitiesQualityRoutinesRoutineType = 0 | 1;
export type DomainEntitiesQualityRoutinesRoutineOrigin = 0 | 1;
export type DomainEntitiesQualityRoutinesRoutineCadence = 0 | 1;
export type DomainEntitiesQualityRoutinesRoutineDefinition = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  cadence?: DomainEntitiesQualityRoutinesRoutineCadence;
  isActive?: boolean;
  executions?: DomainEntitiesQualityRoutinesRoutineExecution[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineDefinitionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  cadence?: DomainEntitiesQualityRoutinesRoutineCadence;
  isActive?: boolean;
  executions?: DomainEntitiesQualityRoutinesRoutineExecution[] | null;
};
export type DomainEntitiesRndProjectsRndProjectStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesRolesRole = {
  id?: string;
  name?: string | null;
  normalizedName?: string | null;
  concurrencyStamp?: string | null;
  displayName?: string | null;
  createdAt?: string;
  createdById?: string | null;
  updatedAt?: string | null;
  lastUpdatedById?: string | null;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  type?: SharedDepartmentType;
  isManager?: boolean;
};
export type DomainEntitiesApprovalsApprovalStatus = 0 | 1 | 2;
export type DomainEntitiesApprovalsApprovalStage = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  id?: string;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
  order?: number;
  required?: boolean;
};
export type DomainEntitiesApprovalsApprovalStageRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  id?: string;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
  order?: number;
  required?: boolean;
};
export type DomainEntitiesApprovalsApproval = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  itemType?: string | null;
  escalationDuration?: string;
  approvalStages?: DomainEntitiesApprovalsApprovalStage[] | null;
};
export type DomainEntitiesApprovalsApprovalRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  itemType?: string | null;
  escalationDuration?: string;
  approvalStages?: DomainEntitiesApprovalsApprovalStageRead[] | null;
};
export type DomainEntitiesRndProjectsRndProjectApprovals = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProject;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
};
export type DomainEntitiesRndProjectsRndProjectApprovalsRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProject;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApprovalRead;
};
export type DomainEntitiesRndProjectsRndProject = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  productId?: string | null;
  product?: DomainEntitiesProductsProduct;
  title?: string | null;
  objective?: string | null;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  requestedById?: string;
  requestedBy?: DomainEntitiesUsersUser;
  status?: DomainEntitiesRndProjectsRndProjectStatus;
  targetLaunchDate?: string | null;
  qtppFormId?: string | null;
  qtppForm?: DomainEntitiesFormsForm;
  attachmentId?: string | null;
  attachment?: DomainEntitiesAttachmentsAttachment;
  approved?: boolean;
  approvals?: DomainEntitiesRndProjectsRndProjectApprovals[] | null;
};
export type DomainEntitiesRndProjectsRndProjectRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  productId?: string | null;
  product?: DomainEntitiesProductsProduct;
  title?: string | null;
  objective?: string | null;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  requestedById?: string;
  requestedBy?: DomainEntitiesUsersUser;
  status?: DomainEntitiesRndProjectsRndProjectStatus;
  targetLaunchDate?: string | null;
  qtppFormId?: string | null;
  qtppForm?: DomainEntitiesFormsForm;
  attachmentId?: string | null;
  attachment?: DomainEntitiesAttachmentsAttachmentRead;
  approved?: boolean;
  approvals?: DomainEntitiesRndProjectsRndProjectApprovalsRead[] | null;
};
export type DomainEntitiesRndFormulationsRndFormulationStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesRndFormulationsRndFormulationItemSubstitute = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndFormulationItemId?: string;
  rndFormulationItem?: DomainEntitiesRndFormulationsRndFormulationItem;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterial;
};
export type DomainEntitiesRndFormulationsRndFormulationItemSubstituteRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndFormulationItemId?: string;
  rndFormulationItem?: DomainEntitiesRndFormulationsRndFormulationItem;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterialRead;
};
export type DomainEntitiesRndFormulationsRndFormulationItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulation;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  materialTypeId?: string | null;
  materialType?: DomainEntitiesMaterialsMaterialType;
  grade?: string | null;
  casNumber?: string | null;
  order?: number;
  isSubstitutable?: boolean;
  baseQuantity?: number;
  baseUoMId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasure;
  prescribedQuantity?: number;
  percentage?: number | null;
  substitutes?:
    DomainEntitiesRndFormulationsRndFormulationItemSubstitute[] | null;
};
export type DomainEntitiesRndFormulationsRndFormulationItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulation;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  materialTypeId?: string | null;
  materialType?: DomainEntitiesMaterialsMaterialTypeRead;
  grade?: string | null;
  casNumber?: string | null;
  order?: number;
  isSubstitutable?: boolean;
  baseQuantity?: number;
  baseUoMId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  prescribedQuantity?: number;
  percentage?: number | null;
  substitutes?:
    DomainEntitiesRndFormulationsRndFormulationItemSubstituteRead[] | null;
};
export type DomainEntitiesRndFormulationsRndFormulationApprovals = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulation;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
};
export type DomainEntitiesRndFormulationsRndFormulationApprovalsRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulation;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApprovalRead;
};
export type DomainEntitiesRndFormulationsRndFormulation = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProject;
  version?: number;
  status?: DomainEntitiesRndFormulationsRndFormulationStatus;
  items?: DomainEntitiesRndFormulationsRndFormulationItem[] | null;
  approved?: boolean;
  approvals?: DomainEntitiesRndFormulationsRndFormulationApprovals[] | null;
};
export type DomainEntitiesRndFormulationsRndFormulationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProjectRead;
  version?: number;
  status?: DomainEntitiesRndFormulationsRndFormulationStatus;
  items?: DomainEntitiesRndFormulationsRndFormulationItemRead[] | null;
  approved?: boolean;
  approvals?: DomainEntitiesRndFormulationsRndFormulationApprovalsRead[] | null;
};
export type DomainEntitiesRndTrialBatchesRndTrialBatchScaleType = 0 | 1 | 2;
export type DomainEntitiesRndTrialBatchesRndTrialBatchStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesRndTrialBatchesRndTrialBatch = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProject;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulation;
  batchCode?: string | null;
  scaleType?: DomainEntitiesRndTrialBatchesRndTrialBatchScaleType;
  batchSize?: number;
  batchSizeUoMId?: string | null;
  batchSizeUoM?: DomainEntitiesBaseUnitOfMeasure;
  manufacturingDate?: string | null;
  performedById?: string | null;
  performedBy?: DomainEntitiesUsersUser;
  protocolFormId?: string | null;
  protocolForm?: DomainEntitiesFormsForm;
  status?: DomainEntitiesRndTrialBatchesRndTrialBatchStatus;
  observations?: string | null;
};
export type DomainEntitiesRndTrialBatchesRndTrialBatchRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProjectRead;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulationRead;
  batchCode?: string | null;
  scaleType?: DomainEntitiesRndTrialBatchesRndTrialBatchScaleType;
  batchSize?: number;
  batchSizeUoMId?: string | null;
  batchSizeUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  manufacturingDate?: string | null;
  performedById?: string | null;
  performedBy?: DomainEntitiesUsersUser;
  protocolFormId?: string | null;
  protocolForm?: DomainEntitiesFormsForm;
  status?: DomainEntitiesRndTrialBatchesRndTrialBatchStatus;
  observations?: string | null;
};
export type DomainEntitiesQualityRoutinesRoutineStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesQualityRoutinesRoutineAuditEvent = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineExecutionId?: string;
  routineExecution?: DomainEntitiesQualityRoutinesRoutineExecution;
  action?: string | null;
  detail?: string | null;
  occurredAt?: string;
  actorId?: string;
};
export type DomainEntitiesQualityRoutinesRoutineAuditEventRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineExecutionId?: string;
  routineExecution?: DomainEntitiesQualityRoutinesRoutineExecution;
  action?: string | null;
  detail?: string | null;
  occurredAt?: string;
  actorId?: string;
};
export type DomainEntitiesQualityRoutinesRoutineExecution = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineCode?: string | null;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  origin?: DomainEntitiesQualityRoutinesRoutineOrigin;
  cadence?: DomainEntitiesQualityRoutinesRoutineCadence;
  routineDefinitionId?: string | null;
  routineDefinition?: DomainEntitiesQualityRoutinesRoutineDefinition;
  periodStart?: string | null;
  periodEnd?: string | null;
  routineDate?: string;
  emergencyTrigger?: string | null;
  emergencyReason?: string | null;
  rndTrialBatchId?: string | null;
  rndTrialBatch?: DomainEntitiesRndTrialBatchesRndTrialBatch;
  doneById?: string | null;
  doneBy?: DomainEntitiesUsersUser;
  doneAt?: string | null;
  status?: DomainEntitiesQualityRoutinesRoutineStatus;
  samples?: DomainEntitiesQualityRoutinesRoutineSample[] | null;
  auditEvents?: DomainEntitiesQualityRoutinesRoutineAuditEvent[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineExecutionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineCode?: string | null;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  origin?: DomainEntitiesQualityRoutinesRoutineOrigin;
  cadence?: DomainEntitiesQualityRoutinesRoutineCadence;
  routineDefinitionId?: string | null;
  routineDefinition?: DomainEntitiesQualityRoutinesRoutineDefinitionRead;
  periodStart?: string | null;
  periodEnd?: string | null;
  routineDate?: string;
  emergencyTrigger?: string | null;
  emergencyReason?: string | null;
  rndTrialBatchId?: string | null;
  rndTrialBatch?: DomainEntitiesRndTrialBatchesRndTrialBatchRead;
  doneById?: string | null;
  doneBy?: DomainEntitiesUsersUser;
  doneAt?: string | null;
  status?: DomainEntitiesQualityRoutinesRoutineStatus;
  samples?: DomainEntitiesQualityRoutinesRoutineSample[] | null;
  auditEvents?: DomainEntitiesQualityRoutinesRoutineAuditEventRead[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineSample = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineExecutionId?: string;
  routineExecution?: DomainEntitiesQualityRoutinesRoutineExecution;
  samplingPoint?: string | null;
  areaName?: string | null;
  collectedAt?: string;
  tracks?: DomainEntitiesQualityRoutinesRoutineTrack[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineSampleRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineExecutionId?: string;
  routineExecution?: DomainEntitiesQualityRoutinesRoutineExecutionRead;
  samplingPoint?: string | null;
  areaName?: string | null;
  collectedAt?: string;
  tracks?: DomainEntitiesQualityRoutinesRoutineTrack[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineCoaItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineArdId?: string;
  routineArd?: DomainEntitiesQualityRoutinesRoutineArd;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormField;
  includeOnCoa?: boolean;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesQualityRoutinesRoutineCoaItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineArdId?: string;
  routineArd?: DomainEntitiesQualityRoutinesRoutineArd;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormFieldRead;
  includeOnCoa?: boolean;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesQualityRoutinesRoutineArd = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  coaItems?: DomainEntitiesQualityRoutinesRoutineCoaItem[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineArdRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  coaItems?: DomainEntitiesQualityRoutinesRoutineCoaItemRead[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineTrack = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineSampleId?: string;
  routineSample?: DomainEntitiesQualityRoutinesRoutineSample;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  routineArdId?: string;
  routineArd?: DomainEntitiesQualityRoutinesRoutineArd;
  formId?: string;
  formRevisionId?: string | null;
  worksheetFinalizedAt?: string | null;
  worksheetFinalizedById?: string | null;
  response?: DomainEntitiesFormsResponse;
  coaItemsSnapshotJson?: string | null;
};
export type DomainEntitiesQualityRoutinesRoutineTrackRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineSampleId?: string;
  routineSample?: DomainEntitiesQualityRoutinesRoutineSampleRead;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  routineArdId?: string;
  routineArd?: DomainEntitiesQualityRoutinesRoutineArdRead;
  formId?: string;
  formRevisionId?: string | null;
  worksheetFinalizedAt?: string | null;
  worksheetFinalizedById?: string | null;
  response?: DomainEntitiesFormsResponse;
  coaItemsSnapshotJson?: string | null;
};
export type DomainEntitiesFormsFormResponse = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormField;
  formFieldRevisionId?: string | null;
  formFieldRevision?: DomainEntitiesFormulasFormFieldRevision;
  value?: string | null;
  complies?: boolean | null;
};
export type DomainEntitiesFormsFormResponseRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormFieldRead;
  formFieldRevisionId?: string | null;
  formFieldRevision?: DomainEntitiesFormulasFormFieldRevisionRead;
  value?: string | null;
  complies?: boolean | null;
};
export type DomainEntitiesFormulasFormulaSnapshotReason = 0 | 1 | 2;
export type DomainEntitiesFormulasResponseFormulaSnapshot = {
  id?: string;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  placementKey?: string | null;
  sequence?: number;
  formulaRevisionId?: string;
  formulaRevision?: DomainEntitiesFormulasFormulaRevision;
  definitionHash?: string | null;
  configurationHash?: string | null;
  executableDefinitionJson?: string | null;
  bindingsJson?: string | null;
  resultTargetsJson?: string | null;
  tableShapeJson?: string | null;
  calculationPolicyJson?: string | null;
  displayPolicyJson?: string | null;
  methodReference?: string | null;
  supersedesSnapshotId?: string | null;
  supersedesSnapshot?: DomainEntitiesFormulasResponseFormulaSnapshot;
  reason?: DomainEntitiesFormulasFormulaSnapshotReason;
  approvalReference?: string | null;
  capturedById?: string;
  capturedBy?: DomainEntitiesUsersUser;
  capturedAt?: string;
};
export type DomainEntitiesFormulasResponseFormulaSnapshotRead = {
  id?: string;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  placementKey?: string | null;
  sequence?: number;
  formulaRevisionId?: string;
  formulaRevision?: DomainEntitiesFormulasFormulaRevisionRead;
  definitionHash?: string | null;
  configurationHash?: string | null;
  executableDefinitionJson?: string | null;
  bindingsJson?: string | null;
  resultTargetsJson?: string | null;
  tableShapeJson?: string | null;
  calculationPolicyJson?: string | null;
  displayPolicyJson?: string | null;
  methodReference?: string | null;
  supersedesSnapshotId?: string | null;
  supersedesSnapshot?: DomainEntitiesFormulasResponseFormulaSnapshotRead;
  reason?: DomainEntitiesFormulasFormulaSnapshotReason;
  approvalReference?: string | null;
  capturedById?: string;
  capturedBy?: DomainEntitiesUsersUser;
  capturedAt?: string;
};
export type DomainEntitiesFormulasFormulaExecutionTrigger = 0 | 1 | 2 | 3;
export type DomainEntitiesFormulasFormulaExecutionAuthority = 0 | 1;
export type DomainEntitiesFormulasFormulaExecutionStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesFormulasFormulaExecution = {
  id?: string;
  responseFormulaSnapshotId?: string;
  responseFormulaSnapshot?: DomainEntitiesFormulasResponseFormulaSnapshot;
  supersedesExecutionId?: string | null;
  supersedesExecution?: DomainEntitiesFormulasFormulaExecution;
  trigger?: DomainEntitiesFormulasFormulaExecutionTrigger;
  authority?: DomainEntitiesFormulasFormulaExecutionAuthority;
  status?: DomainEntitiesFormulasFormulaExecutionStatus;
  engineVersion?: string | null;
  engineBuildHash?: string | null;
  formulaLanguageVersion?: string | null;
  numericPolicyVersion?: string | null;
  inputHash?: string | null;
  resultHash?: string | null;
  resolvedInputsJson?: string | null;
  rawResultsJson?: string | null;
  roundedResultsJson?: string | null;
  displayResultsJson?: string | null;
  calculationTraceJson?: string | null;
  idempotencyKey?: string | null;
  actorId?: string;
  actor?: DomainEntitiesUsersUser;
  executedAt?: string;
};
export type DomainEntitiesFormulasFormulaExecutionRead = {
  id?: string;
  responseFormulaSnapshotId?: string;
  responseFormulaSnapshot?: DomainEntitiesFormulasResponseFormulaSnapshotRead;
  supersedesExecutionId?: string | null;
  supersedesExecution?: DomainEntitiesFormulasFormulaExecutionRead;
  trigger?: DomainEntitiesFormulasFormulaExecutionTrigger;
  authority?: DomainEntitiesFormulasFormulaExecutionAuthority;
  status?: DomainEntitiesFormulasFormulaExecutionStatus;
  engineVersion?: string | null;
  engineBuildHash?: string | null;
  formulaLanguageVersion?: string | null;
  numericPolicyVersion?: string | null;
  inputHash?: string | null;
  resultHash?: string | null;
  resolvedInputsJson?: string | null;
  rawResultsJson?: string | null;
  roundedResultsJson?: string | null;
  displayResultsJson?: string | null;
  calculationTraceJson?: string | null;
  idempotencyKey?: string | null;
  actorId?: string;
  actor?: DomainEntitiesUsersUser;
  executedAt?: string;
};
export type DomainEntitiesFormulasResponseFormulaSubmissionExecution = {
  id?: string;
  responseFormulaSubmissionSetId?: string;
  responseFormulaSubmissionSet?: DomainEntitiesFormulasResponseFormulaSubmissionSet;
  formulaExecutionId?: string;
  formulaExecution?: DomainEntitiesFormulasFormulaExecution;
  placementKey?: string | null;
  ordinal?: number;
};
export type DomainEntitiesFormulasResponseFormulaSubmissionSet = {
  id?: string;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  sequence?: number;
  setHash?: string | null;
  inputAggregateHash?: string | null;
  configurationAggregateHash?: string | null;
  submittedById?: string;
  submittedBy?: DomainEntitiesUsersUser;
  submittedAt?: string;
  executions?:
    DomainEntitiesFormulasResponseFormulaSubmissionExecution[] | null;
};
export type DomainEntitiesFormulasResponseFormulaSubmissionSetRead = {
  id?: string;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  sequence?: number;
  setHash?: string | null;
  inputAggregateHash?: string | null;
  configurationAggregateHash?: string | null;
  submittedById?: string;
  submittedBy?: DomainEntitiesUsersUser;
  submittedAt?: string;
  executions?:
    DomainEntitiesFormulasResponseFormulaSubmissionExecution[] | null;
};
export type DomainEntitiesFormsResponseApproval = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  approvalRound?: number;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
  formulaSubmissionSetId?: string | null;
  formulaSubmissionSet?: DomainEntitiesFormulasResponseFormulaSubmissionSet;
};
export type DomainEntitiesFormsResponseApprovalRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  approvalRound?: number;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApprovalRead;
  formulaSubmissionSetId?: string | null;
  formulaSubmissionSet?: DomainEntitiesFormulasResponseFormulaSubmissionSetRead;
};
export type DomainEntitiesFormsResponse = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  formRevisionId?: string | null;
  formRevision?: DomainEntitiesFormulasFormRevision;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  materialSamplingId?: string | null;
  materialSampling?: DomainEntitiesMaterialSamplingMaterialSampling;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  routineTrackId?: string | null;
  routineTrack?: DomainEntitiesQualityRoutinesRoutineTrack;
  formResponses?: DomainEntitiesFormsFormResponse[] | null;
  approvals?: DomainEntitiesFormsResponseApproval[] | null;
  checkedById?: string | null;
  checkedBy?: DomainEntitiesUsersUser;
  checkedAt?: string | null;
  approved?: boolean;
  rejected?: boolean;
};
export type DomainEntitiesFormsResponseRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  formRevisionId?: string | null;
  formRevision?: DomainEntitiesFormulasFormRevisionRead;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  materialSamplingId?: string | null;
  materialSampling?: DomainEntitiesMaterialSamplingMaterialSamplingRead;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  routineTrackId?: string | null;
  routineTrack?: DomainEntitiesQualityRoutinesRoutineTrackRead;
  formResponses?: DomainEntitiesFormsFormResponseRead[] | null;
  approvals?: DomainEntitiesFormsResponseApprovalRead[] | null;
  checkedById?: string | null;
  checkedBy?: DomainEntitiesUsersUser;
  checkedAt?: string | null;
  approved?: boolean;
  rejected?: boolean;
};
export type DomainEntitiesMaterialSpecificationsMaterialSpecification = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  responseId?: string | null;
  response?: DomainEntitiesFormsResponse;
  formSections?: DomainEntitiesFormsFormSection[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesMaterialSpecificationsMaterialSpecificationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  responseId?: string | null;
  response?: DomainEntitiesFormsResponseRead;
  formSections?: DomainEntitiesFormsFormSection[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesProductSpecificationsProductSpecification = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  labelClaim?: string | null;
  packingStyle?: string | null;
  shelfLife?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  testStage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  responseId?: string | null;
  response?: DomainEntitiesFormsResponse;
  formSections?: DomainEntitiesFormsFormSection[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesProductSpecificationsProductSpecificationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  labelClaim?: string | null;
  packingStyle?: string | null;
  shelfLife?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  testStage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  responseId?: string | null;
  response?: DomainEntitiesFormsResponseRead;
  formSections?: DomainEntitiesFormsFormSection[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesFormsFormSection = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  name?: string | null;
  description?: string | null;
  instrumentId?: string | null;
  instrument?: DomainEntitiesProductsEquipmentsQcEquipment;
  order?: number;
  fields?: DomainEntitiesFormsFormField[] | null;
  value?: string | null;
  materialSpecificationId?: string | null;
  materialSpecification?: DomainEntitiesMaterialSpecificationsMaterialSpecification;
  productSpecificationId?: string | null;
  productSpecification?: DomainEntitiesProductSpecificationsProductSpecification;
  groupName?: string | null;
  complies?: boolean;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
};
export type DomainEntitiesFormsFormSectionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  name?: string | null;
  description?: string | null;
  instrumentId?: string | null;
  instrument?: DomainEntitiesProductsEquipmentsQcEquipmentRead;
  order?: number;
  fields?: DomainEntitiesFormsFormFieldRead[] | null;
  value?: string | null;
  materialSpecificationId?: string | null;
  materialSpecification?: DomainEntitiesMaterialSpecificationsMaterialSpecificationRead;
  productSpecificationId?: string | null;
  productSpecification?: DomainEntitiesProductSpecificationsProductSpecificationRead;
  groupName?: string | null;
  complies?: boolean;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
};
export type DomainEntitiesFormsFormFieldAssignee = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formAssigneeId?: string;
  formAssignee?: DomainEntitiesFormsFormAssignee;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormField;
  assigneeId?: string | null;
  assignee?: DomainEntitiesUsersUser;
};
export type DomainEntitiesFormsFormFieldAssigneeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formAssigneeId?: string;
  formAssignee?: DomainEntitiesFormsFormAssignee;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormFieldRead;
  assigneeId?: string | null;
  assignee?: DomainEntitiesUsersUser;
};
export type DomainEntitiesFormsFormAssignee = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  materialSamplingId?: string | null;
  materialSampling?: DomainEntitiesMaterialSamplingMaterialSampling;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  routineTrackId?: string | null;
  routineTrack?: DomainEntitiesQualityRoutinesRoutineTrack;
  fieldAssignees?: DomainEntitiesFormsFormFieldAssignee[] | null;
};
export type DomainEntitiesFormsFormAssigneeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  materialSamplingId?: string | null;
  materialSampling?: DomainEntitiesMaterialSamplingMaterialSamplingRead;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  routineTrackId?: string | null;
  routineTrack?: DomainEntitiesQualityRoutinesRoutineTrackRead;
  fieldAssignees?: DomainEntitiesFormsFormFieldAssigneeRead[] | null;
};
export type DomainEntitiesFormsFormReviewer = {
  id?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  userId?: string;
  user?: DomainEntitiesUsersUser;
};
export type DomainEntitiesFormsFormReviewerRead = {
  id?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  userId?: string;
  user?: DomainEntitiesUsersUser;
};
export type DomainEntitiesFormsForm = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: DomainEntitiesFormsFormType;
  sections?: DomainEntitiesFormsFormSection[] | null;
  responses?: DomainEntitiesFormsFormResponse[] | null;
  assignees?: DomainEntitiesFormsFormAssignee[] | null;
  reviewers?: DomainEntitiesFormsFormReviewer[] | null;
};
export type DomainEntitiesFormsFormRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: DomainEntitiesFormsFormType;
  sections?: DomainEntitiesFormsFormSectionRead[] | null;
  responses?: DomainEntitiesFormsFormResponseRead[] | null;
  assignees?: DomainEntitiesFormsFormAssigneeRead[] | null;
  reviewers?: DomainEntitiesFormsFormReviewerRead[] | null;
};
export type DomainEntitiesRoutesRouteResource = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  resourceId?: string;
  resource?: DomainEntitiesBaseResource;
};
export type DomainEntitiesRoutesRouteResourceRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  resourceId?: string;
  resource?: DomainEntitiesBaseResourceRead;
};
export type DomainEntitiesRoutesRouteResponsibleUser = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteResponsibleUserRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataRead;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteResponsibleRole = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  roleId?: string;
  role?: DomainEntitiesRolesRole;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteResponsibleRoleRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  roleId?: string;
  role?: DomainEntitiesRolesRole;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataRead;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteWorkCenter = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  workCenterId?: string;
  workCenter?: DomainEntitiesBaseWorkCenter;
};
export type DomainEntitiesRoutesRouteWorkCenterRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  workCenterId?: string;
  workCenter?: DomainEntitiesBaseWorkCenterRead;
};
export type DomainEntitiesRoutesRoute = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  operationId?: string;
  operation?: DomainEntitiesBaseOperation;
  estimatedTime?: string | null;
  workflowId?: string | null;
  workFlow?: DomainEntitiesFormsForm;
  order?: number;
  resources?: DomainEntitiesRoutesRouteResource[] | null;
  responsibleUsers?: DomainEntitiesRoutesRouteResponsibleUser[] | null;
  responsibleRoles?: DomainEntitiesRoutesRouteResponsibleRole[] | null;
  workCenters?: DomainEntitiesRoutesRouteWorkCenter[] | null;
  isCritical?: boolean;
};
export type DomainEntitiesRoutesRouteRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  operationId?: string;
  operation?: DomainEntitiesBaseOperationRead;
  estimatedTime?: string | null;
  workflowId?: string | null;
  workFlow?: DomainEntitiesFormsFormRead;
  order?: number;
  resources?: DomainEntitiesRoutesRouteResourceRead[] | null;
  responsibleUsers?: DomainEntitiesRoutesRouteResponsibleUserRead[] | null;
  responsibleRoles?: DomainEntitiesRoutesRouteResponsibleRoleRead[] | null;
  workCenters?: DomainEntitiesRoutesRouteWorkCenterRead[] | null;
  isCritical?: boolean;
};
export type DomainEntitiesProductsProductPrices = {
  price?: number;
  priceUoM?: string | null;
  date?: string;
};
export type DomainEntitiesProductsProduct = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  description?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  labelClaim?: string | null;
  categoryId?: string | null;
  category?: DomainEntitiesProductsProductCategory;
  baseQuantity?: number;
  baseUomId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasure;
  equipmentId?: string | null;
  equipment?: DomainEntitiesProductsEquipmentsEquipment;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  fullBatchSize?: number;
  finishedProducts?: DomainEntitiesProductsFinishedProduct[] | null;
  billOfMaterials?: DomainEntitiesProductsProductBillOfMaterial[] | null;
  packages?: DomainEntitiesProductsProductPackage[] | null;
  routes?: DomainEntitiesRoutesRoute[] | null;
  division?: DomainEntitiesProductsDivision;
  prices?: DomainEntitiesProductsProductPrices[] | null;
  packings?: DomainEntitiesProductsProductPacking[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  documentNumber?: string | null;
  revisionNumber?: number;
};
export type DomainEntitiesProductsProductRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  description?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  labelClaim?: string | null;
  categoryId?: string | null;
  category?: DomainEntitiesProductsProductCategory;
  baseQuantity?: number;
  baseUomId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  equipmentId?: string | null;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentRead;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  fullBatchSize?: number;
  finishedProducts?: DomainEntitiesProductsFinishedProductRead[] | null;
  billOfMaterials?: DomainEntitiesProductsProductBillOfMaterialRead[] | null;
  packages?: DomainEntitiesProductsProductPackageRead[] | null;
  routes?: DomainEntitiesRoutesRouteRead[] | null;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  prices?: DomainEntitiesProductsProductPrices[] | null;
  packings?: DomainEntitiesProductsProductPackingRead[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  documentNumber?: string | null;
  revisionNumber?: number;
};
export type DomainEntitiesProductionSchedulesBatchSize = 0 | 1;
export type DomainEntitiesBaseTermsOfPayment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  dueDays?: number | null;
};
export type DomainEntitiesBaseTermsOfPaymentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  dueDays?: number | null;
};
export type DomainEntitiesCustomersCustomerType = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesCurrenciesCurrency = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isBaseCurrency?: boolean;
};
export type DomainEntitiesCurrenciesCurrencyRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isBaseCurrency?: boolean;
};
export type DomainEntitiesCustomersCustomerContact = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  customerId?: string;
  customer?: DomainEntitiesCustomersCustomer;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
};
export type DomainEntitiesCustomersCustomerContactRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  customerId?: string;
  customer?: DomainEntitiesCustomersCustomer;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
};
export type DomainEntitiesCustomersCustomerPricingAgreement = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  customerId?: string;
  customer?: DomainEntitiesCustomersCustomer;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  productPackingId?: string;
  productPacking?: DomainEntitiesProductsProductPacking;
  agreedPrice?: number;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrency;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  notes?: string | null;
};
export type DomainEntitiesCustomersCustomerPricingAgreementRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  customerId?: string;
  customer?: DomainEntitiesCustomersCustomer;
  productId?: string;
  product?: DomainEntitiesProductsProductRead;
  productPackingId?: string;
  productPacking?: DomainEntitiesProductsProductPackingRead;
  agreedPrice?: number;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  notes?: string | null;
};
export type DomainEntitiesCustomersCustomer = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number | null;
  termsOfPaymentId?: string | null;
  termsOfPayment?: DomainEntitiesBaseTermsOfPayment;
  type?: DomainEntitiesCustomersCustomerType;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  contacts?: DomainEntitiesCustomersCustomerContact[] | null;
  pricingAgreements?: DomainEntitiesCustomersCustomerPricingAgreement[] | null;
};
export type DomainEntitiesCustomersCustomerRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number | null;
  termsOfPaymentId?: string | null;
  termsOfPayment?: DomainEntitiesBaseTermsOfPaymentRead;
  type?: DomainEntitiesCustomersCustomerType;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  contacts?: DomainEntitiesCustomersCustomerContactRead[] | null;
  pricingAgreements?:
    DomainEntitiesCustomersCustomerPricingAgreementRead[] | null;
};
export type DomainEntitiesProductionSchedulesProductionScheduleProduct = {
  id?: string;
  productionScheduleId?: string;
  productionSchedule?: DomainEntitiesProductionSchedulesProductionSchedule;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  batchNumber?: string | null;
  batchSize?: DomainEntitiesProductionSchedulesBatchSize;
  marketTypeId?: string | null;
  marketType?: DomainEntitiesCustomersCustomer;
  quantity?: number;
  cancelled?: boolean;
  reasonForCancellation?: string | null;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPacking;
  productionActivity?: DomainEntitiesProductsProductionProductionActivity;
};
export type DomainEntitiesProductionSchedulesProductionScheduleProductRead = {
  id?: string;
  productionScheduleId?: string;
  productionSchedule?: DomainEntitiesProductionSchedulesProductionScheduleRead;
  productId?: string;
  product?: DomainEntitiesProductsProductRead;
  batchNumber?: string | null;
  batchSize?: DomainEntitiesProductionSchedulesBatchSize;
  marketTypeId?: string | null;
  marketType?: DomainEntitiesCustomersCustomerRead;
  quantity?: number;
  cancelled?: boolean;
  reasonForCancellation?: string | null;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPackingRead;
  productionActivity?: DomainEntitiesProductsProductionProductionActivityRead;
};
export type DomainEntitiesProductsProductionBatchManufacturingStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesProductsProductionBatchManufacturingRecord = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  batchQuantity?: number;
  sampledQuantity?: number;
  status?: DomainEntitiesProductsProductionBatchManufacturingStatus;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedDate?: string | null;
};
export type DomainEntitiesProductsProductionBatchManufacturingRecordRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductRead;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  batchQuantity?: number;
  sampledQuantity?: number;
  status?: DomainEntitiesProductsProductionBatchManufacturingStatus;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedDate?: string | null;
};
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteQuantity = {
  quantity?: number;
  movedAt?: string;
  movedById?: string;
};
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteApproval = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  finishedGoodsTransferNoteId?: string;
  finishedGoodsTransferNote?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNote;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
};
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteApprovalRead =
  {
    userId?: string | null;
    user?: DomainEntitiesUsersUser;
    roleId?: string | null;
    role?: DomainEntitiesRolesRole;
    required?: boolean;
    order?: number;
    stageStartTime?: string | null;
    status?: DomainEntitiesApprovalsApprovalStatus;
    approvalTime?: string | null;
    approvedById?: string | null;
    approvedBy?: DomainEntitiesUsersUser;
    createdAt?: string;
    activatedAt?: string | null;
    comments?: string | null;
    id?: string;
    finishedGoodsTransferNoteId?: string;
    finishedGoodsTransferNote?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNote;
    approvalId?: string;
    approval?: DomainEntitiesApprovalsApprovalRead;
  };
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNote = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  transferNoteNumber?: string | null;
  fromWarehouseId?: string | null;
  fromWarehouse?: DomainEntitiesWarehousesWarehouse;
  toWarehouseId?: string | null;
  toWarehouse?: DomainEntitiesWarehousesWarehouse;
  quantityPerPack?: number;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPacking;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  isApproved?: boolean;
  totalQuantity?: number;
  quantityReceived?: number;
  notes?: string | null;
  qarNumber?: string | null;
  batchManufacturingRecordId?: string;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  loose?: number;
  allocatedQuantity?: number;
  quantities?:
    DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteQuantity[] | null;
  approved?: boolean;
  approvals?:
    DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteApproval[] | null;
  isPartial?: boolean;
  isFulfilled?: boolean;
  acceptedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  transferNoteNumber?: string | null;
  fromWarehouseId?: string | null;
  fromWarehouse?: DomainEntitiesWarehousesWarehouse;
  toWarehouseId?: string | null;
  toWarehouse?: DomainEntitiesWarehousesWarehouse;
  quantityPerPack?: number;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPackingRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  isApproved?: boolean;
  totalQuantity?: number;
  quantityReceived?: number;
  notes?: string | null;
  qarNumber?: string | null;
  batchManufacturingRecordId?: string;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecordRead;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  loose?: number;
  allocatedQuantity?: number;
  remainingQuantity?: number;
  quantities?:
    DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteQuantity[] | null;
  approved?: boolean;
  approvals?:
    DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteApprovalRead[] | null;
  isPartial?: boolean;
  isFulfilled?: boolean;
  acceptedAt?: string | null;
};
export type DomainEntitiesWarehousesDistributedFinishedProductStatus = 0 | 1;
export type DomainEntitiesWarehousesDistributedFinishedProduct = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseArrivalLocationId?: string | null;
  warehouseArrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocation;
  productId?: string | null;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  transferNoteId?: string | null;
  transferNote?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNote;
  product?: DomainEntitiesProductsProduct;
  uomId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  distributedAt?: string | null;
  arrivedAt?: string | null;
  status?: DomainEntitiesWarehousesDistributedFinishedProductStatus;
};
export type DomainEntitiesWarehousesDistributedFinishedProductRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseArrivalLocationId?: string | null;
  warehouseArrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocation;
  productId?: string | null;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecordRead;
  transferNoteId?: string | null;
  transferNote?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteRead;
  product?: DomainEntitiesProductsProductRead;
  uomId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
  distributedAt?: string | null;
  arrivedAt?: string | null;
  status?: DomainEntitiesWarehousesDistributedFinishedProductStatus;
};
export type DomainEntitiesWarehousesWarehouseArrivalLocation = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  distributedRequisitionMaterials?:
    DomainEntitiesWarehousesDistributedRequisitionMaterial[] | null;
  distributedFinishedProducts?:
    DomainEntitiesWarehousesDistributedFinishedProduct[] | null;
  distributedStockTransferBatches?:
    DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesWarehousesWarehouseArrivalLocationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  distributedRequisitionMaterials?:
    DomainEntitiesWarehousesDistributedRequisitionMaterial[] | null;
  distributedFinishedProducts?:
    DomainEntitiesWarehousesDistributedFinishedProductRead[] | null;
  distributedStockTransferBatches?:
    DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesCountriesCountry = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
export type DomainEntitiesCountriesCountryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
export type DomainEntitiesProcurementManufacturersQuantityType = 0 | 1 | 2;
export type DomainEntitiesProcurementManufacturersQuantityPerPackOption = {
  type?: DomainEntitiesProcurementManufacturersQuantityType;
  min?: number | null;
  max?: number | null;
  values?: number[] | null;
};
export type DomainEntitiesProcurementManufacturersManufacturerMaterial = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturer;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  quantityType?: DomainEntitiesProcurementManufacturersQuantityType;
  quantityPerPackOption?: DomainEntitiesProcurementManufacturersQuantityPerPackOption;
};
export type DomainEntitiesProcurementManufacturersManufacturerMaterialRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturer;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  quantityType?: DomainEntitiesProcurementManufacturersQuantityType;
  quantityPerPackOption?: DomainEntitiesProcurementManufacturersQuantityPerPackOption;
};
export type DomainEntitiesProcurementManufacturersManufacturer = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  approvedAt?: string | null;
  validityDate?: string | null;
  countryId?: string | null;
  country?: DomainEntitiesCountriesCountry;
  materials?:
    DomainEntitiesProcurementManufacturersManufacturerMaterial[] | null;
};
export type DomainEntitiesProcurementManufacturersManufacturerRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  approvedAt?: string | null;
  validityDate?: string | null;
  countryId?: string | null;
  country?: DomainEntitiesCountriesCountryRead;
  materials?:
    DomainEntitiesProcurementManufacturersManufacturerMaterialRead[] | null;
};
export type DomainEntitiesProcurementSuppliersSupplierManufacturer = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturer;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  default?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierManufacturerRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerRead;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  default?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierCertificationType =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesProcurementSuppliersSupplierCertification = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  certificationType?: DomainEntitiesProcurementSuppliersSupplierCertificationType;
  certificateNumber: string;
  issuingBody: string;
  issueDate?: string;
  expiryDate?: string;
  attachmentId?: string | null;
  attachment?: DomainEntitiesAttachmentsAttachment;
};
export type DomainEntitiesProcurementSuppliersSupplierCertificationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  certificationType?: DomainEntitiesProcurementSuppliersSupplierCertificationType;
  certificateNumber: string;
  issuingBody: string;
  issueDate?: string;
  expiryDate?: string;
  attachmentId?: string | null;
  attachment?: DomainEntitiesAttachmentsAttachmentRead;
};
export type DomainEntitiesProcurementSuppliersSupplierContact = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierContactRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierBankDetail = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  bankName: string;
  accountNumber: string;
  accountName: string;
  swiftCode?: string | null;
  iban?: string | null;
  branchAddress?: string | null;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrency;
};
export type DomainEntitiesProcurementSuppliersSupplierBankDetailRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  bankName: string;
  accountNumber: string;
  accountName: string;
  swiftCode?: string | null;
  iban?: string | null;
  branchAddress?: string | null;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
};
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreementStatus =
  0 | 1 | 2;
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreementChangeKind =
  0 | 1 | 2;
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreementApproval =
  {
    userId?: string | null;
    user?: DomainEntitiesUsersUser;
    roleId?: string | null;
    role?: DomainEntitiesRolesRole;
    required?: boolean;
    order?: number;
    stageStartTime?: string | null;
    status?: DomainEntitiesApprovalsApprovalStatus;
    approvalTime?: string | null;
    approvedById?: string | null;
    approvedBy?: DomainEntitiesUsersUser;
    createdAt?: string;
    activatedAt?: string | null;
    comments?: string | null;
    id?: string;
    supplierPricingAgreementId?: string;
    supplierPricingAgreement?: DomainEntitiesProcurementSuppliersSupplierPricingAgreement;
    approvalId?: string;
    approval?: DomainEntitiesApprovalsApproval;
  };
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreementApprovalRead =
  {
    userId?: string | null;
    user?: DomainEntitiesUsersUser;
    roleId?: string | null;
    role?: DomainEntitiesRolesRole;
    required?: boolean;
    order?: number;
    stageStartTime?: string | null;
    status?: DomainEntitiesApprovalsApprovalStatus;
    approvalTime?: string | null;
    approvedById?: string | null;
    approvedBy?: DomainEntitiesUsersUser;
    createdAt?: string;
    activatedAt?: string | null;
    comments?: string | null;
    id?: string;
    supplierPricingAgreementId?: string;
    supplierPricingAgreement?: DomainEntitiesProcurementSuppliersSupplierPricingAgreement;
    approvalId?: string;
    approval?: DomainEntitiesApprovalsApprovalRead;
  };
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreement = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  status?: DomainEntitiesProcurementSuppliersSupplierPricingAgreementStatus;
  changeKind?: DomainEntitiesProcurementSuppliersSupplierPricingAgreementChangeKind;
  replacesAgreementId?: string | null;
  approvals?:
    DomainEntitiesProcurementSuppliersSupplierPricingAgreementApproval[] | null;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  agreedPrice?: number;
  priceUoM: string;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrency;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  notes?: string | null;
};
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreementRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  status?: DomainEntitiesProcurementSuppliersSupplierPricingAgreementStatus;
  changeKind?: DomainEntitiesProcurementSuppliersSupplierPricingAgreementChangeKind;
  replacesAgreementId?: string | null;
  approvals?:
    | DomainEntitiesProcurementSuppliersSupplierPricingAgreementApprovalRead[]
    | null;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  agreedPrice?: number;
  priceUoM: string;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  notes?: string | null;
};
export type DomainEntitiesProcurementSuppliersSupplierPerformanceRecord = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  periodStart?: string;
  periodEnd?: string;
  onTimeDeliveryRate?: number;
  qualityRejectRate?: number;
  score?: number;
};
export type DomainEntitiesProcurementSuppliersSupplierPerformanceRecordRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  periodStart?: string;
  periodEnd?: string;
  onTimeDeliveryRate?: number;
  qualityRejectRate?: number;
  score?: number;
};
export type DomainEntitiesProcurementSuppliersSupplier = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  countryId?: string | null;
  country?: DomainEntitiesCountriesCountry;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  approvedAt?: string | null;
  requalificationDueDate?: string | null;
  associatedManufacturers?:
    DomainEntitiesProcurementSuppliersSupplierManufacturer[] | null;
  certifications?:
    DomainEntitiesProcurementSuppliersSupplierCertification[] | null;
  contacts?: DomainEntitiesProcurementSuppliersSupplierContact[] | null;
  bankDetails?: DomainEntitiesProcurementSuppliersSupplierBankDetail[] | null;
  pricingAgreements?:
    DomainEntitiesProcurementSuppliersSupplierPricingAgreement[] | null;
  performanceRecords?:
    DomainEntitiesProcurementSuppliersSupplierPerformanceRecord[] | null;
};
export type DomainEntitiesProcurementSuppliersSupplierRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  countryId?: string | null;
  country?: DomainEntitiesCountriesCountryRead;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  approvedAt?: string | null;
  requalificationDueDate?: string | null;
  associatedManufacturers?:
    DomainEntitiesProcurementSuppliersSupplierManufacturerRead[] | null;
  certifications?:
    DomainEntitiesProcurementSuppliersSupplierCertificationRead[] | null;
  contacts?: DomainEntitiesProcurementSuppliersSupplierContactRead[] | null;
  bankDetails?:
    DomainEntitiesProcurementSuppliersSupplierBankDetailRead[] | null;
  pricingAgreements?:
    DomainEntitiesProcurementSuppliersSupplierPricingAgreementRead[] | null;
  performanceRecords?:
    DomainEntitiesProcurementSuppliersSupplierPerformanceRecordRead[] | null;
};
export type DomainEntitiesShipmentsShipmentInvoice = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  supplierId?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  items?: DomainEntitiesShipmentsShipmentInvoiceItem[] | null;
  totalCost?: number;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
  paidAt?: string | null;
  dueDate?: string | null;
};
export type DomainEntitiesShipmentsShipmentInvoiceRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  supplierId?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierRead;
  items?: DomainEntitiesShipmentsShipmentInvoiceItem[] | null;
  totalCost?: number;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  paidAt?: string | null;
  dueDate?: string | null;
};
export type DomainEntitiesRequisitionsProcurementSource = 0 | 1;
export type DomainEntitiesRequisitionsSourceRequisitionItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  sourceRequisitionId?: string;
  sourceRequisition?: DomainEntitiesRequisitionsSourceRequisition;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  source?: DomainEntitiesRequisitionsProcurementSource;
  requisitionId?: string;
};
export type DomainEntitiesRequisitionsSourceRequisitionItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  sourceRequisitionId?: string;
  sourceRequisition?: DomainEntitiesRequisitionsSourceRequisition;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
  source?: DomainEntitiesRequisitionsProcurementSource;
  requisitionId?: string;
};
export type DomainEntitiesRequisitionsSourceRequisition = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  sentQuotationRequestAt?: string | null;
  items?: DomainEntitiesRequisitionsSourceRequisitionItem[] | null;
};
export type DomainEntitiesRequisitionsSourceRequisitionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplierRead;
  sentQuotationRequestAt?: string | null;
  items?: DomainEntitiesRequisitionsSourceRequisitionItemRead[] | null;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrder;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  quantityInvoiced?: number;
  price?: number;
  priceUoM?: string | null;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrder;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
  quantityInvoiced?: number;
  price?: number;
  priceUoM?: string | null;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type DomainEntitiesPurchaseOrdersRevisedPurchaseOrderType =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesPurchaseOrdersRevisedPurchaseOrder = {
  id?: string;
  type?: DomainEntitiesPurchaseOrdersRevisedPurchaseOrderType;
  purchaseOrderItemId?: string | null;
  purchaseOrderItem?: DomainEntitiesPurchaseOrdersPurchaseOrderItem;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number | null;
  price?: number | null;
  priceUoM?: string | null;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
  uoMBeforeId?: string | null;
  uomBefore?: DomainEntitiesBaseUnitOfMeasure;
  quantityBefore?: number | null;
  priceBefore?: number | null;
  priceUoMBefore?: string | null;
  currencyBeforeId?: string | null;
  currencyBefore?: DomainEntitiesCurrenciesCurrency;
  materialBeforeId?: string | null;
  materialBefore?: DomainEntitiesMaterialsMaterial;
  revisionNumber?: number;
  revisionDate?: string | null;
};
export type DomainEntitiesPurchaseOrdersRevisedPurchaseOrderRead = {
  id?: string;
  type?: DomainEntitiesPurchaseOrdersRevisedPurchaseOrderType;
  purchaseOrderItemId?: string | null;
  purchaseOrderItem?: DomainEntitiesPurchaseOrdersPurchaseOrderItemRead;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number | null;
  price?: number | null;
  priceUoM?: string | null;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  uoMBeforeId?: string | null;
  uomBefore?: DomainEntitiesBaseUnitOfMeasureRead;
  quantityBefore?: number | null;
  priceBefore?: number | null;
  priceUoMBefore?: string | null;
  currencyBeforeId?: string | null;
  currencyBefore?: DomainEntitiesCurrenciesCurrencyRead;
  materialBeforeId?: string | null;
  materialBefore?: DomainEntitiesMaterialsMaterialRead;
  revisionNumber?: number;
  revisionDate?: string | null;
};
export type DomainEntitiesBaseDeliveryMode = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesBaseDeliveryModeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderApproval = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrder;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderApprovalRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrder;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApprovalRead;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrder = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  proFormaInvoiceNumber?: string | null;
  sourceRequisitionId?: string;
  sourceRequisition?: DomainEntitiesRequisitionsSourceRequisition;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  requestDate?: string;
  expectedDeliveryDate?: string | null;
  items?: DomainEntitiesPurchaseOrdersPurchaseOrderItem[] | null;
  deliveryDate?: string | null;
  sentAt?: string | null;
  status?: DomainEntitiesPurchaseOrdersPurchaseOrderStatus;
  revisionNumber?: number;
  revisedPurchaseOrders?:
    DomainEntitiesPurchaseOrdersRevisedPurchaseOrder[] | null;
  deliveryMode?: DomainEntitiesBaseDeliveryMode;
  termsOfPayment?: DomainEntitiesBaseTermsOfPayment;
  deliveryModeId?: string | null;
  termsOfPaymentId?: string | null;
  totalFobValue?: number;
  totalCifValue?: number;
  seaFreight?: number;
  insurance?: number;
  amountInFigures?: string | null;
  estimatedDeliveryDate?: string | null;
  approvals?: DomainEntitiesPurchaseOrdersPurchaseOrderApproval[] | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  approved?: boolean;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  proFormaInvoiceNumber?: string | null;
  sourceRequisitionId?: string;
  sourceRequisition?: DomainEntitiesRequisitionsSourceRequisitionRead;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplierRead;
  requestDate?: string;
  expectedDeliveryDate?: string | null;
  items?: DomainEntitiesPurchaseOrdersPurchaseOrderItemRead[] | null;
  deliveryDate?: string | null;
  sentAt?: string | null;
  status?: DomainEntitiesPurchaseOrdersPurchaseOrderStatus;
  isRevised?: boolean;
  revisionNumber?: number;
  revisedPurchaseOrders?:
    DomainEntitiesPurchaseOrdersRevisedPurchaseOrderRead[] | null;
  deliveryMode?: DomainEntitiesBaseDeliveryModeRead;
  termsOfPayment?: DomainEntitiesBaseTermsOfPaymentRead;
  deliveryModeId?: string | null;
  termsOfPaymentId?: string | null;
  totalFobValue?: number;
  totalCifValue?: number;
  seaFreight?: number;
  insurance?: number;
  amountInFigures?: string | null;
  estimatedDeliveryDate?: string | null;
  approvals?: DomainEntitiesPurchaseOrdersPurchaseOrderApprovalRead[] | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  approved?: boolean;
};
export type DomainEntitiesShipmentsShipmentInvoiceItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  shipmentInvoiceId?: string;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoice;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturer;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrder;
  expectedQuantity?: number;
  receivedQuantity?: number;
  reason?: string | null;
  distributed?: boolean;
  price?: number;
  priceUoM?: string | null;
  totalCost?: number;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
};
export type DomainEntitiesShipmentsShipmentInvoiceItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  shipmentInvoiceId?: string;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceRead;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerRead;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrderRead;
  expectedQuantity?: number;
  receivedQuantity?: number;
  reason?: string | null;
  distributed?: boolean;
  price?: number;
  priceUoM?: string | null;
  totalCost?: number;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
};
export type DomainEntitiesWarehousesMaterialItemDistribution = {
  id?: string;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterial;
  shipmentInvoiceItemId?: string;
  shipmentInvoiceItem?: DomainEntitiesShipmentsShipmentInvoiceItem;
  quantity?: number;
};
export type DomainEntitiesWarehousesMaterialItemDistributionRead = {
  id?: string;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterial;
  shipmentInvoiceItemId?: string;
  shipmentInvoiceItem?: DomainEntitiesShipmentsShipmentInvoiceItemRead;
  quantity?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialStatus =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesRequisitionsRequisitionType = 0 | 1 | 2;
export type DomainEntitiesRequisitionsRequestStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesRequisitionsRequisitionApproval = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  requisitionId?: string;
  requisition?: DomainEntitiesRequisitionsRequisition;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
};
export type DomainEntitiesRequisitionsRequisitionApprovalRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  requisitionId?: string;
  requisition?: DomainEntitiesRequisitionsRequisition;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApprovalRead;
};
export type DomainEntitiesRequisitionsRequisition = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  requestedById?: string;
  requestedBy?: DomainEntitiesUsersUser;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  requisitionType?: DomainEntitiesRequisitionsRequisitionType;
  status?: DomainEntitiesRequisitionsRequestStatus;
  comments?: string | null;
  expectedDelivery?: string | null;
  productionScheduleProductId?: string | null;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  rndTrialBatchId?: string | null;
  rndTrialBatch?: DomainEntitiesRndTrialBatchesRndTrialBatch;
  approvals?: DomainEntitiesRequisitionsRequisitionApproval[] | null;
  items?: DomainEntitiesRequisitionsRequisitionItem[] | null;
  approved?: boolean;
};
export type DomainEntitiesRequisitionsRequisitionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  requestedById?: string;
  requestedBy?: DomainEntitiesUsersUser;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  requisitionType?: DomainEntitiesRequisitionsRequisitionType;
  status?: DomainEntitiesRequisitionsRequestStatus;
  comments?: string | null;
  expectedDelivery?: string | null;
  productionScheduleProductId?: string | null;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductRead;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  rndTrialBatchId?: string | null;
  rndTrialBatch?: DomainEntitiesRndTrialBatchesRndTrialBatchRead;
  approvals?: DomainEntitiesRequisitionsRequisitionApprovalRead[] | null;
  items?: DomainEntitiesRequisitionsRequisitionItem[] | null;
  approved?: boolean;
};
export type DomainEntitiesRequisitionsRequisitionItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  requisitionId?: string;
  requisition?: DomainEntitiesRequisitionsRequisition;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  quantityReceived?: number;
  status?: DomainEntitiesRequisitionsRequestStatus;
};
export type DomainEntitiesRequisitionsRequisitionItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  requisitionId?: string;
  requisition?: DomainEntitiesRequisitionsRequisitionRead;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
  quantityReceived?: number;
  status?: DomainEntitiesRequisitionsRequestStatus;
};
export type DomainEntitiesWarehousesDistributedRequisitionItem = {
  id?: string;
  requisitionItemId?: string;
  requisitionItem?: DomainEntitiesRequisitionsRequisitionItem;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  quantity?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionItemRead = {
  id?: string;
  requisitionItemId?: string;
  requisitionItem?: DomainEntitiesRequisitionsRequisitionItemRead;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  quantity?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterial = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseArrivalLocationId?: string | null;
  warehouseArrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocation;
  materialItemDistributions?:
    DomainEntitiesWarehousesMaterialItemDistribution[] | null;
  shipmentInvoiceId?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoice;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  distributedAt?: string | null;
  arrivedAt?: string | null;
  checkedAt?: string | null;
  grnGeneratedAt?: string | null;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  checkLists?: DomainEntitiesChecklistsChecklist[] | null;
  distributedRequisitionItems?:
    DomainEntitiesWarehousesDistributedRequisitionItem[] | null;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseArrivalLocationId?: string | null;
  warehouseArrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocationRead;
  materialItemDistributions?:
    DomainEntitiesWarehousesMaterialItemDistributionRead[] | null;
  shipmentInvoiceId?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceRead;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
  distributedAt?: string | null;
  arrivedAt?: string | null;
  checkedAt?: string | null;
  grnGeneratedAt?: string | null;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  checkLists?: DomainEntitiesChecklistsChecklist[] | null;
  distributedRequisitionItems?:
    DomainEntitiesWarehousesDistributedRequisitionItemRead[] | null;
};
export type DomainEntitiesChecklistsIntactness = 0 | 1;
export type DomainEntitiesChecklistsConsignmentCarrier = 0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesChecklistsChecklist = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterial;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterial;
  checkedAt?: string | null;
  shipmentInvoiceId?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoice;
  supplierId?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  manufacturerId?: string | null;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturer;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesChecklistsChecklistRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterialRead;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterialRead;
  checkedAt?: string | null;
  shipmentInvoiceId?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceRead;
  supplierId?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierRead;
  manufacturerId?: string | null;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerRead;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferSource =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stockTransferId?: string;
    stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersStockTransfer;
    fromDepartmentId?: string;
    fromDepartment?: DomainEntitiesDepartmentsDepartment;
    toDepartmentId?: string;
    toDepartment?: DomainEntitiesDepartmentsDepartment;
    quantity?: number;
    status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
    approvedAt?: string | null;
    approvedById?: string | null;
    approvedBy?: DomainEntitiesUsersUser;
    issuedById?: string | null;
    issuedBy?: DomainEntitiesUsersUser;
    issuedAt?: string | null;
  };
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferSourceRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stockTransferId?: string;
    stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersStockTransfer;
    fromDepartmentId?: string;
    fromDepartment?: DomainEntitiesDepartmentsDepartment;
    toDepartmentId?: string;
    toDepartment?: DomainEntitiesDepartmentsDepartment;
    quantity?: number;
    status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
    approvedAt?: string | null;
    approvedById?: string | null;
    approvedBy?: DomainEntitiesUsersUser;
    issuedById?: string | null;
    issuedBy?: DomainEntitiesUsersUser;
    issuedAt?: string | null;
  };
export type DomainEntitiesProductionSchedulesStockTransfersStockTransfer = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  reason?: string | null;
  requiredQuantity?: number;
  productionScheduleProductId?: string | null;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  sources?:
    DomainEntitiesProductionSchedulesStockTransfersStockTransferSource[] | null;
};
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  reason?: string | null;
  requiredQuantity?: number;
  productionScheduleProductId?: string | null;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductRead;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  sources?:
    | DomainEntitiesProductionSchedulesStockTransfersStockTransferSourceRead[]
    | null;
};
export type DomainEntitiesBasePackageStyle = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesBasePackageStyleRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesMaterialsBatchBatchStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type DomainEntitiesMaterialsBatchSr = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  srNumber?: string | null;
  grossWeight?: number;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
};
export type DomainEntitiesMaterialsBatchSrRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  srNumber?: string | null;
  grossWeight?: number;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
};
export type DomainEntitiesMaterialsBatchEventType = 0 | 1 | 2 | 3;
export type DomainEntitiesMaterialsBatchMaterialBatchEvent = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  batchId?: string;
  batch?: DomainEntitiesMaterialsBatchMaterialBatch;
  quantity?: number;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  type?: DomainEntitiesMaterialsBatchEventType;
  consumptionWarehouseId?: string | null;
  consumptionWarehouse?: DomainEntitiesWarehousesWarehouse;
  consumedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchEventRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  batchId?: string;
  batch?: DomainEntitiesMaterialsBatchMaterialBatch;
  quantity?: number;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  type?: DomainEntitiesMaterialsBatchEventType;
  consumptionWarehouseId?: string | null;
  consumptionWarehouse?: DomainEntitiesWarehousesWarehouse;
  consumedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchMovementType = 0 | 1 | 2;
export type DomainEntitiesMaterialsBatchMassMaterialBatchMovement = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  batchId?: string;
  batch?: DomainEntitiesMaterialsBatchMaterialBatch;
  fromWarehouse?: DomainEntitiesWarehousesWarehouse;
  fromWarehouseId?: string | null;
  toWarehouse?: DomainEntitiesWarehousesWarehouse;
  toWarehouseId?: string | null;
  quantity?: number;
  movedAt?: string;
  movedById?: string;
  movedBy?: DomainEntitiesUsersUser;
  movementType?: DomainEntitiesMaterialsBatchMovementType;
};
export type DomainEntitiesMaterialsBatchMassMaterialBatchMovementRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  batchId?: string;
  batch?: DomainEntitiesMaterialsBatchMaterialBatch;
  fromWarehouse?: DomainEntitiesWarehousesWarehouse;
  fromWarehouseId?: string | null;
  toWarehouse?: DomainEntitiesWarehousesWarehouse;
  toWarehouseId?: string | null;
  quantity?: number;
  movedAt?: string;
  movedById?: string;
  movedBy?: DomainEntitiesUsersUser;
  movementType?: DomainEntitiesMaterialsBatchMovementType;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReservedQuantity = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  warehouseLocationShelfId?: string | null;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelf;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  warehouseLocationShelfId?: string | null;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelf;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductRead;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
};
export type DomainEntitiesMaterialsBatchMaterialBatch = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  checklistId?: string | null;
  checklist?: DomainEntitiesChecklistsChecklist;
  batchNumber?: string | null;
  grnId?: string | null;
  grn?: DomainEntitiesGrnsGrn;
  stockTransferId?: string | null;
  stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersStockTransfer;
  numberOfContainers?: number;
  containerPackageStyleId?: string | null;
  containerPackageStyle?: DomainEntitiesBasePackageStyle;
  quantityPerContainer?: number;
  quantityAssigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  dateRejected?: string | null;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  retestReason?: string | null;
  retestNotes?: string | null;
  sampleWeights?: DomainEntitiesMaterialsBatchSr[] | null;
  events?: DomainEntitiesMaterialsBatchMaterialBatchEvent[] | null;
  massMovements?:
    DomainEntitiesMaterialsBatchMassMaterialBatchMovement[] | null;
  reservedQuantities?:
    DomainEntitiesMaterialsBatchMaterialBatchReservedQuantity[] | null;
  shelfMaterialBatches?: DomainEntitiesWarehousesShelfMaterialBatch[] | null;
  returnDate?: string | null;
  issueNumber?: string | null;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  checklistId?: string | null;
  checklist?: DomainEntitiesChecklistsChecklistRead;
  batchNumber?: string | null;
  grnId?: string | null;
  grn?: DomainEntitiesGrnsGrnRead;
  stockTransferId?: string | null;
  stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersStockTransferRead;
  numberOfContainers?: number;
  containerPackageStyleId?: string | null;
  containerPackageStyle?: DomainEntitiesBasePackageStyleRead;
  quantityPerContainer?: number;
  quantityAssigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  quantityUnassigned?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  dateRejected?: string | null;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  retestReason?: string | null;
  retestNotes?: string | null;
  sampleWeights?: DomainEntitiesMaterialsBatchSrRead[] | null;
  events?: DomainEntitiesMaterialsBatchMaterialBatchEventRead[] | null;
  massMovements?:
    DomainEntitiesMaterialsBatchMassMaterialBatchMovementRead[] | null;
  reservedQuantities?:
    DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityRead[] | null;
  reservedQuantity?: number;
  shelfMaterialBatches?: DomainEntitiesWarehousesShelfMaterialBatch[] | null;
  returnDate?: string | null;
  issueNumber?: string | null;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedAt?: string | null;
};
export type DomainEntitiesWarehousesShelfMaterialBatch = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationShelfId?: string;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelf;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  quantity?: number;
  rowVersion?: string | null;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  note?: string | null;
};
export type DomainEntitiesWarehousesShelfMaterialBatchRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationShelfId?: string;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelf;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchRead;
  quantity?: number;
  rowVersion?: string | null;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  note?: string | null;
};
export type DomainEntitiesWarehousesWarehouseLocationShelf = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationRackId?: string;
  warehouseLocationRack?: DomainEntitiesWarehousesWarehouseLocationRack;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  materialBatches?: DomainEntitiesWarehousesShelfMaterialBatch[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationShelfRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationRackId?: string;
  warehouseLocationRack?: DomainEntitiesWarehousesWarehouseLocationRack;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  materialBatches?: DomainEntitiesWarehousesShelfMaterialBatchRead[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationRack = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationId?: string;
  warehouseLocation?: DomainEntitiesWarehousesWarehouseLocation;
  name?: string | null;
  description?: string | null;
  shelves?: DomainEntitiesWarehousesWarehouseLocationShelf[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationRackRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationId?: string;
  warehouseLocation?: DomainEntitiesWarehousesWarehouseLocation;
  name?: string | null;
  description?: string | null;
  shelves?: DomainEntitiesWarehousesWarehouseLocationShelfRead[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocation = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  racks?: DomainEntitiesWarehousesWarehouseLocationRack[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  racks?: DomainEntitiesWarehousesWarehouseLocationRackRead[] | null;
};
export type DomainEntitiesWarehousesWarehouseType = 0 | 1 | 2 | 3;
export type DomainEntitiesEmployeesGender = 0 | 1;
export type DomainEntitiesEmployeesMaritalStatus = 0 | 1;
export type DomainEntitiesEmployeesReligion = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type DomainEntitiesEmployeesEmployeeType = 0 | 1;
export type DomainEntitiesPersonsLifeStatus = 0 | 1;
export type DomainEntitiesPersonsPerson = {
  fullName?: string | null;
  phoneNumber?: string | null;
  occupation?: string | null;
  lifeStatus?: DomainEntitiesPersonsLifeStatus;
};
export type DomainEntitiesEmergencyContactsEmergencyContact = {
  fullName?: string | null;
  contactNumber?: string | null;
  relationship?: string | null;
  residentialAddress?: string | null;
};
export type DomainEntitiesChildrenChild = {
  fullName?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
};
export type DomainEntitiesSiblingsSibling = {
  fullName?: string | null;
  contact?: string | null;
  gender?: DomainEntitiesEmployeesGender;
};
export type DomainEntitiesEducationHistoriesEducation = {
  schoolName?: string | null;
  startDate?: string;
  endDate?: string;
  major?: string | null;
  qualificationEarned?: string | null;
};
export type DomainEntitiesEmployeeHistoriesEmploymentHistory = {
  companyName?: string | null;
  startDate?: string;
  endDate?: string;
  position?: string | null;
};
export type DomainEntitiesShiftAssignmentsShiftCategory = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
};
export type DomainEntitiesShiftAssignmentsShiftCategoryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
};
export type DomainEntitiesShiftTypesRotationType = 0 | 1;
export type DomainEntitiesShiftSchedulesScheduleFrequency =
  0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesShiftSchedulesScheduleStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesShiftSchedulesShiftSchedule = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  scheduleName?: string | null;
  frequency?: DomainEntitiesShiftSchedulesScheduleFrequency;
  scheduleStatus?: DomainEntitiesShiftSchedulesScheduleStatus;
  startDate?: string;
  endDate?: string;
  shiftTypes?: DomainEntitiesShiftTypesShiftType[] | null;
  employees?: DomainEntitiesEmployeesEmployee[] | null;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
};
export type DomainEntitiesShiftSchedulesShiftScheduleRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  scheduleName?: string | null;
  frequency?: DomainEntitiesShiftSchedulesScheduleFrequency;
  scheduleStatus?: DomainEntitiesShiftSchedulesScheduleStatus;
  startDate?: string;
  endDate?: string;
  shiftTypes?: DomainEntitiesShiftTypesShiftType[] | null;
  employees?: DomainEntitiesEmployeesEmployee[] | null;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
};
export type SystemDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesShiftTypesShiftType = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  shiftName?: string | null;
  rotationType?: DomainEntitiesShiftTypesRotationType;
  startTime?: string;
  endTime?: string;
  shiftSchedules?: DomainEntitiesShiftSchedulesShiftSchedule[] | null;
  applicableDays?: SystemDayOfWeek[] | null;
};
export type DomainEntitiesShiftTypesShiftTypeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  shiftName?: string | null;
  rotationType?: DomainEntitiesShiftTypesRotationType;
  startTime?: string;
  endTime?: string;
  shiftSchedules?: DomainEntitiesShiftSchedulesShiftScheduleRead[] | null;
  applicableDays?: SystemDayOfWeek[] | null;
};
export type DomainEntitiesShiftAssignmentsShiftAssignment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  scheduleDate?: string;
  employeeId?: string;
  employee?: DomainEntitiesEmployeesEmployee;
  shiftScheduleId?: string;
  shiftTypeId?: string;
  shiftCategoryId?: string;
  shiftCategory?: DomainEntitiesShiftAssignmentsShiftCategory;
  shiftType?: DomainEntitiesShiftTypesShiftType;
  shiftSchedules?: DomainEntitiesShiftSchedulesShiftSchedule;
};
export type DomainEntitiesShiftAssignmentsShiftAssignmentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  scheduleDate?: string;
  employeeId?: string;
  employee?: DomainEntitiesEmployeesEmployee;
  shiftScheduleId?: string;
  shiftTypeId?: string;
  shiftCategoryId?: string;
  shiftCategory?: DomainEntitiesShiftAssignmentsShiftCategoryRead;
  shiftType?: DomainEntitiesShiftTypesShiftTypeRead;
  shiftSchedules?: DomainEntitiesShiftSchedulesShiftScheduleRead;
};
export type DomainEntitiesLeaveTypesLeaveType = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  isPaid?: boolean;
  deductFromBalance?: boolean;
  deductionLimit?: number | null;
  numberOfDays?: number;
  isActive?: boolean;
  designations?: DomainEntitiesDesignationsDesignation[] | null;
};
export type DomainEntitiesLeaveTypesLeaveTypeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  isPaid?: boolean;
  deductFromBalance?: boolean;
  deductionLimit?: number | null;
  numberOfDays?: number;
  isActive?: boolean;
  designations?: DomainEntitiesDesignationsDesignation[] | null;
};
export type DomainEntitiesDesignationsDesignation = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name: string;
  description?: string | null;
  maximumLeaveDays?: number;
  departments?: DomainEntitiesDepartmentsDepartment[] | null;
  leaveTypes?: DomainEntitiesLeaveTypesLeaveType[] | null;
};
export type DomainEntitiesDesignationsDesignationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name: string;
  description?: string | null;
  maximumLeaveDays?: number;
  departments?: DomainEntitiesDepartmentsDepartment[] | null;
  leaveTypes?: DomainEntitiesLeaveTypesLeaveTypeRead[] | null;
};
export type DomainEntitiesEmployeesEmployeeLevel = 0 | 1 | 2;
export type DomainEntitiesEmployeesEmployeeStatus = 0 | 1 | 2;
export type DomainEntitiesEmployeesEmployeeActiveStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesEmployeesEmployeeInactiveStatus =
  0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesEmployeesEmployee = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
  residentialAddress?: string | null;
  nationality?: string | null;
  region?: string | null;
  maritalStatus?: DomainEntitiesEmployeesMaritalStatus;
  religion?: DomainEntitiesEmployeesReligion;
  staffNumber?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  bankAccountNumber?: string | null;
  ssnitNumber?: string | null;
  ghanaCardNumber?: string | null;
  annualLeaveDays?: number;
  type?: DomainEntitiesEmployeesEmployeeType;
  mother?: DomainEntitiesPersonsPerson;
  father?: DomainEntitiesPersonsPerson;
  spouse?: DomainEntitiesPersonsPerson;
  emergencyContact?: DomainEntitiesEmergencyContactsEmergencyContact;
  nextOfKin?: DomainEntitiesEmergencyContactsEmergencyContact;
  children?: DomainEntitiesChildrenChild[] | null;
  siblings?: DomainEntitiesSiblingsSibling[] | null;
  educationBackground?: DomainEntitiesEducationHistoriesEducation[] | null;
  employmentHistory?: DomainEntitiesEmployeeHistoriesEmploymentHistory[] | null;
  shiftAssignments?: DomainEntitiesShiftAssignmentsShiftAssignment[] | null;
  reportingManagerId?: string | null;
  reportingManager?: DomainEntitiesUsersUser;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  designationId?: string | null;
  designation?: DomainEntitiesDesignationsDesignation;
  dateEmployed?: string;
  level?: DomainEntitiesEmployeesEmployeeLevel;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  activeStatus?: DomainEntitiesEmployeesEmployeeActiveStatus;
  inactiveStatus?: DomainEntitiesEmployeesEmployeeInactiveStatus;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
  exitDate?: string | null;
  warehouses?: DomainEntitiesWarehousesWarehouse[] | null;
};
export type DomainEntitiesEmployeesEmployeeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
  residentialAddress?: string | null;
  nationality?: string | null;
  region?: string | null;
  maritalStatus?: DomainEntitiesEmployeesMaritalStatus;
  religion?: DomainEntitiesEmployeesReligion;
  staffNumber?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  bankAccountNumber?: string | null;
  ssnitNumber?: string | null;
  ghanaCardNumber?: string | null;
  annualLeaveDays?: number;
  type?: DomainEntitiesEmployeesEmployeeType;
  mother?: DomainEntitiesPersonsPerson;
  father?: DomainEntitiesPersonsPerson;
  spouse?: DomainEntitiesPersonsPerson;
  emergencyContact?: DomainEntitiesEmergencyContactsEmergencyContact;
  nextOfKin?: DomainEntitiesEmergencyContactsEmergencyContact;
  children?: DomainEntitiesChildrenChild[] | null;
  siblings?: DomainEntitiesSiblingsSibling[] | null;
  educationBackground?: DomainEntitiesEducationHistoriesEducation[] | null;
  employmentHistory?: DomainEntitiesEmployeeHistoriesEmploymentHistory[] | null;
  shiftAssignments?: DomainEntitiesShiftAssignmentsShiftAssignmentRead[] | null;
  reportingManagerId?: string | null;
  reportingManager?: DomainEntitiesUsersUser;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  designationId?: string | null;
  designation?: DomainEntitiesDesignationsDesignationRead;
  dateEmployed?: string;
  level?: DomainEntitiesEmployeesEmployeeLevel;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  activeStatus?: DomainEntitiesEmployeesEmployeeActiveStatus;
  inactiveStatus?: DomainEntitiesEmployeesEmployeeInactiveStatus;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
  exitDate?: string | null;
  warehouses?: DomainEntitiesWarehousesWarehouse[] | null;
};
export type DomainEntitiesWarehousesWarehouse = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  description?: string | null;
  locations?: DomainEntitiesWarehousesWarehouseLocation[] | null;
  arrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocation;
  type?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  employees?: DomainEntitiesEmployeesEmployee[] | null;
};
export type DomainEntitiesWarehousesWarehouseRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  description?: string | null;
  locations?: DomainEntitiesWarehousesWarehouseLocationRead[] | null;
  arrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocationRead;
  type?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  employees?: DomainEntitiesEmployeesEmployeeRead[] | null;
};
export type DomainEntitiesDepartmentsDepartment = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  type?: SharedDepartmentType;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  lastUpdatedById?: string | null;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  parentDepartmentId?: string | null;
  parentDepartment?: DomainEntitiesDepartmentsDepartment;
  warehouses?: DomainEntitiesWarehousesWarehouse[] | null;
  designations?: DomainEntitiesDesignationsDesignation[] | null;
  division?: DomainEntitiesProductsDivision;
  isSeeded?: boolean;
};
export type DomainEntitiesDepartmentsDepartmentRead = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  type?: SharedDepartmentType;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  lastUpdatedById?: string | null;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  parentDepartmentId?: string | null;
  parentDepartment?: DomainEntitiesDepartmentsDepartmentRead;
  warehouses?: DomainEntitiesWarehousesWarehouseRead[] | null;
  designations?: DomainEntitiesDesignationsDesignationRead[] | null;
  division?: DomainEntitiesProductsDivision;
  isSeeded?: boolean;
};
export type DomainEntitiesUsersUser = {
  id?: string;
  userName?: string | null;
  normalizedUserName?: string | null;
  email?: string | null;
  normalizedEmail?: string | null;
  emailConfirmed?: boolean;
  passwordHash?: string | null;
  securityStamp?: string | null;
  concurrencyStamp?: string | null;
  phoneNumber?: string | null;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnd?: string | null;
  lockoutEnabled?: boolean;
  accessFailedCount?: number;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  lastUpdatedById?: string | null;
  createdById?: string | null;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  avatar?: string | null;
  isDisabled?: boolean;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  signature?: string | null;
};
export type DomainEntitiesUsersUserRead = {
  id?: string;
  userName?: string | null;
  normalizedUserName?: string | null;
  email?: string | null;
  normalizedEmail?: string | null;
  emailConfirmed?: boolean;
  passwordHash?: string | null;
  securityStamp?: string | null;
  concurrencyStamp?: string | null;
  phoneNumber?: string | null;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnd?: string | null;
  lockoutEnabled?: boolean;
  accessFailedCount?: number;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  lastUpdatedById?: string | null;
  createdById?: string | null;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  avatar?: string | null;
  isDisabled?: boolean;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentRead;
  signature?: string | null;
};
export type DomainEntitiesProductsProductCategory = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesProductsProductCategoryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUserRead;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUserRead;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUserRead;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesProductsUpdateProductPackageDescriptionRequest = {
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
};
export type DomainEntitiesRoutesCreateRouteResource = {
  resourceId?: string;
};
export type DomainEntitiesRoutesCreateRouteResponsibleUser = {
  userId?: string;
  productAnalyticalRawDataId?: string | null;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesCreateRouteResponsibleRole = {
  roleId?: string;
  productAnalyticalRawDataId?: string | null;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesCreateRouteWorkCenter = {
  workCenterId?: string;
};
export type DomainEntitiesRoutesCreateRouteRequest = {
  operationId?: string;
  estimatedTime?: string | null;
  resources?: DomainEntitiesRoutesCreateRouteResource[] | null;
  responsibleUsers?: DomainEntitiesRoutesCreateRouteResponsibleUser[] | null;
  responsibleRoles?: DomainEntitiesRoutesCreateRouteResponsibleRole[] | null;
  workCenters?: DomainEntitiesRoutesCreateRouteWorkCenter[] | null;
  order?: number;
  isCritical?: boolean;
};
export type DomainEntitiesProductsCreateProductPackageRequest = {
  materialId: string;
  materialThickness?: string | null;
  otherStandards?: string | null;
  baseQuantity?: number;
  baseUoMId?: string | null;
  unitCapacity?: number;
  directLinkMaterialId?: string | null;
  packingExcessMargin?: number;
  prescribedQuantity?: number;
  loose?: number;
  productPackingId?: string | null;
  substituteMaterialIds?: string[] | null;
};
export type DomainEntitiesProductsCreateProductPackingList = {
  uomId?: string;
  quantity?: number;
  order?: number;
};
export type DomainEntitiesProductsCreateProductPacking = {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  packPerShipper?: number;
  basePackingUomId?: string | null;
  basePackingQuantity?: number;
  expectedYield?: number;
  isDefault?: boolean;
  packingLists?: DomainEntitiesProductsCreateProductPackingList[] | null;
};
export type DomainEntitiesProductsEquipmentsCreateEquipmentRequest = {
  name?: string | null;
  equipmentNumber?: string | null;
  isStorage?: boolean;
  capacityQuantity?: number;
  uoMId?: string | null;
  relevanceCheck?: boolean;
  departmentId?: string;
  location?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsEquipmentsEquipmentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductsEquipmentsEquipmentDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export const {
  usePostApiV1ProductMutation,
  useGetApiV1ProductQuery,
  useLazyGetApiV1ProductQuery,
  useGetApiV1ProductByProductIdQuery,
  useLazyGetApiV1ProductByProductIdQuery,
  usePutApiV1ProductByProductIdMutation,
  useDeleteApiV1ProductByProductIdMutation,
  useGetApiV1ProductCategoriesQuery,
  useLazyGetApiV1ProductCategoriesQuery,
  usePutApiV1ProductPackageDescriptionByProductIdMutation,
  useGetApiV1ProductByProductIdBomQuery,
  useLazyGetApiV1ProductByProductIdBomQuery,
  usePostApiV1ProductByProductIdRoutesMutation,
  useGetApiV1ProductByProductIdRoutesQuery,
  useLazyGetApiV1ProductByProductIdRoutesQuery,
  useGetApiV1ProductRoutesByRouteIdQuery,
  useLazyGetApiV1ProductRoutesByRouteIdQuery,
  useDeleteApiV1ProductRoutesByRouteIdMutation,
  usePostApiV1ProductByProductIdPackagesMutation,
  useGetApiV1ProductByProductIdPackagesQuery,
  useLazyGetApiV1ProductByProductIdPackagesQuery,
  usePostApiV1ProductByProductIdPackingMutation,
  useGetApiV1ProductByProductIdPackingQuery,
  useLazyGetApiV1ProductByProductIdPackingQuery,
  useGetApiV1ProductPackagesByProductPackageIdQuery,
  useLazyGetApiV1ProductPackagesByProductPackageIdQuery,
  usePutApiV1ProductPackagesByProductPackageIdMutation,
  useDeleteApiV1ProductPackagesByProductPackageIdMutation,
  usePostApiV1ProductByProductIdFinishedMutation,
  usePutApiV1ProductByProductIdBomArchiveMutation,
  usePostApiV1ProductEquipmentMutation,
  useGetApiV1ProductEquipmentQuery,
  useLazyGetApiV1ProductEquipmentQuery,
  useGetApiV1ProductEquipmentByEquipmentIdQuery,
  useLazyGetApiV1ProductEquipmentByEquipmentIdQuery,
  usePutApiV1ProductEquipmentByEquipmentIdMutation,
  useDeleteApiV1ProductEquipmentByEquipmentIdMutation,
  useGetApiV1ProductEquipmentAllQuery,
  useLazyGetApiV1ProductEquipmentAllQuery,
  useGetApiV1ProductDownloadStockQuery,
  useLazyGetApiV1ProductDownloadStockQuery,
  useGetApiV1ProductDownloadQuery,
  useLazyGetApiV1ProductDownloadQuery,
} = injectedRtkApi;
