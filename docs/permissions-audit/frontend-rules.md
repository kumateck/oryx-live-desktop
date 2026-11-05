# Desktop access rules (generated)

Every manifest root, route and query choice rule from `apps/web/src/modules/*/manifest.ts`.

`some` = any-of (OR) rule. `all` with several keys = needs every key. `dept` = backend department type required (0 production).

## about-to-expire-materials

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/about-to-expire-materials` | root | all | `CanViewAboutToExpireMaterials` |  |  |
| `/warehouse/about-to-expire-materials/:id` | route | all | `CanViewAboutToExpireMaterials` |  |  |

## activities

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/production/activities` | root | all | `CanViewPlannedProducts` | 0 |  |

## alerts

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/alert` | root | all | `CanViewAlerts` |  |  |

## analytical-test-requests

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/atr` | root | some | `CanViewAnalyticalTestRequests`, `CanViewAnalyticalTestRequestsForSampling`, `CanViewProductAnalyticalTestRequests`, `CanViewProductAnalyticalTestRequestsForAnalysing` |  | OR of several keys |
| `/atr` | root?type=0 | some | `CanViewAnalyticalTestRequests`, `CanViewAnalyticalTestRequestsForSampling` |  | OR of several keys |
| `/atr` | root?type=1 | some | `CanViewProductAnalyticalTestRequests`, `CanViewProductAnalyticalTestRequestsForAnalysing` |  | OR of several keys |
| `/atr` | root?type=2 | some | `CanViewProductAnalyticalTestRequests`, `CanViewProductAnalyticalTestRequestsForAnalysing` |  | OR of several keys |
| `/atr` | root?type=6 | some | `CanViewProductAnalyticalTestRequests`, `CanViewProductAnalyticalTestRequestsForAnalysing` |  | OR of several keys |
| `/atr` | root?type=3 | some | `CanViewProductAnalyticalTestRequests`, `CanViewProductAnalyticalTestRequestsForAnalysing` |  | OR of several keys |
| `/atr` | root?type=4 | some | `CanViewProductAnalyticalTestRequests`, `CanViewProductAnalyticalTestRequestsForAnalysing` |  | OR of several keys |
| `/atr` | root?type=5 | some | `CanViewProductAnalyticalTestRequests`, `CanViewProductAnalyticalTestRequestsForAnalysing` |  | OR of several keys |
| `/atr/:id` | route | all | `CanCheckProductTest` |  |  |
| `/atr/:id/assign` | route | all | `CanAssignProductTest` |  |  |
| `/atr/:id/reassign` | route | all | `CanReassignProductTest` |  |  |
| `/atr/:id/test` | route | all | `CanStartProductTest` |  |  |

## approval-rights-transfer

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qa/approval-rights-transfer` | root | all | `CanTransferApprovalRights` |  |  |

## approval-settings

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/approvals` | root | all | `CanViewApprovals` |  |  |
| `/settings/approvals/create` | route | all | `CanCreateNewApproval` |  |  |
| `/settings/approvals/edit/:id` | route | all | `CanEditApprovalWorkflow` |  |  |

## approved-materials

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/approved-materials` | root | some | `CanViewApprovedRawMaterials`, `CanViewApprovedPackagingMaterials` |  | OR of several keys |
| `/warehouse/approved-materials` | root?type=0 | all | `CanViewApprovedRawMaterials` |  |  |
| `/warehouse/approved-materials` | root?type=1 | all | `CanViewApprovedPackagingMaterials` |  |  |

## approved-products

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/approved-products` | root | all | `CanViewApprovedProducts` |  |  |

## attendance

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/attendance-report-summary` | root | all | `CanViewAttendanceReportUpload` |  |  |

## attendance-upload

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/attendance-report-upload` | root | all | `CanViewAttendanceReportUpload` |  |  |

## audit-trail

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/access-management/audit-trail` | root | all | `CanViewAuditTrail` |  |  |

## available-stock

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/stock/available` | root | some | `CanViewRawMaterialStock`, `CanViewPackingMaterialStock` |  | OR of several keys |

## billing-sheets

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/logistics/billing-sheets` | root | all | `CanViewBillingSheet` |  |  |
| `/logistics/billing-sheets/create` | route | all | `CanCreateBillingSheet` |  |  |
| `/logistics/billing-sheets/:id/edit` | route | all | `CanEditBillingSheet` |  |  |

## change-password

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/change-password` | root | all | `CanViewChangePassword` |  |  |

## code-settings

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/code-settings` | root | all | `CanViewCodeSettings` |  |  |

## collection-configurations

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/config` | root | some | `CanViewProductCategories`, `CanViewRawCategories`, `CanViewPackageCategories`, `CanViewItemCategory`, `CanViewEquipmentCategory`, `CanViewResources`, `CanViewOperations`, `CanViewWorkCenters`, `CanViewSite`, `CanViewMaterialTypes`, `CanViewUnitOfMeasure`, `CanViewPackageStyle`, `CanViewProductState`, `CanViewCountries`, `CanViewShiftCategories`, `CanViewPaymentTerms`, `CanViewDeliveryModes`, `CanViewCharges` |  | OR of several keys |

## commercial-certificates

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/commercial-certificates` | root | some | `CanViewQcCertificate`, `CanCheckRawMaterialTestResult`, `CanCheckPackagingMaterialTestResult`, `CanCheckProductTest` |  | OR of several keys |
| `/qc/commercial-certificates/:id` | route | some | `CanViewQcCertificate`, `CanCheckRawMaterialTestResult`, `CanCheckPackagingMaterialTestResult`, `CanCheckProductTest` |  | OR of several keys |

## compensation

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/employee-compensation` | root | all | `CanViewCompensation` |  |  |

## contractors

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/services-providers` | root | all | `CanViewContractors` |  |  |

## costing

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/finance/costing` | root | all | `ManageCosting` |  |  |
| `/finance/costing/agreements` | route | all | `ManageCosting` |  |  |
| `/finance/costing/agreements/:id` | route | all | `ManageCosting` |  |  |

## crm-job-requests

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/crm/jobs/job-request` | root | all | `CanViewJobRequests` |  |  |

## customer-quotations

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/crm/quotations` | root | all | `ViewCustomerQuotations` |  |  |

## customers

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/crm/customers` | root | some | `CanViewCustomers`, `ViewCustomerCreditStatus`, `ViewCustomerQuotations` |  | OR of several keys |
| `/crm/customers/:id` | route | all | `CanViewCustomers` |  |  |
| `/crm/customers/:id/quotations/create` | route | all | `CreateCustomerQuotation` |  |  |

## damage-missing

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/damage-missing-items` | root | some | `CanViewItStoreDamageMissingItems`, `CanViewGeneralStoreDamageMissingItems`, `CanViewEquipmentStoreDamageMissingItems`, `CanViewReagentStoreDamageMissingItems` |  | OR of several keys |
| `/extrals/damage-missing-items` | root?storeType=1 | some | `CanViewGeneralStoreDamageMissingItems` |  |  |
| `/extrals/damage-missing-items` | root?storeType=0 | some | `CanViewItStoreDamageMissingItems` |  |  |
| `/extrals/damage-missing-items` | root?storeType=2 | some | `CanViewEquipmentStoreDamageMissingItems` |  |  |
| `/extrals/damage-missing-items` | root?storeType=3 | some | `CanViewReagentStoreDamageMissingItems` |  |  |

