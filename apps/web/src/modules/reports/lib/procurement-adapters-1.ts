import type { DomainEntitiesReportsPurchaseOrderPurchaseOrderReportDtoRead, DomainEntitiesReportsPurchaseOrderPurchasedPoReportDtoRead, DomainEntitiesReportsShipmentsShipmentReportDto } from "@/shared/api/generated/reports";
import { reportSheet, reportDate, reportEnum } from "@/shared/reports/report-data";

export const purchaseOrdersSheet = (name: string, rows: readonly DomainEntitiesReportsPurchaseOrderPurchaseOrderReportDtoRead[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Supplier name", read: (row) => row.supplierName },
  { label: "Proforma invoice number", read: (row) => row.proformaInvoiceNumber },
  { label: "Purchase order number", read: (row) => row.purchaseOrderNumber },
  { label: "Material name", read: (row) => row.materialName },
  { label: "Order quantity", read: (row) => row.orderQuantity },
  { label: "Unit", read: (row) => row.uomName },
  { label: "Unit price", read: (row) => row.unitPrice },
  { label: "Price unit", read: (row) => row.priceUoM },
  { label: "Currency symbol", read: (row) => row.currencySymbol },
  { label: "Material value", read: (row) => row.materialValue },
  { label: "Purchase order date", read: (row) => reportDate(row.purchaseOrderDate) },
  { label: "Expected deliverydate", read: (row) => reportDate(row.expectedDeliverydate) },
]);

export const purchasedOrdersSheet = (name: string, rows: readonly DomainEntitiesReportsPurchaseOrderPurchasedPoReportDtoRead[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Supplier type", read: (row) => row.supplierType },
  { label: "Supplier name", read: (row) => row.supplierName },
  { label: "PO number", read: (row) => row.poNumber },
  { label: "Invoice number", read: (row) => row.invoiceNumber },
  { label: "Material name", read: (row) => row.materialName },
  { label: "Ordered quantity", read: (row) => row.orderedQuantity },
  { label: "Ordered uom", read: (row) => row.orderedUom },
  { label: "Quantity received", read: (row) => row.quantityReceived },
  { label: "Received uom", read: (row) => row.receivedUom },
  { label: "Unit cost", read: (row) => row.unitCost },
  { label: "Price unit", read: (row) => row.priceUoM },
  { label: "Currency symbol", read: (row) => row.currencySymbol },
  { label: "Material purchase value", read: (row) => row.materialPurchaseValue },
  { label: "Invoice date", read: (row) => reportDate(row.invoiceDate) },
]);

export const shipmentsSheet = (name: string, rows: readonly DomainEntitiesReportsShipmentsShipmentReportDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Supplier name", read: (row) => row.supplierName },
  { label: "Invoice amount", read: (row) => row.invoiceAmount },
  { label: "Materials", read: (row) => row.materials?.join("\n") },
  { label: "Expected arrival date", read: (row) => reportDate(row.expectedArrivalDate) },
  { label: "Free days", read: (row) => row.freeDays },
  { label: "Demurrage starts", read: (row) => reportDate(row.demurrageStarts) },
  { label: "Container size", read: (row) => row.containerSize },
  { label: "Bill of lading", read: (row) => row.billOfLadingNo },
  { label: "Transaction type", read: (row) => row.transactionType },
  { label: "Status", read: (row) => row.status },
]);

