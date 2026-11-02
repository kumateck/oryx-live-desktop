/** Explicit local reset scope. Unclassified/new tables stop the reset. */
const names = (text: string): string[] => text.trim().split(/\s+/);

export const retainedGroups = {
  identity: names(`Organizations Sites Departments DepartmentDesignation Designations
    users roles userroles userclaims roleclaims userlogins usertokens RoleDepartments
    PermissionTypes DataProtectionKeys __EFMigrationsHistory`),
  employees: names(`Employees Children Sibling Education EmploymentHistories EmployeeWarehouse
    EmployeeCompensations CompensationAllowances EmployeeTaxReliefs PayrollAdditions PayrollDeductions
    PayGrades PayeTaxBands SsnitRates LeaveTypes DesignationLeaveType LeaveEntitlements
    ShiftTypes ShiftSchedules ShiftScheduleShiftType ShiftCategories WorkingHoursPolicies
    CompanyWorkingDays Holidays`),
  materials: names(`Materials MaterialCategories MaterialTypes MaterialDepartments
    Manufacturers ManufacturerMaterials Suppliers SupplierBankDetails SupplierCertifications
    SupplierContacts SupplierManufacturers SupplierPricingAgreements SupplierPricingAgreementApprovals`),
  products: names(`Products ProductCategories ProductBillOfMaterials BillOfMaterials BillOfMaterialItems
    BillOfMaterialItemSubstitutes ProductPackages ProductPackageSubstitutes ProductPackings
    ProductPackingList ProductPrices Routes RouteResources RouteWorkCenters RouteResponsibleUsers
    RouteResponsibleRoles Resources Operations WorkCenters Equipments PackageStyles PackageTypes
    ProductStates MarketTypes`),
  quality: names(`MaterialSpecifications ProductSpecifications MaterialStandardTestProcedures
    ProductStandardTestProcedures MaterialAnalyticalRawData ProductAnalyticalRawData CommercialCoaItems
    Instruments QcEquipments QcEquipmentCategories UniformityOfWeights MicrobialRequirements
    Reagents Threshold RoutineArds RoutineCoaItems RoutineDefinitions AuditChecklistTemplates
    AuditChecklistTemplateItems QcStandardTestProcedures QcStpSteps QcWorksheetTemplates
    QcWorksheetSections QcWorksheetFields QcWorksheetFieldRevisions QcSpecifications
    QcSpecificationCharacteristics QcSpecificationWorksheetLinks QcSpecProposalSets QcSamplingPoints
    QcSamplingPointGroups QcMonitoringPrograms QcAiExtractionSettings QcAiExtractionActiveProvider
    StpDocuments StpDocumentVersions StpDocumentSignatures`),
  forms: names(`Forms FormSections FormFields FormReviewers Questions QuestionOptions
    FormulaDefinitions QuestionFormulaDefinitions FormulaRevisions FormulaRevisionAudits
    LegacyFormulaArtifacts LegacyKeyMappings FormRevisions FormRevisionAudits FormFieldRevisions
    FormFieldFormulaConfigurations FormulaMigrationRuns FormulaMigrationItems FormulaReconciliationResults`),
  workflows: names(`Alerts AlertUsers AlertRoles Approvals ApprovalStages ApprovalDelegations Configurations`),
  warehouses: names(`Warehouses WarehouseLocations WarehouseLocationNames WarehouseLocationRacks
    WarehouseLocationShelves WarehouseArrivalLocations`),
  collections: names(`UnitOfMeasures Countries Currencies ExchangeRates TermsOfPayments DeliveryModes
    Charges ShipmentDiscrepancyTypes Items ItemCategories Vendors VendorItems Customers CustomerContacts
    CustomerPricingAgreements Services ServiceProviders ServiceServiceProvider ServiceCharge`),
  researchSetup: names(`RndAnalyticalMethods RndFormulations RndFormulationApprovals RndFormulationItems
    RndFormulationItemSubstitutes RndStabilityChambers`),
} satisfies Record<string, string[]>;

export const retainedTables = Object.values(retainedGroups).flat();

// Templates/procedures use versioned dependent rows; their complete definitions and audit history stay.
export const retainedPrefixes = ["Template", "Procedure"];

export const selectiveTables = names(`Attachments ApprovalActionLogs QcApprovals
  Responses FormResponses ResponseApprovals ResponseFormulaSnapshots FormulaExecutions
  ResponseFormulaSubmissionSets ResponseFormulaSubmissionExecutions RndProjects RndProjectApprovals`);