## department-employees

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/department-employee-export` | root | all | `CanViewDepartmentEmployee` |  |  |

## departments

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/departments` | root | all | `CanViewDepartments` |  |  |

## designations

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/designation-management` | root | all | `CanViewDesignation` |  |  |

## distributed-area

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/distributed-area` | root | some | `CanViewDistributedRawMaterials`, `CanViewDistributedPackagingMaterials` |  | OR of several keys |
| `/warehouse/distributed-area` | root?type=0 | all | `CanViewDistributedRawMaterials` |  |  |
| `/warehouse/distributed-area` | root?type=1 | all | `CanViewDistributedPackagingMaterials` |  |  |

## employees

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/employee-management` | root | some | `CanViewActiveEmployee`, `CanViewInactiveEmployee`, `CanViewNewEmployee` |  | OR of several keys |
| `/hr/employee-management` | root?status=0 | all | `CanViewActiveEmployee` |  |  |
| `/hr/employee-management` | root?status=1 | all | `CanViewInactiveEmployee` |  |  |
| `/hr/employee-management` | root?status=2 | all | `CanViewNewEmployee` |  |  |
| `/hr/employee-management/create/:type` | route | all | `CanRegisterEmployee` |  |  |
| `/hr/employee-management/:id/edit/:type` | route | all | `CanUpdateEmployeeInfo` |  |  |
| `/hr/employee-management/:id/details` | route | all | `CanViewEmployeeDetails` |  |  |

## equipment

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/equipments` | root | all | `CanViewEquipment` |  |  |

## expired-materials

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/expired-materials` | root | all | `CanViewExpiredMaterials` |  |  |
| `/warehouse/expired-materials/:id` | route | all | `CanViewExpiredMaterials` |  |  |

## extra-material-issue

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/extra-material` | root | some | `CanIssueRawMaterialRequisitions`, `CanIssuePackagingMaterialRequisitions` |  | OR of several keys |

## fg-allocations

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/crm/allocations` | root | some | `CanViewPackingList`, `CanViewInvoice` |  | OR of several keys |

## fg-invoices

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/crm/invoices` | root | some | `CanViewInvoice`, `CanViewWaybillForFgw` |  | OR of several keys |

## fg-products

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/fg-products` | root | all | `CanViewApprovedProducts` |  |  |

## fg-proforma-invoices

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/crm/proforma-invoice` | root | all | `CanViewProformaInvoice` |  |  |

## fgtn-dashboard

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/fgtn-dashbord` | root | some | `CanViewOrder` |  |  |

## finance

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/finance` | root | some | `CanViewPayments`, `CanApprovePayment`, `CanViewCashflowReports` |  | OR of several keys |
| `/finance/payments` | route | all | `CanViewPayments` |  |  |
| `/finance/payments/:id` | route | all | `CanViewPayments` |  |  |
| `/finance/payment-approvals` | route | all | `CanApprovePayment` |  |  |
| `/finance/payment-approvals/:id` | route | all | `CanApprovePayment` |  |  |
| `/finance/cashflow` | route | all | `CanViewCashflowReports` |  |  |

## finished-goods-notes

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/finished-goods-transfer-notes` | root | all | `CanViewFgtn` |  |  |

## form-templates

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/templates` | root | all | `CanViewTemplate` |  |  |
| `/settings/templates/create` | route | all | `CanViewTemplate`, `CanCreateTemplate` |  | needs several keys |
| `/settings/templates/:id/edit` | route | all | `CanViewTemplate`, `CanEditTemplate` |  | needs several keys |

## formula-approvals

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qa/formula-approvals` | root | all | `CanViewApproveFormulaRevision` |  |  |

## formula-builder

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/formula` | root | all | `CanViewFormulaBuilder` |  |  |

## formula-reviews

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qa/formula-reviews` | root | all | `CanViewReviewFormulaRevision` |  |  |

## general-inventory

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/general-inventory-config` | root | some | `CanViewItemsInItStore`, `CanViewItemsInGeneralStore`, `CanViewItemsInEquipmentStore`, `CanViewItemsInReagentStore` |  | OR of several keys |
| `/extrals/general-inventory-config` | root?storeType=1 | all | `CanViewItemsInGeneralStore` |  |  |
| `/extrals/general-inventory-config` | root?storeType=0 | all | `CanViewItemsInItStore` |  |  |
| `/extrals/general-inventory-config` | root?storeType=2 | all | `CanViewItemsInEquipmentStore` |  |  |
| `/extrals/general-inventory-config` | root?storeType=3 | all | `CanViewItemsInReagentStore` |  |  |
| `/extrals/general-inventory-config/create` | route | some | `CanViewItemsInItStore`, `CanViewItemsInGeneralStore`, `CanViewItemsInEquipmentStore`, `CanViewItemsInReagentStore` |  | OR of several keys |
| `/extrals/general-inventory-config/create` | route?storeType=1 | all | `CanViewItemsInGeneralStore`, `CanCreateNewItemInGeneralStore` |  | needs several keys |
| `/extrals/general-inventory-config/create` | route?storeType=0 | all | `CanViewItemsInItStore`, `CanCreateNewItemInItStore` |  | needs several keys |
| `/extrals/general-inventory-config/create` | route?storeType=2 | all | `CanViewItemsInEquipmentStore`, `CanCreateNewItemInEquipmentStore` |  | needs several keys |
| `/extrals/general-inventory-config/create` | route?storeType=3 | all | `CanViewItemsInReagentStore`, `CanCreateNewItemInReagentStore` |  | needs several keys |
| `/extrals/general-inventory-config/:id` | route | some | `CanViewItemsInItStore`, `CanViewItemsInGeneralStore`, `CanViewItemsInEquipmentStore`, `CanViewItemsInReagentStore` |  | OR of several keys |
| `/extrals/general-inventory-config/:id` | route?storeType=1 | all | `CanViewItemsInGeneralStore` |  |  |
| `/extrals/general-inventory-config/:id` | route?storeType=0 | all | `CanViewItemsInItStore` |  |  |
| `/extrals/general-inventory-config/:id` | route?storeType=2 | all | `CanViewItemsInEquipmentStore` |  |  |
| `/extrals/general-inventory-config/:id` | route?storeType=3 | all | `CanViewItemsInReagentStore` |  |  |
| `/extrals/general-inventory-config/:id/edit` | route | some | `CanViewItemsInItStore`, `CanViewItemsInGeneralStore`, `CanViewItemsInEquipmentStore`, `CanViewItemsInReagentStore` |  | OR of several keys |
| `/extrals/general-inventory-config/:id/edit` | route?storeType=1 | all | `CanViewItemsInGeneralStore`, `CanEditItemInGeneralStore` |  | needs several keys |
| `/extrals/general-inventory-config/:id/edit` | route?storeType=0 | all | `CanViewItemsInItStore`, `CanEditItemInItStore` |  | needs several keys |
| `/extrals/general-inventory-config/:id/edit` | route?storeType=2 | all | `CanViewItemsInEquipmentStore`, `CanEditItemInEquipmentStore` |  | needs several keys |
| `/extrals/general-inventory-config/:id/edit` | route?storeType=3 | all | `CanViewItemsInReagentStore`, `CanEditItemInReagentStore` |  | needs several keys |

