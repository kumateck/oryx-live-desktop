export const invoicesPath = "/logistics/shipment-invoices";
export const createInvoicePath = `${invoicesPath}/create`;
export const invoicePath = (id: string) => `${invoicesPath}/${id}`;
export const invoicePermissions = { view: "CanViewShipmentInvoice", create: "CanCreateShipmentInvoice" } as const;
export const audit = { module: "Logistics", subModule: "Shipment Invoices" } as const;
/** A purchase order can be invoiced once it has been sent, and until every line is fully invoiced. The numbers are the server's. */
export const invoiceableStatuses: readonly number[] = [7, 8];
