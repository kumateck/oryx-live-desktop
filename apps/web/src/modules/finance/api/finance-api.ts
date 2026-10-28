import { salesApi } from "@/shared/api/generated/sales";
import { approvalsApi } from "@/shared/api/generated/approvals";
import { addTags } from "@/shared/api/add-tags";
const payment = { type: "payment" as const, id: "LIST" };
const queue = { type: "PendingApprovals" as const, id: "all" };
const approvals = { type: "approval" as const, id: "LIST" };
export const financeApi = salesApi.enhanceEndpoints({ endpoints: {
  postApiV1PaymentsByPaymentIdReview: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [payment, queue, approvals, "BillingSheets"]); },
  postApiV1Payments: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [payment, queue, approvals, "BillingSheets"]); },
} });
export const financeQueueApi = approvalsApi.enhanceEndpoints({ endpoints: {
  getApiV1ApprovalMyPending: (definition) => { definition.providesTags = addTags(definition.providesTags, [queue, payment]); },
} });
export type { DomainEntitiesPaymentsPaymentDto as Payment, DomainEntitiesPaymentsPaymentListItemDto as PaymentRow,
  DomainEntitiesPaymentsCashflowDirectionDto as CashflowDirection, DomainEntitiesPaymentsAgingReportDto as AgingReport,
  DomainEntitiesPaymentsAgingPartyDto as AgingParty, DomainEntitiesPaymentsAgingLineDto as AgingLine,
  DomainEntitiesPaymentsCashflowCurrencyDto as CurrencyConfiguration } from "@/shared/api/generated/sales";