## holidays

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/holidays` | root | all | `CanViewHolidays` |  |  |

## hr-dashboard

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr-dashboard` | root | some | `CanViewActiveEmployee`, `CanViewCompensation`, `CanViewPayrollConfiguration`, `CanViewPayrollRuns`, `CanViewPayslip`, `CanViewOwnPayslip`, `CanViewPerformanceCycles`, `CanViewOwnGoals`, `CanViewTeamGoals`, `CanViewPerformanceReviews` |  | OR of several keys |

## hr-executive-summary

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr-executive-summary` | root | some | `CanViewActiveEmployee` |  |  |

## hr-reports

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/human-resources-report` | root | all | `CanViewHumanResourcesReport` |  |  |

## inventory-command-center

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/inventory-command-center` | root | some | `CanViewRawMaterialsItems`, `CanViewPackagingMaterialsItems` |  | OR of several keys |

## issue-bmr

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qa/issue-bmr` | root | some | `CanViewIssuedBmrBprs`, `CanIssueBmr` |  | OR of several keys |

## issue-stock

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/issue-stock` | root | some | `CanViewItStoreIssueStocks`, `CanViewGeneralStoreIssueStocks`, `CanViewEquipmentStoreIssueStocks`, `CanViewReagentStoreIssueStocks` |  | OR of several keys |
| `/extrals/issue-stock` | root?storeType=1 | some | `CanViewGeneralStoreIssueStocks` |  |  |
| `/extrals/issue-stock` | root?storeType=0 | some | `CanViewItStoreIssueStocks` |  |  |
| `/extrals/issue-stock` | root?storeType=2 | some | `CanViewEquipmentStoreIssueStocks` |  |  |
| `/extrals/issue-stock` | root?storeType=3 | some | `CanViewReagentStoreIssueStocks` |  |  |
| `/extrals/issue-stock/:id` | route | some | `CanViewItStoreIssueStocks`, `CanViewGeneralStoreIssueStocks`, `CanViewEquipmentStoreIssueStocks`, `CanViewReagentStoreIssueStocks` |  | OR of several keys |

## it-tickets

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/it` | root | authenticated | — |  | sign-in only |
| `/it/my-issues` | route | authenticated | — |  | sign-in only |
| `/it/my-issues/:id/details` | route | authenticated | — |  | sign-in only |
| `/it/support-tickets` | route | some | `CanViewAllTickets`, `CanAssignTicket`, `CanCloseTicket`, `CanCommentOnTicket` |  | OR of several keys |
| `/it/support-tickets/:id/details` | route | some | `CanViewAllTickets`, `CanAssignTicket`, `CanCloseTicket`, `CanCommentOnTicket` |  | OR of several keys |

## job-orders

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/job-orders` | root | all | `CanViewJobOrders` |  |  |

## job-requests

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/job-requests` | root | all | `CanViewJobRequests` |  |  |

## leave-management

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/leave-management` | root | all | `CanViewLeaveRequests` |  |  |
| `/hr/leave-management/create/:category` | route | all | `CanViewLeaveRequests`, `CanCreateLeaveRequest` |  | needs several keys |
| `/hr/leave-management/:id/edit` | route | all | `CanViewLeaveRequests`, `CanEditLeaveRequest` |  | needs several keys |

## leave-types

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/leave-configuration` | root | all | `CanViewLeaveType` |  |  |

## location-chart

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/location-chart` | root | some | `CanViewRawMaterialLocationChartList`, `CanViewPackagingMaterialLocationChartList` |  | OR of several keys |
| `/warehouse/location-chart` | root?type=0 | all | `CanViewRawMaterialLocationChartList` |  |  |
| `/warehouse/location-chart` | root?type=1 | all | `CanViewPackagingMaterialLocationChartList` |  |  |

## locations

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/locations` | root | all | `CanViewLocations` |  |  |

## logistics-dashboard

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/logistics-dashboard` | root | some | `CanViewShipmentInvoice`, `CanViewWaybill` |  | OR of several keys |

## manufacturers

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/manufacturers` | root | all | `CanViewManufacturers` |  |  |
| `/settings/manufacturers/create` | route | all | `CanCreateManufacturer` |  |  |
| `/settings/manufacturers/:id/edit` | route | all | `CanUpdateManufacturerDetails` |  |  |

## material-ards

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/analytical-raw-data` | root | some | `CanViewRawMaterialArds`, `CanViewPackagingMaterialArds` |  | OR of several keys |
| `/qc/analytical-raw-data` | root?type=0 | all | `CanViewRawMaterialArds` |  |  |
| `/qc/analytical-raw-data` | root?type=1 | all | `CanViewPackagingMaterialArds` |  |  |
| `/qc/analytical-raw-data/:id` | route | some | `CanViewRawMaterialArds`, `CanViewPackagingMaterialArds` |  | OR of several keys |

## material-distribution

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement/material-distribution` | root | all | `CanViewMaterialDistribution` |  |  |

## material-location

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/material-location` | root | some | `CanViewRawMaterialLocationList`, `CanViewPackagingMaterialLocationList` |  | OR of several keys |
| `/warehouse/material-location` | root?type=0 | all | `CanViewRawMaterialLocationList` |  |  |
| `/warehouse/material-location` | root?type=1 | all | `CanViewPackagingMaterialLocationList` |  |  |

## material-retests

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/material-retests` | root | all | `CanViewMaterialRetests` |  |  |
| `/qc/material-retests/:id/test-request` | route | all | `CanViewMaterialRetestDetail`, `CanLinkMaterialRetestTestRequest`, `CanCreateUnscheduledQcTestRequest`, `CanViewQcSpecifications` |  | needs several keys |
| `/qc/material-retests/:id/testing` | route | all | `CanViewMaterialRetestDetail`, `CanViewQcTestRequests` |  | needs several keys |
| `/qc/material-retests/:id/certificate` | route | all | `CanViewMaterialRetestDetail`, `CanViewQcCertificate` |  | needs several keys |
| `/qc/material-retests/:id` | route | all | `CanViewMaterialRetestDetail` |  |  |

