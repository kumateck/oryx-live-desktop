export const billingSheetsPath = "/logistics/billing-sheets";
export const createBillingSheetPath = (invoiceId?: string) => `${billingSheetsPath}/create${invoiceId ? `?invoiceId=${encodeURIComponent(invoiceId)}` : ""}`;
export const billingSheetPath = (id: string) => `${billingSheetsPath}/${id}`;
export const editBillingSheetPath = (id: string) => `${billingSheetsPath}/${id}/edit`;
/** Recording a payment is a finance action with its own key; the rest belong to the billing sheet. */
export const billingPermissions = { view: "CanViewBillingSheet", create: "CanCreateBillingSheet", edit: "CanEditBillingSheet", remove: "CanDeleteBillingSheet", pay: "CanRecordPayment" } as const;
export const audit = { module: "Logistics", subModule: "Billing Sheets" } as const;

/** How a charge was paid. The numbers are the server's. */
export const paymentMethods = [{ value: "0", label: "Bank transfer" }, { value: "1", label: "Cheque" }, { value: "2", label: "Cash" }, { value: "3", label: "Credit card" }, { value: "4", label: "Other" }] as const;

export const billingFileTypes = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xlsx";
export const billingFileLimit = 10 * 1024 * 1024;
