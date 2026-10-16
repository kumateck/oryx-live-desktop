import { api } from "@/shared/api/base-api";
import { audit } from "../lib/approval-documents";

const headers = { Module: audit.module, SubModule: "Approval Delegation" };
const tag = { type: "ApprovalDelegations" as const, id: "mine" };
const queue = { type: "PendingApprovals" as const, id: "all" };

/**
 * Approval delegation (oryx-backend `ApprovalController`, added with the `ApprovalDelegations` table).
 * Declared by hand until the contract in contracts/openapi is exported again from a backend that has it.
 */
const delegationApi = api.enhanceEndpoints({ addTagTypes: ["ApprovalDelegations"] }).injectEndpoints({
  endpoints: (build) => ({
    getMyDelegations: build.query<unknown, void>({ query: () => ({ url: "/api/v1/approval/delegations/mine", headers }), providesTags: [tag] }),
    // What is waiting for the user changes either way, so the queue is read again.
    delegateApprovals: build.mutation<unknown, { delegateUserId: string; startDate: string; endDate: string; reason: string | null }>({
      query: (body) => ({ url: "/api/v1/approval/delegate", method: "POST", body, headers }), invalidatesTags: (_result, error) => error ? [] : [tag, queue] }),
    revokeDelegation: build.mutation<unknown, string>({
      query: (id) => ({ url: `/api/v1/approval/delegations/${id}`, method: "DELETE", headers }), invalidatesTags: (_result, error) => error ? [] : [tag, queue] }),
  }),
});
export const { useGetMyDelegationsQuery, useDelegateApprovalsMutation, useRevokeDelegationMutation } = delegationApi;