## material-returns

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/material-returns` | root | all | `CanViewMaterialsReturnNote` |  |  |

## material-specifications

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/material-specification` | root | some | `CanViewRawMaterialSpecifications`, `CanViewPackagingMaterialSpecifications` |  | OR of several keys |
| `/qc/material-specification` | root?type=0 | all | `CanViewRawMaterialSpecifications` |  |  |
| `/qc/material-specification` | root?type=1 | all | `CanViewPackagingMaterialSpecifications` |  |  |
| `/qc/material-specification/create` | route | some | `CanCreateRawMaterialSpecification`, `CanCreatePackagingMaterialSpecification` |  | OR of several keys |
| `/qc/material-specification/:id/details` | route | some | `CanViewRawMaterialSpecifications`, `CanViewPackagingMaterialSpecifications` |  | OR of several keys |
| `/qc/material-specification/:id/edit` | route | some | `CanEditRawMaterialSpecification`, `CanEditPackagingMaterialSpecification` |  | OR of several keys |
| `/qc/material-specification/:id/complete` | route | some | `CanCreateRawMaterialSpecification`, `CanEditRawMaterialSpecification`, `CanCreatePackagingMaterialSpecification`, `CanEditPackagingMaterialSpecification` |  | OR of several keys |

## material-stps

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/material-stp` | root | some | `CanViewRawMaterialStps`, `CanViewPackagingMaterialStps` |  | OR of several keys |
| `/qc/material-stp` | root?type=0 | all | `CanViewRawMaterialStps` |  |  |
| `/qc/material-stp` | root?type=1 | all | `CanViewPackagingMaterialStps` |  |  |
| `/qc/material-stp/:id` | route | some | `CanViewRawMaterialStps`, `CanViewPackagingMaterialStps` |  | OR of several keys |
| `/qc/material-stp/:id/document` | route | some | `CanViewRawMaterialStps`, `CanViewPackagingMaterialStps` |  | OR of several keys |

## materials

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/materials` | root | some | `CanViewRawMaterials`, `CanViewPackagingMaterials` |  | OR of several keys |
| `/warehouse/materials` | root?type=0 | all | `CanViewRawMaterials` |  |  |
| `/warehouse/materials` | root?type=1 | all | `CanViewPackagingMaterials` |  |  |
| `/warehouse/materials/linked` | route | some | `CanViewLinkedRawMaterials`, `CanViewLinkedPackagingMaterials` |  | OR of several keys |
| `/warehouse/materials/linked` | route?type=0 | all | `CanViewLinkedRawMaterials` |  |  |
| `/warehouse/materials/linked` | route?type=1 | all | `CanViewLinkedPackagingMaterials` |  |  |
| `/warehouse/materials/unlink` | route | some | `CanViewUnlinkedRawMaterials`, `CanViewUnlinkedPackagingMaterials` |  | OR of several keys |
| `/warehouse/materials/unlink` | route?type=0 | all | `CanViewUnlinkedRawMaterials` |  |  |
| `/warehouse/materials/unlink` | route?type=1 | all | `CanViewUnlinkedPackagingMaterials` |  |  |

## oos-investigations

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qa/oos-investigations` | root | all | `CanViewOosInvestigations` |  |  |

## overtime

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/overtime-management` | root | all | `CanViewOvertimeManagement` |  |  |
| `/hr/overtime-management/create` | route | all | `CanViewOvertimeManagement`, `CanCreateOvertimeManagement` |  | needs several keys |
| `/hr/overtime-management/:id/edit` | route | all | `CanViewOvertimeManagement`, `CanEditOvertimeManagement` |  | needs several keys |

## payroll-configuration

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/payroll-configuration` | root | all | `CanViewPayrollConfiguration` |  |  |

## payroll-runs

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/payroll-runs` | root | all | `CanViewPayrollRuns` |  |  |
| `/hr/payroll-runs/payslips/:id` | route | all | `CanViewPayslip` |  |  |

## pending-approvals

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qa/pending-approvals` | root | all | `CanViewPendingApprovals` |  |  |

## performance-cycles

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/performance-cycles` | root | all | `CanViewPerformanceCycles` |  |  |

## performance-goals

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/goals` | root | some | `CanViewOwnGoals`, `CanViewTeamGoals` |  | OR of several keys |
| `/hr/goals/reviews/:id` | route | some | `CanSubmitSelfAssessment`, `CanSubmitManagerReview` |  | OR of several keys |

## performance-reviews

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/performance-reviews` | root | all | `CanViewPerformanceReviews` |  |  |

## permissions

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/access-management/permissions` | root | all | `CanViewPermissions` |  |  |

## price-comparison

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement/price-comparison` | root | some | `CanViewForeignVendorPricing`, `CanViewLocalVendorPricing` |  | OR of several keys |
| `/procurement/price-comparison` | root?type=0 | all | `CanViewForeignVendorPricing` |  |  |
| `/procurement/price-comparison` | root?type=1 | all | `CanViewLocalVendorPricing` |  |  |

## procurement-dashboard

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement-dashboard` | root | some | `CanViewPurchaseRequisitions` |  |  |

## product-ards

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/product-analytical-raw-data` | root | all | `CanViewProductArds` |  |  |
| `/qc/product-analytical-raw-data/:id` | route | all | `CanViewProductArds` |  |  |

## product-specifications

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/product-specification` | root | all | `CanViewProductSpecifications` |  |  |
| `/qc/product-specification/create` | route | all | `CanCreateProductSpecification` |  |  |
| `/qc/product-specification/:id/details` | route | all | `CanViewProductSpecifications` |  |  |
| `/qc/product-specification/:id/edit` | route | all | `CanEditProductSpecification` |  |  |
| `/qc/product-specification/:id/complete` | route | some | `CanCreateProductSpecification`, `CanEditProductSpecification` |  | OR of several keys |

## product-stps

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/products-stp` | root | all | `CanViewProductStps` |  |  |
| `/qc/products-stp/:id` | route | all | `CanViewProductStps` |  |  |
| `/qc/products-stp/:id/document` | route | all | `CanViewProductStps` |  |  |

## production-health-dashboard

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/production-health-dashboard` | root | some | `CanViewPlannedProducts` |  |  |

## production-orders

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/crm/production-order` | root | all | `CanViewOrder` |  |  |

## production-transfers

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/production/stock-transfer-requests` | root | some | `CanViewIncomingStockTransferRequests`, `CanViewOutgoingStockTransferRequests` |  | OR of several keys |
| `/production/stock-transfer-requests` | root?type=0 | all | `CanViewIncomingStockTransferRequests` |  |  |
| `/production/stock-transfer-requests` | root?type=1 | all | `CanViewOutgoingStockTransferRequests` |  |  |

## products

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/production/products` | root | all | `CanViewPlannedProducts` | 0 |  |
| `/production/products/create` | route | all | `CanCreateNewProductionPlan` | 0 |  |
| `/production/products/:id/edit/:tab` | route | all | `CanEditProductionPlan` | 0 |  |

## proforma-requests

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement/awarded-quotations` | root | some | `CanViewForeignProformaRequest`, `CanViewLocalProformaRequest` |  | OR of several keys |
| `/procurement/awarded-quotations` | root?type=0 | all | `CanViewForeignProformaRequest` |  |  |
| `/procurement/awarded-quotations` | root?type=1 | all | `CanViewLocalProformaRequest` |  |  |

## proforma-responses

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement/profoma-responses` | root | some | `CanViewForeignProformaInvoiceSubmissions`, `CanViewLocalProformaInvoiceSubmissions` |  | OR of several keys |
| `/procurement/profoma-responses` | root?type=0 | all | `CanViewForeignProformaInvoiceSubmissions` |  |  |
| `/procurement/profoma-responses` | root?type=1 | all | `CanViewLocalProformaInvoiceSubmissions` |  |  |

