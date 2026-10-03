import type { SupplierType } from "@/shared/procurement/supplier-type";

export const viewOrderPermissions: Record<SupplierType, string> = { 0: "CanViewForeignPurchaseOrder", 1: "CanViewLocalPurchaseOrder" };
export const viewApprovedPermissions: Record<SupplierType, string> = { 0: "CanViewApprovedForeignPurchaseOrder", 1: "CanViewApprovedLocalPurchaseOrder" };
/** Entering an order's charges and total, which sends it to be checked. */
export const finaliseOrderPermissions: Record<SupplierType, string> = { 0: "CanCreateForeignPurchaseOrder", 1: "CanCreateLocalPurchaseOrder" };
/** Marking a finalised order as checked, which sends it for approval. */
export const checkOrderPermissions: Record<SupplierType, string> = { 0: "CanCheckForeignPurchaseOrder", 1: "CanCheckLocalPurchaseOrder" };
/** Emailing an approved order to its supplier. */
export const sendOrderPermissions: Record<SupplierType, string> = { 0: "CanSendApprovedForeignPurchaseOrder", 1: "CanSendApprovedLocalPurchaseOrder" };

/** Changing the lines of an order that has already gone to its supplier. */
export const reviseOrderPermissions: Record<SupplierType, string> = { 0: "CanReviseForeignPurchaseOrder", 1: "CanReviseLocalPurchaseOrder" };

export const ordersPath = "/procurement/purchase-orders";
export const orderListPath = "/procurement/purchase-order-lists";
export const orderPath = (id: string, type: SupplierType) => `${ordersPath}/${id}?type=${type}`;
export const reviseOrderPath = (id: string, type: SupplierType) => `${ordersPath}/${id}/revise?type=${type}`;
export const audit = { module: "Procurement", subModule: "Purchase Orders" } as const;

/** The stages of a purchase order. The numbers are the server's. */
export const orderStatus = { awarded: 0, pending: 1, proformaRequested: 2, proformaReceived: 3, awaitingCheck: 4, checked: 5, approved: 6, sent: 7, partlyInvoiced: 8, invoiced: 9, revised: 10, cancelled: 11 } as const;
export type OrderStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export const orderStatusLabels: Record<OrderStatus, string> = {
  0: "Awarded", 1: "Pending", 2: "Proforma requested", 3: "Proforma received", 4: "Awaiting check", 5: "Checked, awaiting approval",
  6: "Approved", 7: "Sent to supplier", 8: "Partly invoiced", 9: "Fully invoiced", 10: "Revised", 11: "Cancelled",
};
export const isOrderStatus = (value: number): value is OrderStatus => Number.isInteger(value) && value >= 0 && value <= 11;
