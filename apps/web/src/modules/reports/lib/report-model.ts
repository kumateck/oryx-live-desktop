import type { ReportSheet } from "@/shared/reports/report-data";
import type { ReportFilters, ReportFieldName } from "../schemas/report-filters";
export enum ReportKey { MaterialList = 0, MaterialStockSummary = 1, MaterialStockDetail = 2, InventoryValuation = 3, SupplierDetail = 4, SupplierSummary = 5, PurchaseOrders = 6, PurchasedOrders = 7, Shipments = 8, TransferSummary = 9, TransferDetail = 10, ProductStockSummary = 11, ProductStockDetail = 12, ProductList = 13, InvoicedProducts = 14, StoreItems = 15, StoreStock = 16, VendorItems = 17, VendorSummary = 18, EmployeeMaster = 19, StaffGrade = 20, EmployeeMovement = 21, StaffTotal = 22, GenderRatio = 23, LeaveOverview = 24, StaffTurnover = 25, DailyAttendance = 26, DepartmentAttendance = 27, MonthlySchedule = 28, DailySchedule = 29, ProductReadiness = 30, QualityProducts = 31, QualityMaterials = 32 }
export type ReportGroup = "warehouse" | "procurement" | "finished-goods" | "stores" | "hr" | "quality";
export interface ReportDefinition { key: ReportKey; title: string; group: ReportGroup; fields: readonly ReportFieldName[]; required?: readonly ReportFieldName[]; description: string }
export interface ReportOutput { sheets: readonly ReportSheet[]; warnings?: readonly string[] }
export type ReportLoader = (key: ReportKey, filters: ReportFilters, signal: AbortSignal) => Promise<ReportOutput>;
export const reportPermissions: Record<ReportGroup, string> = { warehouse: "CanViewWarehouseReport", procurement: "CanViewProcurementReport", "finished-goods": "CanViewFgtnReport", stores: "CanViewStoreAndInventoryReport", hr: "CanViewHumanResourcesReport", quality: "CanViewQcAndQaReport" };
export const reportsAudit = { module: "Reports", subModule: "Report generation" } as const;