## purchase-order-lists

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement/purchase-order-lists` | root | some | `CanViewForeignPurchaseOrder`, `CanViewLocalPurchaseOrder` |  | OR of several keys |

## purchase-orders

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement/purchase-orders` | root | some | `CanViewForeignPurchaseOrder`, `CanViewLocalPurchaseOrder` |  | OR of several keys |
| `/procurement/purchase-orders` | root?type=0 | all | `CanViewForeignPurchaseOrder` |  |  |
| `/procurement/purchase-orders` | root?type=1 | all | `CanViewLocalPurchaseOrder` |  |  |
| `/procurement/purchase-orders/:id/revise` | route | some | `CanReviseForeignPurchaseOrder`, `CanReviseLocalPurchaseOrder` |  | OR of several keys |
| `/procurement/purchase-orders/approved` | route | some | `CanViewApprovedForeignPurchaseOrder`, `CanViewApprovedLocalPurchaseOrder` |  | OR of several keys |
| `/procurement/purchase-orders/approved` | route?type=0 | all | `CanViewApprovedForeignPurchaseOrder` |  |  |
| `/procurement/purchase-orders/approved` | route?type=1 | all | `CanViewApprovedLocalPurchaseOrder` |  |  |
| `/procurement/purchase-orders/check` | route | some | `CanViewForeignPurchaseOrder`, `CanViewLocalPurchaseOrder` |  | OR of several keys |
| `/procurement/purchase-orders/check` | route?type=0 | all | `CanViewForeignPurchaseOrder` |  |  |
| `/procurement/purchase-orders/check` | route?type=1 | all | `CanViewLocalPurchaseOrder` |  |  |
| `/procurement/purchase-orders/:id` | route | some | `CanViewForeignPurchaseOrder`, `CanViewLocalPurchaseOrder`, `CanViewApprovedForeignPurchaseOrder`, `CanViewApprovedLocalPurchaseOrder` |  | OR of several keys |

## qa-qc-dashboard

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qa-qc-dashboard` | root | some | `CanViewRawMaterialGoodsReceiptNotes`, `CanViewPackagingMaterialGoodsReceiptNotes`, `CanViewAnalyticalTestRequests` |  | OR of several keys |
| `/qa-qc-dashboard/qc` | route | some | `CanViewRawMaterialGoodsReceiptNotes`, `CanViewPackagingMaterialGoodsReceiptNotes` |  | OR of several keys |
| `/qa-qc-dashboard/qa` | route | some | `CanViewAnalyticalTestRequests` |  |  |

## qc-ai-extraction

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/qc/ai-extraction` | root | all | `CanManageAiWorksheetExtractionSettings` |  |  |

## qc-equipment

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/qc-equipments` | root | all | `CanViewQcEquipment` |  |  |

## qc-grn

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/goods-receipt-note` | root | some | `CanViewRawMaterialGoodsReceiptNotes`, `CanViewPackagingMaterialGoodsReceiptNotes` |  | OR of several keys |
| `/qc/goods-receipt-note` | root?type=0 | all | `CanViewRawMaterialGoodsReceiptNotes` |  |  |
| `/qc/goods-receipt-note` | root?type=1 | all | `CanViewPackagingMaterialGoodsReceiptNotes` |  |  |
| `/qc/goods-receipt-note/:id` | route | some | `CanViewRawMaterialGoodsReceiptNotes`, `CanViewPackagingMaterialGoodsReceiptNotes` |  | OR of several keys |
| `/qc/goods-receipt-note/:id/batches/:batchId` | route | some | `CanCheckRawMaterialTestResult`, `CanCheckPackagingMaterialTestResult` |  | OR of several keys |
| `/qc/goods-receipt-note/:id/batches/:batchId/assign` | route | some | `CanStartRawMaterialTest`, `CanStartPackagingMaterialTest` |  | OR of several keys |
| `/qc/goods-receipt-note/:id/batches/:batchId/reassign` | route | some | `CanReassignRawMaterialTest`, `CanReassignPackagingMaterialTest` |  | OR of several keys |
| `/qc/goods-receipt-note/:id/batches/:batchId/test` | route | some | `CanStartRawMaterialTest`, `CanStartPackagingMaterialTest` |  | OR of several keys |

## qc-rework

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/rework-tasks` | root | all | `CanViewResponseReworkTasks` |  |  |
| `/qc/rework-tasks/:id` | route | all | `CanViewResponseReworkTaskDetail` |  |  |
| `/qc/rework-tasks/:id/test` | route | all | `CanViewResponseReworkTaskDetail` |  |  |

## qc-routines

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/qc/routines` | root | all | `CanViewQcRoutineTests` |  | undefined key CanViewQcRoutineTests |
| `/qc/routines/setup` | route | all | `CanViewQcRoutineSetup` |  | undefined key CanViewQcRoutineSetup |
| `/qc/routines/water-quality` | route | all | `CanViewQcRoutineWaterQuality` |  | undefined key CanViewQcRoutineWaterQuality |
| `/qc/routines/:id` | route | all | `CanViewQcRoutineTests` |  | undefined key CanViewQcRoutineTests |
| `/qc/routines/tracks/:id` | route | all | `CanViewQcRoutineTests` |  | undefined key CanViewQcRoutineTests |
| `/qc/routines/certificates/:id` | route | some | `CanViewQcRoutineTests`, `CanViewQcRoutineWaterQuality` |  | OR of several keys; undefined key CanViewQcRoutineTests, CanViewQcRoutineWaterQuality |

## quarantine-area

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/quarantine-area` | root | some | `CanViewQuarantineRawMaterials`, `CanViewQuarantinePackagingMaterials` |  | OR of several keys |

## questions

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/questions` | root | all | `CanViewQuestions` |  |  |
| `/settings/questions/formula/:id/repair` | route | all | `CanViewQuestions` + any of `CanRepairQuestionFormula`, `CanRepairTestFormula` |  | extra OR group |
| `/settings/questions/table/create` | route | all | `CanViewQuestions`, `CanCreateQuestions` |  | needs several keys |
| `/settings/questions/table/:id/edit` | route | all | `CanViewQuestions`, `CanEditQuestions` |  | needs several keys |
| `/settings/questions/formula/create` | route | all | `CanViewQuestions`, `CanCreateQuestions` |  | needs several keys |
| `/settings/questions/formula/:id/edit` | route | all | `CanViewQuestions`, `CanEditQuestions` |  | needs several keys |

