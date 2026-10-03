import { api } from "@/shared/api/base-api";
import { productsApi } from "@/shared/api/generated/products";
import { salesApi } from "@/shared/api/generated/sales";
import { auditFor } from "../lib/customers";

const list = { type: "Customers" as const, id: "all" };
const one = (id: string) => ({ type: "Customers" as const, id });
const changed = (_result: unknown, error: unknown) => error ? [] : [list];

export const customerApi = salesApi.enhanceEndpoints({ endpoints: {
  getApiV1Customers: { providesTags: [list] }, postApiV1Customers: { invalidatesTags: changed }, putApiV1CustomersById: { invalidatesTags: changed }, deleteApiV1CustomersById: { invalidatesTags: changed } } });
export const { useGetApiV1CustomersQuery, useLazyGetApiV1CustomersQuery, usePostApiV1CustomersMutation, usePutApiV1CustomersByIdMutation, useDeleteApiV1CustomersByIdMutation } = customerApi;
export const { useLazyGetApiV1ProductQuery, useLazyGetApiV1ProductByProductIdPackingQuery } = productsApi;

const headers = (subModule: string) => { const audit = auditFor(subModule); return { Module: audit.module, SubModule: audit.subModule }; };
const write = (url: string, method: "POST" | "PUT" | "DELETE", body: unknown, subModule: string) => ({ url, method, ...(body === undefined ? {} : { body }), headers: headers(subModule) });
const read = (url: string, subModule: string, params?: Record<string, string | number | undefined>) => ({ url, headers: headers(subModule), ...(params ? { params } : {}) });
interface ForCustomer<T> { customerId: string; body: T }
interface ForChild<T> extends ForCustomer<T> { id: string }
export interface ProfileBody { name: string; email: string; phone: string; address: string; creditLimit: number | null; termsOfPaymentId: string | null; type: number | null; currencyId: string | null; billingAddress: string | null; shippingAddress: string | null }
export interface ContactBody { name: string; role?: string; email?: string; phone?: string; isPrimary: boolean }
export interface PricingBody { productId: string; productPackingId: string; currencyId: string; agreedPrice: number; effectiveFrom: string; effectiveTo: string | null; notes?: string }
export interface QuotationBody { code: string; validUntil: string; items: { productId: string; productPackingId: string; quantity: number; unitPrice?: number; discountPercent: number }[] }

