export interface ApiDomain {
  /** Output file name under apps/web/src/shared/api/generated. */
  id: string;
  /** Backend controller tags owned by this domain. A tag belongs to exactly one domain. */
  tags: readonly string[];
  exportName: string;
}

// Transport grouping only: one lazily imported endpoint file per domain. Module ownership of
// screens lives in apps/web/src/modules. Generation fails when the contract has an unassigned tag.
export const apiDomains: readonly ApiDomain[] = [
  { id: "auth", exportName: "authApi", tags: ["Auth", "Verification"] },
  { id: "identity", exportName: "identityApi", tags: ["User", "Role", "Permission", "Department"] },
  { id: "approvals", exportName: "approvalsApi", tags: ["Approval", "PendingApprovalDocumentCounts", "PendingRevisionApproval"] },
  { id: "settings", exportName: "settingsApi", tags: [
    "ActivityLog", "Alert", "Collection", "CompanyWorkingDays", "Configuration", "Country", "File", "Holiday", "WorkingHoursPolicy",
  ] },
  { id: "hr", exportName: "hrApi", tags: [
    "AttendanceRecord", "Designation", "Employee", "Onboarding", "LeaveEntitlement", "LeaveRequest", "LeaveType", "OvertimeRequest",
    "Payroll", "Performance", "ShiftCategory", "ShiftSchedule", "ShiftType", "StaffRequisition",
  ] },
  { id: "materials", exportName: "materialsApi", tags: ["Material", "BillOfMaterial"] },
  { id: "products", exportName: "productsApi", tags: ["Product"] },
  { id: "production", exportName: "productionApi", tags: ["ProductionSchedule", "ProductionOrder", "WorkOrder"] },
  { id: "warehouse", exportName: "warehouseApi", tags: ["Warehouse", "Requisition", "StockAdjustment", "StockDiscrepancy", "DamagedStocks"] },
  { id: "procurement", exportName: "procurementApi", tags: ["Procurement", "Supplier"] },
  { id: "inventory", exportName: "inventoryApi", tags: [
    "Item", "ItemGrn", "ItemInventoryTransaction", "ItemStockRequisition", "InventoryProcurement", "Vendor", "RecoverableItemsReport",
  ] },
  { id: "sales", exportName: "salesApi", tags: ["Customer", "Payment"] },
  { id: "qc", exportName: "qcApi", tags: [
    "CommercialCertificate", "Instrument", "MicrobialRequirement", "QcAiExtractionSettings", "QcCoa", "QcEquipment",
    "QcMonitoringProgram", "QcOosCase", "QcSamplingPointGroup", "QcSpecification", "QcSpecificationProposal",
    "QcStandardTestProcedure", "QcTestRequest", "QcWaterQuality", "QcWorksheetApproval", "QcWorksheetInstance",
    "QcWorksheetTemplate", "RoutineQc", "WaterQuality", "MaterialRetest", "QcResponseRework", "QcWorksheetFiles",
  ] },
  { id: "analytical", exportName: "analyticalApi", tags: [
    "AnalyticalTestRequest", "MaterialAnalyticalRawData", "MaterialSampling", "MaterialSpecification",
    "MaterialStandardTestProcedure", "OosInvestigation", "ProductAnalyticalRawData", "ProductSampling",
    "ProductSpecification", "ProductStandardTestProcedure", "StpDocument",
  ] },
  { id: "qa", exportName: "qaApi", tags: ["QualityAudit"] },
  { id: "forms", exportName: "formsApi", tags: ["Form", "FormRevision", "FormulaDefinition", "FormulaQuestion", "FormulaRuntime"] },
  { id: "templates", exportName: "templatesApi", tags: [
    "Procedure", "TemplateActivity", "TemplateAdoption", "TemplateArea", "TemplateForm", "TemplateQuestion",
    "TemplateSection", "TemplateSharing", "TemplateWorkflow",
  ] },
  { id: "rnd", exportName: "rndApi", tags: [
    "RndAnalyticalMethod", "RndDevelopmentReport", "RndFormulation", "RndFormulationReview", "RndProject",
    "RndStabilityChamber", "RndStabilityStudy", "RndTechnologyTransfer", "RndTechnologyTransferReview", "RndTrialBatch",
  ] },
  { id: "services", exportName: "servicesApi", tags: [
    "IT Support Tickets", "Job Orders", "Job Requests", "JobExecution", "Service Memos", "Service Proforma Invoices",
    "Service Providers", "Service Quotations", "Services",
  ] },
  { id: "reports", exportName: "reportsApi", tags: ["Report"] },
];