## quotation-requests

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement/quotations` | root | some | `CanViewForeignQuotation`, `CanViewLocalQuotation` |  | OR of several keys |
| `/procurement/quotations` | root?type=0 | all | `CanViewForeignQuotation` |  |  |
| `/procurement/quotations` | root?type=1 | all | `CanViewLocalQuotation` |  |  |

## quotation-responses

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement/sales-quotation` | root | some | `CanViewForeignQuotationResponse`, `CanViewLocalQuotationResponse` |  | OR of several keys |
| `/procurement/sales-quotation` | root?type=0 | all | `CanViewForeignQuotationResponse` |  |  |
| `/procurement/sales-quotation` | root?type=1 | all | `CanViewLocalQuotationResponse` |  |  |

## racks

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/racks` | root | all | `CanViewRacks` |  |  |

## receiving-area

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/receiving-area` | root | some | `CanViewRawMaterialsItems`, `CanViewPackagingMaterialsItems` |  | OR of several keys |
| `/warehouse/receiving-area/:id/create-checklist` | route | some | `CanCreateChecklistForRawMaterials`, `CanCreateChecklistForPackagingMaterials` |  | OR of several keys |

## rejected-area

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/rejected-area` | root | some | `CanViewRejectedRawMaterials`, `CanViewRejectedPackagingMaterials` |  | OR of several keys |

## reports

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/reports` | root | some | `CanViewWarehouseReport`, `CanViewProcurementReport`, `CanViewFgtnReport`, `CanViewStoreAndInventoryReport`, `CanViewHumanResourcesReport`, `CanViewQcAndQaReport` |  | OR of several keys |
| `/reports/warehouse-report` | route | all | `CanViewWarehouseReport` |  |  |
| `/reports/procurement-report` | route | all | `CanViewProcurementReport` |  |  |
| `/reports/procument-reports` | route | all | `CanViewProcurementReport` |  |  |
| `/reports/finish-goods-transfernote-report` | route | all | `CanViewFgtnReport` |  |  |
| `/reports/store-inventory-report` | route | all | `CanViewStoreAndInventoryReport` |  |  |
| `/reports/human-resources-report` | route | all | `CanViewHumanResourcesReport` |  |  |
| `/reports/human-resources-report/:report` | route | all | `CanViewHumanResourcesReport` |  |  |
| `/reports/qc-qa-reports` | route | all | `CanViewQcAndQaReport` |  |  |
| `/reports/qc-qa-reports/:report` | route | all | `CanViewQcAndQaReport` |  |  |

## requisitions

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/production/requisition` | root | some | `CanViewRawMaterialRequisitions`, `CanViewPackagingMaterialRequisitions`, `CanViewRawMaterialRequisitionsForCreation`, `CanViewPackageMaterialRequisitionsForCreation` |  | OR of several keys |
| `/production/requisition/create` | route | some | `CanViewRawMaterialRequisitionsForCreation`, `CanViewPackageMaterialRequisitionsForCreation` |  | OR of several keys |
| `/production/requisition/create` | route?type=0 | all | `CanViewRawMaterialRequisitionsForCreation` |  |  |
| `/production/requisition/create` | route?type=1 | all | `CanViewPackageMaterialRequisitionsForCreation` |  |  |
| `/production/requisition/general` | route | some | `CanViewRawMaterialRequisitions`, `CanViewPackagingMaterialRequisitions` |  | OR of several keys |
| `/production/requisition/:id/details` | route | some | `CanViewRawMaterialRequisitions`, `CanViewPackagingMaterialRequisitions` |  | OR of several keys |

## return-items

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/return-items` | root | some | `CanViewItStoreReturnItems`, `CanViewGeneralStoreReturnItems`, `CanViewEquipmentStoreReturnItems`, `CanViewReagentStoreReturnItems` |  | OR of several keys |
| `/extrals/return-items` | root?storeType=1 | some | `CanViewGeneralStoreReturnItems` |  |  |
| `/extrals/return-items` | root?storeType=0 | some | `CanViewItStoreReturnItems` |  |  |
| `/extrals/return-items` | root?storeType=2 | some | `CanViewEquipmentStoreReturnItems` |  |  |
| `/extrals/return-items` | root?storeType=3 | some | `CanViewReagentStoreReturnItems` |  |  |

## roles

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/access-management/roles` | root | all | `CanViewRoles` |  |  |
| `/access-management/roles/create` | route | all | `CanCreateRole` |  |  |
| `/access-management/roles/:id` | route | all | `CanViewRoles` |  |  |

## schedules

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/production/schedules` | root | all | `CanViewProductSchedules` | 0 |  |
| `/production/schedules/create` | route | all | `CanCreateProductSchedule` | 0 |  |
| `/production/schedules/:id/products/add` | route | all | `CanAddProductsToProductSchedule` | 0 |  |
| `/production/schedules/:id/products/remove` | route | all | `CanRemoveProductsFromProductSchedule` | 0 |  |
| `/production/schedules/:id/edit` | route | all | `CanEditProductSchedule` | 0 |  |

## service-comparison

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/service-price-comparison` | root | some | `CanViewServicesPricingSelection` |  |  |

## service-memos

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/service-memo` | root | some | `CanViewServicesMemo` |  |  |
| `/extrals/service-memo/:id` | route | some | `CanViewServicesMemo` |  |  |

## service-procurement

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/service-quotation-response` | root | some | `CanViewServicesQuotationResponses` |  |  |

## service-proformas

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/service-proforma-request` | root | some | `CanViewServicesProformaRequests`, `CanViewServicesProformaResponses`, `CanViewServicesPurchaseOrders` |  | OR of several keys |

## services-dashboard

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/services-dashboard` | root | some | `CanViewServices`, `CanViewContractors`, `CanViewJobRequests`, `CanViewJobOrders`, `CanViewServicesQuotationResponses`, `CanViewServicesPricingSelection`, `CanViewServicesProformaRequests`, `CanViewServicesProformaResponses`, `CanViewServicesMemo`, `CanViewServicesPurchaseOrders` |  | OR of several keys |

## settings-home

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings` | root | authenticated | — |  | sign-in only |
| `/settings/account` | route | authenticated | — |  | sign-in only |
| `/settings/appearance` | route | authenticated | — |  | sign-in only |

## shelves

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/shelves` | root | all | `CanViewShelves` |  |  |

## shift-categories

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/shift-categories` | root | all | `CanViewShiftCategories` |  |  |

## shift-planning

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/plan-shift` | root | all | `CanViewShiftSchedule` |  |  |

## shift-schedules

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/shift-schedule` | root | all | `CanViewShiftSchedule` |  |  |

## shift-types

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/shift-types` | root | all | `CanViewShiftTypes` |  |  |

## shift-upload

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/shift-schedule-upload` | root | all | `CanViewShiftScheduleReportUpload` |  |  |

## shipment-discrepancies

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/logistics/shipment-discrepancies` | root | all | `CanViewShipmentDiscrepancy` |  |  |
| `/logistics/shipment-discrepancies/create` | route | all | `CanRecordShipmentDiscrepancy`, `CanViewShipmentDocument` |  | needs several keys |

## shipment-documents

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/logistics/shipment-documents` | root | all | `CanViewShipmentDocument` |  |  |
| `/logistics/shipment-documents/create` | route | all | `CanCreateShipmentDocument` |  |  |

