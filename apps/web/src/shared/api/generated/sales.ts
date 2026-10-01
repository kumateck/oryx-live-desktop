import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1Customers: build.mutation<
      PostApiV1CustomersApiResponse,
      PostApiV1CustomersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/customers`,
        method: "POST",
        body: queryArg.domainEntitiesCustomersCreateCustomerRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Customers: build.query<
      GetApiV1CustomersApiResponse,
      GetApiV1CustomersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/customers`,
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
    getApiV1CustomersById: build.query<
      GetApiV1CustomersByIdApiResponse,
      GetApiV1CustomersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/customers/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1CustomersById: build.mutation<
      PutApiV1CustomersByIdApiResponse,
      PutApiV1CustomersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/customers/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesCustomersCreateCustomerRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1CustomersById: build.mutation<
      DeleteApiV1CustomersByIdApiResponse,
      DeleteApiV1CustomersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/customers/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Payments: build.query<
      GetApiV1PaymentsApiResponse,
      GetApiV1PaymentsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          isReceipt: queryArg.isReceipt,
        },
      }),
    }),
    postApiV1Payments: build.mutation<
      PostApiV1PaymentsApiResponse,
      PostApiV1PaymentsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments`,
        method: "POST",
        body: queryArg.domainEntitiesPaymentsRecordPaymentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1PaymentsCurrencyConfiguration: build.query<
      GetApiV1PaymentsCurrencyConfigurationApiResponse,
      GetApiV1PaymentsCurrencyConfigurationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments/currency-configuration`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          asOf: queryArg.asOf,
        },
      }),
    }),
    getApiV1PaymentsByPaymentId: build.query<
      GetApiV1PaymentsByPaymentIdApiResponse,
      GetApiV1PaymentsByPaymentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments/${queryArg.paymentId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1PaymentsByPaymentIdApprovalDetails: build.query<
      GetApiV1PaymentsByPaymentIdApprovalDetailsApiResponse,
      GetApiV1PaymentsByPaymentIdApprovalDetailsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments/${queryArg.paymentId}/approval-details`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1PaymentsByPaymentIdReview: build.mutation<
      PostApiV1PaymentsByPaymentIdReviewApiResponse,
      PostApiV1PaymentsByPaymentIdReviewApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments/${queryArg.paymentId}/review`,
        method: "POST",
        body: queryArg.domainEntitiesPaymentsReviewPaymentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1PaymentsApAging: build.query<
      GetApiV1PaymentsApAgingApiResponse,
      GetApiV1PaymentsApAgingApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments/ap-aging`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          asOf: queryArg.asOf,
        },
      }),
    }),
    getApiV1PaymentsArAging: build.query<
      GetApiV1PaymentsArAgingApiResponse,
      GetApiV1PaymentsArAgingApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments/ar-aging`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          asOf: queryArg.asOf,
        },
      }),
    }),
    getApiV1PaymentsCashflowSummary: build.query<
      GetApiV1PaymentsCashflowSummaryApiResponse,
      GetApiV1PaymentsCashflowSummaryApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments/cashflow-summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          asOf: queryArg.asOf,
        },
      }),
    }),
    putApiV1PaymentsBaseCurrencyByCurrencyId: build.mutation<
      PutApiV1PaymentsBaseCurrencyByCurrencyIdApiResponse,
      PutApiV1PaymentsBaseCurrencyByCurrencyIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments/base-currency/${queryArg.currencyId}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1PaymentsExchangeRates: build.mutation<
      PostApiV1PaymentsExchangeRatesApiResponse,
      PostApiV1PaymentsExchangeRatesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments/exchange-rates`,
        method: "POST",
        body: queryArg.domainEntitiesCurrenciesCreateExchangeRateRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1PaymentsExchangeRatesByCurrencyId: build.query<
      GetApiV1PaymentsExchangeRatesByCurrencyIdApiResponse,
      GetApiV1PaymentsExchangeRatesByCurrencyIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/payments/exchange-rates/${queryArg.currencyId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          asOf: queryArg.asOf,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as salesApi };
export type PostApiV1CustomersApiResponse = /** status 200 OK */ string;
export type PostApiV1CustomersApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesCustomersCreateCustomerRequest: DomainEntitiesCustomersCreateCustomerRequest;
};
export type GetApiV1CustomersApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesCustomersCustomerDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1CustomersApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1CustomersByIdApiResponse =
  /** status 200 OK */ DomainEntitiesCustomersCustomerDto;
export type GetApiV1CustomersByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1CustomersByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesCustomersCustomerDto;
export type PutApiV1CustomersByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesCustomersCreateCustomerRequest: DomainEntitiesCustomersCreateCustomerRequest;
};
export type DeleteApiV1CustomersByIdApiResponse = void;
export type DeleteApiV1CustomersByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1PaymentsApiResponse =
  /** status 200 OK */ DomainEntitiesPaymentsPaymentListDto;
export type GetApiV1PaymentsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesPaymentsPaymentStatus;
  isReceipt?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1PaymentsApiResponse = /** status 200 OK */ string;
export type PostApiV1PaymentsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesPaymentsRecordPaymentRequest: DomainEntitiesPaymentsRecordPaymentRequest;
};
export type GetApiV1PaymentsCurrencyConfigurationApiResponse =
  /** status 200 OK */ DomainEntitiesPaymentsCashflowCurrencyDto;
export type GetApiV1PaymentsCurrencyConfigurationApiArg = {
  asOf?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1PaymentsByPaymentIdApiResponse =
  /** status 200 OK */ DomainEntitiesPaymentsPaymentDto;
export type GetApiV1PaymentsByPaymentIdApiArg = {
  paymentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1PaymentsByPaymentIdApprovalDetailsApiResponse =
  /** status 200 OK */ DomainEntitiesPaymentsPaymentDto;
export type GetApiV1PaymentsByPaymentIdApprovalDetailsApiArg = {
  paymentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1PaymentsByPaymentIdReviewApiResponse = void;
export type PostApiV1PaymentsByPaymentIdReviewApiArg = {
  paymentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesPaymentsReviewPaymentRequest: DomainEntitiesPaymentsReviewPaymentRequest;
};
export type GetApiV1PaymentsApAgingApiResponse =
  /** status 200 OK */ DomainEntitiesPaymentsAgingReportDto;
export type GetApiV1PaymentsApAgingApiArg = {
  asOf?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1PaymentsArAgingApiResponse =
  /** status 200 OK */ DomainEntitiesPaymentsAgingReportDto;
export type GetApiV1PaymentsArAgingApiArg = {
  asOf?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1PaymentsCashflowSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesPaymentsCashflowSummaryDto;
export type GetApiV1PaymentsCashflowSummaryApiArg = {
  asOf?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1PaymentsBaseCurrencyByCurrencyIdApiResponse = void;
export type PutApiV1PaymentsBaseCurrencyByCurrencyIdApiArg = {
  currencyId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1PaymentsExchangeRatesApiResponse =
  /** status 200 OK */ string;
export type PostApiV1PaymentsExchangeRatesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesCurrenciesCreateExchangeRateRequest: DomainEntitiesCurrenciesCreateExchangeRateRequest;
};
export type GetApiV1PaymentsExchangeRatesByCurrencyIdApiResponse =
  /** status 200 OK */ DomainEntitiesCurrenciesExchangeRateDto;
export type GetApiV1PaymentsExchangeRatesByCurrencyIdApiArg = {
  currencyId: string;
  asOf?: string;
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
export type DomainEntitiesCustomersCustomerType = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesCustomersCreateCustomerRequest = {
  name: string;
  email: string;
  phone: string;
  address: string;
  creditLimit?: number | null;
  termsOfPaymentId?: string | null;
  type?: DomainEntitiesCustomersCustomerType;
  currencyId?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
};
export type SharedDepartmentType = 0 | 1 | 2;
export type DomainEntitiesProductsDivision = 0 | 1;
export type SharedCollectionItemDto = {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  symbol?: string | null;
  uom?: string | null;
};
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
export type DomainEntitiesBaseTermsOfPaymentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  dueDays?: number | null;
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
export type DomainEntitiesCustomersCustomerDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number | null;
  termsOfPayment?: DomainEntitiesBaseTermsOfPaymentDto;
  type?: DomainEntitiesCustomersCustomerType;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  billingAddress?: string | null;
  shippingAddress?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesCustomersCustomerDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesCustomersCustomerDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesPaymentsPaymentMethod = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesPaymentsPayableType = 0 | 1 | 2 | 3;
export type DomainEntitiesPaymentsPaymentStatus = 0 | 1 | 2;
export type DomainEntitiesPaymentsPaymentListItemDto = {
  id?: string;
  amount?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  paymentDate?: string;
  method?: DomainEntitiesPaymentsPaymentMethod;
  reference?: string | null;
  payableType?: DomainEntitiesPaymentsPayableType;
  payableId?: string;
  status?: DomainEntitiesPaymentsPaymentStatus;
};
export type DomainEntitiesPaymentsPaymentListDto = {
  data?: DomainEntitiesPaymentsPaymentListItemDto[] | null;
  pageIndex?: number;
  pageCount?: number;
  totalRecordCount?: number;
};
export type DomainEntitiesPaymentsRecordPaymentRequest = {
  amount?: number;
  currencyId?: string;
  paymentDate?: string;
  method?: DomainEntitiesPaymentsPaymentMethod;
  reference: string;
  notes?: string | null;
  payableType?: DomainEntitiesPaymentsPayableType;
  payableId?: string;
};
export type DomainEntitiesPaymentsCashflowRateDto = {
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  rateToBase?: number | null;
  effectiveDate?: string | null;
};
export type DomainEntitiesPaymentsCashflowCurrencyDto = {
  baseCurrency?: DomainEntitiesCurrenciesCurrencyDto;
  asOf?: string;
  rates?: DomainEntitiesPaymentsCashflowRateDto[] | null;
};
export type DomainEntitiesApprovalsApprovalStatus = 0 | 1 | 2;
export type DomainEntitiesPaymentsPaymentApprovalDto = {
  id?: string;
  order?: number;
  required?: boolean;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  comments?: string | null;
};
export type DomainEntitiesPaymentsPaymentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  amount?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  paymentDate?: string;
  method?: DomainEntitiesPaymentsPaymentMethod;
  reference?: string | null;
  notes?: string | null;
  recordedBy?: DomainEntitiesUsersUserDto;
  payableType?: DomainEntitiesPaymentsPayableType;
  payableId?: string;
  approved?: boolean;
  status?: DomainEntitiesPaymentsPaymentStatus;
  approvals?: DomainEntitiesPaymentsPaymentApprovalDto[] | null;
};
export type DomainEntitiesPaymentsReviewPaymentRequest = {
  status?: DomainEntitiesApprovalsApprovalStatus;
  comments?: string | null;
};
export type DomainEntitiesPaymentsAgingBucketsDto = {
  current?: number;
  days0To30?: number;
  days31To60?: number;
  days61To90?: number;
  daysOver90?: number;
  dueDateUnknown?: number;
};
export type DomainEntitiesPaymentsAgingBucket = 0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesPaymentsAgingLineDto = {
  payableType?: DomainEntitiesPaymentsPayableType;
  payableId?: string;
  documentCode?: string | null;
  dueDate?: string | null;
  currencyId?: string;
  currencyName?: string | null;
  originalOutstanding?: number;
  rateToBase?: number;
  outstandingBase?: number;
  bucket?: DomainEntitiesPaymentsAgingBucket;
};
export type DomainEntitiesPaymentsAgingPartyDto = {
  partyId?: string;
  partyName?: string | null;
  totalOutstandingBase?: number;
  bucketsBase?: DomainEntitiesPaymentsAgingBucketsDto;
  lines?: DomainEntitiesPaymentsAgingLineDto[] | null;
};
export type DomainEntitiesPaymentsAgingReportDto = {
  baseCurrencyId?: string;
  baseCurrencyName?: string | null;
  totalOutstandingBase?: number;
  parties?: DomainEntitiesPaymentsAgingPartyDto[] | null;
  dataQualityWarnings?: string[] | null;
};
export type DomainEntitiesPaymentsCashflowDirectionDto = {
  totalOutstandingBase?: number;
  overdue?: number;
  next7Days?: number;
  days8To30?: number;
  days31To60?: number;
  days61To90?: number;
  beyond90Days?: number;
  dueDateUnknown?: number;
};
export type DomainEntitiesPaymentsCashflowSummaryDto = {
  baseCurrencyId?: string;
  baseCurrencyName?: string | null;
  projectedOutflows?: DomainEntitiesPaymentsCashflowDirectionDto;
  projectedInflows?: DomainEntitiesPaymentsCashflowDirectionDto;
  dataQualityWarnings?: string[] | null;
};
export type DomainEntitiesCurrenciesCreateExchangeRateRequest = {
  currencyId?: string;
  rateToBase?: number;
  effectiveDate?: string;
};
export type DomainEntitiesCurrenciesExchangeRateDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  rateToBase?: number;
  effectiveDate?: string;
};
export const {
  usePostApiV1CustomersMutation,
  useGetApiV1CustomersQuery,
  useLazyGetApiV1CustomersQuery,
  useGetApiV1CustomersByIdQuery,
  useLazyGetApiV1CustomersByIdQuery,
  usePutApiV1CustomersByIdMutation,
  useDeleteApiV1CustomersByIdMutation,
  useGetApiV1PaymentsQuery,
  useLazyGetApiV1PaymentsQuery,
  usePostApiV1PaymentsMutation,
  useGetApiV1PaymentsCurrencyConfigurationQuery,
  useLazyGetApiV1PaymentsCurrencyConfigurationQuery,
  useGetApiV1PaymentsByPaymentIdQuery,
  useLazyGetApiV1PaymentsByPaymentIdQuery,
  useGetApiV1PaymentsByPaymentIdApprovalDetailsQuery,
  useLazyGetApiV1PaymentsByPaymentIdApprovalDetailsQuery,
  usePostApiV1PaymentsByPaymentIdReviewMutation,
  useGetApiV1PaymentsApAgingQuery,
  useLazyGetApiV1PaymentsApAgingQuery,
  useGetApiV1PaymentsArAgingQuery,
  useLazyGetApiV1PaymentsArAgingQuery,
  useGetApiV1PaymentsCashflowSummaryQuery,
  useLazyGetApiV1PaymentsCashflowSummaryQuery,
  usePutApiV1PaymentsBaseCurrencyByCurrencyIdMutation,
  usePostApiV1PaymentsExchangeRatesMutation,
  useGetApiV1PaymentsExchangeRatesByCurrencyIdQuery,
  useLazyGetApiV1PaymentsExchangeRatesByCurrencyIdQuery,
} = injectedRtkApi;
