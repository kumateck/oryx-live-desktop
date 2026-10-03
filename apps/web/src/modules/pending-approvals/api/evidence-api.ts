import { api } from "@/shared/api/base-api";
import { audit } from "../lib/approval-documents";

const headers = { Module: audit.module, SubModule: audit.subModule };

/**
 * Four documents an approver reads whose endpoints the server publishes without a response type,
 * so the generated client leaves them out. They are declared here and read through schemas.
 */
const evidenceApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCustomerQuotation: build.query<unknown, string>({ query: (id) => ({ url: `/api/v1/customers/quotations/${id}`, headers }), providesTags: [{ type: "PendingApprovals", id: "all" }] }),
    getPricingProposal: build.query<unknown, { supplierId: string; id: string }>({ query: ({ supplierId, id }) => ({ url: `/api/v1/suppliers/${supplierId}/pricing-agreements/proposals/${id}`, headers }), providesTags: [{ type: "PendingApprovals", id: "all" }] }),
    getPayrollRun: build.query<unknown, string>({ query: (id) => ({ url: `/api/v1/payroll/runs/${id}`, headers }), providesTags: [{ type: "PendingApprovals", id: "all" }] }),
    getPerformanceReview: build.query<unknown, string>({ query: (id) => ({ url: `/api/v1/performance/reviews/${id}`, headers }), providesTags: [{ type: "PendingApprovals", id: "all" }] }),
  }),
});
export const { useGetCustomerQuotationQuery, useGetPricingProposalQuery, useGetPayrollRunQuery, useGetPerformanceReviewQuery } = evidenceApi;
