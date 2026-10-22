import type { DomainEntitiesReportsFinishedGoodsTransferNotesFinishedGoodsTransferDetailedReportDto, DomainEntitiesReportsFinishedGoodsTransferNotesFinishedGoodsTransferSummaryReportDto, DomainEntitiesReportsFinishedGoodsTransferNotesInvoicedProductsSummaryReportDtoRead, DomainEntitiesReportsFinishedGoodsTransferNotesProductStockDetailedReportDto, DomainEntitiesReportsFinishedGoodsTransferNotesProductStockSummaryReportDto } from "@/shared/api/generated/reports";
import { reportSheet, reportDate, reportEnum } from "@/shared/reports/report-data";

export const transferSummarySheet = (name: string, rows: readonly DomainEntitiesReportsFinishedGoodsTransferNotesFinishedGoodsTransferSummaryReportDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Product name", read: (row) => row.productName },
  { label: "Product code", read: (row) => row.productCode },
  { label: "Number of batches", read: (row) => row.numberOfBatches },
  { label: "Total quantity", read: (row) => row.totalQuantity },
  { label: "Unit", read: (row) => row.uomName },
  { label: "Production department", read: (row) => row.productionDepartment },
  { label: "Destination warehouse", read: (row) => row.destinationWarehouse },
  { label: "Transfer date", read: (row) => reportDate(row.transferDate) },
  { label: "Accepted date", read: (row) => reportDate(row.acceptedDate) },
]);

export const transferDetailSheet = (name: string, rows: readonly DomainEntitiesReportsFinishedGoodsTransferNotesFinishedGoodsTransferDetailedReportDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Product name", read: (row) => row.productName },
  { label: "Product code", read: (row) => row.productCode },
  { label: "Batch number", read: (row) => row.batchNumber },
  { label: "Quantity transferred", read: (row) => row.quantityTransferred },
  { label: "Manufacturing date", read: (row) => reportDate(row.manufacturingDate) },
  { label: "Expiry date", read: (row) => reportDate(row.expiryDate) },
  { label: "Packing style", read: (row) => row.packingStyle },
  { label: "Unit", read: (row) => row.uomName },
  { label: "Production department", read: (row) => row.productionDepartment },
  { label: "Destination warehouse", read: (row) => row.destinationWarehouse },
  { label: "Transfer date", read: (row) => reportDate(row.transferDate) },
  { label: "Accepted date", read: (row) => reportDate(row.acceptedDate) },
  { label: "Status", read: (row) => row.status },
]);

export const productStockSummarySheet = (name: string, rows: readonly DomainEntitiesReportsFinishedGoodsTransferNotesProductStockSummaryReportDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Product name", read: (row) => row.productName },
  { label: "Product code", read: (row) => row.productCode },
  { label: "Warehouse", read: (row) => row.warehouse },
  { label: "Production department", read: (row) => row.productionDepartment },
  { label: "Number of batches", read: (row) => row.numberOfBatches },
  { label: "Total quantity", read: (row) => row.totalQuantity },
  { label: "Unit", read: (row) => row.uomName },
]);

export const productStockDetailSheet = (name: string, rows: readonly DomainEntitiesReportsFinishedGoodsTransferNotesProductStockDetailedReportDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Product name", read: (row) => row.productName },
  { label: "Product code", read: (row) => row.productCode },
  { label: "Batch number", read: (row) => row.batchNumber },
  { label: "Manufacturing date", read: (row) => reportDate(row.manufacturingDate) },
  { label: "Expiry date", read: (row) => reportDate(row.expiryDate) },
  { label: "Total quantity", read: (row) => row.totalQuantity },
  { label: "Unit", read: (row) => row.uomName },
  { label: "Production department", read: (row) => row.productionDepartment },
  { label: "Warehouse", read: (row) => row.warehouse },
]);

export const invoicedProductsSheet = (name: string, rows: readonly DomainEntitiesReportsFinishedGoodsTransferNotesInvoicedProductsSummaryReportDtoRead[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Invoice no", read: (row) => row.invoiceNo },
  { label: "Invoice date", read: (row) => reportDate(row.invoiceDate) },
  { label: "Customer name", read: (row) => row.customerName },
  { label: "Order no", read: (row) => row.orderNo },
  { label: "Order date", read: (row) => reportDate(row.orderDate) },
  { label: "No of batches", read: (row) => row.noOfBatches },
  { label: "Order quantity", read: (row) => row.orderQuantity },
  { label: "Quantity allocated", read: (row) => row.quantityAllocated },
  { label: "Outstanding quantity", read: (row) => row.outstandingQuantity },
  { label: "Product code", read: (row) => row.productCode },
  { label: "Product name", read: (row) => row.productName },
  { label: "Unit", read: (row) => row.uom },
  { label: "Unit price", read: (row) => row.unitPrice },
  { label: "Price unit", read: (row) => row.priceUoM },
  { label: "Item amount", read: (row) => row.itemAmount },
]);

