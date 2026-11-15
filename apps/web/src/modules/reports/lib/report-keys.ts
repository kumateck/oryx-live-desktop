/**
 * Each report has its own backend key (`PermissionKeys` in oryx-backend). A role sees and runs only the reports
 * whose keys it holds. Kept apart from the catalog, with no imports, so manifests and the navigation
 * import script can read it. Keys are `ReportKey` values; `report-directory.ts` checks that every report has one.
 */
export const reportViewKeys = {
  0: "CanViewMaterialsPerDepartmentReport", // MaterialList
  1: "CanViewMaterialStockSummaryReport", // MaterialStockSummary
  2: "CanViewMaterialStockDetailReport", // MaterialStockDetail
  3: "CanViewInventoryValuationReport", // InventoryValuation
  4: "CanViewSupplierMappingDetailReport", // SupplierDetail
  5: "CanViewSupplierMappingSummaryReport", // SupplierSummary
  6: "CanViewPurchaseOrdersReport", // PurchaseOrders
  7: "CanViewInvoicedPurchaseOrdersReport", // PurchasedOrders
  8: "CanViewShipmentsReport", // Shipments
  9: "CanViewFinishedGoodsTransferSummaryReport", // TransferSummary
  10: "CanViewFinishedGoodsTransferDetailReport", // TransferDetail
  11: "CanViewProductStockSummaryReport", // ProductStockSummary
  12: "CanViewProductStockDetailReport", // ProductStockDetail
  13: "CanViewProductListReport", // ProductList
  14: "CanViewInvoicedProductsReport", // InvoicedProducts
  15: "CanViewStoreItemsReport", // StoreItems
  16: "CanViewStoreStockReport", // StoreStock
  17: "CanViewVendorItemMappingDetailReport", // VendorItems
  18: "CanViewVendorItemMappingSummaryReport", // VendorSummary
  19: "CanViewEmployeeMasterListReport", // EmployeeMaster
  20: "CanViewStaffGradeReport", // StaffGrade
  21: "CanViewNewHiresAndExitsReport", // EmployeeMovement
  22: "CanViewStaffTotalReport", // StaffTotal
  23: "CanViewStaffGenderRatioReport", // GenderRatio
  24: "CanViewLeaveOverviewReport", // LeaveOverview
  25: "CanViewStaffTurnoverReport", // StaffTurnover
  26: "CanViewDailyAttendanceReport", // DailyAttendance
  27: "CanViewDepartmentAttendanceReport", // DepartmentAttendance
  28: "CanViewMonthlyProductionScheduleReport", // MonthlySchedule
  29: "CanViewDailyProductionScheduleReport", // DailySchedule
  30: "CanViewProductReadinessReport", // ProductReadiness
  31: "CanViewDepartmentProductListReport", // QualityProducts
  32: "CanViewMaterialListReport", // QualityMaterials
  33: "CanViewBmrIssuedReport", // IssuedBmr
  34: "CanViewStockCountSheetReport", // CurrentStock
  35: "CanViewExpiredStockReport", // ExpiredStock
  36: "CanViewApprovedManufacturerListReport", // ApprovedManufacturers
  37: "CanViewBmrIssuedByProductReport", // IssuedBmrByProduct
} as const;

/** Every report key: opening the hub, or an old report address that redirects into it, needs one of these. */
export const anyReportKey: readonly string[] = Object.values(reportViewKeys);
