import { api } from "@/shared/api/base-api";
import type { BankDetail, BankRequest, Certification, CertificationRequest, ComplianceDue, Contact, ContactRequest, Performance, PerformanceRequest, PricingAgreement, PricingRequest, RecordId, Scoped, ScopedRecord, SpendSummary } from "./types";
import { responseSchemas } from "./response-schemas";

const route = (id: string) => `/api/v1/suppliers/${id}`;
const audit = (subModule: string) => ({ Module: "Supplier relationship management", SubModule: subModule });
const tag = (supplierId: string, section: string) => [{ type: "Supplier" as const, id: `${supplierId}:${section}` }];
const pricingTags = (supplierId: string) => [{ type: "PendingApprovals" as const, id: "all" }, ...tag(supplierId, "pricing"), { type: "Supplier" as const, id: supplierId }, { type: "procurement/supplier" as const, id: supplierId }];

/** The backend DTOs provide these types; OpenAPI currently omits response schemas for SRM. */
export const relationshipApi = api.injectEndpoints({ endpoints: (build) => ({
  getCertifications: build.query<Certification[], string>({ query: (id) => `${route(id)}/certifications`, transformResponse: (response) => responseSchemas.certification.parse(response), providesTags: (_result, _error, id) => tag(id, "certifications") }),
  createCertification: build.mutation<string, Scoped<CertificationRequest>>({ query: ({ supplierId, body }) => ({ url: `${route(supplierId)}/certifications`, method: "POST", body, headers: audit("Certifications") }), transformResponse: (response) => responseSchemas.createdId.parse(response), invalidatesTags: (_result, error, arg) => error ? [] : tag(arg.supplierId, "certifications") }),
  updateCertification: build.mutation<void, ScopedRecord<CertificationRequest>>({ query: ({ supplierId, id, body }) => ({ url: `${route(supplierId)}/certifications/${id}`, method: "PUT", body, headers: audit("Certifications") }), invalidatesTags: (_result, error, arg) => error ? [] : tag(arg.supplierId, "certifications") }),
  deleteCertification: build.mutation<void, RecordId>({ query: ({ supplierId, id }) => ({ url: `${route(supplierId)}/certifications/${id}`, method: "DELETE", headers: audit("Certifications") }), invalidatesTags: (_result, error, arg) => error ? [] : tag(arg.supplierId, "certifications") }),
  getExpiringCertifications: build.query<Certification[], { withinDays: number; asOf: string }>({ query: (params) => ({ url: "/api/v1/suppliers/certifications/expiring", params }), transformResponse: (response) => responseSchemas.certification.parse(response) }),

  getContacts: build.query<Contact[], string>({ query: (id) => `${route(id)}/contacts`, transformResponse: (response) => responseSchemas.contact.parse(response), providesTags: (_result, _error, id) => tag(id, "contacts") }),
  createContact: build.mutation<string, Scoped<ContactRequest>>({ query: ({ supplierId, body }) => ({ url: `${route(supplierId)}/contacts`, method: "POST", body, headers: audit("Contacts") }), transformResponse: (response) => responseSchemas.createdId.parse(response), invalidatesTags: (_result, error, arg) => error ? [] : tag(arg.supplierId, "contacts") }),
  updateContact: build.mutation<void, ScopedRecord<ContactRequest>>({ query: ({ supplierId, id, body }) => ({ url: `${route(supplierId)}/contacts/${id}`, method: "PUT", body, headers: audit("Contacts") }), invalidatesTags: (_result, error, arg) => error ? [] : tag(arg.supplierId, "contacts") }),
  deleteContact: build.mutation<void, RecordId>({ query: ({ supplierId, id }) => ({ url: `${route(supplierId)}/contacts/${id}`, method: "DELETE", headers: audit("Contacts") }), invalidatesTags: (_result, error, arg) => error ? [] : tag(arg.supplierId, "contacts") }),

  getBankDetails: build.query<BankDetail[], string>({ query: (id) => `${route(id)}/bank-details`, transformResponse: (response) => responseSchemas.bank.parse(response), providesTags: (_result, _error, id) => tag(id, "bank") }),
  createBankDetail: build.mutation<string, Scoped<BankRequest>>({ query: ({ supplierId, body }) => ({ url: `${route(supplierId)}/bank-details`, method: "POST", body, headers: audit("Bank details") }), transformResponse: (response) => responseSchemas.createdId.parse(response), invalidatesTags: (_result, error, arg) => error ? [] : tag(arg.supplierId, "bank") }),
  updateBankDetail: build.mutation<void, ScopedRecord<BankRequest>>({ query: ({ supplierId, id, body }) => ({ url: `${route(supplierId)}/bank-details/${id}`, method: "PUT", body, headers: audit("Bank details") }), invalidatesTags: (_result, error, arg) => error ? [] : tag(arg.supplierId, "bank") }),
  deleteBankDetail: build.mutation<void, RecordId>({ query: ({ supplierId, id }) => ({ url: `${route(supplierId)}/bank-details/${id}`, method: "DELETE", headers: audit("Bank details") }), invalidatesTags: (_result, error, arg) => error ? [] : tag(arg.supplierId, "bank") }),

  getPricing: build.query<PricingAgreement[], string>({ query: (id) => ({ url: `${route(id)}/pricing-agreements`, headers: audit("Pricing agreements") }), transformResponse: (response) => responseSchemas.pricing.parse(response), providesTags: (_result, _error, id) => [...pricingTags(id), { type: "procurement/supplier", id: "LIST" }] }),
  createPricing: build.mutation<string, Scoped<PricingRequest>>({ query: ({ supplierId, body }) => ({ url: `${route(supplierId)}/pricing-agreements`, method: "POST", body, headers: audit("Pricing agreements") }), transformResponse: (response) => responseSchemas.createdId.parse(response), invalidatesTags: (_result, error, arg) => error ? [] : pricingTags(arg.supplierId) }),
  updatePricing: build.mutation<void, ScopedRecord<PricingRequest>>({ query: ({ supplierId, id, body }) => ({ url: `${route(supplierId)}/pricing-agreements/${id}`, method: "PUT", body, headers: audit("Pricing agreements") }), invalidatesTags: (_result, error, arg) => error ? [] : pricingTags(arg.supplierId) }),
  archivePricing: build.mutation<void, RecordId>({ query: ({ supplierId, id }) => ({ url: `${route(supplierId)}/pricing-agreements/${id}`, method: "DELETE", headers: audit("Pricing agreements") }), invalidatesTags: (_result, error, arg) => error ? [] : pricingTags(arg.supplierId) }),

  getPerformance: build.query<Performance[], string>({ query: (id) => `${route(id)}/performance`, transformResponse: (response) => responseSchemas.performance.parse(response), providesTags: (_result, _error, id) => tag(id, "performance") }),
  computePerformance: build.mutation<Performance, Scoped<PerformanceRequest>>({ query: ({ supplierId, body }) => ({ url: `${route(supplierId)}/performance/compute`, method: "POST", body, headers: audit("Performance") }), transformResponse: (response) => responseSchemas.performanceRecord.parse(response) }),
  persistPerformance: build.mutation<string, Scoped<PerformanceRequest>>({ query: ({ supplierId, body }) => ({ url: `${route(supplierId)}/performance`, method: "POST", body, headers: audit("Performance") }), transformResponse: (response) => responseSchemas.createdId.parse(response), invalidatesTags: (_result, error, arg) => error ? [] : tag(arg.supplierId, "performance") }),
  getSpend: build.query<SpendSummary, { supplierId: string; from: string; to: string }>({ query: ({ supplierId, ...params }) => ({ url: `${route(supplierId)}/spend-summary`, params }), transformResponse: (response) => responseSchemas.spend.parse(response) }),
  getRequalificationDue: build.query<ComplianceDue[], { withinDays: number; asOf: string }>({ query: (params) => ({ url: "/api/v1/suppliers/requalification-due", params }), transformResponse: (response) => responseSchemas.complianceDue.parse(response) }),
}) });

export const {
  useGetCertificationsQuery, useCreateCertificationMutation, useUpdateCertificationMutation, useDeleteCertificationMutation,
  useGetExpiringCertificationsQuery, useGetContactsQuery, useCreateContactMutation, useUpdateContactMutation, useDeleteContactMutation,
  useGetBankDetailsQuery, useCreateBankDetailMutation, useUpdateBankDetailMutation, useDeleteBankDetailMutation,
  useGetPricingQuery, useCreatePricingMutation, useUpdatePricingMutation, useArchivePricingMutation,
  useGetPerformanceQuery, useComputePerformanceMutation, usePersistPerformanceMutation, useGetSpendQuery, useGetRequalificationDueQuery,
} = relationshipApi;
