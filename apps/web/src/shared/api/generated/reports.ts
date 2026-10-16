import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getApiV1ReportProduction: build.query<
      GetApiV1ReportProductionApiResponse,
      GetApiV1ReportProductionApiArg
    >({
      providesTags: [{ type: "report/production", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/production`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportProductionMaterialsBelowMinimum: build.query<
      GetApiV1ReportProductionMaterialsBelowMinimumApiResponse,
      GetApiV1ReportProductionMaterialsBelowMinimumApiArg
    >({
      providesTags: [{ type: "report/production", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/production/materials-below-minimum`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ReportWarehouse: build.query<
      GetApiV1ReportWarehouseApiResponse,
      GetApiV1ReportWarehouseApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportLogistics: build.query<
      GetApiV1ReportLogisticsApiResponse,
      GetApiV1ReportLogisticsApiArg
    >({
      providesTags: [{ type: "report/logistic", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/logistics`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportReservedMaterialBatches: build.query<
      GetApiV1ReportReservedMaterialBatchesApiResponse,
      GetApiV1ReportReservedMaterialBatchesApiArg
    >({
      providesTags: [{ type: "report/reserved-material-batch", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/reserved-material-batches`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportHumanResource: build.query<
      GetApiV1ReportHumanResourceApiResponse,
      GetApiV1ReportHumanResourceApiArg
    >({
      providesTags: [{ type: "report/human-resource", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/human-resource`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
          designationId: queryArg.designationId,
          employeeType: queryArg.employeeType,
          gender: queryArg.gender,
        },
      }),
    }),
    getApiV1ReportStaffReport: build.query<
      GetApiV1ReportStaffReportApiResponse,
      GetApiV1ReportStaffReportApiArg
    >({
      providesTags: [{ type: "report/staff-report", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/staff-report`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportEmployeeMovement: build.query<
      GetApiV1ReportEmployeeMovementApiResponse,
      GetApiV1ReportEmployeeMovementApiArg
    >({
      providesTags: [{ type: "report/employee-movement", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/employee-movement`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportStaffTotalReport: build.query<
      GetApiV1ReportStaffTotalReportApiResponse,
      GetApiV1ReportStaffTotalReportApiArg
    >({
      providesTags: [{ type: "report/staff-total-report", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/staff-total-report`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportStaffGenderRatioReport: build.query<
      GetApiV1ReportStaffGenderRatioReportApiResponse,
      GetApiV1ReportStaffGenderRatioReportApiArg
    >({
      providesTags: [{ type: "report/staff-gender-ratio-report", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/staff-gender-ratio-report`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportStaffLeaveReport: build.query<
      GetApiV1ReportStaffLeaveReportApiResponse,
      GetApiV1ReportStaffLeaveReportApiArg
    >({
      providesTags: [{ type: "report/staff-leave-report", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/staff-leave-report`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportStaffTurnoverReport: build.query<
      GetApiV1ReportStaffTurnoverReportApiResponse,
      GetApiV1ReportStaffTurnoverReportApiArg
    >({
      providesTags: [{ type: "report/staff-turnover-report", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/staff-turnover-report`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportMaterialsReadyForChecklist: build.query<
      GetApiV1ReportMaterialsReadyForChecklistApiResponse,
      GetApiV1ReportMaterialsReadyForChecklistApiArg
    >({
      providesTags: [{ type: "report/materials-ready-for-checklist", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/materials-ready-for-checklist`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportMaterialsReadyForAssignment: build.query<
      GetApiV1ReportMaterialsReadyForAssignmentApiResponse,
      GetApiV1ReportMaterialsReadyForAssignmentApiArg
    >({
      providesTags: [{ type: "report/materials-ready-for-assignment", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/materials-ready-for-assignment`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportQaDashboard: build.query<
      GetApiV1ReportQaDashboardApiResponse,
      GetApiV1ReportQaDashboardApiArg
    >({
      providesTags: [{ type: "report/qa-dashboard", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/qa-dashboard`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
          productId: queryArg.productId,
        },
      }),
    }),
    getApiV1ReportQcDashboard: build.query<
      GetApiV1ReportQcDashboardApiResponse,
      GetApiV1ReportQcDashboardApiArg
    >({
      providesTags: [{ type: "report/qc-dashboard", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/qc-dashboard`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
          productId: queryArg.productId,
          materialId: queryArg.materialId,
        },
      }),
    }),
    getApiV1ReportFinishedGoodsTransferSummary: build.query<
      GetApiV1ReportFinishedGoodsTransferSummaryApiResponse,
      GetApiV1ReportFinishedGoodsTransferSummaryApiArg
    >({
      providesTags: [{ type: "report/finished-goods-transfer-summary", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/finished-goods-transfer-summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
          productId: queryArg.productId,
          warehouseId: queryArg.warehouseId,
        },
      }),
    }),
    getApiV1ReportFinishedGoodsTransferDetailed: build.query<
      GetApiV1ReportFinishedGoodsTransferDetailedApiResponse,
      GetApiV1ReportFinishedGoodsTransferDetailedApiArg
    >({
      providesTags: [{ type: "report/finished-goods-transfer-detailed", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/finished-goods-transfer-detailed`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
          productId: queryArg.productId,
          warehouseId: queryArg.warehouseId,
        },
      }),
    }),
    getApiV1ReportProductStockSummary: build.query<
      GetApiV1ReportProductStockSummaryApiResponse,
      GetApiV1ReportProductStockSummaryApiArg
    >({
      providesTags: [{ type: "report/product-stock-summary", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/product-stock-summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          productId: queryArg.productId,
          warehouseId: queryArg.warehouseId,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportProductStockDetailed: build.query<
      GetApiV1ReportProductStockDetailedApiResponse,
      GetApiV1ReportProductStockDetailedApiArg
    >({
      providesTags: [{ type: "report/product-stock-detailed", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/product-stock-detailed`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          productId: queryArg.productId,
          warehouseId: queryArg.warehouseId,
          departmentId: queryArg.departmentId,
          batchNumber: queryArg.batchNumber,
          expiryDateFrom: queryArg.expiryDateFrom,
          expiryDateTo: queryArg.expiryDateTo,
        },
      }),
    }),
    getApiV1ReportFgtnDashboardKpi: build.query<
      GetApiV1ReportFgtnDashboardKpiApiResponse,
      GetApiV1ReportFgtnDashboardKpiApiArg
    >({
      providesTags: [{ type: "report/fgtn", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/fgtn/dashboard-kpi`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          dateFilter: queryArg.dateFilter,
          customStartDate: queryArg.customStartDate,
          customEndDate: queryArg.customEndDate,
          materialId: queryArg.materialId,
          productId: queryArg.productId,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportSupplierMaterials: build.query<
      GetApiV1ReportSupplierMaterialsApiResponse,
      GetApiV1ReportSupplierMaterialsApiArg
    >({
      providesTags: [{ type: "report/supplier-material", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/supplier-materials`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialName: queryArg.materialName,
          materialType: queryArg.materialType,
          supplierName: queryArg.supplierName,
          manufacturerName: queryArg.manufacturerName,
          validityDateFrom: queryArg.validityDateFrom,
          validityDateTo: queryArg.validityDateTo,
          supplierId: queryArg.supplierId,
          manufacturerId: queryArg.manufacturerId,
        },
      }),
    }),
    getApiV1ReportItemsPerStoreType: build.query<
      GetApiV1ReportItemsPerStoreTypeApiResponse,
      GetApiV1ReportItemsPerStoreTypeApiArg
    >({
      providesTags: [{ type: "report/items-per-store-type", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/items-per-store-type`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          store: queryArg.store,
          inventoryClassification: queryArg.inventoryClassification,
          itemId: queryArg.itemId,
          categoryId: queryArg.categoryId,
        },
      }),
    }),
    getApiV1ReportStockSummaryPerStoreType: build.query<
      GetApiV1ReportStockSummaryPerStoreTypeApiResponse,
      GetApiV1ReportStockSummaryPerStoreTypeApiArg
    >({
      providesTags: [{ type: "report/stock-summary-per-store-type", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/stock-summary-per-store-type`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ReportVendorItem: build.query<
      GetApiV1ReportVendorItemApiResponse,
      GetApiV1ReportVendorItemApiArg
    >({
      providesTags: [{ type: "report/vendor-item", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/vendor-item`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          store: queryArg.store,
          vendorId: queryArg.vendorId,
          itemId: queryArg.itemId,
          categoryId: queryArg.categoryId,
          classification: queryArg.classification,
        },
      }),
    }),
    getApiV1ReportVendorItemSummary: build.query<
      GetApiV1ReportVendorItemSummaryApiResponse,
      GetApiV1ReportVendorItemSummaryApiArg
    >({
      providesTags: [{ type: "report/vendor-item", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/vendor-item/summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          itemId: queryArg.itemId,
          categoryId: queryArg.categoryId,
          classification: queryArg.classification,
          store: queryArg.store,
        },
      }),
    }),
    getApiV1ReportShipment: build.query<
      GetApiV1ReportShipmentApiResponse,
      GetApiV1ReportShipmentApiArg
    >({
      providesTags: [{ type: "report/shipment", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/shipment`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          supplierIds: queryArg.supplierIds,
          statuses: queryArg.statuses,
        },
      }),
    }),
    getApiV1ReportPurchaseOrders: build.query<
      GetApiV1ReportPurchaseOrdersApiResponse,
      GetApiV1ReportPurchaseOrdersApiArg
    >({
      providesTags: [{ type: "report/purchase-order", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/purchase-orders`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          supplierIds: queryArg.supplierIds,
          poNumber: queryArg.poNumber,
          supplierType: queryArg.supplierType,
        },
      }),
    }),
    getApiV1ReportPurchasedPoReport: build.query<
      GetApiV1ReportPurchasedPoReportApiResponse,
      GetApiV1ReportPurchasedPoReportApiArg
    >({
      providesTags: [{ type: "report/purchased-po-report", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/purchased-po-report`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          supplierIds: queryArg.supplierIds,
          poNumber: queryArg.poNumber,
          supplierType: queryArg.supplierType,
        },
      }),
    }),
    getApiV1ReportProductionDashboard: build.query<
      GetApiV1ReportProductionDashboardApiResponse,
      GetApiV1ReportProductionDashboardApiArg
    >({
      providesTags: [{ type: "report/production-dashboard", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/production-dashboard`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ReportProcurementDashboard: build.query<
      GetApiV1ReportProcurementDashboardApiResponse,
      GetApiV1ReportProcurementDashboardApiArg
    >({
      providesTags: [{ type: "report/procurement-dashboard", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/procurement-dashboard`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          filter: queryArg.filter,
        },
      }),
    }),
    getApiV1ReportWarehouseDashboard: build.query<
      GetApiV1ReportWarehouseDashboardApiResponse,
      GetApiV1ReportWarehouseDashboardApiArg
    >({
      providesTags: [{ type: "report/warehouse-dashboard", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse-dashboard`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          filter: queryArg.filter,
        },
      }),
    }),
    getApiV1ReportExpiredMaterials: build.query<
      GetApiV1ReportExpiredMaterialsApiResponse,
      GetApiV1ReportExpiredMaterialsApiArg
    >({
      providesTags: [{ type: "report/expired-material", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/expired-materials`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ReportReservedMaterials: build.query<
      GetApiV1ReportReservedMaterialsApiResponse,
      GetApiV1ReportReservedMaterialsApiArg
    >({
      providesTags: [{ type: "report/reserved-material", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/reserved-materials`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialId: queryArg.materialId,
        },
      }),
    }),
    getApiV1ReportMaterialsBelowReorder: build.query<
      GetApiV1ReportMaterialsBelowReorderApiResponse,
      GetApiV1ReportMaterialsBelowReorderApiArg
    >({
      providesTags: [{ type: "report/materials-below-reorder", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/materials-below-reorder`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ReportMaterialsChecklist: build.query<
      GetApiV1ReportMaterialsChecklistApiResponse,
      GetApiV1ReportMaterialsChecklistApiArg
    >({
      providesTags: [{ type: "report/materials-checklist", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/materials-checklist`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ReportShipmentStatusSummary: build.query<
      GetApiV1ReportShipmentStatusSummaryApiResponse,
      GetApiV1ReportShipmentStatusSummaryApiArg
    >({
      providesTags: [{ type: "report/shipment-status-summary", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/shipment-status-summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          filter: queryArg.filter,
        },
      }),
    }),
    getApiV1ReportGeneralInventoryDashboard: build.query<
      GetApiV1ReportGeneralInventoryDashboardApiResponse,
      GetApiV1ReportGeneralInventoryDashboardApiArg
    >({
      providesTags: [{ type: "report/general-inventory-dashboard", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/general-inventory-dashboard`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          filter: queryArg.filter,
        },
      }),
    }),
    getApiV1ReportItemsBelowReorder: build.query<
      GetApiV1ReportItemsBelowReorderApiResponse,
      GetApiV1ReportItemsBelowReorderApiArg
    >({
      providesTags: [{ type: "report/items-below-reorder", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/items-below-reorder`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ReportServicesDashboard: build.query<
      GetApiV1ReportServicesDashboardApiResponse,
      GetApiV1ReportServicesDashboardApiArg
    >({
      providesTags: [{ type: "report/services-dashboard", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/services-dashboard`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          filter: queryArg.filter,
        },
      }),
    }),
    getApiV1ReportInvoicedProductsSummary: build.query<
      GetApiV1ReportInvoicedProductsSummaryApiResponse,
      GetApiV1ReportInvoicedProductsSummaryApiArg
    >({
      providesTags: [{ type: "report/invoiced-products-summary", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/invoiced-products-summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          productId: queryArg.productId,
          customerId: queryArg.customerId,
          warehouseDivision: queryArg.warehouseDivision,
        },
      }),
    }),
    getApiV1ReportInvoicedProductsDetailed: build.query<
      GetApiV1ReportInvoicedProductsDetailedApiResponse,
      GetApiV1ReportInvoicedProductsDetailedApiArg
    >({
      providesTags: [{ type: "report/invoiced-products-detailed", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/invoiced-products-detailed`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          productId: queryArg.productId,
          customerId: queryArg.customerId,
          warehouseDivision: queryArg.warehouseDivision,
        },
      }),
    }),
    getApiV1ReportWarehouseKpiCapacityUtilisation: build.query<
      GetApiV1ReportWarehouseKpiCapacityUtilisationApiResponse,
      GetApiV1ReportWarehouseKpiCapacityUtilisationApiArg
    >({
      providesTags: [{ type: "report/warehouse-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse-kpi/capacity-utilisation`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          warehouseType: queryArg.warehouseType,
          division: queryArg.division,
        },
      }),
    }),
    getApiV1ReportWarehouseKpiDockToStock: build.query<
      GetApiV1ReportWarehouseKpiDockToStockApiResponse,
      GetApiV1ReportWarehouseKpiDockToStockApiArg
    >({
      providesTags: [{ type: "report/warehouse-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse-kpi/dock-to-stock`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          warehouseType: queryArg.warehouseType,
          division: queryArg.division,
          datePreset: queryArg.datePreset,
          customStartDate: queryArg.customStartDate,
          customEndDate: queryArg.customEndDate,
        },
      }),
    }),
    getApiV1ReportWarehouseKpiStockTransferFulfilment: build.query<
      GetApiV1ReportWarehouseKpiStockTransferFulfilmentApiResponse,
      GetApiV1ReportWarehouseKpiStockTransferFulfilmentApiArg
    >({
      providesTags: [{ type: "report/warehouse-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse-kpi/stock-transfer-fulfilment`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          datePreset: queryArg.datePreset,
          customStartDate: queryArg.customStartDate,
          customEndDate: queryArg.customEndDate,
          fromDepartmentId: queryArg.fromDepartmentId,
          toDepartmentId: queryArg.toDepartmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseKpiReceivingPipeline: build.query<
      GetApiV1ReportWarehouseKpiReceivingPipelineApiResponse,
      GetApiV1ReportWarehouseKpiReceivingPipelineApiArg
    >({
      providesTags: [{ type: "report/warehouse-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse-kpi/receiving-pipeline`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          warehouseType: queryArg.warehouseType,
          division: queryArg.division,
        },
      }),
    }),
    getApiV1ReportWarehouseKpiExpiryRiskIndex: build.query<
      GetApiV1ReportWarehouseKpiExpiryRiskIndexApiResponse,
      GetApiV1ReportWarehouseKpiExpiryRiskIndexApiArg
    >({
      providesTags: [{ type: "report/warehouse-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse-kpi/expiry-risk-index`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          warehouseType: queryArg.warehouseType,
          division: queryArg.division,
          expiryWindow: queryArg.expiryWindow,
        },
      }),
    }),
    getApiV1ReportWarehouseKpiReorderAlertCount: build.query<
      GetApiV1ReportWarehouseKpiReorderAlertCountApiResponse,
      GetApiV1ReportWarehouseKpiReorderAlertCountApiArg
    >({
      providesTags: [{ type: "report/warehouse-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse-kpi/reorder-alert-count`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportWarehouseKpiSwapRequestActivity: build.query<
      GetApiV1ReportWarehouseKpiSwapRequestActivityApiResponse,
      GetApiV1ReportWarehouseKpiSwapRequestActivityApiArg
    >({
      providesTags: [{ type: "report/warehouse-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse-kpi/swap-request-activity`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          warehouseType: queryArg.warehouseType,
          division: queryArg.division,
          datePreset: queryArg.datePreset,
          customStartDate: queryArg.customStartDate,
          customEndDate: queryArg.customEndDate,
        },
      }),
    }),
    getApiV1ReportWarehouseKpiMaterialMovementCount: build.query<
      GetApiV1ReportWarehouseKpiMaterialMovementCountApiResponse,
      GetApiV1ReportWarehouseKpiMaterialMovementCountApiArg
    >({
      providesTags: [{ type: "report/warehouse-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse-kpi/material-movement-count`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          warehouseType: queryArg.warehouseType,
          division: queryArg.division,
          datePreset: queryArg.datePreset,
          customStartDate: queryArg.customStartDate,
          customEndDate: queryArg.customEndDate,
        },
      }),
    }),
    getApiV1ReportWarehouseKpiFreshness: build.query<
      GetApiV1ReportWarehouseKpiFreshnessApiResponse,
      GetApiV1ReportWarehouseKpiFreshnessApiArg
    >({
      providesTags: [{ type: "report/warehouse-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse-kpi/freshness`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          warehouseType: queryArg.warehouseType,
          division: queryArg.division,
        },
      }),
    }),
    getApiV1ReportKpiBmrReleaseRate: build.query<
      GetApiV1ReportKpiBmrReleaseRateApiResponse,
      GetApiV1ReportKpiBmrReleaseRateApiArg
    >({
      providesTags: [{ type: "report/kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/kpi/bmr-release-rate`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportKpiYieldPerformance: build.query<
      GetApiV1ReportKpiYieldPerformanceApiResponse,
      GetApiV1ReportKpiYieldPerformanceApiArg
    >({
      providesTags: [{ type: "report/kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/kpi/yield-performance`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportKpiScheduleAdherence: build.query<
      GetApiV1ReportKpiScheduleAdherenceApiResponse,
      GetApiV1ReportKpiScheduleAdherenceApiArg
    >({
      providesTags: [{ type: "report/kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/kpi/schedule-adherence`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportKpiProductionOutputVolume: build.query<
      GetApiV1ReportKpiProductionOutputVolumeApiResponse,
      GetApiV1ReportKpiProductionOutputVolumeApiArg
    >({
      providesTags: [{ type: "report/kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/kpi/production-output-volume`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportKpiAtrTestingBacklog: build.query<
      GetApiV1ReportKpiAtrTestingBacklogApiResponse,
      GetApiV1ReportKpiAtrTestingBacklogApiArg
    >({
      providesTags: [{ type: "report/kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/kpi/atr-testing-backlog`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportKpiStockRequisitionPending: build.query<
      GetApiV1ReportKpiStockRequisitionPendingApiResponse,
      GetApiV1ReportKpiStockRequisitionPendingApiArg
    >({
      providesTags: [{ type: "report/kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/kpi/stock-requisition-pending`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportKpiFgtnPendingApproval: build.query<
      GetApiV1ReportKpiFgtnPendingApprovalApiResponse,
      GetApiV1ReportKpiFgtnPendingApprovalApiArg
    >({
      providesTags: [{ type: "report/kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/kpi/fgtn-pending-approval`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportKpiProductionOrderDeliveryStatus: build.query<
      GetApiV1ReportKpiProductionOrderDeliveryStatusApiResponse,
      GetApiV1ReportKpiProductionOrderDeliveryStatusApiArg
    >({
      providesTags: [{ type: "report/kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/kpi/production-order-delivery-status`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
          customerId: queryArg.customerId,
        },
      }),
    }),
    getApiV1ReportKpiMaterialReturnRate: build.query<
      GetApiV1ReportKpiMaterialReturnRateApiResponse,
      GetApiV1ReportKpiMaterialReturnRateApiArg
    >({
      providesTags: [{ type: "report/kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/kpi/material-return-rate`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseMaterialsStockSummary: build.query<
      GetApiV1ReportWarehouseMaterialsStockSummaryApiResponse,
      GetApiV1ReportWarehouseMaterialsStockSummaryApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/materials-stock-summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          materialKind: queryArg.materialKind,
          materialId: queryArg.materialId,
        },
      }),
    }),
    getApiV1ReportWarehouseMaterialsStockBatchDetail: build.query<
      GetApiV1ReportWarehouseMaterialsStockBatchDetailApiResponse,
      GetApiV1ReportWarehouseMaterialsStockBatchDetailApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/materials-stock-batch-detail`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          materialKind: queryArg.materialKind,
          batchNumber: queryArg.batchNumber,
          expiryDateFrom: queryArg.expiryDateFrom,
          expiryDateTo: queryArg.expiryDateTo,
        },
      }),
    }),
    getApiV1ReportWarehouseShelfUtilisationDetail: build.query<
      GetApiV1ReportWarehouseShelfUtilisationDetailApiResponse,
      GetApiV1ReportWarehouseShelfUtilisationDetailApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/shelf-utilisation-detail`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          locationId: queryArg.locationId,
          occupancyStatus: queryArg.occupancyStatus,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseGoodsReceivingRegister: build.query<
      GetApiV1ReportWarehouseGoodsReceivingRegisterApiResponse,
      GetApiV1ReportWarehouseGoodsReceivingRegisterApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/goods-receiving-register`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          grnStatus: queryArg.grnStatus,
          supplierId: queryArg.supplierId,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseReceivingPerformanceDetail: build.query<
      GetApiV1ReportWarehouseReceivingPerformanceDetailApiResponse,
      GetApiV1ReportWarehouseReceivingPerformanceDetailApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/receiving-performance-detail`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          warehouseId: queryArg.warehouseId,
          supplierId: queryArg.supplierId,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehousePutawayRegister: build.query<
      GetApiV1ReportWarehousePutawayRegisterApiResponse,
      GetApiV1ReportWarehousePutawayRegisterApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/putaway-register`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          warehouseId: queryArg.warehouseId,
          employeeId: queryArg.employeeId,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseStockAdjustmentAudit: build.query<
      GetApiV1ReportWarehouseStockAdjustmentAuditApiResponse,
      GetApiV1ReportWarehouseStockAdjustmentAuditApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/stock-adjustment-audit`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          reasonCode: queryArg.reasonCode,
          warehouseId: queryArg.warehouseId,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseBatchTraceability: build.query<
      GetApiV1ReportWarehouseBatchTraceabilityApiResponse,
      GetApiV1ReportWarehouseBatchTraceabilityApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/batch-traceability`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialBatchId: queryArg.materialBatchId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseInterWarehouseSwapRequests: build.query<
      GetApiV1ReportWarehouseInterWarehouseSwapRequestsApiResponse,
      GetApiV1ReportWarehouseInterWarehouseSwapRequestsApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/inter-warehouse-swap-requests`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          warehouseId: queryArg.warehouseId,
          status: queryArg.status,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseStockTransferInterDepartment: build.query<
      GetApiV1ReportWarehouseStockTransferInterDepartmentApiResponse,
      GetApiV1ReportWarehouseStockTransferInterDepartmentApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/stock-transfer-inter-department`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          fromDepartmentId: queryArg.fromDepartmentId,
          toDepartmentId: queryArg.toDepartmentId,
          status: queryArg.status,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseMaterialExpiryProjection: build.query<
      GetApiV1ReportWarehouseMaterialExpiryProjectionApiResponse,
      GetApiV1ReportWarehouseMaterialExpiryProjectionApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/material-expiry-projection`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          window: queryArg.window,
          warehouseId: queryArg.warehouseId,
          materialId: queryArg.materialId,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseSlowMovingInventory: build.query<
      GetApiV1ReportWarehouseSlowMovingInventoryApiResponse,
      GetApiV1ReportWarehouseSlowMovingInventoryApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/slow-moving-inventory`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          materialId: queryArg.materialId,
          departmentId: queryArg.departmentId,
          threshold: queryArg.threshold,
        },
      }),
    }),
    getApiV1ReportWarehouseBinCardTransactionLedger: build.query<
      GetApiV1ReportWarehouseBinCardTransactionLedgerApiResponse,
      GetApiV1ReportWarehouseBinCardTransactionLedgerApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/bin-card-transaction-ledger`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialBatchId: queryArg.materialBatchId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseOperationsSummary: build.query<
      GetApiV1ReportWarehouseOperationsSummaryApiResponse,
      GetApiV1ReportWarehouseOperationsSummaryApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/operations-summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          warehouseId: queryArg.warehouseId,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseQcPending: build.query<
      GetApiV1ReportWarehouseQcPendingApiResponse,
      GetApiV1ReportWarehouseQcPendingApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/qc-pending`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          supplierId: queryArg.supplierId,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseReorderLevelVsStock: build.query<
      GetApiV1ReportWarehouseReorderLevelVsStockApiResponse,
      GetApiV1ReportWarehouseReorderLevelVsStockApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/reorder-level-vs-stock`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1ReportWarehouseInventoryValuationSummary: build.query<
      GetApiV1ReportWarehouseInventoryValuationSummaryApiResponse,
      GetApiV1ReportWarehouseInventoryValuationSummaryApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/inventory-valuation-summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseType: queryArg.warehouseType,
          division: queryArg.division,
          uomGroup: queryArg.uomGroup,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseInventoryValuationDetail: build.query<
      GetApiV1ReportWarehouseInventoryValuationDetailApiResponse,
      GetApiV1ReportWarehouseInventoryValuationDetailApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/inventory-valuation-detail`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseType: queryArg.warehouseType,
          division: queryArg.division,
          warehouseId: queryArg.warehouseId,
          valuationType: queryArg.valuationType,
          materialId: queryArg.materialId,
          expiryDateFrom: queryArg.expiryDateFrom,
          expiryDateTo: queryArg.expiryDateTo,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseEmployeeActivity: build.query<
      GetApiV1ReportWarehouseEmployeeActivityApiResponse,
      GetApiV1ReportWarehouseEmployeeActivityApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/employee-activity`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          materialKind: queryArg.materialKind,
          employeeId: queryArg.employeeId,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportWarehouseArrivalLocationStatus: build.query<
      GetApiV1ReportWarehouseArrivalLocationStatusApiResponse,
      GetApiV1ReportWarehouseArrivalLocationStatusApiArg
    >({
      providesTags: [{ type: "report/warehouse", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/warehouse/arrival-location-status`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          status: queryArg.status,
          agingThresholdDays: queryArg.agingThresholdDays,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportHrKpiEmployeeHeadcount: build.query<
      GetApiV1ReportHrKpiEmployeeHeadcountApiResponse,
      GetApiV1ReportHrKpiEmployeeHeadcountApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/employee-headcount`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          employeeType: queryArg.employeeType,
          status: queryArg.status,
        },
      }),
    }),
    getApiV1ReportHrKpiEmployeeGenderRatio: build.query<
      GetApiV1ReportHrKpiEmployeeGenderRatioApiResponse,
      GetApiV1ReportHrKpiEmployeeGenderRatioApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/employee-gender-ratio`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportHrKpiLeaveRequestPipeline: build.query<
      GetApiV1ReportHrKpiLeaveRequestPipelineApiResponse,
      GetApiV1ReportHrKpiLeaveRequestPipelineApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/leave-request-pipeline`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ReportHrKpiOvertimeRequestActivity: build.query<
      GetApiV1ReportHrKpiOvertimeRequestActivityApiResponse,
      GetApiV1ReportHrKpiOvertimeRequestActivityApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/overtime-request-activity`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ReportHrKpiDailyAttendanceRate: build.query<
      GetApiV1ReportHrKpiDailyAttendanceRateApiResponse,
      GetApiV1ReportHrKpiDailyAttendanceRateApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/daily-attendance-rate`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          date: queryArg.date,
        },
      }),
    }),
    getApiV1ReportHrKpiStaffRequisitionPipeline: build.query<
      GetApiV1ReportHrKpiStaffRequisitionPipelineApiResponse,
      GetApiV1ReportHrKpiStaffRequisitionPipelineApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/staff-requisition-pipeline`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ReportHrKpiEmployeeGradeLevelDistribution: build.query<
      GetApiV1ReportHrKpiEmployeeGradeLevelDistributionApiResponse,
      GetApiV1ReportHrKpiEmployeeGradeLevelDistributionApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/employee-grade-level-distribution`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportHrKpiNewHiresThisPeriod: build.query<
      GetApiV1ReportHrKpiNewHiresThisPeriodApiResponse,
      GetApiV1ReportHrKpiNewHiresThisPeriodApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/new-hires-this-period`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ReportHrKpiEmployeeTurnoverRate: build.query<
      GetApiV1ReportHrKpiEmployeeTurnoverRateApiResponse,
      GetApiV1ReportHrKpiEmployeeTurnoverRateApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/employee-turnover-rate`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ReportHrKpiLeaveUtilisationRate: build.query<
      GetApiV1ReportHrKpiLeaveUtilisationRateApiResponse,
      GetApiV1ReportHrKpiLeaveUtilisationRateApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/leave-utilisation-rate`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          year: queryArg.year,
        },
      }),
    }),
    getApiV1ReportHrKpiActiveDisciplinaryActions: build.query<
      GetApiV1ReportHrKpiActiveDisciplinaryActionsApiResponse,
      GetApiV1ReportHrKpiActiveDisciplinaryActionsApiArg
    >({
      providesTags: [{ type: "report/hr-kpi", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr-kpi/active-disciplinary-actions`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportHrEmployeeMasterList: build.query<
      GetApiV1ReportHrEmployeeMasterListApiResponse,
      GetApiV1ReportHrEmployeeMasterListApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/employee-master-list`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          employeeType: queryArg.employeeType,
          gradeLevel: queryArg.gradeLevel,
          status: queryArg.status,
        },
      }),
    }),
    getApiV1ReportHrEmployeeDirectoryByDepartment: build.query<
      GetApiV1ReportHrEmployeeDirectoryByDepartmentApiResponse,
      GetApiV1ReportHrEmployeeDirectoryByDepartmentApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/employee-directory-by-department`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          gradeLevel: queryArg.gradeLevel,
          employeeType: queryArg.employeeType,
        },
      }),
    }),
    getApiV1ReportHrEmployeeDemographics: build.query<
      GetApiV1ReportHrEmployeeDemographicsApiResponse,
      GetApiV1ReportHrEmployeeDemographicsApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/employee-demographics`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportHrStaffGradeLevel: build.query<
      GetApiV1ReportHrStaffGradeLevelApiResponse,
      GetApiV1ReportHrStaffGradeLevelApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/staff-grade-level`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1ReportHrLeaveRegister: build.query<
      GetApiV1ReportHrLeaveRegisterApiResponse,
      GetApiV1ReportHrLeaveRegisterApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/leave-register`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          leaveCategory: queryArg.leaveCategory,
          status: queryArg.status,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ReportHrLeaveBalance: build.query<
      GetApiV1ReportHrLeaveBalanceApiResponse,
      GetApiV1ReportHrLeaveBalanceApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/leave-balance`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          leaveYear: queryArg.leaveYear,
          employeeId: queryArg.employeeId,
        },
      }),
    }),
    getApiV1ReportHrLeaveApprovalAudit: build.query<
      GetApiV1ReportHrLeaveApprovalAuditApiResponse,
      GetApiV1ReportHrLeaveApprovalAuditApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/leave-approval-audit`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          status: queryArg.status,
        },
      }),
    }),
    getApiV1ReportHrOvertimeRequestRegister: build.query<
      GetApiV1ReportHrOvertimeRequestRegisterApiResponse,
      GetApiV1ReportHrOvertimeRequestRegisterApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/overtime-request-register`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          status: queryArg.status,
        },
      }),
    }),
    getApiV1ReportHrStaffRequisitionRegister: build.query<
      GetApiV1ReportHrStaffRequisitionRegisterApiResponse,
      GetApiV1ReportHrStaffRequisitionRegisterApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/staff-requisition-register`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          status: queryArg.status,
          appointmentType: queryArg.appointmentType,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ReportHrEmployeeDisciplinaryReport: build.query<
      GetApiV1ReportHrEmployeeDisciplinaryReportApiResponse,
      GetApiV1ReportHrEmployeeDisciplinaryReportApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/employee-disciplinary-report`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          disciplinaryStatus: queryArg.disciplinaryStatus,
        },
      }),
    }),
    getApiV1ReportHrEmployeeExitReport: build.query<
      GetApiV1ReportHrEmployeeExitReportApiResponse,
      GetApiV1ReportHrEmployeeExitReportApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/employee-exit-report`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          exitReason: queryArg.exitReason,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ReportHrEmployeeAnniversaryBirthday: build.query<
      GetApiV1ReportHrEmployeeAnniversaryBirthdayApiResponse,
      GetApiV1ReportHrEmployeeAnniversaryBirthdayApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/employee-anniversary-birthday`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          eventType: queryArg.eventType,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ReportHrShiftScheduleRegister: build.query<
      GetApiV1ReportHrShiftScheduleRegisterApiResponse,
      GetApiV1ReportHrShiftScheduleRegisterApiArg
    >({
      providesTags: [{ type: "report/hr", id: "LIST" }, { type: "report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/report/hr/shift-schedule-register`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          status: queryArg.status,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as reportsApi };
export type GetApiV1ReportProductionApiResponse =
  /** status 200 OK */ DomainEntitiesReportsProductionReportDto;
export type GetApiV1ReportProductionApiArg = {
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportProductionMaterialsBelowMinimumApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsMaterialWithStockDto[];
export type GetApiV1ReportProductionMaterialsBelowMinimumApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseReportDto;
export type GetApiV1ReportWarehouseApiArg = {
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportLogisticsApiResponse =
  /** status 200 OK */ DomainEntitiesReportsLogisticsReportDto;
export type GetApiV1ReportLogisticsApiArg = {
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportReservedMaterialBatchesApiResponse =
  /** status 200 OK */ DomainEntitiesReportsMaterialBatchReservedQuantityReportDto[];
export type GetApiV1ReportReservedMaterialBatchesApiArg = {
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHumanResourceApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceHrDashboardDtoRead;
export type GetApiV1ReportHumanResourceApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  designationId?: string;
  employeeType?: DomainEntitiesEmployeesEmployeeType;
  gender?: DomainEntitiesEmployeesGender;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportStaffReportApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourcePermanentStaffGradeReportDtoRead;
export type GetApiV1ReportStaffReportApiArg = {
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportEmployeeMovementApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceEmployeeMovementReportDtoRead[];
export type GetApiV1ReportEmployeeMovementApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportStaffTotalReportApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceStaffTotalReportRead;
export type GetApiV1ReportStaffTotalReportApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportStaffGenderRatioReportApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceStaffGenderRatioReportRead;
export type GetApiV1ReportStaffGenderRatioReportApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportStaffLeaveReportApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceStaffLeaveSummaryReportDtoRead;
export type GetApiV1ReportStaffLeaveReportApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportStaffTurnoverReportApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceStaffTurnoverReportDto;
export type GetApiV1ReportStaffTurnoverReportApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportMaterialsReadyForChecklistApiResponse =
  /** status 200 OK */ DomainEntitiesReportsMaterialReadyForChecklistDto[];
export type GetApiV1ReportMaterialsReadyForChecklistApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportMaterialsReadyForAssignmentApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchMaterialBatchDtoRead[];
export type GetApiV1ReportMaterialsReadyForAssignmentApiArg = {
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportQaDashboardApiResponse =
  /** status 200 OK */ DomainEntitiesReportsQaDashboardDto;
export type GetApiV1ReportQaDashboardApiArg = {
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  productId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportQcDashboardApiResponse =
  /** status 200 OK */ DomainEntitiesReportsQaDashboardDto;
export type GetApiV1ReportQcDashboardApiArg = {
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  productId?: string;
  materialId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportFinishedGoodsTransferSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesReportsFinishedGoodsTransferNotesFinishedGoodsTransferSummaryReportDto[];
export type GetApiV1ReportFinishedGoodsTransferSummaryApiArg = {
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  productId?: string;
  warehouseId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportFinishedGoodsTransferDetailedApiResponse =
  /** status 200 OK */ DomainEntitiesReportsFinishedGoodsTransferNotesFinishedGoodsTransferDetailedReportDto[];
export type GetApiV1ReportFinishedGoodsTransferDetailedApiArg = {
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  productId?: string;
  warehouseId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportProductStockSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesReportsFinishedGoodsTransferNotesProductStockSummaryReportDto[];
export type GetApiV1ReportProductStockSummaryApiArg = {
  productId?: string;
  warehouseId?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportProductStockDetailedApiResponse =
  /** status 200 OK */ DomainEntitiesReportsFinishedGoodsTransferNotesProductStockDetailedReportDto[];
export type GetApiV1ReportProductStockDetailedApiArg = {
  productId?: string;
  warehouseId?: string;
  departmentId?: string;
  batchNumber?: string;
  expiryDateFrom?: string;
  expiryDateTo?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportFgtnDashboardKpiApiResponse =
  /** status 200 OK */ DomainEntitiesReportsFinishedGoodsTransferNotesDashboardKpiReportDto;
export type GetApiV1ReportFgtnDashboardKpiApiArg = {
  dateFilter?: DomainEntitiesReportsFinishedGoodsTransferNotesDateFilterType;
  customStartDate?: string;
  customEndDate?: string;
  materialId?: string;
  productId?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportSupplierMaterialsApiResponse =
  /** status 200 OK */ DomainEntitiesReportsProcurementSupplierMaterialReportDto;
export type GetApiV1ReportSupplierMaterialsApiArg = {
  materialName?: string;
  materialType?: DomainEntitiesMaterialsMaterialKind;
  supplierName?: string;
  manufacturerName?: string;
  validityDateFrom?: string;
  validityDateTo?: string;
  supplierId?: string;
  manufacturerId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportItemsPerStoreTypeApiResponse =
  /** status 200 OK */ DomainEntitiesItemsItemDto[];
export type GetApiV1ReportItemsPerStoreTypeApiArg = {
  store?: DomainEntitiesItemsStore;
  inventoryClassification?: DomainEntitiesItemsInventoryClassification;
  itemId?: string;
  categoryId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportStockSummaryPerStoreTypeApiResponse =
  /** status 200 OK */ DomainEntitiesItemsStoreItemStockSummaryDto[];
export type GetApiV1ReportStockSummaryPerStoreTypeApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportVendorItemApiResponse =
  /** status 200 OK */ DomainEntitiesItemsVendorStoreItemStockSummaryDto[];
export type GetApiV1ReportVendorItemApiArg = {
  store?: DomainEntitiesItemsStore;
  vendorId?: string;
  itemId?: string;
  categoryId?: string;
  classification?: DomainEntitiesItemsInventoryClassification;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportVendorItemSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesItemsVendorStoreItemStockSummaryDto[];
export type GetApiV1ReportVendorItemSummaryApiArg = {
  itemId?: string;
  categoryId?: string;
  classification?: DomainEntitiesItemsInventoryClassification;
  store?: DomainEntitiesItemsStore;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportShipmentApiResponse =
  /** status 200 OK */ DomainEntitiesReportsShipmentsShipmentReportDto[];
export type GetApiV1ReportShipmentApiArg = {
  startDate?: string;
  endDate?: string;
  supplierIds?: string[];
  statuses?: string[];
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportPurchaseOrdersApiResponse =
  /** status 200 OK */ DomainEntitiesReportsPurchaseOrderPurchaseOrderReportDtoRead[];
export type GetApiV1ReportPurchaseOrdersApiArg = {
  startDate?: string;
  endDate?: string;
  supplierIds?: string[];
  poNumber?: string;
  supplierType?: DomainEntitiesProcurementSuppliersSupplierType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportPurchasedPoReportApiResponse =
  /** status 200 OK */ DomainEntitiesReportsPurchaseOrderPurchasedPoReportDtoRead[];
export type GetApiV1ReportPurchasedPoReportApiArg = {
  startDate?: string;
  endDate?: string;
  supplierIds?: string[];
  poNumber?: string;
  supplierType?: DomainEntitiesProcurementSuppliersSupplierType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportProductionDashboardApiResponse =
  /** status 200 OK */ DomainEntitiesReportsProductionDashboardDto;
export type GetApiV1ReportProductionDashboardApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportProcurementDashboardApiResponse =
  /** status 200 OK */ DomainEntitiesReportsProcurementProcurementDashboardDto;
export type GetApiV1ReportProcurementDashboardApiArg = {
  filter?: DomainEntitiesReportsWarehouseDateFilter;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseDashboardApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseWarehouseDashboardReportDto;
export type GetApiV1ReportWarehouseDashboardApiArg = {
  filter?: DomainEntitiesReportsWarehouseDateFilter;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportExpiredMaterialsApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseExpiredMaterialReportDto[];
export type GetApiV1ReportExpiredMaterialsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportReservedMaterialsApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseReservedMaterialReportDto[];
export type GetApiV1ReportReservedMaterialsApiArg = {
  materialId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportMaterialsBelowReorderApiResponse =
  /** status 200 OK */ DomainEntitiesReportsMaterialReorderReportDto[];
export type GetApiV1ReportMaterialsBelowReorderApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportMaterialsChecklistApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseMaterialsChecklistReportDto;
export type GetApiV1ReportMaterialsChecklistApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportShipmentStatusSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesReportsProcurementShipmentStatusReportDto;
export type GetApiV1ReportShipmentStatusSummaryApiArg = {
  filter?: DomainEntitiesReportsWarehouseDateFilter;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportGeneralInventoryDashboardApiResponse =
  /** status 200 OK */ DomainEntitiesReportsGeneralInventoryGeneralInventoryDashboardDtoRead;
export type GetApiV1ReportGeneralInventoryDashboardApiArg = {
  filter?: DomainEntitiesReportsWarehouseDateFilter;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportItemsBelowReorderApiResponse =
  /** status 200 OK */ DomainEntitiesReportsGeneralInventoryItemBelowReorderDto[];
export type GetApiV1ReportItemsBelowReorderApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportServicesDashboardApiResponse =
  /** status 200 OK */ DomainEntitiesReportsServicesServicesDashboardReportDto;
export type GetApiV1ReportServicesDashboardApiArg = {
  filter?: DomainEntitiesReportsWarehouseDateFilter;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportInvoicedProductsSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesReportsFinishedGoodsTransferNotesInvoicedProductsSummaryReportDtoRead[];
export type GetApiV1ReportInvoicedProductsSummaryApiArg = {
  startDate?: string;
  endDate?: string;
  productId?: string;
  customerId?: string;
  warehouseDivision?: DomainEntitiesProductsDivision;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportInvoicedProductsDetailedApiResponse =
  /** status 200 OK */ DomainEntitiesReportsFinishedGoodsTransferNotesInvoicedProductsDetailedReportDtoRead[];
export type GetApiV1ReportInvoicedProductsDetailedApiArg = {
  startDate?: string;
  endDate?: string;
  productId?: string;
  customerId?: string;
  warehouseDivision?: DomainEntitiesProductsDivision;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseKpiCapacityUtilisationApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseDashboardKpiWarehouseCapacityUtilisationDto[];
export type GetApiV1ReportWarehouseKpiCapacityUtilisationApiArg = {
  warehouseId?: string;
  warehouseType?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseKpiDockToStockApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseDashboardKpiDockToStockTimeDto[];
export type GetApiV1ReportWarehouseKpiDockToStockApiArg = {
  warehouseId?: string;
  warehouseType?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  datePreset?: DomainEntitiesReportsWarehouseDateFilter;
  customStartDate?: string;
  customEndDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseKpiStockTransferFulfilmentApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseDashboardKpiStockTransferFulfilmentRateDto[];
export type GetApiV1ReportWarehouseKpiStockTransferFulfilmentApiArg = {
  datePreset?: DomainEntitiesReportsWarehouseDateFilter;
  customStartDate?: string;
  customEndDate?: string;
  fromDepartmentId?: string;
  toDepartmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseKpiReceivingPipelineApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseDashboardKpiReceivingPipelineSnapshotDto[];
export type GetApiV1ReportWarehouseKpiReceivingPipelineApiArg = {
  warehouseId?: string;
  warehouseType?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseKpiExpiryRiskIndexApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseDashboardKpiExpiryRiskIndexDto[];
export type GetApiV1ReportWarehouseKpiExpiryRiskIndexApiArg = {
  warehouseId?: string;
  warehouseType?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  expiryWindow?: DomainEntitiesReportsWarehouseDashboardKpiExpiryWindowFilter;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseKpiReorderAlertCountApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseDashboardKpiReorderAlertCountDto[];
export type GetApiV1ReportWarehouseKpiReorderAlertCountApiArg = {
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseKpiSwapRequestActivityApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseDashboardKpiSwapRequestActivityDto[];
export type GetApiV1ReportWarehouseKpiSwapRequestActivityApiArg = {
  warehouseId?: string;
  warehouseType?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  datePreset?: DomainEntitiesReportsWarehouseDateFilter;
  customStartDate?: string;
  customEndDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseKpiMaterialMovementCountApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseDashboardKpiMaterialMovementCountDto[];
export type GetApiV1ReportWarehouseKpiMaterialMovementCountApiArg = {
  warehouseId?: string;
  warehouseType?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  datePreset?: DomainEntitiesReportsWarehouseDateFilter;
  customStartDate?: string;
  customEndDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseKpiFreshnessApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseDashboardKpiWarehouseDataFreshnessDto[];
export type GetApiV1ReportWarehouseKpiFreshnessApiArg = {
  warehouseId?: string;
  warehouseType?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportKpiBmrReleaseRateApiResponse =
  /** status 200 OK */ DomainEntitiesReportsBmrReleaseRateDto[];
export type GetApiV1ReportKpiBmrReleaseRateApiArg = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportKpiYieldPerformanceApiResponse =
  /** status 200 OK */ DomainEntitiesReportsYieldPerformanceDto[];
export type GetApiV1ReportKpiYieldPerformanceApiArg = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportKpiScheduleAdherenceApiResponse =
  /** status 200 OK */ DomainEntitiesReportsScheduleAdherenceDto[];
export type GetApiV1ReportKpiScheduleAdherenceApiArg = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportKpiProductionOutputVolumeApiResponse =
  /** status 200 OK */ DomainEntitiesReportsProductionOutputVolumeDto[];
export type GetApiV1ReportKpiProductionOutputVolumeApiArg = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportKpiAtrTestingBacklogApiResponse =
  /** status 200 OK */ DomainEntitiesReportsAtrTestingBacklogDto[];
export type GetApiV1ReportKpiAtrTestingBacklogApiArg = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportKpiStockRequisitionPendingApiResponse =
  /** status 200 OK */ DomainEntitiesReportsStockRequisitionPendingDto[];
export type GetApiV1ReportKpiStockRequisitionPendingApiArg = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportKpiFgtnPendingApprovalApiResponse =
  /** status 200 OK */ DomainEntitiesReportsFgtnPendingApprovalDto[];
export type GetApiV1ReportKpiFgtnPendingApprovalApiArg = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportKpiProductionOrderDeliveryStatusApiResponse =
  /** status 200 OK */ DomainEntitiesReportsProductionOrderDeliveryStatusDto[];
export type GetApiV1ReportKpiProductionOrderDeliveryStatusApiArg = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  customerId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportKpiMaterialReturnRateApiResponse =
  /** status 200 OK */ DomainEntitiesReportsMaterialReturnRateDto[];
export type GetApiV1ReportKpiMaterialReturnRateApiArg = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseMaterialsStockSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseMaterialsStockSummaryDto[];
export type GetApiV1ReportWarehouseMaterialsStockSummaryApiArg = {
  departmentId?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  materialId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseMaterialsStockBatchDetailApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseMaterialsStockBatchDetailDto[];
export type GetApiV1ReportWarehouseMaterialsStockBatchDetailApiArg = {
  departmentId?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  batchNumber?: string;
  expiryDateFrom?: string;
  expiryDateTo?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseShelfUtilisationDetailApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseShelfUtilisationDetailDto[];
export type GetApiV1ReportWarehouseShelfUtilisationDetailApiArg = {
  warehouseId?: string;
  locationId?: string;
  occupancyStatus?: DomainEntitiesReportsWarehouseOccupancyStatus;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseGoodsReceivingRegisterApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseGoodsReceivingRegisterDto[];
export type GetApiV1ReportWarehouseGoodsReceivingRegisterApiArg = {
  startDate?: string;
  endDate?: string;
  grnStatus?: string;
  supplierId?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseReceivingPerformanceDetailApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseReceivingPerformanceDetailDto[];
export type GetApiV1ReportWarehouseReceivingPerformanceDetailApiArg = {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  supplierId?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehousePutawayRegisterApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehousePutawayRegisterDto[];
export type GetApiV1ReportWarehousePutawayRegisterApiArg = {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  employeeId?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseStockAdjustmentAuditApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseStockAdjustmentAuditDto[];
export type GetApiV1ReportWarehouseStockAdjustmentAuditApiArg = {
  startDate?: string;
  endDate?: string;
  reasonCode?: string;
  warehouseId?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseBatchTraceabilityApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseBatchTraceabilityDto[];
export type GetApiV1ReportWarehouseBatchTraceabilityApiArg = {
  materialBatchId?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseInterWarehouseSwapRequestsApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseInterWarehouseSwapRequestDto[];
export type GetApiV1ReportWarehouseInterWarehouseSwapRequestsApiArg = {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  status?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseStockTransferInterDepartmentApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseStockTransferInterDepartmentDetailDto[];
export type GetApiV1ReportWarehouseStockTransferInterDepartmentApiArg = {
  startDate?: string;
  endDate?: string;
  fromDepartmentId?: string;
  toDepartmentId?: string;
  status?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseMaterialExpiryProjectionApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseMaterialExpiryProjectionDto[];
export type GetApiV1ReportWarehouseMaterialExpiryProjectionApiArg = {
  window?: DomainEntitiesReportsWarehouseDashboardKpiExpiryWindowFilter;
  warehouseId?: string;
  materialId?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseSlowMovingInventoryApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseSlowMovingInventoryDto[];
export type GetApiV1ReportWarehouseSlowMovingInventoryApiArg = {
  warehouseId?: string;
  materialId?: string;
  departmentId?: string;
  threshold?: DomainEntitiesReportsWarehouseInactivityThreshold;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseBinCardTransactionLedgerApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseBinCardTransactionLedgerDto[];
export type GetApiV1ReportWarehouseBinCardTransactionLedgerApiArg = {
  materialBatchId?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseOperationsSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseOperationsSummaryDto[];
export type GetApiV1ReportWarehouseOperationsSummaryApiArg = {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseQcPendingApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseQcPendingDto[];
export type GetApiV1ReportWarehouseQcPendingApiArg = {
  warehouseId?: string;
  supplierId?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseReorderLevelVsStockApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseReorderLevelVsStockDto[];
export type GetApiV1ReportWarehouseReorderLevelVsStockApiArg = {
  departmentId?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseInventoryValuationSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseInventoryValuationSummaryDto[];
export type GetApiV1ReportWarehouseInventoryValuationSummaryApiArg = {
  warehouseType?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  uomGroup?: DomainEntitiesBaseUnitOfMeasureCategory;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseInventoryValuationDetailApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseInventoryValuationDetailDto[];
export type GetApiV1ReportWarehouseInventoryValuationDetailApiArg = {
  warehouseType?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  warehouseId?: string;
  valuationType?: string;
  materialId?: string;
  expiryDateFrom?: string;
  expiryDateTo?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseEmployeeActivityApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseWarehouseEmployeeActivityDto[];
export type GetApiV1ReportWarehouseEmployeeActivityApiArg = {
  startDate?: string;
  endDate?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  employeeId?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportWarehouseArrivalLocationStatusApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseArrivalLocationStatusDto[];
export type GetApiV1ReportWarehouseArrivalLocationStatusApiArg = {
  warehouseId?: string;
  status?: string;
  agingThresholdDays?: number;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiEmployeeHeadcountApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiEmployeeHeadcountSnapshotDtoRead[];
export type GetApiV1ReportHrKpiEmployeeHeadcountApiArg = {
  departmentId?: string;
  employeeType?: DomainEntitiesEmployeesEmployeeType;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiEmployeeGenderRatioApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiEmployeeGenderRatioDtoRead[];
export type GetApiV1ReportHrKpiEmployeeGenderRatioApiArg = {
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiLeaveRequestPipelineApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiLeaveRequestPipelineDtoRead[];
export type GetApiV1ReportHrKpiLeaveRequestPipelineApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiOvertimeRequestActivityApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiOvertimeRequestActivityDto[];
export type GetApiV1ReportHrKpiOvertimeRequestActivityApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiDailyAttendanceRateApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiDailyAttendanceRateDto[];
export type GetApiV1ReportHrKpiDailyAttendanceRateApiArg = {
  departmentId?: string;
  date?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiStaffRequisitionPipelineApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiStaffRequisitionPipelineDto[];
export type GetApiV1ReportHrKpiStaffRequisitionPipelineApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiEmployeeGradeLevelDistributionApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiEmployeeGradeLevelDistributionDtoRead[];
export type GetApiV1ReportHrKpiEmployeeGradeLevelDistributionApiArg = {
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiNewHiresThisPeriodApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiNewHiresThisPeriodDtoRead[];
export type GetApiV1ReportHrKpiNewHiresThisPeriodApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiEmployeeTurnoverRateApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiEmployeeTurnoverRateDto[];
export type GetApiV1ReportHrKpiEmployeeTurnoverRateApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiLeaveUtilisationRateApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiLeaveUtilisationRateDto[];
export type GetApiV1ReportHrKpiLeaveUtilisationRateApiArg = {
  departmentId?: string;
  year?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrKpiActiveDisciplinaryActionsApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHrDashboardKpiActiveDisciplinaryActionsDtoRead[];
export type GetApiV1ReportHrKpiActiveDisciplinaryActionsApiArg = {
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrEmployeeMasterListApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceEmployeeMasterListReportDto[];
export type GetApiV1ReportHrEmployeeMasterListApiArg = {
  departmentId?: string;
  employeeType?: DomainEntitiesEmployeesEmployeeType;
  gradeLevel?: DomainEntitiesEmployeesEmployeeLevel;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrEmployeeDirectoryByDepartmentApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceEmployeeDirectoryByDepartmentDto[];
export type GetApiV1ReportHrEmployeeDirectoryByDepartmentApiArg = {
  departmentId?: string;
  gradeLevel?: DomainEntitiesEmployeesEmployeeLevel;
  employeeType?: DomainEntitiesEmployeesEmployeeType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrEmployeeDemographicsApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceEmployeeDemographicsReportDto[];
export type GetApiV1ReportHrEmployeeDemographicsApiArg = {
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrStaffGradeLevelApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceStaffGradeLevelReportDto[];
export type GetApiV1ReportHrStaffGradeLevelApiArg = {
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrLeaveRegisterApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceLeaveRegisterReportDto[];
export type GetApiV1ReportHrLeaveRegisterApiArg = {
  departmentId?: string;
  leaveCategory?: DomainEntitiesLeaveRequestsRequestCategory;
  status?: DomainEntitiesLeaveRequestsLeaveStatus;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrLeaveBalanceApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceLeaveBalanceReportDto[];
export type GetApiV1ReportHrLeaveBalanceApiArg = {
  departmentId?: string;
  leaveYear?: number;
  employeeId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrLeaveApprovalAuditApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceLeaveApprovalAuditReportDto[];
export type GetApiV1ReportHrLeaveApprovalAuditApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: DomainEntitiesLeaveRequestsLeaveStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrOvertimeRequestRegisterApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceOvertimeRequestRegisterReportDto[];
export type GetApiV1ReportHrOvertimeRequestRegisterApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: DomainEntitiesOvertimeRequestsOvertimeStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrStaffRequisitionRegisterApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceStaffRequisitionRegisterReportDto[];
export type GetApiV1ReportHrStaffRequisitionRegisterApiArg = {
  departmentId?: string;
  status?: DomainEntitiesStaffRequisitionsStaffRequisitionStatus;
  appointmentType?: DomainEntitiesStaffRequisitionsAppointmentType;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrEmployeeDisciplinaryReportApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceEmployeeDisciplinaryReportDto[];
export type GetApiV1ReportHrEmployeeDisciplinaryReportApiArg = {
  departmentId?: string;
  disciplinaryStatus?: DomainEntitiesEmployeesEmployeeActiveStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrEmployeeExitReportApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceEmployeeExitReportDto[];
export type GetApiV1ReportHrEmployeeExitReportApiArg = {
  departmentId?: string;
  exitReason?: DomainEntitiesEmployeesEmployeeInactiveStatus;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrEmployeeAnniversaryBirthdayApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceEmployeeAnniversaryBirthdayReportDto[];
export type GetApiV1ReportHrEmployeeAnniversaryBirthdayApiArg = {
  departmentId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ReportHrShiftScheduleRegisterApiResponse =
  /** status 200 OK */ DomainEntitiesReportsHumanResourceShiftScheduleRegisterReportDto[];
export type GetApiV1ReportHrShiftScheduleRegisterApiArg = {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: DomainEntitiesShiftSchedulesScheduleStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type DomainEntitiesReportsProductionReportDto = {
  numberOfPurchaseRequisitions?: number;
  numberOfNewPurchaseRequisitions?: number;
  numberOfInProgressPurchaseRequisitions?: number;
  numberOfCompletedPurchaseRequisitions?: number;
  numberOfProductionSchedules?: number;
  numberOfNewProductionSchedules?: number;
  numberOfInProgressProductionSchedules?: number;
  numberOfCompletedProductionSchedules?: number;
  numberOfIncomingStockTransfers?: number;
  numberOfIncomingPendingStockTransfers?: number;
  numberOfIncomingCompletedStockTransfers?: number;
  numberOfOutgoingStockTransfers?: number;
  numberOfOutgoingPendingStockTransfers?: number;
  numberOfOutgoingCompletedStockTransfers?: number;
};
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
export type MicrosoftAspNetCoreMvcProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: JsonValue | undefined;
};
export type DomainEntitiesMaterialsMaterialKind = 0 | 1;
export type SharedDepartmentType = 0 | 1 | 2;
export type DomainEntitiesProductsDivision = 0 | 1;
export type SharedCollectionItemDto = {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  symbol?: string | null;
  uom?: string | null;
};
export type DomainEntitiesDepartmentsDepartmentListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  type?: SharedDepartmentType;
  description?: string | null;
  division?: DomainEntitiesProductsDivision;
  parentDepartment?: SharedCollectionItemDto;
};
export type DomainEntitiesUsersUserDto = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isDisabled?: boolean;
  avatar?: string | null;
  createdAt?: string;
  signature?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
};
export type DomainEntitiesMaterialsMaterialCategoryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
};
export type DomainEntitiesMaterialSpecificationsMaterialSpecificationReducedDto =
  {
    id?: string;
    specificationNumber?: string | null;
  };
export type DomainEntitiesCountriesCountryDto = {
  id?: string;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
export type DomainEntitiesCurrenciesCurrencyDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isBaseCurrency?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierType = 0 | 1;
export type DomainEntitiesProcurementSuppliersSupplierStatus = 0 | 1 | 2;
export type DomainEntitiesProcurementSuppliersSupplierListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  approvedAt?: string | null;
  requalificationDueDate?: string | null;
};
export type DomainEntitiesProcurementManufacturersManufacturerListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  approvedAt?: string | null;
  validityDate?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
};
export type DomainEntitiesMaterialsMaterialDto = {
  id?: string;
  code?: string | null;
  pharmacopoeia?: string | null;
  name?: string | null;
  description?: string | null;
  alphabet?: string | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
  isUnlimited?: boolean;
  materialCategory?: DomainEntitiesMaterialsMaterialCategoryDto;
  specification?: DomainEntitiesMaterialSpecificationsMaterialSpecificationReducedDto;
  totalStock?: number;
  reservedStock?: number;
  suppliers?: DomainEntitiesProcurementSuppliersSupplierListDto[] | null;
  manufacturers?:
    DomainEntitiesProcurementManufacturersManufacturerListDto[] | null;
};
export type DomainEntitiesBaseUnitOfMeasureType = 0 | 1 | 2 | 3;
export type DomainEntitiesBaseUnitOfMeasureCategory = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesBaseUnitOfMeasureDto = {
  id?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isScalable?: boolean;
  isRawMaterial?: boolean;
  type?: DomainEntitiesBaseUnitOfMeasureType;
  category?: DomainEntitiesBaseUnitOfMeasureCategory;
  createdAt?: string;
};
export type DomainEntitiesMaterialsMaterialWithStockDto = {
  material?: DomainEntitiesMaterialsMaterialDto;
  stockQuantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
};
export type DomainEntitiesReportsWarehouseReportDto = {
  numberOfStockRequisitions?: number;
  numberOfNewStockRequisitions?: number;
  numberOfInProgressStockRequisitions?: number;
  numberOfCompletedStockRequisitions?: number;
  numberOfIncomingStockTransfers?: number;
  numberOfIncomingPendingStockTransfers?: number;
  numberOfIncomingCompletedStockTransfers?: number;
  numberOfShipments?: number;
  numberOfInTransitShipments?: number;
  numberOfArrivedShipments?: number;
  numberOfClearedShipments?: number;
};
export type DomainEntitiesReportsLogisticsReportDto = {
  numberOfInvoices?: number;
  numberOfPaidInvoices?: number;
  numberOfUnpaidInvoices?: number;
  numberOfShipments?: number;
  numberOfNewShipments?: number;
  numberOfInTransitShipments?: number;
  numberOfArrivedShipments?: number;
  numberOfClearedShipments?: number;
  numberOfBillingSheets?: number;
  numberOfPaidBillingSheets?: number;
  numberOfPendingBillingSheets?: number;
  numberOfWaybills?: number;
  numberOfNewWaybills?: number;
  numberOfInTransitWaybills?: number;
  numberOfArrivedWaybills?: number;
  numberOfClearedWaybills?: number;
};
export type DomainEntitiesReportsMaterialBatchReservedQuantityReportDto = {
  warehouse?: SharedCollectionItemDto;
  material?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
};
export type DomainEntitiesReportsHumanResourceAttendanceStatsDto = {
  numberOfAbsentEmployees?: number;
  numberOfPresentEmployees?: number;
  attendanceRate?: number;
};
export type DomainEntitiesReportsHumanResourceHrDashboardDto = {
  numberOfLeaveRequests?: number;
  numberOfPendingLeaveRequests?: number;
  numberOfRejectedLeaveRequests?: number;
  numberOfExpiredLeaveRequests?: number;
  numberOfOvertimeRequests?: number;
  numberOfPendingOvertimeRequests?: number;
  numberOfApprovedOvertimeRequests?: number;
  numberOfExpiredOvertimeRequests?: number;
  numberOfAbsenceRequests?: number;
  numberOfPendingAbsenceRequests?: number;
  numberOfApprovedAbsenceRequests?: number;
  numberOfRejectedAbsenceRequests?: number;
  numberOfExitPasses?: number;
  numberOfPendingExitPasses?: number;
  numberOfApprovedExitPasses?: number;
  numberOfRejectedExitPasses?: number;
  numberOfOfficialDutyLeaves?: number;
  numberOfPendingOfficialDutyLeaves?: number;
  numberOfApprovedOfficialDutyLeaves?: number;
  numberOfRejectedOfficialDutyLeaves?: number;
  numberOfStaffRequisitions?: number;
  numberOfNewCasualEmployees?: number;
  numberOfNewPermanentEmployees?: number;
  numberOfActiveCasualEmployees?: number;
  numberOfActivePermanentEmployees?: number;
  numberOfInactiveCasualEmployees?: number;
  numberOfInactivePermanentEmployees?: number;
  numberOfCasualEmployees?: number;
  numberOfPermanentEmployees?: number;
  attendanceStats?: DomainEntitiesReportsHumanResourceAttendanceStatsDto;
  employeeGenderRatio?: number;
};
export type DomainEntitiesReportsHumanResourceHrDashboardDtoRead = {
  numberOfLeaveRequests?: number;
  numberOfPendingLeaveRequests?: number;
  numberOfRejectedLeaveRequests?: number;
  numberOfExpiredLeaveRequests?: number;
  numberOfOvertimeRequests?: number;
  numberOfPendingOvertimeRequests?: number;
  numberOfApprovedOvertimeRequests?: number;
  numberOfExpiredOvertimeRequests?: number;
  numberOfAbsenceRequests?: number;
  numberOfPendingAbsenceRequests?: number;
  numberOfApprovedAbsenceRequests?: number;
  numberOfRejectedAbsenceRequests?: number;
  numberOfExitPasses?: number;
  numberOfPendingExitPasses?: number;
  numberOfApprovedExitPasses?: number;
  numberOfRejectedExitPasses?: number;
  numberOfOfficialDutyLeaves?: number;
  numberOfPendingOfficialDutyLeaves?: number;
  numberOfApprovedOfficialDutyLeaves?: number;
  numberOfRejectedOfficialDutyLeaves?: number;
  numberOfStaffRequisitions?: number;
  totalEmployees?: number;
  numberOfNewCasualEmployees?: number;
  numberOfNewPermanentEmployees?: number;
  numberOfNewEmployees?: number;
  numberOfActiveCasualEmployees?: number;
  numberOfActivePermanentEmployees?: number;
  numberOfActiveEmployees?: number;
  numberOfInactiveCasualEmployees?: number;
  numberOfInactivePermanentEmployees?: number;
  numberOfInactiveEmployees?: number;
  numberOfCasualEmployees?: number;
  numberOfPermanentEmployees?: number;
  attendanceStats?: DomainEntitiesReportsHumanResourceAttendanceStatsDto;
  employeeGenderRatio?: number;
};
export type DomainEntitiesEmployeesEmployeeType = 0 | 1;
export type DomainEntitiesEmployeesGender = 0 | 1;
export type DomainEntitiesReportsHumanResourcePermanentStaffGradeCountDto = {
  seniorMgtMale?: number;
  seniorMgtFemale?: number;
  seniorStaffMale?: number;
  seniorStaffFemale?: number;
  juniorStaffMale?: number;
  juniorStaffFemale?: number;
  department?: string | null;
};
export type DomainEntitiesReportsHumanResourcePermanentStaffGradeCountDtoRead =
  {
    seniorMgtMale?: number;
    seniorMgtFemale?: number;
    seniorStaffMale?: number;
    seniorStaffFemale?: number;
    juniorStaffMale?: number;
    juniorStaffFemale?: number;
    totalMale?: number;
    totalFemale?: number;
    department?: string | null;
  };
export type DomainEntitiesReportsHumanResourcePermanentStaffGradeTotalDto = {
  seniorMgtMale?: number;
  seniorMgtFemale?: number;
  seniorStaffMale?: number;
  seniorStaffFemale?: number;
  juniorStaffMale?: number;
  juniorStaffFemale?: number;
};
export type DomainEntitiesReportsHumanResourcePermanentStaffGradeTotalDtoRead =
  {
    seniorMgtMale?: number;
    seniorMgtFemale?: number;
    seniorStaffMale?: number;
    seniorStaffFemale?: number;
    juniorStaffMale?: number;
    juniorStaffFemale?: number;
    totalMale?: number;
    totalFemale?: number;
    total?: number;
  };
export type DomainEntitiesReportsHumanResourcePermanentStaffGradeReportDto = {
  departments?:
    DomainEntitiesReportsHumanResourcePermanentStaffGradeCountDto[] | null;
  totals?: DomainEntitiesReportsHumanResourcePermanentStaffGradeTotalDto;
};
export type DomainEntitiesReportsHumanResourcePermanentStaffGradeReportDtoRead =
  {
    departments?:
      | DomainEntitiesReportsHumanResourcePermanentStaffGradeCountDtoRead[]
      | null;
    totals?: DomainEntitiesReportsHumanResourcePermanentStaffGradeTotalDtoRead;
  };
export type DomainEntitiesReportsHumanResourceEmployeeMovementCountDto = {
  permanentNew?: number;
  permanentTransfer?: number;
  permanentResignation?: number;
  permanentTermination?: number;
  permanentSDVP?: number;
  casualNew?: number;
  casualResignation?: number;
  casualTermination?: number;
  casualSDVP?: number;
  departmentName?: string | null;
};
export type DomainEntitiesReportsHumanResourceEmployeeMovementCountDtoRead = {
  permanentNew?: number;
  permanentTransfer?: number;
  permanentResignation?: number;
  permanentTermination?: number;
  permanentSDVP?: number;
  casualNew?: number;
  casualResignation?: number;
  casualTermination?: number;
  casualSDVP?: number;
  netMovement?: number;
  departmentName?: string | null;
};
export type DomainEntitiesReportsHumanResourceEmployeeMovementGrandTotalDto = {
  permanentNew?: number;
  permanentTransfer?: number;
  permanentResignation?: number;
  permanentTermination?: number;
  permanentSDVP?: number;
  casualNew?: number;
  casualResignation?: number;
  casualTermination?: number;
  casualSDVP?: number;
};
export type DomainEntitiesReportsHumanResourceEmployeeMovementGrandTotalDtoRead =
  {
    permanentNew?: number;
    permanentTransfer?: number;
    permanentResignation?: number;
    permanentTermination?: number;
    permanentSDVP?: number;
    casualNew?: number;
    casualResignation?: number;
    casualTermination?: number;
    casualSDVP?: number;
    netMovement?: number;
  };
export type DomainEntitiesReportsHumanResourceEmployeeMovementReportDto = {
  departments?:
    DomainEntitiesReportsHumanResourceEmployeeMovementCountDto[] | null;
  totals?: DomainEntitiesReportsHumanResourceEmployeeMovementGrandTotalDto;
};
export type DomainEntitiesReportsHumanResourceEmployeeMovementReportDtoRead = {
  departments?:
    DomainEntitiesReportsHumanResourceEmployeeMovementCountDtoRead[] | null;
  totals?: DomainEntitiesReportsHumanResourceEmployeeMovementGrandTotalDtoRead;
};
export type DomainEntitiesReportsHumanResourceStaffTotalSummary = {
  totalPermanentStaff?: number;
  totalCasualStaff?: number;
  department?: string | null;
};
export type DomainEntitiesReportsHumanResourceStaffTotalSummaryRead = {
  totalPermanentStaff?: number;
  totalCasualStaff?: number;
  totalStaff?: number;
  department?: string | null;
};
export type DomainEntitiesReportsHumanResourceStaffGrandTotal = {
  totalPermanentStaff?: number;
  totalCasualStaff?: number;
};
export type DomainEntitiesReportsHumanResourceStaffGrandTotalRead = {
  totalPermanentStaff?: number;
  totalCasualStaff?: number;
  totalStaff?: number;
};
export type DomainEntitiesReportsHumanResourceStaffTotalReport = {
  departments?: DomainEntitiesReportsHumanResourceStaffTotalSummary[] | null;
  totals?: DomainEntitiesReportsHumanResourceStaffGrandTotal;
};
export type DomainEntitiesReportsHumanResourceStaffTotalReportRead = {
  departments?:
    DomainEntitiesReportsHumanResourceStaffTotalSummaryRead[] | null;
  totals?: DomainEntitiesReportsHumanResourceStaffGrandTotalRead;
};
export type DomainEntitiesReportsHumanResourceStaffGenderRatioCountDto = {
  numberOfPermanentMale?: number;
  numberOfPermanentFemale?: number;
  numberOfCasualMale?: number;
  numberOfCasualFemale?: number;
  department?: string | null;
};
export type DomainEntitiesReportsHumanResourceStaffGenderRatioCountDtoRead = {
  numberOfPermanentMale?: number;
  numberOfPermanentFemale?: number;
  numberOfCasualMale?: number;
  numberOfCasualFemale?: number;
  totalMales?: number;
  totalFemales?: number;
  total?: number;
  department?: string | null;
};
export type DomainEntitiesReportsHumanResourceStaffGenderRatioTotalDto = {
  numberOfPermanentMale?: number;
  numberOfPermanentFemale?: number;
  numberOfCasualMale?: number;
  numberOfCasualFemale?: number;
};
export type DomainEntitiesReportsHumanResourceStaffGenderRatioTotalDtoRead = {
  numberOfPermanentMale?: number;
  numberOfPermanentFemale?: number;
  numberOfCasualMale?: number;
  numberOfCasualFemale?: number;
  totalMales?: number;
  totalFemales?: number;
  total?: number;
};
export type DomainEntitiesReportsHumanResourceStaffGenderRatioReport = {
  departments?:
    DomainEntitiesReportsHumanResourceStaffGenderRatioCountDto[] | null;
  totals?: DomainEntitiesReportsHumanResourceStaffGenderRatioTotalDto;
};
export type DomainEntitiesReportsHumanResourceStaffGenderRatioReportRead = {
  departments?:
    DomainEntitiesReportsHumanResourceStaffGenderRatioCountDtoRead[] | null;
  totals?: DomainEntitiesReportsHumanResourceStaffGenderRatioTotalDtoRead;
};
export type DomainEntitiesReportsHumanResourceStaffLeaveSummaryDto = {
  departmentName?: string | null;
  staffDueForLeave?: number;
  totalLeaveEntitlement?: number;
  daysUsed?: number;
};
export type DomainEntitiesReportsHumanResourceStaffLeaveSummaryDtoRead = {
  departmentName?: string | null;
  staffDueForLeave?: number;
  totalLeaveEntitlement?: number;
  daysUsed?: number;
  daysLeft?: number;
  percentUsed?: number;
  percentLeft?: number;
};
export type DomainEntitiesReportsHumanResourceStaffLeaveSummaryReportDto = {
  departments?: DomainEntitiesReportsHumanResourceStaffLeaveSummaryDto[] | null;
};
export type DomainEntitiesReportsHumanResourceStaffLeaveSummaryReportDtoRead = {
  departments?:
    DomainEntitiesReportsHumanResourceStaffLeaveSummaryDtoRead[] | null;
};
export type DomainEntitiesReportsHumanResourceStaffTurnoverCountDto = {
  no?: number;
  department?: string | null;
  exitReason?: string | null;
  leaverCount?: number;
  totalLeavers?: number;
  averageHeadcount?: number;
  departmentalTurnover?: number;
};
export type DomainEntitiesReportsHumanResourceStaffTurnoverReportDto = {
  departments?:
    DomainEntitiesReportsHumanResourceStaffTurnoverCountDto[] | null;
  organisationTurnover?: number;
  grandTotalLeavers?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialStatus =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesReportsMaterialReadyForChecklistDto = {
  id?: string;
  materialId?: string | null;
  materialCode?: string | null;
  materialName?: string | null;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  shipmentInvoiceId?: string | null;
  shipmentInvoiceCode?: string | null;
  quantity?: number;
  uoMId?: string | null;
  uoMName?: string | null;
  uoMSymbol?: string | null;
  arrivedAt?: string | null;
  createdAt?: string;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  departmentId?: string | null;
  departmentName?: string | null;
};
export type DomainEntitiesShipmentsShipmentInvoiceListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierListDto;
  totalCost?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  paidAt?: string | null;
  dueDate?: string | null;
  amountPaid?: number;
  outstandingBalance?: number;
  isUsed?: boolean;
};
export type DomainEntitiesShipmentsShipmentInvoiceItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  manufacturer?: SharedCollectionItemDto;
  purchaseOrder?: SharedCollectionItemDto;
  expectedQuantity?: number;
  receivedQuantity?: number;
  price?: number;
  priceUoM?: string | null;
  totalCost?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  reason?: string | null;
};
export type DomainEntitiesProcurementDistributionMaterialItemDistributionDto = {
  shipmentInvoiceItem?: DomainEntitiesShipmentsShipmentInvoiceItemDto;
  quantity?: number;
};
export type DomainEntitiesBasePackageStyleDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesMaterialsBatchBatchStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type DomainEntitiesMaterialsBatchSrDto = {
  srNumber?: string | null;
  grossWeight?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
};
export type DomainEntitiesMaterialsBatchDistributedMaterialBatchDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  code?: string | null;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  quantityDistributed?: number;
  sampleWeights?: DomainEntitiesMaterialsBatchSrDto[] | null;
  reservedQuantity?: number;
};
export type DomainEntitiesChecklistsDistributedChecklistDto = {
  materialBatches?:
    DomainEntitiesMaterialsBatchDistributedMaterialBatchDto[] | null;
};
export type DomainEntitiesRequisitionsRequestStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesRequisitionsRequisitionItemListDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  quantityReceived?: number;
  status?: DomainEntitiesRequisitionsRequestStatus;
};
export type DomainEntitiesWarehousesWarehouseType = 0 | 1 | 2 | 3;
export type DomainEntitiesWarehousesWarehouseWithoutLocationDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
  type?: DomainEntitiesWarehousesWarehouseType;
};
export type DomainEntitiesWarehousesDistributedRequisitionItemDto = {
  id?: string;
  requisitionItem?: DomainEntitiesRequisitionsRequisitionItemListDto;
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  warehouse?: DomainEntitiesWarehousesWarehouseWithoutLocationDto;
  quantity?: number;
  quantityDistributed?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionItemDtoRead = {
  id?: string;
  requisitionItem?: DomainEntitiesRequisitionsRequisitionItemListDto;
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  warehouse?: DomainEntitiesWarehousesWarehouseWithoutLocationDto;
  quantity?: number;
  quantityDistributed?: number;
  fullyDistributed?: boolean;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialDto = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceListDto;
  quantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  arrivedAt?: string | null;
  checkedAt?: string | null;
  distributedAt?: string | null;
  grnGeneratedAt?: string | null;
  materialItemDistributions?:
    DomainEntitiesProcurementDistributionMaterialItemDistributionDto[] | null;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  checklists?: DomainEntitiesChecklistsDistributedChecklistDto[] | null;
  distributedRequisitionItems?:
    DomainEntitiesWarehousesDistributedRequisitionItemDto[] | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialDtoRead = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceListDto;
  quantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  arrivedAt?: string | null;
  checkedAt?: string | null;
  distributedAt?: string | null;
  grnGeneratedAt?: string | null;
  materialItemDistributions?:
    DomainEntitiesProcurementDistributionMaterialItemDistributionDto[] | null;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  checklists?: DomainEntitiesChecklistsDistributedChecklistDto[] | null;
  distributedRequisitionItems?:
    DomainEntitiesWarehousesDistributedRequisitionItemDtoRead[] | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
};
export type DomainEntitiesProcurementManufacturersQuantityType = 0 | 1 | 2;
export type DomainEntitiesProcurementManufacturersQuantityPerPackOption = {
  type?: DomainEntitiesProcurementManufacturersQuantityType;
  min?: number | null;
  max?: number | null;
  values?: number[] | null;
};
export type DomainEntitiesProcurementManufacturersManufacturerMaterialDto = {
  material?: DomainEntitiesMaterialsMaterialDto;
  quantityType?: DomainEntitiesProcurementManufacturersQuantityType;
  quantityPerPackOption?: DomainEntitiesProcurementManufacturersQuantityPerPackOption;
};
export type DomainEntitiesProcurementManufacturersManufacturerDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  approvedAt?: string | null;
  validityDate?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
  materials?:
    DomainEntitiesProcurementManufacturersManufacturerMaterialDto[] | null;
};
export type DomainEntitiesProcurementSuppliersSupplierManufacturerDto = {
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerDto;
  material?: DomainEntitiesMaterialsMaterialDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  default?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  approvedAt?: string | null;
  requalificationDueDate?: string | null;
  associatedManufacturers?:
    DomainEntitiesProcurementSuppliersSupplierManufacturerDto[] | null;
};
export type DomainEntitiesShipmentsShipmentInvoiceDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  items?: DomainEntitiesShipmentsShipmentInvoiceItemDto[] | null;
  totalCost?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  paidAt?: string | null;
  dueDate?: string | null;
  amountPaid?: number;
  outstandingBalance?: number;
  isUsed?: boolean;
};
export type DomainEntitiesChecklistsIntactness = 0 | 1;
export type DomainEntitiesChecklistsConsignmentCarrier = 0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesMaterialsBatchBatchChecklistDto = {
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterialDto;
  material?: DomainEntitiesMaterialsMaterialDto;
  checkedAt?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceDto;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerDto;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
};
export type DomainEntitiesMaterialsBatchBatchChecklistDtoRead = {
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterialDtoRead;
  material?: DomainEntitiesMaterialsMaterialDto;
  checkedAt?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceDto;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerDto;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
};
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesProductionSchedulesStockTransfersMaterialBatchStockTransferDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    code?: string | null;
    material?: DomainEntitiesMaterialsMaterialDto;
    uoM?: DomainEntitiesBaseUnitOfMeasureDto;
    product?: SharedCollectionItemDto;
    productionSchedule?: SharedCollectionItemDto;
    reason?: string | null;
    requiredQuantity?: number;
    status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
  };
export type DomainEntitiesMaterialsBatchCurrentLocationDto = {
  location?: SharedCollectionItemDto;
  quantityAtLocation?: number;
};
export type DomainEntitiesWarehousesWareHouseLocationDto = {
  id?: string;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  warehouse?: SharedCollectionItemDto;
};
export type DomainEntitiesWarehousesWareHouseLocationRackDto = {
  id?: string;
  warehouseLocation?: DomainEntitiesWarehousesWareHouseLocationDto;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesWarehousesMaterialWarehouseLocationShelfDto = {
  id?: string;
  warehouseLocationRack?: DomainEntitiesWarehousesWareHouseLocationRackDto;
  code?: string | null;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReducedDto = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  issueNumber?: string | null;
  issuedBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  aboutToExpire?: boolean;
  expired?: boolean;
  issueNumber?: string | null;
  issuedBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
};
export type DomainEntitiesWarehousesShelfMaterialBatchDto = {
  id?: string;
  warehouseLocationShelf?: DomainEntitiesWarehousesMaterialWarehouseLocationShelfDto;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDto;
  quantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  note?: string | null;
};
export type DomainEntitiesWarehousesShelfMaterialBatchDtoRead = {
  id?: string;
  warehouseLocationShelf?: DomainEntitiesWarehousesMaterialWarehouseLocationShelfDto;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead;
  quantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  note?: string | null;
};
export type DomainEntitiesChecklistsMaterialBatchChecklistDto = {
  checkedAt?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceDto;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerDto;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
};
export type DomainEntitiesMaterialsBatchMaterialBatchListDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  checklist?: DomainEntitiesChecklistsMaterialBatchChecklistDto;
  returnDate?: string | null;
  issueNumber?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
  issuedBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchListDtoRead = {
  id?: string;
  material?: SharedCollectionItemDto;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  checklist?: DomainEntitiesChecklistsMaterialBatchChecklistDto;
  aboutToExpire?: boolean;
  expired?: boolean;
  returnDate?: string | null;
  isReturn?: boolean;
  issueNumber?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
  issuedBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
};
export type DomainEntitiesWarehousesWarehouseLocationShelfDto = {
  id?: string;
  warehouseLocationRack?: DomainEntitiesWarehousesWareHouseLocationRackDto;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  materialBatches?: DomainEntitiesWarehousesShelfMaterialBatchDto[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationShelfDtoRead = {
  id?: string;
  warehouseLocationRack?: DomainEntitiesWarehousesWareHouseLocationRackDto;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  materialBatches?: DomainEntitiesWarehousesShelfMaterialBatchDtoRead[] | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchListDto;
  warehouse?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelfDto;
  quantity?: number;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchListDtoRead;
  warehouse?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelfDtoRead;
  quantity?: number;
};
export type DomainEntitiesMaterialsBatchMaterialBatchDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  batchNumber?: string | null;
  checklist?: DomainEntitiesMaterialsBatchBatchChecklistDto;
  stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersMaterialBatchStockTransferDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  sampleWeights?: DomainEntitiesMaterialsBatchSrDto[] | null;
  locations?: DomainEntitiesMaterialsBatchCurrentLocationDto[] | null;
  shelves?: DomainEntitiesWarehousesShelfMaterialBatchDto[] | null;
  reservedQuantities?:
    DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityDto[] | null;
  reservedQuantity?: number;
  returnDate?: string | null;
  issueNumber?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  issuedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchDtoRead = {
  id?: string;
  material?: SharedCollectionItemDto;
  batchNumber?: string | null;
  checklist?: DomainEntitiesMaterialsBatchBatchChecklistDtoRead;
  stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersMaterialBatchStockTransferDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  sampleWeights?: DomainEntitiesMaterialsBatchSrDto[] | null;
  locations?: DomainEntitiesMaterialsBatchCurrentLocationDto[] | null;
  shelves?: DomainEntitiesWarehousesShelfMaterialBatchDtoRead[] | null;
  reservedQuantities?:
    DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityDtoRead[] | null;
  reservedQuantity?: number;
  returnDate?: string | null;
  aboutToExpire?: boolean;
  expired?: boolean;
  issueNumber?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  issuedAt?: string | null;
};
export type DomainEntitiesReportsQaDashboardDto = {
  numberOfBmrRequests?: number;
  numberOfPendingBmrRequests?: number;
  numberOfApprovedBmrRequests?: number;
  numberOfRejectBmrRequests?: number;
  numberOfAnalyticalTestRequests?: number;
  numberOfExpiredAnalyticalTestRequests?: number;
  numberOfApprovals?: number;
  numberOfPendingApprovals?: number;
  numberOfRejectedApprovals?: number;
  numberOfManufacturers?: number;
  numberOfNewManufacturers?: number;
  numberOfApprovedManufacturers?: number;
  numberOfExpiredManufacturers?: number;
  numberOfProducts?: number;
  numberOfRawMaterials?: number;
  numberOfPackingMaterials?: number;
};
export type DomainEntitiesReportsFinishedGoodsTransferNotesFinishedGoodsTransferSummaryReportDto =
  {
    no?: number;
    productName?: string | null;
    productCode?: string | null;
    numberOfBatches?: number;
    totalQuantity?: number;
    uomName?: string | null;
    productionDepartment?: string | null;
    destinationWarehouse?: string | null;
    transferDate?: string;
    acceptedDate?: string | null;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesFinishedGoodsTransferDetailedReportDto =
  {
    no?: number;
    productName?: string | null;
    productCode?: string | null;
    batchNumber?: string | null;
    quantityTransferred?: number;
    manufacturingDate?: string | null;
    expiryDate?: string | null;
    packingStyle?: string | null;
    uomName?: string | null;
    productionDepartment?: string | null;
    destinationWarehouse?: string | null;
    transferDate?: string;
    acceptedDate?: string | null;
    status?: string | null;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesProductStockSummaryReportDto =
  {
    no?: number;
    productName?: string | null;
    productCode?: string | null;
    warehouse?: string | null;
    productionDepartment?: string | null;
    numberOfBatches?: number;
    totalQuantity?: number;
    uomName?: string | null;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesProductStockDetailedReportDto =
  {
    no?: number;
    productName?: string | null;
    productCode?: string | null;
    batchNumber?: string | null;
    manufacturingDate?: string | null;
    expiryDate?: string | null;
    totalQuantity?: number;
    uomName?: string | null;
    productionDepartment?: string | null;
    warehouse?: string | null;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesProductCountKpiDto =
  {
    betaProducts?: number;
    nonBetaProducts?: number;
    totalProducts?: number;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesProductionOrderKpiDto =
  {
    pendingProductionOrders?: number;
    partialPackingReady?: number;
    fullPackingReady?: number;
    totalProductionOrders?: number;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesFgtnKpiDto = {
  pendingTransferNote?: number;
  acceptedTransferNote?: number;
  totalFgtnTransferNotes?: number;
};
export type DomainEntitiesReportsFinishedGoodsTransferNotesFgtnInventoryQuantityDto =
  {
    uom?: string | null;
    availableQuantity?: number;
    batchCount?: number;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesFgtnDispatchPipelineDto =
  {
    awaitingArrival?: number;
    arrived?: number;
    total?: number;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesDashboardKpiReportDto =
  {
    productCount?: DomainEntitiesReportsFinishedGoodsTransferNotesProductCountKpiDto;
    totalCustomers?: number;
    productionOrders?: DomainEntitiesReportsFinishedGoodsTransferNotesProductionOrderKpiDto;
    finishedGoodsTransferNotes?: DomainEntitiesReportsFinishedGoodsTransferNotesFgtnKpiDto;
    inventorySummary?:
      | DomainEntitiesReportsFinishedGoodsTransferNotesFgtnInventoryQuantityDto[]
      | null;
    dispatchPipeline?: DomainEntitiesReportsFinishedGoodsTransferNotesFgtnDispatchPipelineDto;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesDateFilterType =
  0 | 1 | 2;
export type DomainEntitiesReportsProcurementSupplierMaterialReportDto = {
  manufacturers?: DomainEntitiesProcurementManufacturersManufacturerListDto;
  materials?:
    DomainEntitiesProcurementManufacturersManufacturerMaterialDto[] | null;
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  supplier?: DomainEntitiesProcurementSuppliersSupplierListDto;
};
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
};
export type DomainEntitiesItemsInventoryClassification = 0 | 1;
export type DomainEntitiesItemsStore = 0 | 1 | 2 | 3;
export type DomainEntitiesItemsItemCategoryDto = {
  id?: string;
  name?: string | null;
};
export type DomainEntitiesItemsItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  name?: string | null;
  code?: string | null;
  classification?: DomainEntitiesItemsInventoryClassification;
  unitOfMeasure?: DomainEntitiesBaseUnitOfMeasureDto;
  hasBatch?: boolean;
  store?: DomainEntitiesItemsStore;
  minimumLevel?: number;
  maximumLevel?: number;
  reorderLevel?: number;
  isActive?: boolean;
  description?: string | null;
  itemCategory?: DomainEntitiesItemsItemCategoryDto;
  availableQuantity?: number;
};
export type DomainEntitiesItemsStoreItemStockSummaryDto = {
  no?: number;
  store?: DomainEntitiesItemsStore;
  itemName?: string | null;
  itemCode?: string | null;
  category?: string | null;
  totalQuantity?: number;
  unitOfMeasure?: string | null;
};
export type DomainEntitiesItemsVendorStoreItemStockSummaryDto = {
  no?: number;
  store?: DomainEntitiesItemsStore;
  itemName?: string | null;
  itemCode?: string | null;
  category?: string | null;
  totalQuantity?: number;
  unitOfMeasure?: string | null;
  vendorName?: string | null;
  inventoryClassification?: DomainEntitiesItemsInventoryClassification;
};
export type DomainEntitiesReportsShipmentsShipmentReportDto = {
  no?: number;
  supplierName?: string | null;
  invoiceAmount?: number;
  materials?: string[] | null;
  expectedArrivalDate?: string;
  freeDays?: string | null;
  demurrageStarts?: string | null;
  containerSize?: string | null;
  billOfLadingNo?: string | null;
  transactionType?: string | null;
  status?: string | null;
};
export type DomainEntitiesReportsPurchaseOrderPurchaseOrderReportDto = {
  no?: number;
  supplierName?: string | null;
  proformaInvoiceNumber?: string | null;
  purchaseOrderNumber?: string | null;
  materialName?: string | null;
  orderQuantity?: number;
  uomName?: string | null;
  unitPrice?: number;
  priceUoM?: string | null;
  currencySymbol?: string | null;
  purchaseOrderDate?: string;
  expectedDeliverydate?: string | null;
};
export type DomainEntitiesReportsPurchaseOrderPurchaseOrderReportDtoRead = {
  no?: number;
  supplierName?: string | null;
  proformaInvoiceNumber?: string | null;
  purchaseOrderNumber?: string | null;
  materialName?: string | null;
  orderQuantity?: number;
  uomName?: string | null;
  unitPrice?: number;
  priceUoM?: string | null;
  currencySymbol?: string | null;
  materialValue?: number;
  purchaseOrderDate?: string;
  expectedDeliverydate?: string | null;
};
export type DomainEntitiesReportsPurchaseOrderPurchasedPoReportDto = {
  no?: number;
  supplierType?: string | null;
  supplierName?: string | null;
  poNumber?: string | null;
  invoiceNumber?: string | null;
  materialName?: string | null;
  orderedQuantity?: number;
  orderedUom?: string | null;
  quantityReceived?: number;
  receivedUom?: string | null;
  unitCost?: number;
  priceUoM?: string | null;
  currencySymbol?: string | null;
  invoiceDate?: string;
};
export type DomainEntitiesReportsPurchaseOrderPurchasedPoReportDtoRead = {
  no?: number;
  supplierType?: string | null;
  supplierName?: string | null;
  poNumber?: string | null;
  invoiceNumber?: string | null;
  materialName?: string | null;
  orderedQuantity?: number;
  orderedUom?: string | null;
  quantityReceived?: number;
  receivedUom?: string | null;
  unitCost?: number;
  priceUoM?: string | null;
  currencySymbol?: string | null;
  materialPurchaseValue?: number;
  invoiceDate?: string;
};
export type DomainEntitiesReportsRequisitionReportDto = {
  newRequisitionsCount?: number;
  pendingRequisitionsCount?: number;
  rejectedRequisitionsCount?: number;
  completedRequisitionsCount?: number;
  sourcedRequisitionsCount?: number;
};
export type DomainEntitiesReportsMaterialReorderReportDto = {
  materialName?: string | null;
  materialCode?: string | null;
  currentQuantity?: number;
  reOrderLevel?: number;
  uomSymbol?: string | null;
};
export type DomainEntitiesReportsProductionScheduleStatusReportDto = {
  newScheduleCount?: number;
  inProgressScheduleCount?: number;
  completedScheduleCount?: number;
  delayedScheduleCount?: number;
  cancelledScheduleCount?: number;
};
export type DomainEntitiesReportsStockTransferStatusReportDto = {
  inProgressCount?: number;
  approvedCount?: number;
  issuedCount?: number;
  rejectedCount?: number;
};
export type DomainEntitiesReportsProductionDashboardDto = {
  requisitionReport?: DomainEntitiesReportsRequisitionReportDto;
  materialsBelowReorderLevel?:
    DomainEntitiesReportsMaterialReorderReportDto[] | null;
  productionScheduleReport?: DomainEntitiesReportsProductionScheduleStatusReportDto;
  stockTransferReport?: DomainEntitiesReportsStockTransferStatusReportDto;
};
export type DomainEntitiesReportsProcurementPurchaseOrderStatusReportDto = {
  newCount?: number;
  pendingCount?: number;
  deliveredCount?: number;
  attachedCount?: number;
  pendingCheckCount?: number;
  checkedCount?: number;
  approvedCount?: number;
  completedCount?: number;
  partiallyLinkedCount?: number;
  linkedCount?: number;
  revisedCount?: number;
  cancelledCount?: number;
};
export type DomainEntitiesReportsProcurementSupplierQuotationStatusCountDto = {
  notProcessedCount?: number;
  processedCount?: number;
  notUsedCount?: number;
};
export type DomainEntitiesReportsProcurementSupplierQuotationItemStatusReportDto =
  {
    local?: DomainEntitiesReportsProcurementSupplierQuotationStatusCountDto;
    foreign?: DomainEntitiesReportsProcurementSupplierQuotationStatusCountDto;
  };
export type DomainEntitiesReportsProcurementMaterialDistributionStatusCountDto =
  {
    pendingCount?: number;
    distributedCount?: number;
  };
export type DomainEntitiesReportsProcurementProcurementDashboardDto = {
  requisitionReport?: DomainEntitiesReportsRequisitionReportDto;
  purchaseOrderStatus?: DomainEntitiesReportsProcurementPurchaseOrderStatusReportDto;
  salesQuotation?: DomainEntitiesReportsProcurementSupplierQuotationItemStatusReportDto;
  materialDistributionStatus?: DomainEntitiesReportsProcurementMaterialDistributionStatusCountDto;
};
export type DomainEntitiesReportsWarehouseDateFilter = 0 | 1 | 2 | 3;
export type DomainEntitiesReportsWarehouseStockTransferStatusCountDto = {
  inProgressCount?: number;
  approvedCount?: number;
  issuedCount?: number;
  rejectedCount?: number;
};
export type DomainEntitiesReportsWarehouseStockTransferDashboardDto = {
  incoming?: DomainEntitiesReportsWarehouseStockTransferStatusCountDto;
  outgoing?: DomainEntitiesReportsWarehouseStockTransferStatusCountDto;
};
export type DomainEntitiesReportsWarehouseStockRequisitionStatusCountDto = {
  newCount?: number;
  pendingCount?: number;
  sourcedCount?: number;
  completedCount?: number;
  rejectedCount?: number;
};
export type DomainEntitiesReportsWarehouseWarehouseDashboardReportDto = {
  stockTransfers?: DomainEntitiesReportsWarehouseStockTransferDashboardDto;
  stockRequisitions?: DomainEntitiesReportsWarehouseStockRequisitionStatusCountDto;
};
export type DomainEntitiesReportsWarehouseExpiredMaterialReportDto = {
  materialName?: string | null;
  materialCode?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  shelfName?: string | null;
  quantityOnShelf?: number;
  uomSymbol?: string | null;
  dateReceived?: string;
};
export type DomainEntitiesReportsWarehouseReservedMaterialReportDto = {
  materialName?: string | null;
  materialCode?: string | null;
  reservedQuantity?: number;
  uomSymbol?: string | null;
  productName?: string | null;
  productCode?: string | null;
  warehouseName?: string | null;
  departmentName?: string | null;
  dateTime?: string;
  schedule?: string | null;
  productBatchNumber?: string | null;
  arNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  balanceQuantity?: number;
  materialBatchNumber?: string | null;
};
export type DomainEntitiesReportsWarehouseMaterialChecklistItemDto = {
  materialName?: string | null;
  materialCode?: string | null;
  quantity?: number;
  uomSymbol?: string | null;
};
export type DomainEntitiesReportsWarehouseMaterialsChecklistReportDto = {
  incomingMaterials?:
    DomainEntitiesReportsWarehouseMaterialChecklistItemDto[] | null;
  checkedMaterials?:
    DomainEntitiesReportsWarehouseMaterialChecklistItemDto[] | null;
};
export type DomainEntitiesReportsProcurementShipmentStatusReportDto = {
  newCount?: number;
  atPortCount?: number;
  clearedCount?: number;
  inTransitCount?: number;
  arrivedCount?: number;
};
export type DomainEntitiesReportsGeneralInventoryItemCountDto = {
  equipmentStoreCount?: number;
  generalSoreCount?: number;
  itStoreCount?: number;
  reagentStoreCount?: number;
};
export type DomainEntitiesReportsGeneralInventoryItemCountDtoRead = {
  equipmentStoreCount?: number;
  generalSoreCount?: number;
  itStoreCount?: number;
  reagentStoreCount?: number;
  total?: number;
};
export type DomainEntitiesReportsGeneralInventoryItemStockRequisitionCountDto =
  {
    pendingCount?: number;
    partialCount?: number;
    completedCount?: number;
  };
export type DomainEntitiesReportsGeneralInventoryItemStockRequisitionCountDtoRead =
  {
    pendingCount?: number;
    partialCount?: number;
    completedCount?: number;
    total?: number;
  };
export type DomainEntitiesReportsGeneralInventoryGeneralInventoryDashboardDto =
  {
    itemCounts?: DomainEntitiesReportsGeneralInventoryItemCountDto;
    itemStockRequisitions?: DomainEntitiesReportsGeneralInventoryItemStockRequisitionCountDto;
    totalvendors?: number;
  };
export type DomainEntitiesReportsGeneralInventoryGeneralInventoryDashboardDtoRead =
  {
    itemCounts?: DomainEntitiesReportsGeneralInventoryItemCountDtoRead;
    itemStockRequisitions?: DomainEntitiesReportsGeneralInventoryItemStockRequisitionCountDtoRead;
    totalvendors?: number;
  };
export type DomainEntitiesReportsGeneralInventoryItemBelowReorderDto = {
  itemName?: string | null;
  code?: string | null;
  currentQuantity?: number;
  reorderLevel?: number;
};
export type DomainEntitiesReportsServicesJobRequisitionCountDto = {
  pending?: number;
  acknowledged?: number;
  assigned?: number;
  jobStarted?: number;
  completed?: number;
  sentToExternal?: number;
  quotationReceived?: number;
  contractorSelected?: number;
  approved?: number;
  cancelled?: number;
};
export type DomainEntitiesReportsServicesServicesDashboardReportDto = {
  totalServiceCount?: number;
  totalContractorsCount?: number;
  jobRequisitionCount?: DomainEntitiesReportsServicesJobRequisitionCountDto;
};
export type DomainEntitiesReportsFinishedGoodsTransferNotesInvoicedProductsSummaryReportDto =
  {
    no?: number;
    invoiceNo?: string | null;
    invoiceDate?: string;
    customerName?: string | null;
    orderNo?: string | null;
    orderDate?: string;
    noOfBatches?: number;
    orderQuantity?: number;
    quantityAllocated?: number;
    productCode?: string | null;
    productName?: string | null;
    uom?: string | null;
    unitPrice?: number;
    priceUoM?: string | null;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesInvoicedProductsSummaryReportDtoRead =
  {
    no?: number;
    invoiceNo?: string | null;
    invoiceDate?: string;
    customerName?: string | null;
    orderNo?: string | null;
    orderDate?: string;
    noOfBatches?: number;
    orderQuantity?: number;
    quantityAllocated?: number;
    outstandingQuantity?: number;
    productCode?: string | null;
    productName?: string | null;
    uom?: string | null;
    unitPrice?: number;
    priceUoM?: string | null;
    itemAmount?: number;
  };
export type DomainEntitiesProductionOrdersAllocateProductionOrderStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesReportsFinishedGoodsTransferNotesInvoicedProductsDetailedReportDto =
  {
    no?: number;
    invoiceNo?: string | null;
    invoiceDate?: string;
    customerName?: string | null;
    orderNo?: string | null;
    orderDate?: string;
    productName?: string | null;
    productCode?: string | null;
    batchNo?: string | null;
    orderQuantity?: number;
    quantityAllocated?: number;
    uom?: string | null;
    unitPrice?: number;
    priceUoM?: string | null;
    allocationStatus?: DomainEntitiesProductionOrdersAllocateProductionOrderStatus;
  };
export type DomainEntitiesReportsFinishedGoodsTransferNotesInvoicedProductsDetailedReportDtoRead =
  {
    no?: number;
    invoiceNo?: string | null;
    invoiceDate?: string;
    customerName?: string | null;
    orderNo?: string | null;
    orderDate?: string;
    productName?: string | null;
    productCode?: string | null;
    batchNo?: string | null;
    orderQuantity?: number;
    quantityAllocated?: number;
    outstandingQuantity?: number;
    uom?: string | null;
    unitPrice?: number;
    priceUoM?: string | null;
    itemAmount?: number;
    allocationStatus?: DomainEntitiesProductionOrdersAllocateProductionOrderStatus;
  };
export type DomainEntitiesReportsWarehouseDashboardKpiWarehouseCapacityUtilisationDto =
  {
    department?: string | null;
    warehouse?: string | null;
    warehouseType?: DomainEntitiesWarehousesWarehouseType;
    totalShelves?: number;
    occupiedShelves?: number;
    availableShelves?: number;
    utilisationPercentage?: number;
  };
export type DomainEntitiesReportsWarehouseDashboardKpiDockToStockTimeDto = {
  department?: string | null;
  warehouse?: string | null;
  period?: string | null;
  averageHours?: number;
  medianHours?: number;
  totalRecords?: number;
};
export type DomainEntitiesReportsWarehouseDashboardKpiStockTransferFulfilmentRateDto =
  {
    department?: string | null;
    direction?: string | null;
    totalTransfers?: number;
    pending?: number;
    approved?: number;
    issued?: number;
    fulfilmentPercentage?: number;
  };
export type DomainEntitiesReportsWarehouseDashboardKpiReceivingPipelineSnapshotDto =
  {
    department?: string | null;
    pending?: number;
    arrived?: number;
    checked?: number;
    grnGenerated?: number;
    distributed?: number;
    assigned?: number;
    total?: number;
  };
export type DomainEntitiesReportsWarehouseDashboardKpiExpiryRiskIndexDto = {
  department?: string | null;
  warehouse?: string | null;
  expiryWindow?: string | null;
  batchCount?: number;
  totalQuantity?: string | null;
  uom?: string | null;
};
export type DomainEntitiesReportsWarehouseDashboardKpiExpiryWindowFilter =
  0 | 1 | 2 | 3;
export type DomainEntitiesReportsWarehouseDashboardKpiReorderAlertCountDto = {
  department?: string | null;
  material?: string | null;
  materialCode?: string | null;
  currentStock?: number;
  reorderLevel?: number;
  shortfall?: number;
  uom?: string | null;
};
export type DomainEntitiesReportsWarehouseDashboardKpiSwapRequestActivityDto = {
  department?: string | null;
  period?: string | null;
  pending?: number;
  approved?: number;
  rejected?: number;
  total?: number;
};
export type DomainEntitiesReportsWarehouseDashboardKpiMaterialMovementCountDto =
  {
    department?: string | null;
    period?: string | null;
    newPutaways?: number;
    adjustments?: number;
    totalMovements?: number;
  };
export type DomainEntitiesReportsWarehouseDashboardKpiWarehouseDataFreshnessDto =
  {
    source?: string | null;
    recordCount?: number;
    lastChangedAt?: string | null;
  };
export type DomainEntitiesReportsBmrReleaseRateDto = {
  departmentId?: string | null;
  department?: string | null;
  totalBmrs?: number;
  pending?: number;
  issued?: number;
  rejected?: number;
  releaseRatePercentage?: number;
};
export type DomainEntitiesReportsYieldPerformanceDto = {
  productId?: string;
  product?: string | null;
  departmentId?: string | null;
  department?: string | null;
  batchCount?: number;
  expectedYield?: number;
  actualQuantityPacked?: number;
  totalGainOrLoss?: number;
  variancePercentage?: number;
};
export type DomainEntitiesReportsScheduleAdherenceDto = {
  departmentId?: string | null;
  department?: string | null;
  onTime?: number;
  delayed?: number;
  totalCompleted?: number;
  adherencePercentage?: number;
};
export type DomainEntitiesReportsProductionOutputVolumeDto = {
  departmentId?: string | null;
  department?: string | null;
  division?: DomainEntitiesProductsDivision;
  productCount?: number;
  totalBatchCount?: number;
  totalQuantityPacked?: number;
  uom?: string | null;
};
export type DomainEntitiesReportsAtrTestingBacklogDto = {
  departmentId?: string | null;
  department?: string | null;
  newNotSampled?: number;
  testing?: number;
  testTaken?: number;
  totalBacklog?: number;
  oldestWaitingDays?: number;
};
export type DomainEntitiesReportsStockRequisitionPendingDto = {
  departmentId?: string | null;
  department?: string | null;
  inProgress?: number;
  reject?: number;
  approved?: number;
  total?: number;
  oldestPendingDays?: number;
};
export type DomainEntitiesReportsFgtnPendingApprovalDto = {
  departmentId?: string | null;
  fromDepartment?: string | null;
  pendingApproval?: number;
  approved?: number;
  averageAgingDays?: number;
};
export type DomainEntitiesProductionOrdersProductionOrderStatus = 0 | 1 | 2;
export type DomainEntitiesReportsProductionOrderDeliveryStatusDto = {
  status?: DomainEntitiesProductionOrdersProductionOrderStatus;
  statusName?: string | null;
  orderCount?: number;
  allocatedCount?: number;
  loaded?: number;
  delivered?: number;
};
export type DomainEntitiesReportsMaterialReturnRateDto = {
  departmentId?: string | null;
  department?: string | null;
  totalIssuedQuantity?: number;
  totalReturnedQuantity?: number;
  returnRatePercentage?: number;
  returnNoteCount?: number;
};
export type DomainEntitiesReportsWarehouseMaterialsStockSummaryDto = {
  no?: number;
  materialName?: string | null;
  materialCode?: string | null;
  materialType?: string | null;
  productionDepartment?: string | null;
  warehouseType?: string | null;
  noOfBatches?: number;
  totalQuantity?: number;
  uom?: string | null;
};
export type DomainEntitiesReportsWarehouseMaterialsStockBatchDetailDto = {
  no?: number;
  materialName?: string | null;
  materialCode?: string | null;
  materialType?: string | null;
  batchNo?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  quantityAvailable?: number;
  uom?: string | null;
  productionDepartment?: string | null;
  warehouseType?: string | null;
  storageLocation?: string | null;
};
export type DomainEntitiesReportsWarehouseShelfUtilisationDetailDto = {
  no?: number;
  warehouse?: string | null;
  warehouseType?: string | null;
  location?: string | null;
  rack?: string | null;
  shelfCode?: string | null;
  shelfName?: string | null;
  occupancyStatus?: string | null;
  distinctBatches?: number;
  totalQuantity?: number;
  lastUpdated?: string | null;
};
export type DomainEntitiesReportsWarehouseOccupancyStatus = 0 | 1 | 2;
export type DomainEntitiesReportsWarehouseGoodsReceivingRegisterDto = {
  no?: number;
  grnNumber?: string | null;
  grnStatus?: string | null;
  grnGeneratedAt?: string;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  declarationNumber?: string | null;
  remarks?: string | null;
  supplier?: string | null;
  material?: string | null;
  quantityReceived?: number;
  uom?: string | null;
  materialBatches?: string | null;
};
export type DomainEntitiesReportsWarehouseReceivingPerformanceDetailDto = {
  no?: number;
  warehouse?: string | null;
  supplier?: string | null;
  material?: string | null;
  quantity?: number;
  arrivedAt?: string | null;
  checkedAt?: string | null;
  grnGeneratedAt?: string | null;
  approvedAt?: string | null;
  distributedAt?: string | null;
  assignedAt?: string | null;
  arrivalToCheckHours?: number | null;
  checkToGrnHours?: number | null;
  grnToApprovedHours?: number | null;
  grnToDistributeHours?: number | null;
  distributeToAssignedHours?: number | null;
  totalDockToStockHours?: number | null;
};
export type DomainEntitiesReportsWarehousePutawayRegisterDto = {
  no?: number;
  material?: string | null;
  batchNo?: string | null;
  quantity?: string | null;
  uom?: string | null;
  fromLocation?: string | null;
  toShelf?: string | null;
  putawayDate?: string;
  putawayBy?: string | null;
  note?: string | null;
};
export type DomainEntitiesReportsWarehouseStockAdjustmentAuditDto = {
  no?: number;
  adjustmentNo?: string | null;
  adjustmentDate?: string;
  material?: string | null;
  batchNo?: string | null;
  shelf?: string | null;
  systemQuantity?: number;
  physicalCount?: number;
  variance?: number;
  reasonCode?: string | null;
  notes?: string | null;
  adjustedBy?: string | null;
};
export type DomainEntitiesReportsWarehouseBatchTraceabilityDto = {
  no?: number;
  eventType?: string | null;
  eventDate?: string;
  fromLocation?: string | null;
  toLocation?: string | null;
  quantity?: number;
  uom?: string | null;
  referenceDocument?: string | null;
  performedBy?: string | null;
  remarks?: string | null;
};
export type DomainEntitiesReportsWarehouseInterWarehouseSwapRequestDto = {
  no?: number;
  firstWarehouse?: string | null;
  secondWarehouse?: string | null;
  status?: string | null;
  material?: string | null;
  batchNo?: string | null;
  quantity?: number;
  uom?: string | null;
  requester?: string | null;
  actionedBy?: string | null;
  actionedAt?: string | null;
  actionNote?: string | null;
};
export type DomainEntitiesReportsWarehouseStockTransferInterDepartmentDetailDto =
  {
    no?: number;
    transferCode?: string | null;
    material?: string | null;
    uom?: string | null;
    requiredQuantity?: number;
    fromDepartment?: string | null;
    toDepartment?: string | null;
    status?: string | null;
    approvedAt?: string | null;
    approvedBy?: string | null;
    issuedAt?: string | null;
    issuedBy?: string | null;
    reason?: string | null;
  };
export type DomainEntitiesReportsWarehouseMaterialExpiryProjectionDto = {
  no?: number;
  material?: string | null;
  materialCode?: string | null;
  batchNo?: string | null;
  expiryDate?: string | null;
  daysUntilExpiry?: number | null;
  expiryWindow?: string | null;
  quantity?: number;
  uom?: string | null;
  warehouse?: string | null;
  shelf?: string | null;
  daysOnShelf?: number;
};
export type DomainEntitiesReportsWarehouseSlowMovingInventoryDto = {
  no?: number;
  material?: string | null;
  materialCode?: string | null;
  batchNo?: string | null;
  quantity?: number;
  uom?: string | null;
  lastMovementDate?: string | null;
  daysSinceLastMove?: number;
  warehouse?: string | null;
  shelf?: string | null;
  estValue?: number;
};
export type DomainEntitiesReportsWarehouseInactivityThreshold = 90 | 180 | 365;
export type DomainEntitiesReportsWarehouseBinCardTransactionLedgerDto = {
  no?: number;
  date?: string;
  description?: string | null;
  wayBill?: string | null;
  arNumber?: string | null;
  supplier?: string | null;
  manufacturer?: string | null;
  quantityReceived?: number;
  quantityIssued?: number;
  balanceQuantity?: number;
  uom?: string | null;
  product?: string | null;
};
export type DomainEntitiesReportsWarehouseOperationsSummaryDto = {
  department?: string | null;
  period?: string | null;
  materialsReceived?: number;
  grnsCreated?: number;
  batchesPutAway?: number;
  stockAdjustments?: number;
  stockTransfers?: number;
  swapsApproved?: number;
  checklistsDone?: number;
};
export type DomainEntitiesReportsWarehouseQcPendingDto = {
  no?: number;
  material?: string | null;
  materialCode?: string | null;
  supplier?: string | null;
  quantity?: number;
  uom?: string | null;
  checklistDate?: string | null;
  daysWaiting?: number;
  warehouse?: string | null;
  arrivalLocation?: string | null;
};
export type DomainEntitiesReportsWarehouseReorderLevelVsStockDto = {
  no?: number;
  material?: string | null;
  materialCode?: string | null;
  materialType?: string | null;
  currentStock?: number;
  reorderLevel?: number;
  avgMonthlyConsumption?: number;
  monthsOfStock?: number;
  suggestedOrderQty?: number;
  stockOutRisk?: string | null;
  uom?: string | null;
  department?: string | null;
};
export type DomainEntitiesReportsWarehouseInventoryValuationSummaryDto = {
  no?: number;
  warehouseType?: string | null;
  division?: string | null;
  warehouse?: string | null;
  itemMaterialCount?: number;
  uomGroup?: string | null;
  totalQuantity?: string | null;
  estUnitCost?: number;
  totalValue?: string | null;
  percentOfTotalInventory?: number;
};
export type DomainEntitiesReportsWarehouseInventoryValuationDetailDto = {
  no?: number;
  warehouseType?: string | null;
  division?: string | null;
  warehouse?: string | null;
  materialItem?: string | null;
  code?: string | null;
  batchNo?: string | null;
  valuationType?: string | null;
  uom?: string | null;
  quantityUOM?: string | null;
  unitSize?: number | null;
  itemCount?: number;
  estUnitCostVal?: number;
  costBasis?: string | null;
  totalValue?: string | null;
  shelfLocation?: string | null;
  expiryDate?: string | null;
  daysOnShelf?: number;
};
export type DomainEntitiesReportsWarehouseWarehouseEmployeeActivityDto = {
  no?: number;
  employee?: string | null;
  department?: string | null;
  checklistsDone?: number;
  grnsCreated?: number;
  stockAdjustments?: number;
  materialDistributions?: number;
  swapsActioned?: number;
  putawayActions?: number;
  totalActions?: number;
};
export type DomainEntitiesReportsWarehouseArrivalLocationStatusDto = {
  no?: number;
  warehouse?: string | null;
  arrivalLocation?: string | null;
  material?: string | null;
  batchNo?: string | null;
  quantity?: number;
  uom?: string | null;
  daysInArrival?: number;
  status?: string | null;
  priorityFlag?: string | null;
};
export type DomainEntitiesReportsHrDashboardKpiEmployeeHeadcountSnapshotDto = {
  department?: string | null;
  permanentActive?: number;
  casualActive?: number;
  permanentInactive?: number;
  casualInactive?: number;
};
export type DomainEntitiesReportsHrDashboardKpiEmployeeHeadcountSnapshotDtoRead =
  {
    department?: string | null;
    permanentActive?: number;
    casualActive?: number;
    totalActive?: number;
    permanentInactive?: number;
    casualInactive?: number;
    totalInactive?: number;
    grandTotal?: number;
  };
export type DomainEntitiesEmployeesEmployeeStatus = 0 | 1 | 2;
export type DomainEntitiesReportsHrDashboardKpiEmployeeGenderRatioDto = {
  department?: string | null;
  permanentMale?: number;
  permanentFemale?: number;
  casualMale?: number;
  casualFemale?: number;
  genderRatio?: string | null;
};
export type DomainEntitiesReportsHrDashboardKpiEmployeeGenderRatioDtoRead = {
  department?: string | null;
  permanentMale?: number;
  permanentFemale?: number;
  casualMale?: number;
  casualFemale?: number;
  totalMale?: number;
  totalFemale?: number;
  genderRatio?: string | null;
};
export type DomainEntitiesReportsHrDashboardKpiLeaveRequestPipelineDto = {
  department?: string | null;
  category?: string | null;
  pending?: number;
  approved?: number;
  rejected?: number;
  expired?: number;
};
export type DomainEntitiesReportsHrDashboardKpiLeaveRequestPipelineDtoRead = {
  department?: string | null;
  category?: string | null;
  pending?: number;
  approved?: number;
  rejected?: number;
  expired?: number;
  total?: number;
};
export type DomainEntitiesReportsHrDashboardKpiOvertimeRequestActivityDto = {
  department?: string | null;
  status?: string | null;
  count?: number;
  totalHoursRequested?: number;
  approvedHours?: number;
};
export type DomainEntitiesReportsHrDashboardKpiDailyAttendanceRateDto = {
  department?: string | null;
  present?: number;
  absent?: number;
  expectedTotal?: number;
  attendanceRatePercent?: number;
};
export type DomainEntitiesReportsHrDashboardKpiStaffRequisitionPipelineDto = {
  department?: string | null;
  status?: string | null;
  count?: number;
  totalPositionsRequired?: number;
};
export type DomainEntitiesReportsHrDashboardKpiEmployeeGradeLevelDistributionDto =
  {
    department?: string | null;
    juniorStaff?: number;
    seniorStaff?: number;
    seniorManagement?: number;
  };
export type DomainEntitiesReportsHrDashboardKpiEmployeeGradeLevelDistributionDtoRead =
  {
    department?: string | null;
    juniorStaff?: number;
    seniorStaff?: number;
    seniorManagement?: number;
    total?: number;
  };
export type DomainEntitiesReportsHrDashboardKpiNewHiresThisPeriodDto = {
  department?: string | null;
  permanentNewHires?: number;
  casualNewHires?: number;
};
export type DomainEntitiesReportsHrDashboardKpiNewHiresThisPeriodDtoRead = {
  department?: string | null;
  permanentNewHires?: number;
  casualNewHires?: number;
  totalNewHires?: number;
};
export type DomainEntitiesReportsHrDashboardKpiEmployeeTurnoverRateDto = {
  department?: string | null;
  leavers?: number;
  averageHeadcount?: number;
  turnoverRatePercent?: number;
};
export type DomainEntitiesReportsHrDashboardKpiLeaveUtilisationRateDto = {
  department?: string | null;
  staffDueForLeave?: number;
  totalDaysAllowed?: number;
  totalDaysUsed?: number;
  utilisationPercent?: number;
};
export type DomainEntitiesReportsHrDashboardKpiActiveDisciplinaryActionsDto = {
  department?: string | null;
  underQuestion?: number;
  formalWarning?: number;
  finalWarning?: number;
  suspended?: number;
};
export type DomainEntitiesReportsHrDashboardKpiActiveDisciplinaryActionsDtoRead =
  {
    department?: string | null;
    underQuestion?: number;
    formalWarning?: number;
    finalWarning?: number;
    suspended?: number;
    totalUnderDisciplinaryAction?: number;
  };
export type DomainEntitiesReportsHumanResourceEmployeeMasterListReportDto = {
  no?: number;
  staffNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string;
  dateEmployed?: string;
  employmentType?: string | null;
  gradeLevel?: string | null;
  status?: string | null;
  department?: string | null;
  designation?: string | null;
  reportingManager?: string | null;
  nationality?: string | null;
  region?: string | null;
  maritalStatus?: string | null;
  religion?: string | null;
  bankAccountNumber?: string | null;
  ssnitNumber?: string | null;
  ghanaCardNumber?: string | null;
  annualLeaveEntitlement?: number;
};
export type DomainEntitiesEmployeesEmployeeLevel = 0 | 1 | 2;
export type DomainEntitiesReportsHumanResourceEmployeeDirectoryByDepartmentDto =
  {
    no?: number;
    department?: string | null;
    staffNumber?: string | null;
    employeeName?: string | null;
    designation?: string | null;
    gradeLevel?: string | null;
    employmentType?: string | null;
    status?: string | null;
    reportingManager?: string | null;
    email?: string | null;
    phone?: string | null;
  };
export type DomainEntitiesReportsHumanResourceEmployeeDemographicsReportDto = {
  no?: number;
  dimension?: string | null;
  category?: string | null;
  permanentCount?: number;
  casualCount?: number;
  totalCount?: number;
  percentage?: number;
};
export type DomainEntitiesReportsHumanResourceStaffGradeLevelReportDto = {
  no?: number;
  department?: string | null;
  seniorMgtMale?: number;
  seniorMgtFemale?: number;
  seniorStaffMale?: number;
  seniorStaffFemale?: number;
  juniorStaffMale?: number;
  juniorStaffFemale?: number;
  totalMale?: number;
  totalFemale?: number;
  departmentalTotal?: number;
};
export type DomainEntitiesReportsHumanResourceLeaveRegisterReportDto = {
  no?: number;
  employeeName?: string | null;
  staffNumber?: string | null;
  department?: string | null;
  leaveCategory?: string | null;
  leaveType?: string | null;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  paidDays?: number | null;
  unpaidDays?: number | null;
  status?: string | null;
  justification?: string | null;
  contactPerson?: string | null;
  destination?: string | null;
  approvedBy?: string | null;
  dateApplied?: string;
};
export type DomainEntitiesLeaveRequestsRequestCategory = 0 | 1 | 2 | 3;
export type DomainEntitiesLeaveRequestsLeaveStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesReportsHumanResourceLeaveBalanceReportDto = {
  no?: number;
  employeeName?: string | null;
  staffNumber?: string | null;
  department?: string | null;
  leaveYear?: number;
  daysAllowed?: number;
  daysUsed?: number;
  daysRemaining?: number;
  utilisation?: number;
};
export type DomainEntitiesReportsHumanResourceLeaveApprovalAuditReportDto = {
  no?: number;
  employee?: string | null;
  leaveCategory?: string | null;
  durationDays?: number;
  approvalStage?: string | null;
  approver?: string | null;
  actionTaken?: string | null;
  actionDate?: string | null;
  comments?: string | null;
  finalStatus?: string | null;
};
export type DomainEntitiesReportsHumanResourceOvertimeRequestRegisterReportDto =
  {
    no?: number;
    requestCode?: string | null;
    department?: string | null;
    employees?: string | null;
    overtimeDate?: string;
    startTime?: string | null;
    endTime?: string | null;
    totalHours?: number;
    justification?: string | null;
    status?: string | null;
    approvedBy?: string | null;
    dateRequested?: string;
  };
export type DomainEntitiesOvertimeRequestsOvertimeStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesReportsHumanResourceStaffRequisitionRegisterReportDto =
  {
    no?: number;
    department?: string | null;
    designation?: string | null;
    positionsRequired?: number;
    appointmentType?: string | null;
    budgetStatus?: string | null;
    requestUrgency?: string | null;
    businessJustification?: string | null;
    requiredQualifications?: string | null;
    educationRequirements?: string | null;
    additionalRequirements?: string | null;
    status?: string | null;
    dateRequested?: string;
  };
export type DomainEntitiesStaffRequisitionsStaffRequisitionStatus =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesStaffRequisitionsAppointmentType = 0 | 1;
export type DomainEntitiesReportsHumanResourceEmployeeDisciplinaryReportDto = {
  no?: number;
  employeeName?: string | null;
  staffNumber?: string | null;
  department?: string | null;
  designation?: string | null;
  disciplinaryStatus?: string | null;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
  activeStatus?: string | null;
  daysUnderAction?: number;
};
export type DomainEntitiesEmployeesEmployeeActiveStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesReportsHumanResourceEmployeeExitReportDto = {
  no?: number;
  employeeName?: string | null;
  staffNumber?: string | null;
  department?: string | null;
  designation?: string | null;
  employmentType?: string | null;
  gradeLevel?: string | null;
  exitReason?: string | null;
  exitDate?: string;
  dateEmployed?: string;
  tenureYears?: number;
  noticePeriodServed?: string | null;
};
export type DomainEntitiesEmployeesEmployeeInactiveStatus =
  0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesReportsHumanResourceEmployeeAnniversaryBirthdayReportDto =
  {
    no?: number;
    eventType?: string | null;
    employeeName?: string | null;
    staffNumber?: string | null;
    department?: string | null;
    designation?: string | null;
    eventDate?: string;
    yearsOfService?: number | null;
    age?: number | null;
  };
export type DomainEntitiesReportsHumanResourceShiftScheduleRegisterReportDto = {
  no?: number;
  scheduleName?: string | null;
  frequency?: string | null;
  startDate?: string;
  endDate?: string;
  status?: string | null;
  employee?: string | null;
  shiftType?: string | null;
  shiftDate?: string;
  rotationType?: string | null;
};
export type DomainEntitiesShiftSchedulesScheduleStatus = 0 | 1 | 2 | 3 | 4;
export const {
  useGetApiV1ReportProductionQuery,
  useLazyGetApiV1ReportProductionQuery,
  useGetApiV1ReportProductionMaterialsBelowMinimumQuery,
  useLazyGetApiV1ReportProductionMaterialsBelowMinimumQuery,
  useGetApiV1ReportWarehouseQuery,
  useLazyGetApiV1ReportWarehouseQuery,
  useGetApiV1ReportLogisticsQuery,
  useLazyGetApiV1ReportLogisticsQuery,
  useGetApiV1ReportReservedMaterialBatchesQuery,
  useLazyGetApiV1ReportReservedMaterialBatchesQuery,
  useGetApiV1ReportHumanResourceQuery,
  useLazyGetApiV1ReportHumanResourceQuery,
  useGetApiV1ReportStaffReportQuery,
  useLazyGetApiV1ReportStaffReportQuery,
  useGetApiV1ReportEmployeeMovementQuery,
  useLazyGetApiV1ReportEmployeeMovementQuery,
  useGetApiV1ReportStaffTotalReportQuery,
  useLazyGetApiV1ReportStaffTotalReportQuery,
  useGetApiV1ReportStaffGenderRatioReportQuery,
  useLazyGetApiV1ReportStaffGenderRatioReportQuery,
  useGetApiV1ReportStaffLeaveReportQuery,
  useLazyGetApiV1ReportStaffLeaveReportQuery,
  useGetApiV1ReportStaffTurnoverReportQuery,
  useLazyGetApiV1ReportStaffTurnoverReportQuery,
  useGetApiV1ReportMaterialsReadyForChecklistQuery,
  useLazyGetApiV1ReportMaterialsReadyForChecklistQuery,
  useGetApiV1ReportMaterialsReadyForAssignmentQuery,
  useLazyGetApiV1ReportMaterialsReadyForAssignmentQuery,
  useGetApiV1ReportQaDashboardQuery,
  useLazyGetApiV1ReportQaDashboardQuery,
  useGetApiV1ReportQcDashboardQuery,
  useLazyGetApiV1ReportQcDashboardQuery,
  useGetApiV1ReportFinishedGoodsTransferSummaryQuery,
  useLazyGetApiV1ReportFinishedGoodsTransferSummaryQuery,
  useGetApiV1ReportFinishedGoodsTransferDetailedQuery,
  useLazyGetApiV1ReportFinishedGoodsTransferDetailedQuery,
  useGetApiV1ReportProductStockSummaryQuery,
  useLazyGetApiV1ReportProductStockSummaryQuery,
  useGetApiV1ReportProductStockDetailedQuery,
  useLazyGetApiV1ReportProductStockDetailedQuery,
  useGetApiV1ReportFgtnDashboardKpiQuery,
  useLazyGetApiV1ReportFgtnDashboardKpiQuery,
  useGetApiV1ReportSupplierMaterialsQuery,
  useLazyGetApiV1ReportSupplierMaterialsQuery,
  useGetApiV1ReportItemsPerStoreTypeQuery,
  useLazyGetApiV1ReportItemsPerStoreTypeQuery,
  useGetApiV1ReportStockSummaryPerStoreTypeQuery,
  useLazyGetApiV1ReportStockSummaryPerStoreTypeQuery,
  useGetApiV1ReportVendorItemQuery,
  useLazyGetApiV1ReportVendorItemQuery,
  useGetApiV1ReportVendorItemSummaryQuery,
  useLazyGetApiV1ReportVendorItemSummaryQuery,
  useGetApiV1ReportShipmentQuery,
  useLazyGetApiV1ReportShipmentQuery,
  useGetApiV1ReportPurchaseOrdersQuery,
  useLazyGetApiV1ReportPurchaseOrdersQuery,
  useGetApiV1ReportPurchasedPoReportQuery,
  useLazyGetApiV1ReportPurchasedPoReportQuery,
  useGetApiV1ReportProductionDashboardQuery,
  useLazyGetApiV1ReportProductionDashboardQuery,
  useGetApiV1ReportProcurementDashboardQuery,
  useLazyGetApiV1ReportProcurementDashboardQuery,
  useGetApiV1ReportWarehouseDashboardQuery,
  useLazyGetApiV1ReportWarehouseDashboardQuery,
  useGetApiV1ReportExpiredMaterialsQuery,
  useLazyGetApiV1ReportExpiredMaterialsQuery,
  useGetApiV1ReportReservedMaterialsQuery,
  useLazyGetApiV1ReportReservedMaterialsQuery,
  useGetApiV1ReportMaterialsBelowReorderQuery,
  useLazyGetApiV1ReportMaterialsBelowReorderQuery,
  useGetApiV1ReportMaterialsChecklistQuery,
  useLazyGetApiV1ReportMaterialsChecklistQuery,
  useGetApiV1ReportShipmentStatusSummaryQuery,
  useLazyGetApiV1ReportShipmentStatusSummaryQuery,
  useGetApiV1ReportGeneralInventoryDashboardQuery,
  useLazyGetApiV1ReportGeneralInventoryDashboardQuery,
  useGetApiV1ReportItemsBelowReorderQuery,
  useLazyGetApiV1ReportItemsBelowReorderQuery,
  useGetApiV1ReportServicesDashboardQuery,
  useLazyGetApiV1ReportServicesDashboardQuery,
  useGetApiV1ReportInvoicedProductsSummaryQuery,
  useLazyGetApiV1ReportInvoicedProductsSummaryQuery,
  useGetApiV1ReportInvoicedProductsDetailedQuery,
  useLazyGetApiV1ReportInvoicedProductsDetailedQuery,
  useGetApiV1ReportWarehouseKpiCapacityUtilisationQuery,
  useLazyGetApiV1ReportWarehouseKpiCapacityUtilisationQuery,
  useGetApiV1ReportWarehouseKpiDockToStockQuery,
  useLazyGetApiV1ReportWarehouseKpiDockToStockQuery,
  useGetApiV1ReportWarehouseKpiStockTransferFulfilmentQuery,
  useLazyGetApiV1ReportWarehouseKpiStockTransferFulfilmentQuery,
  useGetApiV1ReportWarehouseKpiReceivingPipelineQuery,
  useLazyGetApiV1ReportWarehouseKpiReceivingPipelineQuery,
  useGetApiV1ReportWarehouseKpiExpiryRiskIndexQuery,
  useLazyGetApiV1ReportWarehouseKpiExpiryRiskIndexQuery,
  useGetApiV1ReportWarehouseKpiReorderAlertCountQuery,
  useLazyGetApiV1ReportWarehouseKpiReorderAlertCountQuery,
  useGetApiV1ReportWarehouseKpiSwapRequestActivityQuery,
  useLazyGetApiV1ReportWarehouseKpiSwapRequestActivityQuery,
  useGetApiV1ReportWarehouseKpiMaterialMovementCountQuery,
  useLazyGetApiV1ReportWarehouseKpiMaterialMovementCountQuery,
  useGetApiV1ReportWarehouseKpiFreshnessQuery,
  useLazyGetApiV1ReportWarehouseKpiFreshnessQuery,
  useGetApiV1ReportKpiBmrReleaseRateQuery,
  useLazyGetApiV1ReportKpiBmrReleaseRateQuery,
  useGetApiV1ReportKpiYieldPerformanceQuery,
  useLazyGetApiV1ReportKpiYieldPerformanceQuery,
  useGetApiV1ReportKpiScheduleAdherenceQuery,
  useLazyGetApiV1ReportKpiScheduleAdherenceQuery,
  useGetApiV1ReportKpiProductionOutputVolumeQuery,
  useLazyGetApiV1ReportKpiProductionOutputVolumeQuery,
  useGetApiV1ReportKpiAtrTestingBacklogQuery,
  useLazyGetApiV1ReportKpiAtrTestingBacklogQuery,
  useGetApiV1ReportKpiStockRequisitionPendingQuery,
  useLazyGetApiV1ReportKpiStockRequisitionPendingQuery,
  useGetApiV1ReportKpiFgtnPendingApprovalQuery,
  useLazyGetApiV1ReportKpiFgtnPendingApprovalQuery,
  useGetApiV1ReportKpiProductionOrderDeliveryStatusQuery,
  useLazyGetApiV1ReportKpiProductionOrderDeliveryStatusQuery,
  useGetApiV1ReportKpiMaterialReturnRateQuery,
  useLazyGetApiV1ReportKpiMaterialReturnRateQuery,
  useGetApiV1ReportWarehouseMaterialsStockSummaryQuery,
  useLazyGetApiV1ReportWarehouseMaterialsStockSummaryQuery,
  useGetApiV1ReportWarehouseMaterialsStockBatchDetailQuery,
  useLazyGetApiV1ReportWarehouseMaterialsStockBatchDetailQuery,
  useGetApiV1ReportWarehouseShelfUtilisationDetailQuery,
  useLazyGetApiV1ReportWarehouseShelfUtilisationDetailQuery,
  useGetApiV1ReportWarehouseGoodsReceivingRegisterQuery,
  useLazyGetApiV1ReportWarehouseGoodsReceivingRegisterQuery,
  useGetApiV1ReportWarehouseReceivingPerformanceDetailQuery,
  useLazyGetApiV1ReportWarehouseReceivingPerformanceDetailQuery,
  useGetApiV1ReportWarehousePutawayRegisterQuery,
  useLazyGetApiV1ReportWarehousePutawayRegisterQuery,
  useGetApiV1ReportWarehouseStockAdjustmentAuditQuery,
  useLazyGetApiV1ReportWarehouseStockAdjustmentAuditQuery,
  useGetApiV1ReportWarehouseBatchTraceabilityQuery,
  useLazyGetApiV1ReportWarehouseBatchTraceabilityQuery,
  useGetApiV1ReportWarehouseInterWarehouseSwapRequestsQuery,
  useLazyGetApiV1ReportWarehouseInterWarehouseSwapRequestsQuery,
  useGetApiV1ReportWarehouseStockTransferInterDepartmentQuery,
  useLazyGetApiV1ReportWarehouseStockTransferInterDepartmentQuery,
  useGetApiV1ReportWarehouseMaterialExpiryProjectionQuery,
  useLazyGetApiV1ReportWarehouseMaterialExpiryProjectionQuery,
  useGetApiV1ReportWarehouseSlowMovingInventoryQuery,
  useLazyGetApiV1ReportWarehouseSlowMovingInventoryQuery,
  useGetApiV1ReportWarehouseBinCardTransactionLedgerQuery,
  useLazyGetApiV1ReportWarehouseBinCardTransactionLedgerQuery,
  useGetApiV1ReportWarehouseOperationsSummaryQuery,
  useLazyGetApiV1ReportWarehouseOperationsSummaryQuery,
  useGetApiV1ReportWarehouseQcPendingQuery,
  useLazyGetApiV1ReportWarehouseQcPendingQuery,
  useGetApiV1ReportWarehouseReorderLevelVsStockQuery,
  useLazyGetApiV1ReportWarehouseReorderLevelVsStockQuery,
  useGetApiV1ReportWarehouseInventoryValuationSummaryQuery,
  useLazyGetApiV1ReportWarehouseInventoryValuationSummaryQuery,
  useGetApiV1ReportWarehouseInventoryValuationDetailQuery,
  useLazyGetApiV1ReportWarehouseInventoryValuationDetailQuery,
  useGetApiV1ReportWarehouseEmployeeActivityQuery,
  useLazyGetApiV1ReportWarehouseEmployeeActivityQuery,
  useGetApiV1ReportWarehouseArrivalLocationStatusQuery,
  useLazyGetApiV1ReportWarehouseArrivalLocationStatusQuery,
  useGetApiV1ReportHrKpiEmployeeHeadcountQuery,
  useLazyGetApiV1ReportHrKpiEmployeeHeadcountQuery,
  useGetApiV1ReportHrKpiEmployeeGenderRatioQuery,
  useLazyGetApiV1ReportHrKpiEmployeeGenderRatioQuery,
  useGetApiV1ReportHrKpiLeaveRequestPipelineQuery,
  useLazyGetApiV1ReportHrKpiLeaveRequestPipelineQuery,
  useGetApiV1ReportHrKpiOvertimeRequestActivityQuery,
  useLazyGetApiV1ReportHrKpiOvertimeRequestActivityQuery,
  useGetApiV1ReportHrKpiDailyAttendanceRateQuery,
  useLazyGetApiV1ReportHrKpiDailyAttendanceRateQuery,
  useGetApiV1ReportHrKpiStaffRequisitionPipelineQuery,
  useLazyGetApiV1ReportHrKpiStaffRequisitionPipelineQuery,
  useGetApiV1ReportHrKpiEmployeeGradeLevelDistributionQuery,
  useLazyGetApiV1ReportHrKpiEmployeeGradeLevelDistributionQuery,
  useGetApiV1ReportHrKpiNewHiresThisPeriodQuery,
  useLazyGetApiV1ReportHrKpiNewHiresThisPeriodQuery,
  useGetApiV1ReportHrKpiEmployeeTurnoverRateQuery,
  useLazyGetApiV1ReportHrKpiEmployeeTurnoverRateQuery,
  useGetApiV1ReportHrKpiLeaveUtilisationRateQuery,
  useLazyGetApiV1ReportHrKpiLeaveUtilisationRateQuery,
  useGetApiV1ReportHrKpiActiveDisciplinaryActionsQuery,
  useLazyGetApiV1ReportHrKpiActiveDisciplinaryActionsQuery,
  useGetApiV1ReportHrEmployeeMasterListQuery,
  useLazyGetApiV1ReportHrEmployeeMasterListQuery,
  useGetApiV1ReportHrEmployeeDirectoryByDepartmentQuery,
  useLazyGetApiV1ReportHrEmployeeDirectoryByDepartmentQuery,
  useGetApiV1ReportHrEmployeeDemographicsQuery,
  useLazyGetApiV1ReportHrEmployeeDemographicsQuery,
  useGetApiV1ReportHrStaffGradeLevelQuery,
  useLazyGetApiV1ReportHrStaffGradeLevelQuery,
  useGetApiV1ReportHrLeaveRegisterQuery,
  useLazyGetApiV1ReportHrLeaveRegisterQuery,
  useGetApiV1ReportHrLeaveBalanceQuery,
  useLazyGetApiV1ReportHrLeaveBalanceQuery,
  useGetApiV1ReportHrLeaveApprovalAuditQuery,
  useLazyGetApiV1ReportHrLeaveApprovalAuditQuery,
  useGetApiV1ReportHrOvertimeRequestRegisterQuery,
  useLazyGetApiV1ReportHrOvertimeRequestRegisterQuery,
  useGetApiV1ReportHrStaffRequisitionRegisterQuery,
  useLazyGetApiV1ReportHrStaffRequisitionRegisterQuery,
  useGetApiV1ReportHrEmployeeDisciplinaryReportQuery,
  useLazyGetApiV1ReportHrEmployeeDisciplinaryReportQuery,
  useGetApiV1ReportHrEmployeeExitReportQuery,
  useLazyGetApiV1ReportHrEmployeeExitReportQuery,
  useGetApiV1ReportHrEmployeeAnniversaryBirthdayQuery,
  useLazyGetApiV1ReportHrEmployeeAnniversaryBirthdayQuery,
  useGetApiV1ReportHrShiftScheduleRegisterQuery,
  useLazyGetApiV1ReportHrShiftScheduleRegisterQuery,
} = injectedRtkApi;
