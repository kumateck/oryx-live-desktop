# Server enforcement by controller (generated)

Counts of backend actions by how the server checks permission today. **Unprotected writes** are POST/PUT/PATCH/DELETE actions that need only sign-in (or nothing).

| Controller | Actions | Policy attribute | Service check | Controller check | Report filter | Sign-in only | Anonymous | Unprotected writes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ReportController | 106 |  | 2 |  |  | 104 |  |  |
| ProductionScheduleController | 82 | 2 |  |  |  | 80 |  | 29 |
| ProcurementController | 79 | 6 |  |  |  | 73 |  | 42 |
| MaterialController | 57 | 4 |  |  |  | 52 | 1 | 20 |
| WarehouseController | 52 |  |  |  |  | 52 |  | 21 |
| FormController | 43 | 2 |  | 1 |  | 40 |  | 22 |
| ItemController | 34 |  |  |  |  | 34 |  | 20 |
| ProductController | 35 | 1 |  |  |  | 34 |  | 20 |
| InventoryProcurementController | 27 |  |  |  |  | 27 |  | 15 |
| ProductionOrderController | 26 |  |  |  |  | 26 |  | 16 |
| RequisitionController | 25 | 1 | 4 |  |  | 20 |  | 9 |
| MaterialAnalyticalRawDataController | 16 |  |  |  |  | 16 |  | 8 |
| QualityAuditController | 14 |  |  |  |  | 14 |  | 10 |
| CollectionController | 13 |  |  |  |  | 13 |  | 9 |
| EmployeeController | 16 | 3 |  | 1 |  | 12 |  | 7 |
| JobOrderController | 12 |  |  |  |  | 12 |  | 9 |
| RoutineQcController | 12 |  |  |  |  | 12 |  | 6 |
| UserController | 14 | 2 |  |  |  | 8 | 4 | 8 |
| AnalyticalTestRequestController | 11 |  |  |  |  | 11 |  | 8 |
| ApprovalController | 16 | 1 |  | 4 |  | 11 |  | 5 |
| ConfigurationController | 11 |  |  |  |  | 11 |  | 5 |
| JobExecutionController | 10 |  |  |  |  | 10 |  | 8 |
| JobRequestController | 10 |  |  |  |  | 10 |  | 6 |
| MaterialSpecificationController | 10 |  |  |  |  | 10 |  | 5 |
| ProductStandardTestProcedureController | 10 |  |  |  |  | 10 |  | 4 |
| MaterialStandardTestProcedureController | 9 |  |  |  |  | 9 |  | 4 |
| ProductSpecificationController | 9 |  |  |  |  | 9 |  | 4 |
| LeaveRequestController | 8 |  |  |  |  | 8 |  | 6 |
| ProductAnalyticalRawDataController | 8 |  |  |  |  | 8 |  | 4 |
| AuthController | 7 |  |  |  |  | 3 | 4 | 7 |
| ItemStockRequisitionController | 7 |  |  |  |  | 7 |  | 5 |
| DesignationController | 6 |  |  |  |  | 6 |  | 3 |
| FileController | 6 |  |  |  |  | 2 | 4 | 4 |
| PermissionController | 6 |  |  |  |  | 6 |  | 1 |
| ServiceMemoController | 6 |  |  |  |  | 6 |  | 4 |
| ServiceProviderController | 6 |  |  |  |  | 6 |  | 3 |
| ServiceQuotationController | 6 |  |  |  |  | 6 |  | 4 |
| VendorController | 6 |  |  |  |  | 6 |  | 3 |
| BoMController | 5 |  |  |  |  | 5 |  | 3 |
| CustomerController | 24 | 19 |  |  |  | 5 |  | 3 |
| DamagedStocksController | 5 |  |  |  |  | 5 |  | 3 |
| DeparmtentController | 5 |  |  |  |  | 5 |  | 3 |
| HolidayController | 5 |  |  |  |  | 5 |  | 3 |
| ItemGrnController | 5 |  |  |  |  | 5 |  | 3 |
| LeaveEntitlementController | 5 |  |  |  |  | 5 |  | 3 |
| LeaveTypeController | 5 |  |  |  |  | 5 |  | 3 |
| MaterialSamplingController | 5 |  |  |  |  | 5 |  | 3 |
| OvertimeRequestController | 5 |  |  |  |  | 5 |  | 3 |
| ServiceController | 5 |  |  |  |  | 5 |  | 3 |
| ServiceProformaInvoiceController | 5 |  |  |  |  | 5 |  | 3 |
| StaffRequisitionController | 5 |  |  |  |  | 5 |  | 3 |
| WaterQualityController | 5 |  |  |  |  | 5 |  | 3 |
| WorkOrderController | 5 |  |  |  |  | 5 |  | 3 |
| AttendanceRecordController | 4 |  |  |  |  | 4 |  | 1 |
| CommercialCertificateController | 4 |  |  |  |  | 4 |  | 3 |
| OnboardingController | 3 |  |  |  |  | 3 |  | 3 |
| ProductSamplingController | 3 |  |  |  |  | 3 |  | 2 |
| StockAdjustmentController | 3 |  |  |  |  | 3 |  | 1 |
| TicketController | 10 | 3 | 4 |  |  | 3 |  | 3 |
| AlertController | 9 | 7 |  |  |  | 2 |  | 1 |
| CompanyWorkingDaysController | 2 |  |  |  |  | 2 |  | 1 |
| MicrobialRequirementController | 2 |  |  |  |  | 2 |  | 1 |
| RecoverableItemsReportController | 2 |  |  |  |  | 2 |  | 1 |
| StpDocumentController | 11 |  | 9 |  |  |  | 2 | 1 |
| ActivityLogController | 1 |  |  |  |  | 1 |  |  |
| CountryController | 1 |  |  |  |  | 1 |  |  |
| ItemInventoryTransactionController | 1 |  |  |  |  | 1 |  |  |
| MaterialPurchaseUnitsController | 1 |  |  |  |  | 1 |  |  |
| QcWorksheetApprovalController | 2 | 1 |  |  |  | 1 |  |  |
| RoleController | 7 | 6 |  |  |  | 1 |  | 1 |
| SupplierController | 24 | 23 |  |  |  | 1 |  |  |
| VerificationController | 1 |  |  |  |  | 1 |  | 1 |
| CostingController | 5 | 5 |  |  |  |  |  |  |
| ErrorLogController | 3 | 3 |  |  |  |  |  |  |
| FormRevisionController | 6 | 6 |  |  |  |  |  |  |
| FormulaDefinitionController | 11 | 11 |  |  |  |  |  |  |
| FormulaQuestionController | 2 | 2 |  |  |  |  |  |  |
| FormulaRepairController | 5 | 1 | 4 |  |  |  |  |  |
| FormulaRuntimeController | 4 | 4 |  |  |  |  |  |  |
| InstrumentController | 4 | 4 |  |  |  |  |  |  |
| IssuedMaterialRepairController | 2 | 2 |  |  |  |  |  |  |
| MaterialRetestController | 10 | 10 |  |  |  |  |  |  |
| OosInvestigationController | 6 | 6 |  |  |  |  |  |  |
| PaymentController | 12 | 12 |  |  |  |  |  |  |
| PayrollController | 33 | 33 |  |  |  |  |  |  |
| PendingApprovalDocumentCountsController | 1 |  |  | 1 |  |  |  |  |
| PendingRevisionApprovalController | 1 |  |  | 1 |  |  |  |  |
| PerformanceController | 15 | 13 |  | 2 |  |  |  |  |
| ProcedureController | 11 | 11 |  |  |  |  |  |  |
| QcAiExtractionSettingsController | 3 | 3 |  |  |  |  |  |  |
| QcCoaController | 4 | 4 |  |  |  |  |  |  |
| QcEquipmentController | 7 | 7 |  |  |  |  |  |  |
| QcMonitoringProgramController | 12 | 12 |  |  |  |  |  |  |
| QcOosCaseController | 7 | 7 |  |  |  |  |  |  |
| QcResponseReworkController | 4 | 4 |  |  |  |  |  |  |
| QcSamplingPointGroupController | 5 | 5 |  |  |  |  |  |  |
| QcSpecificationController | 11 | 11 |  |  |  |  |  |  |
| QcSpecificationProposalController | 6 | 6 |  |  |  |  |  |  |
| QcStandardTestProcedureController | 11 | 11 |  |  |  |  |  |  |
| QcTestRequestController | 5 | 3 |  | 2 |  |  |  |  |
| QcWaterQualityController | 5 | 5 |  |  |  |  |  |  |
| QcWorksheetFilesController | 2 |  |  | 2 |  |  |  |  |
| QcWorksheetInstanceController | 10 | 6 |  | 4 |  |  |  |  |
| QcWorksheetTemplateController | 11 | 11 |  |  |  |  |  |  |
| ReportHistoryController | 2 |  |  | 1 | 1 |  |  |  |
| RndAnalyticalMethodController | 6 | 6 |  |  |  |  |  |  |
| RndDevelopmentReportController | 1 | 1 |  |  |  |  |  |  |
| RndFormulationController | 6 | 6 |  |  |  |  |  |  |
| RndFormulationReviewController | 2 | 2 |  |  |  |  |  |  |
| RndProjectController | 6 | 6 |  |  |  |  |  |  |
| RndStabilityStudyController | 7 | 7 |  |  |  |  |  |  |
| RndTechnologyTransferController | 5 | 5 |  |  |  |  |  |  |
| RndTechnologyTransferReviewController | 1 | 1 |  |  |  |  |  |  |
| RndTrialBatchController | 4 | 4 |  |  |  |  |  |  |
| ShiftCategoryController | 5 | 5 |  |  |  |  |  |  |
| ShiftScheduleController | 12 | 12 |  |  |  |  |  |  |
| ShiftTypeController | 5 | 5 |  |  |  |  |  |  |
| StockDiscrepancyController | 4 | 4 |  |  |  |  |  |  |
| StockMigrationController | 13 | 13 |  |  |  |  |  |  |
| TemplateActivityController | 10 | 10 |  |  |  |  |  |  |
| TemplateAdoptionController | 2 | 2 |  |  |  |  |  |  |
| TemplateAreaController | 6 | 6 |  |  |  |  |  |  |
| TemplateFormController | 10 | 10 |  |  |  |  |  |  |
| TemplateQuestionController | 10 | 10 |  |  |  |  |  |  |
| TemplateSectionController | 10 | 10 |  |  |  |  |  |  |
| TemplateSharingController | 6 | 6 |  |  |  |  |  |  |
| TemplateWorkflowController | 11 | 11 |  |  |  |  |  |  |
| WhitePlaceboController | 5 | 5 |  |  |  |  |  |  |
| WorkingHoursPolicyController | 3 | 3 |  |  |  |  |  |  |
| **Total** | **1402** | **449** | **23** | **19** | **1** | **895** | **15** | **429** |
