import { historyParams } from "../lib/history";
import { singleReportFilters, reportSelection, selectedReportValue, selectedReportCode } from "../lib/selections";
import type { ApiDispatch } from "@/shared/api/api-provider";
import { reportsApi } from "@/shared/api/generated/reports";
import { productsApi } from "@/shared/api/generated/products";
import type { ReportFilters } from "../schemas/report-filters";
import { ReportKey, reportsAudit, type ReportOutput } from "../lib/report-model";
import { binaryChoice, departmentParam, expiryParams, periodParams, productWarehouseParams, reportBoundary } from "../lib/filter-params";
import { transferSummarySheet, transferDetailSheet, productStockSummarySheet, productStockDetailSheet, invoicedProductsSheet } from "../lib/finished-goods-adapters-1";
import { purchaseOrdersSheet, purchasedOrdersSheet, shipmentsSheet } from "../lib/procurement-adapters-1";
import { productMasterSheet } from "../lib/master-data-adapters";
import { filterSupplierMappings } from "./lookup-choices";
import { supplierMappingSheets } from "../lib/supplier-mappings";
import { reportContractApi } from "./contract-adapters";
import { allReportPages } from "./all-pages";
import { reportRequest } from "./request";
const options = { subscribe: false, forceRefetch: true };
export async function loadCommercialReport(dispatch: ApiDispatch, key: ReportKey, filters: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const f = singleReportFilters(filters);
  const productArgs = { ...reportsAudit, ...historyParams(filters), ...productWarehouseParams(f), ...departmentParam(f) };
  const transferArgs = { ...reportsAudit, ...historyParams(filters), ...productWarehouseParams(f), ...periodParams(f) };
  const supplierType = binaryChoice(f.supplierType?.value);
  const poArgs = { ...reportsAudit, ...historyParams(filters), ...periodParams(f), ...(f.supplierIds.length ? { supplierIds: f.supplierIds.map((option) => option.value) } : {}), ...(f.poNumber ? { poNumber: f.poNumber } : {}), ...(supplierType === undefined ? {} : { supplierType }) };
  const request = reportRequest;
  const productRows = <T extends {productCode?: string|null}>(rows:T[]) => reportSelection(filters,"product").length>1?rows.filter((row)=>selectedReportCode(filters,"product",row.productCode)):rows;
  switch (key) {
    case ReportKey.TransferSummary: return { sheets: [transferSummarySheet("Finished goods transfers", productRows(await request(dispatch(reportsApi.endpoints.getApiV1ReportFinishedGoodsTransferSummary.initiate(transferArgs, options)), signal)))] };
    case ReportKey.TransferDetail: return { sheets: [transferDetailSheet("Transfer batch details", productRows(await request(dispatch(reportsApi.endpoints.getApiV1ReportFinishedGoodsTransferDetailed.initiate(transferArgs, options)), signal)))] };
    case ReportKey.ProductStockSummary: return { sheets: [productStockSummarySheet("Product stock summary", productRows(await request(dispatch(reportsApi.endpoints.getApiV1ReportProductStockSummary.initiate(productArgs, options)), signal)))] };
    case ReportKey.ProductStockDetail: return { sheets: [productStockDetailSheet("Product stock detail", productRows(await request(dispatch(reportsApi.endpoints.getApiV1ReportProductStockDetailed.initiate({ ...productArgs, ...expiryParams(f), ...(f.batchNumber ? { batchNumber: f.batchNumber } : {}) }, options)), signal)))] };
    case ReportKey.PurchaseOrders: return { sheets: [purchaseOrdersSheet("Purchase orders", await request(dispatch(reportsApi.endpoints.getApiV1ReportPurchaseOrders.initiate(poArgs, options)), signal))] };
    case ReportKey.PurchasedOrders: return { sheets: [purchasedOrdersSheet("Invoiced purchase orders", await request(dispatch(reportsApi.endpoints.getApiV1ReportPurchasedPoReport.initiate(poArgs, options)), signal))] };
    case ReportKey.Shipments: return { sheets: [shipmentsSheet("Shipments", await request(dispatch(reportsApi.endpoints.getApiV1ReportShipment.initiate({ ...reportsAudit, ...historyParams(filters), ...periodParams(f), ...(f.supplierIds.length ? { supplierIds: f.supplierIds.map((option) => option.value) } : {}), ...(f.statuses.length ? { statuses: f.statuses.map((option) => option.value) } : {}) }, options)), signal))] };
    case ReportKey.InvoicedProducts: {
      const division = binaryChoice(f.division?.value);
      return { sheets: [invoicedProductsSheet("Invoiced products", productRows(await request(dispatch(reportsApi.endpoints.getApiV1ReportInvoicedProductsSummary.initiate({ ...reportsAudit, ...historyParams(filters), ...periodParams(f), ...(f.product ? { productId: f.product.value } : {}), ...(f.customer ? { customerId: f.customer.value } : {}), ...(division === undefined ? {} : { warehouseDivision: division }) }, options)), signal)))] };
    }
    case ReportKey.SupplierDetail: case ReportKey.SupplierSummary: {
      const materialType = binaryChoice(f.materialKind?.value);
      const mappings = await request(dispatch(reportContractApi.endpoints.readReportSupplierMappings.initiate({ ...reportsAudit, ...historyParams(filters),
        ...(f.materialName ? { materialName: f.materialName } : {}), ...(materialType === undefined ? {} : { materialType }),
        ...(f.supplier ? { supplierId: f.supplier.value } : {}), ...(f.manufacturer ? { manufacturerId: f.manufacturer.value } : {}),
        ...(f.validityDateFrom ? { validityDateFrom: reportBoundary(f.validityDateFrom) } : {}), ...(f.validityDateTo ? { validityDateTo: reportBoundary(f.validityDateTo, true) } : {}),
      }, options)), signal);
      return supplierMappingSheets(filterSupplierMappings(mappings,filters), key === ReportKey.SupplierSummary);
    }
    case ReportKey.ProductList: case ReportKey.QualityProducts: {
      const division = binaryChoice(f.division?.value);
      const products = await allReportPages((page) => request(dispatch(productsApi.endpoints.getApiV1Product.initiate({ ...reportsAudit, ...historyParams(filters), ...departmentParam(f), page, pageSize: 100, ...(division === undefined ? {} : { division }), ...(f.category ? { category: f.category.label } : {}) }, options)), signal), (row) => row.id, signal);
      return { sheets: [productMasterSheet(products.filter((row) => selectedReportValue(filters,"product",row.id) && selectedReportValue(filters,"category",row.category?.id)))] };
    }
    default: throw new Error("This report does not belong to the commercial reporting service.");
  }
}