## shipment-invoices

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/logistics/shipment-invoices` | root | all | `CanViewShipmentInvoice` |  |  |
| `/logistics/shipment-invoices/create` | route | all | `CanCreateShipmentInvoice` |  |  |

## signature-settings

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/signature` | root | all | `CanViewSignatureSettings` |  |  |

## sites

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/sites` | root | all | `CanViewSite` |  |  |

## sourcing

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement/requisition` | root | all | `CanViewPurchaseRequisitions` |  |  |

## staff-requisitions

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/hr/staff-requisition` | root | all | `CanViewStaffRequisition` |  |  |
| `/hr/staff-requisition/create` | route | all | `CanViewStaffRequisition`, `CanCreateStaffRequisition` |  | needs several keys |
| `/hr/staff-requisition/:id/edit` | route | all | `CanViewStaffRequisition`, `CanEditStaffRequisition` |  | needs several keys |

## stock-adjustments

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/stock-adjustments` | root | all | `CanViewMaterialStockAdjustment` |  |  |
| `/warehouse/stock-adjustments/new` | route | all | `CanCreateMaterialStockAdjustment` |  |  |

## stock-discrepancies

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/stock-discrepancies` | root | all | `CanViewStockDiscrepancy` |  |  |
| `/warehouse/stock-discrepancies/create` | route | all | `CanRecordStockDiscrepancy` |  |  |

## stock-issue

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/stock-requisition` | root | some | `CanViewRawMaterialRequisitions`, `CanViewPackagingMaterialRequisitions`, `CanIssueRawMaterialRequisitions`, `CanIssuePackagingMaterialRequisitions` |  | OR of several keys |

## stock-requisitions

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/stock-requisitions` | root | some | `CanViewItStoreStockRequisitions`, `CanViewGeneralStoreStockRequisitions`, `CanViewEquipmentStoreStockRequisitions`, `CanViewReagentStoreStockRequisitions` |  | OR of several keys |
| `/extrals/stock-requisitions` | root?storeType=1 | some | `CanViewGeneralStoreStockRequisitions` |  |  |
| `/extrals/stock-requisitions` | root?storeType=0 | some | `CanViewItStoreStockRequisitions` |  |  |
| `/extrals/stock-requisitions` | root?storeType=2 | some | `CanViewEquipmentStoreStockRequisitions` |  |  |
| `/extrals/stock-requisitions` | root?storeType=3 | some | `CanViewReagentStoreStockRequisitions` |  |  |
| `/extrals/stock-requisitions/:id/details` | route | some | `CanViewItStoreStockRequisitions`, `CanViewGeneralStoreStockRequisitions`, `CanViewEquipmentStoreStockRequisitions`, `CanViewReagentStoreStockRequisitions` |  | OR of several keys |

## stock-transfers

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/stock-transfer-requests` | root | some | `CanViewRawMaterialTransferList`, `CanViewPackagingMaterialTransferList`, `CanIssueRawMaterialStockTransfers`, `CanIssuePackagingMaterialStockTransfers` |  | OR of several keys |

## store-procurement

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/procurement` | root | some | `CanViewPurchaseRequisitionsSourcing`, `CanViewQuotationRequestsForTrustedVendors`, `CanViewQuotationResponsesForTrustedVendors`, `CanViewTrustedVendorPricingSelection`, `CanViewOpenMarketPricingSelection`, `CanViewMemoForTrustedVendors`, `CanViewOpenMarketMemo`, `CanViewOpenMarketQuotationSheets`, `CanViewPurchaseOrdersForTrustedVendors`, `CanViewOpenMarketPurchaseOrders` |  | OR of several keys |
| `/extrals/procurement/purchase-requisition-sourcing` | route | all | `CanViewPurchaseRequisitionsSourcing` |  |  |
| `/extrals/procurement/purchase-requisition-sourcing/:id` | route | all | `CanViewPurchaseRequisitionsSourcing` |  |  |
| `/extrals/procurement/vendor-quotations` | route | all | `CanViewQuotationRequestsForTrustedVendors` |  |  |
| `/extrals/procurement/quotation-responses` | route | all | `CanViewQuotationResponsesForTrustedVendors` |  |  |
| `/extrals/procurement/price-comparison` | route | some | `CanViewTrustedVendorPricingSelection`, `CanViewOpenMarketPricingSelection` |  | OR of several keys |
| `/extrals/procurement/memo` | route | some | `CanViewMemoForTrustedVendors`, `CanViewOpenMarketMemo` |  | OR of several keys |
| `/extrals/procurement/memo/:id` | route | some | `CanViewMemoForTrustedVendors`, `CanViewOpenMarketMemo` |  | OR of several keys |
| `/extrals/procurement/open-market-collection` | route | all | `CanViewOpenMarketQuotationSheets` |  |  |
| `/extrals/procurement/open-market-collection/:id` | route | all | `CanViewOpenMarketQuotationSheets` |  |  |
| `/extrals/procurement/purchased-items` | route | some | `CanViewPurchaseOrdersForTrustedVendors`, `CanViewOpenMarketPurchaseOrders` |  | OR of several keys |

## store-purchase-requisitions

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/purchase-requisitions` | root | some | `CanViewItStorePurchaseRequisitions`, `CanViewGeneralStorePurchaseRequisitions`, `CanViewEquipmentStorePurchaseRequisitions`, `CanViewReagentStorePurchaseRequisitions` |  | OR of several keys |
| `/extrals/purchase-requisitions` | root?storeType=1 | some | `CanViewGeneralStorePurchaseRequisitions` |  |  |
| `/extrals/purchase-requisitions` | root?storeType=0 | some | `CanViewItStorePurchaseRequisitions` |  |  |
| `/extrals/purchase-requisitions` | root?storeType=2 | some | `CanViewEquipmentStorePurchaseRequisitions` |  |  |
| `/extrals/purchase-requisitions` | root?storeType=3 | some | `CanViewReagentStorePurchaseRequisitions` |  |  |
| `/extrals/purchase-requisitions/:id/details` | route | some | `CanViewItStorePurchaseRequisitions`, `CanViewGeneralStorePurchaseRequisitions`, `CanViewEquipmentStorePurchaseRequisitions`, `CanViewReagentStorePurchaseRequisitions` |  | OR of several keys |