export const clearedGroups = {
  inventory: names(`AllocateProductQuantity BatchItem BinCardInformation DamagedStocks DistributeMaterials
    DistributedFinishedProducts DistributedRequisitionItem DistributedRequisitionMaterials
    FinishedProductBatchEvents FinishedProductBatchMovements FinishedProducts Grns HoldingMaterialTransferBatches
    HoldingMaterialTransfers InventoryLedgers IssueItemStockRequisitions ItemGrns ItemInventoryTransactions
    ItemStockRequisitionItems ItemStockRequisitions ItemTransactionLogs MassMaterialBatchMovements
    MaterialBatchEvents MaterialBatchReservedQuantities MaterialBatches MaterialItemDistributions
    MaterialRejects MaterialRetestEvents MaterialRetestRequests MaterialReturnNoteFullReturns
    MaterialReturnNotePartialReturns MaterialReturnNotes ProductBinCardInformation RecoverableItemReports
    ShelfMaterialBatches Srs StockAdjustmentApprovals StockAdjustmentLines StockAdjustments StockDiscrepancies
    StockDiscrepancyApprovals StockEntries StockMigrationLines StockMigrationWriteOffs StockMigrations
    StockTransfers StockTransferSources SwapRequests
    SwapRequests_FirstSwapShelfMaterialBatches SwapRequests_SecondSwapShelfMaterialBatches`),
  production: names(`AllocateProductionOrderApprovals AllocateProductionOrderProduct AllocateProductionOrders
    BatchManufacturingRecords BatchPackagingRecords FinalPackingMaterials FinalPackings FinishedGoodsTransferNoteApprovals
    FinishedGoodsTransferNoteQuantity FinishedGoodsTransferNotes MasterProductionSchedule ProductionActivities
    ProductionActivityLogs ProductionActivityStepResources ProductionActivityStepUsers ProductionActivityStepWorkCenters
    ProductionActivitySteps ProductionExtraPackingApprovals ProductionExtraPackings ProductionOrderApprovals
    ProductionOrderProductQuantity ProductionOrderProducts ProductionOrderWaybills ProductionOrders
    ProductionScheduleItems ProductionScheduleProducts ProductionSchedules ProductionSteps WorkOrders`),
  procurement: names(`BillingSheetApprovals BillingSheetCharges BillingSheets Checklists CustomerQuotationApprovals
    CustomerQuotationItems CustomerQuotations InventoryPurchaseRequisitionItems InventoryPurchaseRequisitions
    InvoiceAmounts Invoices ItemBillingSheetCharges ItemBillingSheets ItemShipmentDocuments ItemShipmentInvoiceItems
    ItemShipmentInvoices MarketRequisitionVendors MarketRequisitions MemoItems Memos PaymentApprovals Payments
    ProformaInvoiceApprovals ProformaInvoiceProducts ProformaInvoices PurchaseOrderApprovals PurchaseOrderCharge
    PurchaseOrderInvoices PurchaseOrderItems PurchaseOrders RequisitionApprovals RequisitionItems Requisitions
    RevisedPurchaseOrder RevisedPurchaseOrderItem ServiceMemoApprovals ServiceMemos ServiceProformaInvoiceItems
    ServiceProformaInvoices ServiceQuotations ShipmentDiscrepancies ShipmentDiscrepancyApprovals ShipmentDiscrepancyItem
    ShipmentDocumentApprovals ShipmentDocuments ShipmentInvoiceItems ShipmentInvoices ShipmentShortageReceipts
    SourceInventoryRequisitionItem SourceInventoryRequisitions SourceRequisitionItems SourceRequisitions
    SupplierPerformanceRecords SupplierQuotationItems SupplierQuotations VendorQuotationItems VendorQuotations
    JobActivities JobExecutions JobOrderExecutions JobOrderServiceProviders JobOrders JobRequestApprovals JobRequests
    ConsumedItems QuotationItems`),
  testing: names(`AnalyticalTestRequestAssignees AnalyticalTestRequests AuditChecklistResponses AuditCorrectiveActions
    AuditFindings CommercialCertificates FormAssignees FormFieldAssignees MaterialSamplings OosInvestigations
    PreSampleChecklists ProductSamplings QcCoaRows QcCoas QcOosCases QcTestRequestSubjects QcTestRequests
    QcWaterQualityPeriods QcWaterUseRecords QcWorksheetFieldValues QcWorksheetInstanceCorrectionReturns
    QcWorksheetInstanceReassignments QcWorksheetInstances QualityAuditTeamMembers QualityAudits ResponseReworkTasks
    RoutineAuditEvents RoutineCertificates RoutineExecutions RoutineSamples RoutineTracks UniformityOfWeightResponses
    WaterQualityPeriods WaterUseRecords`),
  hr: names(`AttendanceRecords EmployeeInvitations GoalRatings Goals HrPayrollRuns LeaveRequestApprovals LeaveRequests
    OvertimeRequestApprovals OvertimeRequests PayrollRunApprovals PayslipLineItems Payslips PerformanceCycles
    PerformanceReviewApprovals PerformanceReviews ShiftAssignments StaffRequisitionApprovals StaffRequisitions`),
  researchTransactions: names(`RndStabilityPullPoints RndStabilityStudies
    RndTechnologyTransferApprovals RndTechnologyTransfers RndTrialBatches`),
  runtime: names(`AlertDispatchRequests ErrorLogs NotificationDeliveries NotificationReads Notifications PasswordResets
    RefreshTokens ReportHistoryCoverage ReportHistoryVersions TicketActivities Tickets`),
} satisfies Record<string, string[]>;

export const clearedTables = Object.values(clearedGroups).flat();