/** The customer relationship endpoints are not in the server's published contract, so they are declared here. */
const crmApi = api.injectEndpoints({ endpoints: (build) => ({
  getCustomerProfile: build.query<unknown, string>({ query: (id) => read(`/api/v1/customers/${id}`, "Customer profile"), providesTags: (_result, _error, id) => [one(id)] }),
  updateCustomerProfile: build.mutation<void, ForCustomer<ProfileBody>>({ query: ({ customerId, body }) => write(`/api/v1/customers/${customerId}`, "PUT", body, "Customer profile"), invalidatesTags: (_r, error, arg) => error ? [] : [list, one(arg.customerId)] }),
  getCustomerCredit: build.query<unknown, { customerId: string; additionalOrderValue?: number }>({ query: ({ customerId, additionalOrderValue }) => read(`/api/v1/customers/${customerId}/credit-status`, "Credit status", { additionalOrderValue }), providesTags: (_r, _e, arg) => [one(arg.customerId)] }),
  getCustomerSummary: build.query<unknown, string>({ query: (id) => read(`/api/v1/customers/${id}/summary`, "Credit status"), providesTags: (_r, _e, id) => [one(id)] }),
  getCustomerContacts: build.query<unknown, string>({ query: (id) => read(`/api/v1/customers/${id}/contacts`, "Contacts"), providesTags: (_r, _e, id) => [one(id)] }),
  createCustomerContact: build.mutation<string, ForCustomer<ContactBody>>({ query: ({ customerId, body }) => write(`/api/v1/customers/${customerId}/contacts`, "POST", body, "Contacts"), invalidatesTags: (_r, error, arg) => error ? [] : [one(arg.customerId)] }),
  updateCustomerContact: build.mutation<void, ForChild<ContactBody>>({ query: ({ customerId, id, body }) => write(`/api/v1/customers/${customerId}/contacts/${id}`, "PUT", body, "Contacts"), invalidatesTags: (_r, error, arg) => error ? [] : [one(arg.customerId)] }),
  deleteCustomerContact: build.mutation<void, { customerId: string; id: string }>({ query: ({ customerId, id }) => write(`/api/v1/customers/${customerId}/contacts/${id}`, "DELETE", undefined, "Contacts"), invalidatesTags: (_r, error, arg) => error ? [] : [one(arg.customerId)] }),
  getCustomerPricing: build.query<unknown, string>({ query: (id) => read(`/api/v1/customers/${id}/pricing-agreements`, "Pricing agreements"), providesTags: (_r, _e, id) => [one(id)] }),
  createCustomerPricing: build.mutation<string, ForCustomer<PricingBody>>({ query: ({ customerId, body }) => write(`/api/v1/customers/${customerId}/pricing-agreements`, "POST", body, "Pricing agreements"), invalidatesTags: (_r, error, arg) => error ? [] : [one(arg.customerId)] }),
  updateCustomerPricing: build.mutation<void, ForChild<PricingBody>>({ query: ({ customerId, id, body }) => write(`/api/v1/customers/${customerId}/pricing-agreements/${id}`, "PUT", body, "Pricing agreements"), invalidatesTags: (_r, error, arg) => error ? [] : [one(arg.customerId)] }),
  deleteCustomerPricing: build.mutation<void, { customerId: string; id: string }>({ query: ({ customerId, id }) => write(`/api/v1/customers/${customerId}/pricing-agreements/${id}`, "DELETE", undefined, "Pricing agreements"), invalidatesTags: (_r, error, arg) => error ? [] : [one(arg.customerId)] }),
  getCustomerQuotations: build.query<{ data?: unknown }, { customerId: string; page?: number; pageSize?: number }>({ query: ({ customerId, page, pageSize }) => read(`/api/v1/customers/${customerId}/quotations`, "Quotations", { page, pageSize }), providesTags: (_r, _e, arg) => [one(arg.customerId), list] }),
  getCustomerQuotation: build.query<unknown, string>({ query: (id) => read(`/api/v1/customers/quotations/${id}`, "Quotations"), providesTags: [list] }),
  getConvertibleQuotations: build.query<unknown, string>({ query: (customerId) => read(`/api/v1/customers/${customerId}/quotations/convertible`, "Quotations"), providesTags: [list] }),
  resolveQuotationPrice: build.query<{ unitPrice?: number; fromAgreement?: boolean }, { customerId: string; productId: string; productPackingId: string }>({ query: ({ customerId, productId, productPackingId }) => read(`/api/v1/customers/${customerId}/quotations/resolve-price`, "Quotations", { productId, productPackingId }) }),
  createCustomerQuotation: build.mutation<string, ForCustomer<QuotationBody>>({ query: ({ customerId, body }) => write(`/api/v1/customers/${customerId}/quotations`, "POST", body, "Quotations"), invalidatesTags: changed }),
  sendCustomerQuotation: build.mutation<void, string>({ query: (id) => write(`/api/v1/customers/quotations/${id}/send`, "POST", undefined, "Quotation approval"), invalidatesTags: (_r, error) => error ? [] : [list, { type: "PendingApprovals", id: "all" }] }),
  convertCustomerQuotation: build.mutation<string, string>({ query: (id) => write(`/api/v1/customers/quotations/${id}/convert`, "POST", undefined, "Quotation conversion"), invalidatesTags: (_r, error) => error ? [] : [list, { type: "ProductionOrders", id: "all" }] }),
  getCustomerOrders: build.query<{ data?: unknown }, { customerId: string; page?: number; pageSize?: number }>({ query: ({ customerId, page, pageSize }) => read(`/api/v1/customers/${customerId}/order-history`, "Order history", { page, pageSize }), providesTags: (_r, _e, arg) => [one(arg.customerId), { type: "ProductionOrders", id: "all" }] }),
}) });
export const { useGetCustomerProfileQuery, useUpdateCustomerProfileMutation, useGetCustomerCreditQuery, useGetCustomerSummaryQuery, useGetCustomerContactsQuery, useCreateCustomerContactMutation, useUpdateCustomerContactMutation,
  useDeleteCustomerContactMutation, useGetCustomerPricingQuery, useCreateCustomerPricingMutation, useUpdateCustomerPricingMutation, useDeleteCustomerPricingMutation, useGetCustomerQuotationsQuery, useGetCustomerQuotationQuery,
  useGetConvertibleQuotationsQuery, useLazyResolveQuotationPriceQuery, useCreateCustomerQuotationMutation, useSendCustomerQuotationMutation, useConvertCustomerQuotationMutation, useGetCustomerOrdersQuery } = crmApi;