## store-services

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/services` | root | all | `CanViewServices` |  |  |

## store-stock

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals` | root | authenticated | — |  | sign-in only |
| `/extrals/available-stocks` | route | some | `CanViewItStoreAvailableStocks`, `CanViewGeneralStoreAvailableStocks`, `CanViewEquipmentStoreAvailableStocks`, `CanViewReagentStoreAvailableStocks` |  | OR of several keys |
| `/extrals/available-stocks` | route?storeType=1 | all | `CanViewGeneralStoreAvailableStocks` |  |  |
| `/extrals/available-stocks` | route?storeType=0 | all | `CanViewItStoreAvailableStocks` |  |  |
| `/extrals/available-stocks` | route?storeType=2 | all | `CanViewEquipmentStoreAvailableStocks` |  |  |
| `/extrals/available-stocks` | route?storeType=3 | all | `CanViewReagentStoreAvailableStocks` |  |  |
| `/extrals/available-stocks/:code/item-transactions` | route | some | `CanViewItStoreAvailableStocks`, `CanViewGeneralStoreAvailableStocks`, `CanViewEquipmentStoreAvailableStocks`, `CanViewReagentStoreAvailableStocks` |  | OR of several keys |
| `/extrals/available-stocks/:code/item-transactions` | route?storeType=1 | all | `CanViewGeneralStoreAvailableStocks` |  |  |
| `/extrals/available-stocks/:code/item-transactions` | route?storeType=0 | all | `CanViewItStoreAvailableStocks` |  |  |
| `/extrals/available-stocks/:code/item-transactions` | route?storeType=2 | all | `CanViewEquipmentStoreAvailableStocks` |  |  |
| `/extrals/available-stocks/:code/item-transactions` | route?storeType=3 | all | `CanViewReagentStoreAvailableStocks` |  |  |
| `/extrals/receiving-area` | route | some | `CanViewItStoreReceivingArea`, `CanViewGeneralStoreReceivingArea`, `CanViewEquipmentStoreReceivingArea`, `CanViewReagentStoreReceivingArea` |  | OR of several keys |
| `/extrals/receiving-area` | route?storeType=1 | all | `CanViewGeneralStoreReceivingArea` |  |  |
| `/extrals/receiving-area` | route?storeType=0 | all | `CanViewItStoreReceivingArea` |  |  |
| `/extrals/receiving-area` | route?storeType=2 | all | `CanViewEquipmentStoreReceivingArea` |  |  |
| `/extrals/receiving-area` | route?storeType=3 | all | `CanViewReagentStoreReceivingArea` |  |  |

## store-vendors

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/extrals/vendors` | root | all | `CanViewVendors` |  |  |

## stores-dashboard

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/stores-dashboard` | root | some | `CanViewItemsInReagentStore`, `CanViewItemsInEquipmentStore`, `CanViewItemsInGeneralStore`, `CanViewItemsInItStore`, `CanViewReagentStoreReceivingArea`, `CanViewEquipmentStoreReceivingArea`, `CanViewGeneralStoreReceivingArea`, `CanViewItStoreReceivingArea`, `CanViewReagentStoreAvailableStocks`, `CanViewEquipmentStoreAvailableStocks`, `CanViewGeneralStoreAvailableStocks`, `CanViewItStoreAvailableStocks`, `CanViewReagentStorePurchaseRequisitions`, `CanViewEquipmentStorePurchaseRequisitions`, `CanViewGeneralStorePurchaseRequisitions`, `CanViewItStorePurchaseRequisitions`, `CanViewReagentStoreStockRequisitions`, `CanViewEquipmentStoreStockRequisitions`, `CanViewGeneralStoreStockRequisitions`, `CanViewItStoreStockRequisitions`, `CanViewReagentStoreIssueStocks`, `CanViewEquipmentStoreIssueStocks`, `CanViewGeneralStoreIssueStocks`, `CanViewItStoreIssueStocks`, `CanViewReagentStoreReturnItems`, `CanViewEquipmentStoreReturnItems`, `CanViewGeneralStoreReturnItems`, `CanViewItStoreReturnItems`, `CanViewReagentStoreDamageMissingItems`, `CanViewEquipmentStoreDamageMissingItems`, `CanViewGeneralStoreDamageMissingItems`, `CanViewItStoreDamageMissingItems`, `CanViewPurchaseRequisitionsSourcing`, `CanViewQuotationRequestsForTrustedVendors`, `CanViewQuotationResponsesForTrustedVendors`, `CanViewTrustedVendorPricingSelection`, `CanViewMemoForTrustedVendors`, `CanViewPurchaseOrdersForTrustedVendors`, `CanViewOpenMarketQuotationSheets`, `CanViewOpenMarketPricingSelection`, `CanViewOpenMarketMemo`, `CanViewOpenMarketPurchaseOrders` |  | OR of several keys |

## supplier-compliance

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/procurement/supplier-compliance` | root | all | `CanViewSupplierCertifications` |  |  |

## suppliers

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/suppliers` | root | all | `CanViewVendors` |  |  |
| `/settings/suppliers/create` | route | all | `CanCreateVendor` |  |  |
| `/settings/suppliers/:id/edit` | route | all | `CanUpdateVendorDetails` |  |  |
| `/settings/suppliers/:id/relationship` | route | some | `CanViewSupplierCertifications`, `CanManageSupplierContracts`, `CanViewSupplierPerformance`, `CanViewSupplierSpend` |  | OR of several keys |

## swap-requests

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/swap-requests` | root | some | `CanIssueRawMaterialRequisitions`, `CanIssuePackagingMaterialRequisitions` |  | OR of several keys |

## units-of-measure

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/uom` | root | all | `CanViewUnitOfMeasure` |  |  |

## upload-center

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/upload-center` | root | some | `CanViewOpeningBalances`, `CanApproveFgtn`, `CanSubmitAttendanceReportUpload`, `CanSubmitShiftScheduleReportUpload` |  | OR of several keys |
| `/settings/upload-center/stock-migrations/:id` | route | all | `CanViewOpeningBalances` |  |  |

## user-passwords

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/user-passwords` | root | account | — |  |  |

## users

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/access-management/users` | root | some | `CanViewActiveUser`, `CanViewInactiveUser` |  | OR of several keys |
| `/access-management/users` | root?status=0 | all | `CanViewActiveUser` |  |  |
| `/access-management/users` | root?status=1 | all | `CanViewInactiveUser` |  |  |
| `/access-management/users/create` | route | all | `CanCreateUser` |  |  |

## warehouse-dashboard

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/warehouse-dashboard` | root | some | `CanViewRawMaterialsItems`, `CanViewPackagingMaterialsItems` |  | OR of several keys |

## warehouses

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/warehouses` | root | all | `CanViewWarehouses` |  |  |

## waybills

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/logistics/waybill` | root | all | `CanViewWaybill` |  |  |
| `/logistics/waybill/create` | route | all | `CanCreateWaybill` |  |  |

## white-placebo

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/production/white-placebo` | root | all | `CanViewRawMaterialRequisitions` | 0 |  |
| `/production/white-placebo/new` | route | all | `CanViewRawMaterialRequisitions`, `CanCreateRawMaterialRequisitions` | 0 | needs several keys |
| `/production/white-placebo/recipe` | route | all | `CanViewRawMaterialRequisitions`, `CanEditProductionPlan`, `CanEditRawMaterials` | 0 | needs several keys |

## working-days

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/working-days` | root | all | `CanViewWorkingDays` |  |  |

## working-hours-policy

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/settings/working-hours-policy` | root | all | `CanViewWorkingHoursPolicy` |  |  |

## workspace

| Path | Applies to | Kind | Keys | Dept | Finding |
| --- | --- | --- | --- | --- | --- |
| `/home` | root | authenticated | — |  | sign-in only |
