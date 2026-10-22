export const financePermissions = { view: "CanViewPayments", record: "CanRecordPayment", approve: "CanApprovePayment", reports: "CanViewCashflowReports" } as const;
export const financeAudit = { module: "Cashflow", subModule: "Payments" } as const;
export const paymentPath = (id: string, approval = false) => `/finance/${approval ? "payment-approvals" : "payments"}/${encodeURIComponent(id)}`;
