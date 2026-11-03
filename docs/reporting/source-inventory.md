# Reporting source inventory

Source snapshot: 2026-11-02. Read-only source/contract inventory, not a runtime or deployment audit. It includes the uncommitted local BMR issued report. Navigation visibility is not proof that a full workflow is available. DTO property presence is not proof of populated or historically accurate data.

Desktop HEAD: `154ca07`; backend HEAD: `32a52e89`. Working-tree additions are described in the study; no customer data was queried.

Inventory: **16 navigation groups**, **151 feature manifests**, **362 concrete workspace page files**. These are different measures; none is a count of independent business processes.

## Navigation ownership map

| Navigation group | Observed sections |
| --- | --- |
| Main | Dashboard; Product Board; My Pending Approvals; Transfer Approval Rights |
| Finance & Cashflow | Payments & receipts; My payment approvals; Cashflow command center; Costing |
| Procurement | Suppliers; Manufacturers; Supplier compliance; Requests; Quotation Management; Orders; Distribution |
| Logistics | Shipment Management; Stock Information |
| Warehouse Management | Material Intake; Rejected Area; Material Requests; Stock Location; Stock Movement |
| Production Planning | Requisition; Products; Product Schedule; Stock Transfer Requests |
| R&D | Formula Builder; Projects; Formula Reviews; Stability Chambers |
| Quality Control | Testing; Test Procedures; Specifications; Analytical Raw Data; QC Worksheets; Routine Quality Control |
| Quality Assurance | Issue BMR/BPR; Analytical Test Requests; Formula Reviews; Formula Approvals; OOS Investigations |
| Audit | Quality Audits |
| FG Warehouse | Customer Management; Production Order; FGTN; Products; Approved Products; Packing List; Proforma Invoice; Invoice; Allocations |
| Inventory & Stores | Stores; Procurement; Service |
| Human Resource | Employee Management; Leave Management; Attendance & Schedule; Shift Scheduling; Payroll; Performance Management |
| IT Support | User Management; Access Management; My IT Issues; Support Tickets |
| System Settings | General; Collections; Sites; Inventory; Organization; Questions; Templates; Procedure Areas; Procedure Questions; Procedure Sections; Procedure Forms; Procedure Activities; Workflow Templates; Alerts & Notifications; Approvals; Signature Settings; Change Password; Change User Password; Code Settings |
| Reports | Human Resources Report; QC and QA Report; Warehouse Report; Store & Inventory Report; Procurement Report; FGTN Report |

## Existing desktop report choices

From `apps/web/src/modules/reports/lib/catalog.ts`. The issued-BMR entry is local source only. Other entries still need customer runtime acceptance; this inventory does not promote them to production-ready.

| Report key | Group | Title | Declared filters |
| --- | --- | --- | --- |
| `MaterialList` | warehouse | Materials per department | `asOfDate`, `department`, `materialKind`, `category` |
| `MaterialStockSummary` | warehouse | Material stock summary | `asOfDate`, `department`, `materialKind`, `material` |
| `MaterialStockDetail` | warehouse | Material stock details | `asOfDate`, `department`, `materialKind`, `material`, `batchNumber`, `expiryDateFrom`, `expiryDateTo` |
| `InventoryValuation` | warehouse | Inventory valuation detail | `asOfDate`, `warehouseType`, `warehouse`, `division`, `department`, `material`, `expiryDateFrom`, `expiryDateTo` |
| `SupplierDetail` | procurement | Supplier and manufacturer details | `materialKind`, `supplier`, `manufacturer`, `material`, `validityDateFrom`, `validityDateTo` |
| `SupplierSummary` | procurement | Supplier and manufacturer summary | `materialKind`, `supplier`, `manufacturer`, `material`, `validityDateFrom`, `validityDateTo` |
| `PurchaseOrders` | procurement | Purchase order report | `supplierIds`, `supplierType`, `poNumber`, `startDate`, `endDate` |
| `PurchasedOrders` | procurement | Invoiced purchase orders | `supplierIds`, `supplierType`, `poNumber`, `startDate`, `endDate` |
| `Shipments` | procurement | Shipment details | `supplierIds`, `statuses`, `startDate`, `endDate` |
| `TransferSummary` | finished-goods | Finished goods transfer summary | `product`, `warehouse`, `startDate`, `endDate` |
| `TransferDetail` | finished-goods | Finished goods transfer details | `product`, `warehouse`, `startDate`, `endDate` |
| `ProductStockSummary` | finished-goods | Product stock summary | `asOfDate`, `product`, `warehouse`, `department` |
| `ProductStockDetail` | finished-goods | Product stock details | `asOfDate`, `product`, `warehouse`, `department`, `batchNumber`, `expiryDateFrom`, `expiryDateTo` |
| `ProductList` | finished-goods | Product list | `asOfDate`, `department`, `division`, `category`, `product` |
| `InvoicedProducts` | finished-goods | Invoiced products summary | `product`, `customer`, `division`, `startDate`, `endDate` |
| `StoreItems` | stores | Items per store type | `asOfDate`, `store`, `classification`, `category`, `item` |
| `StoreStock` | stores | Store stock summary | `asOfDate`, `store`, `classification`, `category`, `item` |
| `VendorItems` | stores | Vendor item mapping details | `asOfDate`, `store`, `classification`, `category`, `item`, `vendor` |
| `VendorSummary` | stores | Vendor item mapping summary | `asOfDate`, `store`, `classification`, `category`, `item` |
| `EmployeeMaster` | hr | Employee master list | `asOfDate`, `department`, `employeeType`, `grade`, `status` |
| `StaffGrade` | hr | Permanent staff grade count | `asOfDate`, `department` |
| `EmployeeMovement` | hr | New hires and exit count | `department`, `startDate`, `endDate` |
| `StaffTotal` | hr | Staff total report | `department`, `startDate`, `endDate` |
| `GenderRatio` | hr | Staff gender ratio | `department`, `startDate`, `endDate` |
| `LeaveOverview` | hr | Leave overview | `department`, `startDate`, `endDate` |
| `StaffTurnover` | hr | Staff turnover | `department`, `startDate`, `endDate` |
| `DailyAttendance` | hr | Daily attendance overview | `date`, `department` |
| `DepartmentAttendance` | hr | Department attendance summary | `asOfDate`, `department` |
| `MonthlySchedule` | quality | Monthly production schedule | `department`, `month` |
| `DailySchedule` | quality | Daily production schedule | `department`, `date` |
| `ProductReadiness` | quality | Product readiness | `department`, `month` |
| `QualityProducts` | quality | Quality product list | `asOfDate`, `department` |
| `QualityMaterials` | quality | Quality material list | `asOfDate`, `materialKind`, `category` |
| `IssuedBmr` | quality | BMR issued report | `startDate`, `endDate`, `department` |

## Backend report and dashboard contract index

**106 core GET operations**, plus **6 related finance/payroll/audit operations** selected by path. Other domain read endpoints can support future reports; they are not counted as ready-made reports. Request parameters are taken from the versioned OpenAPI import. Response fields below are the top row/object properties after unwrapping arrays/pagination, not a complete join specification.

Known metadata caveat: supplier-material and employee-movement object/array shapes have handwritten adapters validated against repository return types. All other entries also require query/authorization review before reuse.

| GET path | Query parameters | Exposed response properties |
| --- | --- | --- |
| `/api/v1/payments/ap-aging` | `asOf` | `baseCurrencyId`, `baseCurrencyName`, `totalOutstandingBase`, `parties`, `dataQualityWarnings` |
| `/api/v1/payments/ar-aging` | `asOf` | `baseCurrencyId`, `baseCurrencyName`, `totalOutstandingBase`, `parties`, `dataQualityWarnings` |
| `/api/v1/payments/cashflow-summary` | `asOf` | `baseCurrencyId`, `baseCurrencyName`, `projectedOutflows`, `projectedInflows`, `dataQualityWarnings` |
| `/api/v1/payroll/runs/{payrollRunId}/bank-advice` | `fileType` | Undeclared body / file / inspect source |
| `/api/v1/payroll/runs/{payrollRunId}/register` | `fileType` | Undeclared body / file / inspect source |
| `/api/v1/report/production-readiness` | `departmentId` (required), `startDate` (required), `endDate` (required) | `departmentId`, `departmentName`, `startDate`, `endDate`, `generatedAt`, `productCount`, `readyProductCount`, `actionNeededProductCount`, `unavailableProductCount`, `markets`, `products`, `totals`, `warnings` |
| `/api/v1/report/production` | `startDate`, `endDate`, `materialKind` | `numberOfPurchaseRequisitions`, `numberOfNewPurchaseRequisitions`, `numberOfInProgressPurchaseRequisitions`, `numberOfCompletedPurchaseRequisitions`, `numberOfProductionSchedules`, `numberOfNewProductionSchedules`, `numberOfInProgressProductionSchedules`, `numberOfCompletedProductionSchedules`, `numberOfIncomingStockTransfers`, `numberOfIncomingPendingStockTransfers`, `numberOfIncomingCompletedStockTransfers`, `numberOfOutgoingStockTransfers`, `numberOfOutgoingPendingStockTransfers`, `numberOfOutgoingCompletedStockTransfers` |
| `/api/v1/report/production/materials-below-minimum` | None declared | `material`, `stockQuantity`, `uoM` |
| `/api/v1/report/warehouse` | `startDate`, `endDate`, `materialKind` | `numberOfStockRequisitions`, `numberOfNewStockRequisitions`, `numberOfInProgressStockRequisitions`, `numberOfCompletedStockRequisitions`, `numberOfIncomingStockTransfers`, `numberOfIncomingPendingStockTransfers`, `numberOfIncomingCompletedStockTransfers`, `numberOfShipments`, `numberOfInTransitShipments`, `numberOfArrivedShipments`, `numberOfClearedShipments` |
| `/api/v1/report/logistics` | `startDate`, `endDate`, `materialKind` | `numberOfInvoices`, `numberOfPaidInvoices`, `numberOfUnpaidInvoices`, `numberOfShipments`, `numberOfNewShipments`, `numberOfInTransitShipments`, `numberOfArrivedShipments`, `numberOfClearedShipments`, `numberOfBillingSheets`, `numberOfPaidBillingSheets`, `numberOfPendingBillingSheets`, `numberOfWaybills`, `numberOfNewWaybills`, `numberOfInTransitWaybills`, `numberOfArrivedWaybills`, `numberOfClearedWaybills` |
| `/api/v1/report/reserved-material-batches` | `startDate`, `endDate`, `materialKind` | `warehouse`, `material`, `uoM`, `quantity` |
| `/api/v1/report/human-resource` | `departmentId`, `startDate`, `endDate`, `materialKind`, `designationId`, `employeeType`, `gender` | `numberOfLeaveRequests`, `numberOfPendingLeaveRequests`, `numberOfRejectedLeaveRequests`, `numberOfExpiredLeaveRequests`, `numberOfOvertimeRequests`, `numberOfPendingOvertimeRequests`, `numberOfApprovedOvertimeRequests`, `numberOfExpiredOvertimeRequests`, `numberOfAbsenceRequests`, `numberOfPendingAbsenceRequests`, `numberOfApprovedAbsenceRequests`, `numberOfRejectedAbsenceRequests`, `numberOfExitPasses`, `numberOfPendingExitPasses`, `numberOfApprovedExitPasses`, `numberOfRejectedExitPasses`, `numberOfOfficialDutyLeaves`, `numberOfPendingOfficialDutyLeaves`, `numberOfApprovedOfficialDutyLeaves`, `numberOfRejectedOfficialDutyLeaves`, `numberOfStaffRequisitions`, `totalEmployees`, `numberOfNewCasualEmployees`, `numberOfNewPermanentEmployees`, `numberOfNewEmployees`, `numberOfActiveCasualEmployees`, `numberOfActivePermanentEmployees`, `numberOfActiveEmployees`, `numberOfInactiveCasualEmployees`, `numberOfInactivePermanentEmployees`, `numberOfInactiveEmployees`, `numberOfCasualEmployees`, `numberOfPermanentEmployees`, `attendanceStats`, `employeeGenderRatio` |
| `/api/v1/report/staff-report` | `departmentId`, `asOfDate` | `departments`, `totals` |
| `/api/v1/report/employee-movement` | `departmentId`, `startDate`, `endDate`, `materialKind` | `departments`, `totals` |
| `/api/v1/report/staff-total-report` | `departmentId`, `startDate`, `endDate`, `materialKind` | `departments`, `totals` |
| `/api/v1/report/staff-gender-ratio-report` | `departmentId`, `startDate`, `endDate`, `materialKind` | `departments`, `totals` |
| `/api/v1/report/staff-leave-report` | `departmentId`, `startDate`, `endDate`, `materialKind` | `departments` |
| `/api/v1/report/staff-turnover-report` | `departmentId`, `startDate`, `endDate`, `materialKind` | `departments`, `organisationTurnover`, `grandTotalLeavers` |
| `/api/v1/report/materials-ready-for-checklist` | `departmentId`, `startDate`, `endDate`, `materialKind` | `id`, `materialId`, `materialCode`, `materialName`, `materialKind`, `shipmentInvoiceId`, `shipmentInvoiceCode`, `quantity`, `uoMId`, `uoMName`, `uoMSymbol`, `arrivedAt`, `createdAt`, `status`, `departmentId`, `departmentName` |
| `/api/v1/report/materials-ready-for-assignment` | `startDate`, `endDate`, `materialKind` | `id`, `material`, `batchNumber`, `checklist`, `stockTransfer`, `uoM`, `numberOfContainers`, `containerPackageStyle`, `quantityPerContainer`, `status`, `dateReceived`, `dateApproved`, `quantityAssigned`, `quantityUnassigned`, `totalQuantity`, `consumedQuantity`, `remainingQuantity`, `sampledQuantity`, `quantityDistributed`, `expiryDate`, `manufacturingDate`, `retestDate`, `sampleWeights`, `locations`, `shelves`, `reservedQuantities`, `reservedQuantity`, `returnDate`, `aboutToExpire`, `expired`, `issueNumber`, `supplierName`, `manufacturerName`, `arNumber`, `sampledBy`, `sampledOn`, `sampleQuantity`, `analysedBy`, `analysedDate`, `issuedBy`, `issuedAt` |
| `/api/v1/report/qa-dashboard` | `startDate`, `endDate`, `materialKind`, `productId` | `numberOfBmrRequests`, `numberOfPendingBmrRequests`, `numberOfApprovedBmrRequests`, `numberOfRejectBmrRequests`, `numberOfAnalyticalTestRequests`, `numberOfExpiredAnalyticalTestRequests`, `numberOfApprovals`, `numberOfPendingApprovals`, `numberOfRejectedApprovals`, `numberOfManufacturers`, `numberOfNewManufacturers`, `numberOfApprovedManufacturers`, `numberOfExpiredManufacturers`, `numberOfProducts`, `numberOfRawMaterials`, `numberOfPackingMaterials` |
| `/api/v1/report/qc-dashboard` | `startDate`, `endDate`, `materialKind`, `productId`, `materialId` | `numberOfBmrRequests`, `numberOfPendingBmrRequests`, `numberOfApprovedBmrRequests`, `numberOfRejectBmrRequests`, `numberOfAnalyticalTestRequests`, `numberOfExpiredAnalyticalTestRequests`, `numberOfApprovals`, `numberOfPendingApprovals`, `numberOfRejectedApprovals`, `numberOfManufacturers`, `numberOfNewManufacturers`, `numberOfApprovedManufacturers`, `numberOfExpiredManufacturers`, `numberOfProducts`, `numberOfRawMaterials`, `numberOfPackingMaterials` |
| `/api/v1/report/finished-goods-transfer-summary` | `startDate`, `endDate`, `materialKind`, `productId`, `warehouseId` | `no`, `productName`, `productCode`, `numberOfBatches`, `totalQuantity`, `uomName`, `productionDepartment`, `destinationWarehouse`, `transferDate`, `acceptedDate` |
| `/api/v1/report/finished-goods-transfer-detailed` | `startDate`, `endDate`, `materialKind`, `productId`, `warehouseId` | `no`, `productName`, `productCode`, `batchNumber`, `quantityTransferred`, `manufacturingDate`, `expiryDate`, `packingStyle`, `uomName`, `productionDepartment`, `destinationWarehouse`, `transferDate`, `acceptedDate`, `status` |
| `/api/v1/report/product-stock-summary` | `productId`, `warehouseId`, `departmentId`, `asOfDate` | `no`, `productName`, `productCode`, `warehouse`, `productionDepartment`, `numberOfBatches`, `totalQuantity`, `uomName` |
| `/api/v1/report/product-stock-detailed` | `productId`, `warehouseId`, `departmentId`, `batchNumber`, `expiryDateFrom`, `expiryDateTo`, `asOfDate` | `no`, `productName`, `productCode`, `batchNumber`, `manufacturingDate`, `expiryDate`, `totalQuantity`, `uomName`, `productionDepartment`, `warehouse` |
| `/api/v1/report/fgtn/dashboard-kpi` | `dateFilter`, `customStartDate`, `customEndDate`, `materialId`, `productId`, `departmentId` | `productCount`, `totalCustomers`, `productionOrders`, `finishedGoodsTransferNotes`, `inventorySummary`, `dispatchPipeline` |
| `/api/v1/report/supplier-materials` | `materialName`, `materialType`, `supplierName`, `manufacturerName`, `validityDateFrom`, `validityDateTo`, `supplierId`, `manufacturerId` | `manufacturers`, `materials`, `uom`, `supplier` |
| `/api/v1/report/items-per-store-type` | `store`, `inventoryClassification`, `itemId`, `categoryId`, `asOfDate` | `id`, `createdBy`, `createdAt`, `attachments`, `name`, `code`, `classification`, `unitOfMeasure`, `hasBatch`, `store`, `minimumLevel`, `maximumLevel`, `reorderLevel`, `isActive`, `description`, `itemCategory`, `availableQuantity` |
| `/api/v1/report/stock-summary-per-store-type` | `asOfDate` | `no`, `store`, `itemName`, `itemCode`, `category`, `totalQuantity`, `unitOfMeasure` |
| `/api/v1/report/vendor-item` | `store`, `vendorId`, `itemId`, `categoryId`, `classification`, `asOfDate` | `no`, `store`, `itemName`, `itemCode`, `category`, `totalQuantity`, `unitOfMeasure`, `vendorName`, `inventoryClassification` |
| `/api/v1/report/vendor-item/summary` | `itemId`, `categoryId`, `classification`, `store`, `asOfDate` | `no`, `store`, `itemName`, `itemCode`, `category`, `totalQuantity`, `unitOfMeasure`, `vendorName`, `inventoryClassification` |
| `/api/v1/report/shipment` | `startDate`, `endDate`, `supplierIds`, `statuses` | `no`, `supplierName`, `invoiceAmount`, `materials`, `expectedArrivalDate`, `freeDays`, `demurrageStarts`, `containerSize`, `billOfLadingNo`, `transactionType`, `status` |
| `/api/v1/report/purchase-orders` | `startDate`, `endDate`, `supplierIds`, `poNumber`, `supplierType` | `no`, `supplierName`, `proformaInvoiceNumber`, `purchaseOrderNumber`, `materialName`, `orderQuantity`, `uomName`, `unitPrice`, `priceUoM`, `currencySymbol`, `materialValue`, `purchaseOrderDate`, `expectedDeliverydate` |
| `/api/v1/report/purchased-po-report` | `startDate`, `endDate`, `supplierIds`, `poNumber`, `supplierType` | `no`, `supplierType`, `supplierName`, `poNumber`, `invoiceNumber`, `materialName`, `orderedQuantity`, `orderedUom`, `quantityReceived`, `receivedUom`, `unitCost`, `priceUoM`, `currencySymbol`, `materialPurchaseValue`, `invoiceDate` |
| `/api/v1/report/production-dashboard` | None declared | `requisitionReport`, `materialsBelowReorderLevel`, `productionScheduleReport`, `stockTransferReport` |
| `/api/v1/report/procurement-dashboard` | `filter` | `requisitionReport`, `purchaseOrderStatus`, `salesQuotation`, `materialDistributionStatus` |
| `/api/v1/report/warehouse-dashboard` | `filter` | `stockTransfers`, `stockRequisitions` |
| `/api/v1/report/expired-materials` | None declared | `materialName`, `materialCode`, `batchNumber`, `expiryDate`, `shelfName`, `quantityOnShelf`, `uomSymbol`, `dateReceived` |
| `/api/v1/report/reserved-materials` | `materialId` | `materialName`, `materialCode`, `reservedQuantity`, `uomSymbol`, `productName`, `productCode`, `warehouseName`, `departmentName`, `dateTime`, `schedule`, `productBatchNumber`, `arNumber`, `manufacturingDate`, `expiryDate`, `balanceQuantity`, `materialBatchNumber` |
| `/api/v1/report/materials-below-reorder` | None declared | `materialName`, `materialCode`, `currentQuantity`, `reOrderLevel`, `uomSymbol` |
| `/api/v1/report/materials-checklist` | None declared | `incomingMaterials`, `checkedMaterials` |
| `/api/v1/report/shipment-status-summary` | `filter` | `newCount`, `atPortCount`, `clearedCount`, `inTransitCount`, `arrivedCount` |
| `/api/v1/report/general-inventory-dashboard` | `filter` | `itemCounts`, `itemStockRequisitions`, `totalvendors` |
| `/api/v1/report/items-below-reorder` | None declared | `itemName`, `code`, `currentQuantity`, `reorderLevel` |
| `/api/v1/report/services-dashboard` | `filter` | `totalServiceCount`, `totalContractorsCount`, `jobRequisitionCount` |
| `/api/v1/report/invoiced-products-summary` | `startDate`, `endDate`, `productId`, `customerId`, `warehouseDivision` | `no`, `invoiceNo`, `invoiceDate`, `customerName`, `orderNo`, `orderDate`, `noOfBatches`, `orderQuantity`, `quantityAllocated`, `outstandingQuantity`, `productCode`, `productName`, `uom`, `unitPrice`, `priceUoM`, `currency`, `itemAmount` |
| `/api/v1/report/invoiced-products-detailed` | `startDate`, `endDate`, `productId`, `customerId`, `warehouseDivision` | `no`, `invoiceNo`, `invoiceDate`, `customerName`, `orderNo`, `orderDate`, `productName`, `productCode`, `batchNo`, `orderQuantity`, `quantityAllocated`, `outstandingQuantity`, `uom`, `unitPrice`, `priceUoM`, `currency`, `itemAmount`, `allocationStatus` |
| `/api/v1/report/warehouse-kpi/capacity-utilisation` | `warehouseId`, `warehouseType`, `division` | `department`, `warehouse`, `warehouseType`, `totalShelves`, `occupiedShelves`, `availableShelves`, `utilisationPercentage` |
| `/api/v1/report/warehouse-kpi/dock-to-stock` | `warehouseId`, `warehouseType`, `division`, `datePreset`, `customStartDate`, `customEndDate` | `department`, `warehouse`, `period`, `averageHours`, `medianHours`, `totalRecords` |
| `/api/v1/report/warehouse-kpi/stock-transfer-fulfilment` | `datePreset`, `customStartDate`, `customEndDate`, `fromDepartmentId`, `toDepartmentId` | `department`, `direction`, `totalTransfers`, `pending`, `approved`, `issued`, `fulfilmentPercentage` |
| `/api/v1/report/warehouse-kpi/receiving-pipeline` | `warehouseId`, `warehouseType`, `division` | `department`, `pending`, `arrived`, `checked`, `grnGenerated`, `distributed`, `assigned`, `total` |
| `/api/v1/report/warehouse-kpi/expiry-risk-index` | `warehouseId`, `warehouseType`, `division`, `expiryWindow` | `department`, `warehouse`, `expiryWindow`, `batchCount`, `totalQuantity`, `uom` |
| `/api/v1/report/warehouse-kpi/reorder-alert-count` | `materialKind` | `department`, `material`, `materialCode`, `currentStock`, `reorderLevel`, `shortfall`, `uom` |
| `/api/v1/report/warehouse-kpi/swap-request-activity` | `warehouseId`, `warehouseType`, `division`, `datePreset`, `customStartDate`, `customEndDate` | `department`, `period`, `pending`, `approved`, `rejected`, `total` |
| `/api/v1/report/warehouse-kpi/material-movement-count` | `warehouseId`, `warehouseType`, `division`, `datePreset`, `customStartDate`, `customEndDate` | `department`, `period`, `newPutaways`, `adjustments`, `totalMovements` |
| `/api/v1/report/warehouse-kpi/freshness` | `warehouseId`, `warehouseType`, `division` | `source`, `recordCount`, `lastChangedAt` |
| `/api/v1/report/kpi/bmr-release-rate` | `startDate`, `endDate`, `departmentId` | `departmentId`, `department`, `totalBmrs`, `pending`, `issued`, `rejected`, `releaseRatePercentage` |
| `/api/v1/report/kpi/yield-performance` | `startDate`, `endDate`, `departmentId` | `productId`, `product`, `departmentId`, `department`, `batchCount`, `expectedYield`, `actualQuantityPacked`, `totalGainOrLoss`, `variancePercentage` |
| `/api/v1/report/kpi/schedule-adherence` | `startDate`, `endDate`, `departmentId` | `departmentId`, `department`, `onTime`, `delayed`, `totalCompleted`, `adherencePercentage` |
| `/api/v1/report/kpi/production-output-volume` | `startDate`, `endDate`, `departmentId` | `departmentId`, `department`, `division`, `productCount`, `totalBatchCount`, `totalQuantityPacked`, `uom` |
| `/api/v1/report/kpi/atr-testing-backlog` | `startDate`, `endDate`, `departmentId` | `departmentId`, `department`, `newNotSampled`, `testing`, `testTaken`, `totalBacklog`, `oldestWaitingDays` |
| `/api/v1/report/kpi/stock-requisition-pending` | `startDate`, `endDate`, `departmentId` | `departmentId`, `department`, `inProgress`, `reject`, `approved`, `total`, `oldestPendingDays` |
| `/api/v1/report/kpi/fgtn-pending-approval` | `startDate`, `endDate`, `departmentId` | `departmentId`, `fromDepartment`, `pendingApproval`, `approved`, `averageAgingDays` |
| `/api/v1/report/kpi/production-order-delivery-status` | `startDate`, `endDate`, `departmentId`, `customerId` | `status`, `statusName`, `orderCount`, `allocatedCount`, `loaded`, `delivered` |
| `/api/v1/report/kpi/material-return-rate` | `startDate`, `endDate`, `departmentId` | `departmentId`, `department`, `totalIssuedQuantity`, `totalReturnedQuantity`, `returnRatePercentage`, `returnNoteCount` |
| `/api/v1/report/warehouse/materials-stock-summary` | `departmentId`, `materialKind`, `materialId`, `asOfDate` | `no`, `materialName`, `materialCode`, `materialType`, `productionDepartment`, `warehouseType`, `noOfBatches`, `totalQuantity`, `uom` |
| `/api/v1/report/warehouse/materials-stock-batch-detail` | `departmentId`, `materialKind`, `batchNumber`, `expiryDateFrom`, `expiryDateTo`, `materialId`, `asOfDate` | `no`, `materialName`, `materialCode`, `materialType`, `batchNo`, `manufacturingDate`, `expiryDate`, `quantityAvailable`, `uom`, `productionDepartment`, `warehouseType`, `storageLocation` |
| `/api/v1/report/warehouse/shelf-utilisation-detail` | `warehouseId`, `locationId`, `occupancyStatus`, `departmentId` | `no`, `warehouse`, `warehouseType`, `location`, `rack`, `shelfCode`, `shelfName`, `occupancyStatus`, `distinctBatches`, `totalQuantity`, `lastUpdated` |
| `/api/v1/report/warehouse/goods-receiving-register` | `startDate`, `endDate`, `grnStatus`, `supplierId`, `departmentId` | `no`, `grnNumber`, `grnStatus`, `grnGeneratedAt`, `carrierName`, `vehicleNumber`, `declarationNumber`, `remarks`, `supplier`, `material`, `quantityReceived`, `uom`, `materialBatches` |
| `/api/v1/report/warehouse/receiving-performance-detail` | `startDate`, `endDate`, `warehouseId`, `supplierId`, `departmentId` | `no`, `warehouse`, `supplier`, `material`, `quantity`, `arrivedAt`, `checkedAt`, `grnGeneratedAt`, `approvedAt`, `distributedAt`, `assignedAt`, `arrivalToCheckHours`, `checkToGrnHours`, `grnToApprovedHours`, `grnToDistributeHours`, `distributeToAssignedHours`, `totalDockToStockHours` |
| `/api/v1/report/warehouse/putaway-register` | `startDate`, `endDate`, `warehouseId`, `employeeId`, `departmentId` | `no`, `material`, `batchNo`, `quantity`, `uom`, `fromLocation`, `toShelf`, `putawayDate`, `putawayBy`, `note` |
| `/api/v1/report/warehouse/stock-adjustment-audit` | `startDate`, `endDate`, `reasonCode`, `warehouseId`, `departmentId` | `no`, `adjustmentNo`, `adjustmentDate`, `material`, `batchNo`, `shelf`, `systemQuantity`, `physicalCount`, `variance`, `reasonCode`, `notes`, `adjustedBy` |
| `/api/v1/report/warehouse/batch-traceability` | `materialBatchId`, `startDate`, `endDate`, `departmentId` | `no`, `eventType`, `eventDate`, `fromLocation`, `toLocation`, `quantity`, `uom`, `referenceDocument`, `performedBy`, `remarks` |
| `/api/v1/report/warehouse/inter-warehouse-swap-requests` | `startDate`, `endDate`, `warehouseId`, `status`, `departmentId` | `no`, `firstWarehouse`, `secondWarehouse`, `status`, `material`, `batchNo`, `quantity`, `uom`, `requester`, `actionedBy`, `actionedAt`, `actionNote` |
| `/api/v1/report/warehouse/stock-transfer-inter-department` | `startDate`, `endDate`, `fromDepartmentId`, `toDepartmentId`, `status`, `departmentId` | `no`, `transferCode`, `material`, `uom`, `requiredQuantity`, `fromDepartment`, `toDepartment`, `status`, `approvedAt`, `approvedBy`, `issuedAt`, `issuedBy`, `reason` |
| `/api/v1/report/warehouse/material-expiry-projection` | `window`, `warehouseId`, `materialId`, `departmentId` | `no`, `material`, `materialCode`, `batchNo`, `expiryDate`, `daysUntilExpiry`, `expiryWindow`, `quantity`, `uom`, `warehouse`, `shelf`, `daysOnShelf` |
| `/api/v1/report/warehouse/slow-moving-inventory` | `warehouseId`, `materialId`, `departmentId`, `threshold` | `no`, `material`, `materialCode`, `batchNo`, `quantity`, `uom`, `lastMovementDate`, `daysSinceLastMove`, `warehouse`, `shelf`, `estValue` |
| `/api/v1/report/warehouse/bin-card-transaction-ledger` | `materialBatchId`, `startDate`, `endDate`, `departmentId` | `no`, `date`, `description`, `wayBill`, `arNumber`, `supplier`, `manufacturer`, `quantityReceived`, `quantityIssued`, `balanceQuantity`, `uom`, `product` |
| `/api/v1/report/warehouse/operations-summary` | `startDate`, `endDate`, `warehouseId`, `departmentId` | `department`, `period`, `materialsReceived`, `grnsCreated`, `batchesPutAway`, `stockAdjustments`, `stockTransfers`, `swapsApproved`, `checklistsDone` |
| `/api/v1/report/warehouse/qc-pending` | `warehouseId`, `supplierId`, `departmentId` | `no`, `material`, `materialCode`, `supplier`, `quantity`, `uom`, `checklistDate`, `daysWaiting`, `warehouse`, `arrivalLocation` |
| `/api/v1/report/warehouse/reorder-level-vs-stock` | `departmentId`, `materialKind` | `no`, `material`, `materialCode`, `materialType`, `currentStock`, `reorderLevel`, `avgMonthlyConsumption`, `monthsOfStock`, `suggestedOrderQty`, `stockOutRisk`, `uom`, `department` |
| `/api/v1/report/warehouse/inventory-valuation-summary` | `warehouseType`, `division`, `uomGroup`, `departmentId` | `no`, `warehouseType`, `division`, `warehouse`, `itemMaterialCount`, `uomGroup`, `totalQuantity`, `estUnitCost`, `totalValue`, `percentOfTotalInventory` |
| `/api/v1/report/warehouse/inventory-valuation-detail` | `warehouseType`, `division`, `warehouseId`, `valuationType`, `materialId`, `expiryDateFrom`, `expiryDateTo`, `departmentId`, `asOfDate` | `no`, `warehouseType`, `division`, `warehouse`, `materialItem`, `code`, `batchNo`, `valuationType`, `uom`, `quantityUOM`, `unitSize`, `itemCount`, `estUnitCostVal`, `costBasis`, `totalValue`, `shelfLocation`, `expiryDate`, `daysOnShelf` |
| `/api/v1/report/warehouse/employee-activity` | `startDate`, `endDate`, `materialKind`, `employeeId`, `departmentId` | `no`, `employee`, `department`, `checklistsDone`, `grnsCreated`, `stockAdjustments`, `materialDistributions`, `swapsActioned`, `putawayActions`, `totalActions` |
| `/api/v1/report/warehouse/arrival-location-status` | `warehouseId`, `status`, `agingThresholdDays`, `departmentId` | `no`, `warehouse`, `arrivalLocation`, `material`, `batchNo`, `quantity`, `uom`, `daysInArrival`, `status`, `priorityFlag` |
| `/api/v1/report/hr-kpi/employee-headcount` | `departmentId`, `employeeType`, `status` | `department`, `permanentActive`, `casualActive`, `totalActive`, `permanentInactive`, `casualInactive`, `totalInactive`, `grandTotal` |
| `/api/v1/report/hr-kpi/employee-gender-ratio` | `departmentId` | `department`, `permanentMale`, `permanentFemale`, `casualMale`, `casualFemale`, `totalMale`, `totalFemale`, `genderRatio` |
| `/api/v1/report/hr-kpi/leave-request-pipeline` | `departmentId`, `startDate`, `endDate` | `department`, `category`, `pending`, `approved`, `rejected`, `expired`, `total` |
| `/api/v1/report/hr-kpi/overtime-request-activity` | `departmentId`, `startDate`, `endDate` | `department`, `status`, `count`, `totalHoursRequested`, `approvedHours` |
| `/api/v1/report/hr-kpi/daily-attendance-rate` | `departmentId`, `date` | `department`, `present`, `absent`, `expectedTotal`, `attendanceRatePercent` |
| `/api/v1/report/hr-kpi/staff-requisition-pipeline` | `departmentId`, `startDate`, `endDate` | `department`, `status`, `count`, `totalPositionsRequired` |
| `/api/v1/report/hr-kpi/employee-grade-level-distribution` | `departmentId` | `department`, `juniorStaff`, `seniorStaff`, `seniorManagement`, `total` |
| `/api/v1/report/hr-kpi/new-hires-this-period` | `departmentId`, `startDate`, `endDate` | `department`, `permanentNewHires`, `casualNewHires`, `totalNewHires` |
| `/api/v1/report/hr-kpi/employee-turnover-rate` | `departmentId`, `startDate`, `endDate` | `department`, `leavers`, `averageHeadcount`, `turnoverRatePercent` |
| `/api/v1/report/hr-kpi/leave-utilisation-rate` | `departmentId`, `year` | `department`, `staffDueForLeave`, `totalDaysAllowed`, `totalDaysUsed`, `utilisationPercent` |
| `/api/v1/report/hr-kpi/active-disciplinary-actions` | `departmentId` | `department`, `underQuestion`, `formalWarning`, `finalWarning`, `suspended`, `totalUnderDisciplinaryAction` |
| `/api/v1/report/hr/employee-master-list` | `departmentId`, `employeeType`, `gradeLevel`, `status`, `asOfDate` | `no`, `staffNumber`, `firstName`, `lastName`, `email`, `phoneNumber`, `gender`, `dateOfBirth`, `dateEmployed`, `employmentType`, `gradeLevel`, `status`, `department`, `designation`, `reportingManager`, `nationality`, `region`, `maritalStatus`, `religion`, `bankAccountNumber`, `ssnitNumber`, `ghanaCardNumber`, `annualLeaveEntitlement` |
| `/api/v1/report/hr/employee-directory-by-department` | `departmentId`, `gradeLevel`, `employeeType` | `no`, `department`, `staffNumber`, `employeeName`, `designation`, `gradeLevel`, `employmentType`, `status`, `reportingManager`, `email`, `phone` |
| `/api/v1/report/hr/employee-demographics` | `departmentId` | `no`, `dimension`, `category`, `permanentCount`, `casualCount`, `totalCount`, `percentage` |
| `/api/v1/report/hr/staff-grade-level` | `departmentId` | `no`, `department`, `seniorMgtMale`, `seniorMgtFemale`, `seniorStaffMale`, `seniorStaffFemale`, `juniorStaffMale`, `juniorStaffFemale`, `totalMale`, `totalFemale`, `departmentalTotal` |
| `/api/v1/report/hr/leave-register` | `departmentId`, `leaveCategory`, `status`, `startDate`, `endDate` | `no`, `employeeName`, `staffNumber`, `department`, `leaveCategory`, `leaveType`, `startDate`, `endDate`, `durationDays`, `paidDays`, `unpaidDays`, `status`, `justification`, `contactPerson`, `destination`, `approvedBy`, `dateApplied` |
| `/api/v1/report/hr/leave-balance` | `departmentId`, `leaveYear`, `employeeId` | `no`, `employeeName`, `staffNumber`, `department`, `leaveYear`, `daysAllowed`, `daysUsed`, `daysRemaining`, `utilisation` |
| `/api/v1/report/hr/leave-approval-audit` | `departmentId`, `startDate`, `endDate`, `status` | `no`, `employee`, `leaveCategory`, `durationDays`, `approvalStage`, `approver`, `actionTaken`, `actionDate`, `comments`, `finalStatus` |
| `/api/v1/report/hr/overtime-request-register` | `departmentId`, `startDate`, `endDate`, `status` | `no`, `requestCode`, `department`, `employees`, `overtimeDate`, `startTime`, `endTime`, `totalHours`, `justification`, `status`, `approvedBy`, `dateRequested` |
| `/api/v1/report/hr/staff-requisition-register` | `departmentId`, `status`, `appointmentType`, `startDate`, `endDate` | `no`, `department`, `designation`, `positionsRequired`, `appointmentType`, `budgetStatus`, `requestUrgency`, `businessJustification`, `requiredQualifications`, `educationRequirements`, `additionalRequirements`, `status`, `dateRequested` |
| `/api/v1/report/hr/employee-disciplinary-report` | `departmentId`, `disciplinaryStatus` | `no`, `employeeName`, `staffNumber`, `department`, `designation`, `disciplinaryStatus`, `suspensionStartDate`, `suspensionEndDate`, `activeStatus`, `daysUnderAction` |
| `/api/v1/report/hr/employee-exit-report` | `departmentId`, `exitReason`, `startDate`, `endDate` | `no`, `employeeName`, `staffNumber`, `department`, `designation`, `employmentType`, `gradeLevel`, `exitReason`, `exitDate`, `dateEmployed`, `tenureYears`, `noticePeriodServed` |
| `/api/v1/report/hr/employee-anniversary-birthday` | `departmentId`, `eventType`, `startDate`, `endDate` | `no`, `eventType`, `employeeName`, `staffNumber`, `department`, `designation`, `eventDate`, `yearsOfService`, `age` |
| `/api/v1/report/hr/shift-schedule-register` | `departmentId`, `startDate`, `endDate`, `status` | `no`, `scheduleName`, `frequency`, `startDate`, `endDate`, `status`, `employee`, `shiftType`, `shiftDate`, `rotationType` |
| `/api/v1/suppliers/{supplierId}/spend-summary` | `from`, `to` | Undeclared body / file / inspect source |
| `/api/v1/report/bmr-issued` | `startDate` (required), `endDate` (required), `departmentId` | `startDate`, `endDate`, `departmentId`, `departmentName`, `generatedAt`, `totalIssued`, `rows` |

## Feature module manifest register

From `apps/web/src/modules/*/manifest.ts`; declaration only, not feature acceptance. Leaf modules are deliberately smaller than the business review groups in this study.

| Feature directory | Label | Root |
| --- | --- | --- |
| `about-to-expire-materials` | About to expire materials | `/warehouse/about-to-expire-materials` |
| `activities` | Production board | `/production/activities` |
| `alerts` | Alerts | `/settings/alert` |
| `analytical-test-requests` | Analytical test requests | `/atr` |
| `approval-rights-transfer` | Transfer approval rights | `/qa/approval-rights-transfer` |
| `approval-settings` | Approval workflows | `/settings/approvals` |
| `approved-materials` | Approved materials | `/warehouse/approved-materials` |
| `approved-products` | Approved products | `/warehouse/approved-products` |
| `attendance` | Attendance summary | `/hr/attendance-report-summary` |
| `attendance-upload` | Attendance upload | `/hr/attendance-report-upload` |
| `audit-trail` | Audit trail | `/access-management/audit-trail` |
| `available-stock` | Available stock | `/stock/available` |
| `billing-sheets` | Billing sheets | `/logistics/billing-sheets` |
| `change-password` | Change password | `/settings/change-password` |
| `code-settings` | Code settings | `/settings/code-settings` |
| `collection-configurations` | Configuration collections | `/settings/config` |
| `commercial-certificates` | Commercial certificates | `/qc/commercial-certificates` |
| `compensation` | Employee compensation | `/hr/employee-compensation` |
| `contractors` | Service providers | `/extrals/services-providers` |
| `costing` | Costing | `/finance/costing` |
| `crm-job-requests` | Job requests (CRM) | `/crm/jobs/job-request` |
| `customer-quotations` | Customer quotations | `/crm/quotations` |
| `customers` | Customers | `/crm/customers` |
| `damage-missing` | Damage/Missing Items | `/extrals/damage-missing-items` |
| `department-employees` | Department employees | `/hr/department-employee-export` |
| `departments` | Departments | `/settings/departments` |
| `designations` | Designation management | `/hr/designation-management` |
| `distributed-area` | Distributed area | `/warehouse/distributed-area` |
| `employees` | Employee management | `/hr/employee-management` |
| `equipment` | Equipment | `/settings/equipments` |
| `expired-materials` | Expired materials | `/warehouse/expired-materials` |
| `extra-material-issue` | Extra material requisitions | `/warehouse/extra-material` |
| `fg-allocations` | Packing lists and allocations | `/crm/allocations` |
| `fg-invoices` | Invoices | `/crm/invoices` |
| `fg-products` | FG products | `/warehouse/fg-products` |
| `fg-proforma-invoices` | Proforma invoices | `/crm/proforma-invoice` |
| `fgtn-dashboard` | FGTN dashboard | `/fgtn-dashbord` |
| `finance` | Finance | `/finance` |
| `finished-goods-notes` | Finished goods transfer notes | `/warehouse/finished-goods-transfer-notes` |
| `form-templates` | Templates | `/settings/templates` |
| `formula-approvals` | Formula Approvals | `/qa/formula-approvals` |
| `formula-builder` | Formula builder | `/formula` |
| `formula-reviews` | Formula Reviews | `/qa/formula-reviews` |
| `general-inventory` | General inventory | `Inspect manifest` |
| `holidays` | Holidays | `/settings/holidays` |
| `hr-dashboard` | HR dashboard | `/hr-dashboard` |
| `hr-executive-summary` | HR executive summary | `/hr-executive-summary` |
| `hr-reports` | HR reports | `/hr/human-resources-report` |
| `inventory-command-center` | Inventory command centre | `/inventory-command-center` |
| `issue-bmr` | Issue BMR/BPR | `/qa/issue-bmr` |
| `issue-stock` | Issue stock | `/extrals/issue-stock` |
| `it-tickets` | IT tickets | `/it` |
| `job-orders` | Job orders | `/extrals/job-orders` |
| `job-requests` | Job requests | `/extrals/job-requests` |
| `leave-management` | Leave management | `/hr/leave-management` |
| `leave-types` | Leave type configuration | `/hr/leave-configuration` |
| `location-chart` | Location chart | `/warehouse/location-chart` |
| `locations` | Locations | `/settings/locations` |
| `logistics-dashboard` | Logistics dashboard | `/logistics-dashboard` |
| `manufacturers` | Manufacturers | `/settings/manufacturers` |
| `material-ards` | Material analytical raw data | `/qc/analytical-raw-data` |
| `material-distribution` | Material distribution | `/procurement/material-distribution` |
| `material-location` | Material location | `/warehouse/material-location` |
| `material-retests` | Material retests | `/qc/material-retests` |
| `material-returns` | Material returns | `/warehouse/material-returns` |
| `material-specifications` | Material specifications | `/qc/material-specification` |
| `material-stps` | Material STPs | `/qc/material-stp` |
| `materials` | Materials | `/warehouse/materials` |
| `oos-investigations` | OOS investigations | `/qa/oos-investigations` |
| `overtime` | Overtime management | `/hr/overtime-management` |
| `payroll-configuration` | Payroll configuration | `/hr/payroll-configuration` |
| `payroll-runs` | Payroll runs | `/hr/payroll-runs` |
| `pending-approvals` | My pending approvals | `/qa/pending-approvals` |
| `performance-cycles` | Performance cycles | `/hr/performance-cycles` |
| `performance-goals` | Goals | `/hr/goals` |
| `performance-reviews` | Performance reviews | `/hr/performance-reviews` |
| `permissions` | Permissions | `/access-management/permissions` |
| `price-comparison` | Price comparison | `/procurement/price-comparison` |
| `procurement-dashboard` | Procurement dashboard | `/procurement-dashboard` |
| `product-ards` | Product analytical raw data | `/qc/product-analytical-raw-data` |
| `product-specifications` | Product specifications | `/qc/product-specification` |
| `product-stps` | Product STPs | `/qc/products-stp` |
| `production-health-dashboard` | Production health dashboard | `/production-health-dashboard` |
| `production-orders` | Production orders | `/crm/production-order` |
| `production-transfers` | Production stock transfers | `/production/stock-transfer-requests` |
| `products` | Planned products | `/production/products` |
| `proforma-requests` | Proforma requests | `/procurement/awarded-quotations` |
| `proforma-responses` | Proforma responses | `/procurement/profoma-responses` |
| `purchase-order-lists` | Order lists | `/procurement/purchase-order-lists` |
| `purchase-orders` | Purchase orders | `/procurement/purchase-orders` |
| `qa-qc-dashboard` | QA and QC dashboards | `/qa-qc-dashboard` |
| `qc-ai-extraction` | AI extraction settings | `/settings/qc/ai-extraction` |
| `qc-equipment` | QC equipment | `/settings/qc-equipments` |
| `qc-grn` | Goods receipt notes (QC) | `/qc/goods-receipt-note` |
| `qc-rework` | QC rework | `/qc/rework-tasks` |
| `qc-routines` | Routine tests | `/qc/routines` |
| `quarantine-area` | Quarantine area | `/warehouse/quarantine-area` |
| `questions` | Questions | `/settings/questions` |
| `quotation-requests` | Quotation requests | `/procurement/quotations` |
| `quotation-responses` | Quotation responses | `/procurement/sales-quotation` |
| `racks` | Racks | `/settings/racks` |
| `receiving-area` | Receiving area | `/warehouse/receiving-area` |
| `rejected-area` | Rejected area | `/warehouse/rejected-area` |
| `reports` | Reports | `/reports` |
| `requisitions` | Requisitions | `/production/requisition` |
| `return-items` | Return items | `/extrals/return-items` |
| `roles` | Roles | `/access-management/roles` |
| `schedules` | Production schedules | `/production/schedules` |
| `service-comparison` | Service price comparison | `/extrals/service-price-comparison` |
| `service-memos` | Service memos | `/extrals/service-memo` |
| `service-procurement` | Service quote responses | `/extrals/service-quotation-response` |
| `service-proformas` | Service proforma invoices | `/extrals/service-proforma-request` |
| `services-dashboard` | Services dashboard | `/services-dashboard` |
| `settings-home` | System configuration | `/settings` |
| `shelves` | Shelves | `/settings/shelves` |
| `shift-categories` | Shift categories | `/settings/shift-categories` |
| `shift-planning` | Plan shift | `/plan-shift` |
| `shift-schedules` | Shift schedule | `/settings/shift-schedule` |
| `shift-types` | Shift types | `/settings/shift-types` |
| `shift-upload` | Shift schedule upload | `/hr/shift-schedule-upload` |
| `shipment-discrepancies` | Shipment discrepancies | `/logistics/shipment-discrepancies` |
| `shipment-documents` | Shipment documents | `/logistics/shipment-documents` |
| `shipment-invoices` | Shipment invoices | `/logistics/shipment-invoices` |
| `signature-settings` | Signature settings | `/settings/signature` |
| `sites` | Sites | `/settings/sites` |
| `sourcing` | Purchase requisitions | `/procurement/requisition` |
| `staff-requisitions` | Staff requisitions | `/hr/staff-requisition` |
| `stock-adjustments` | Stock adjustments | `/warehouse/stock-adjustments` |
| `stock-discrepancies` | Stock discrepancies | `/warehouse/stock-discrepancies` |
| `stock-issue` | Issue stock requisitions | `/warehouse/stock-requisition` |
| `stock-requisitions` | Stock requisitions | `/extrals/stock-requisitions` |
| `stock-transfers` | Stock transfers | `/warehouse/stock-transfer-requests` |
| `store-procurement` | Store procurement | `/extrals/procurement` |
| `store-purchase-requisitions` | Store purchase requisitions | `/extrals/purchase-requisitions` |
| `store-services` | Services | `/extrals/services` |
| `store-stock` | Store stock | `/extrals` |
| `store-vendors` | Store vendors | `/extrals/vendors` |
| `stores-dashboard` | Stores dashboard | `/stores-dashboard` |
| `supplier-compliance` | Supplier compliance | `/procurement/supplier-compliance` |
| `suppliers` | Suppliers | `/settings/suppliers` |
| `swap-requests` | Swap requests | `/warehouse/swap-requests` |
| `units-of-measure` | Units of measure | `/settings/uom` |
| `upload-center` | Upload Center | `/settings/upload-center` |
| `user-passwords` | Change user password | `/settings/user-passwords` |
| `users` | Users | `/access-management/users` |
| `warehouse-dashboard` | Warehouse dashboard | `/warehouse-dashboard` |
| `warehouses` | Stores | `/settings/warehouses` |
| `waybills` | Waybills | `/logistics/waybill` |
| `working-days` | Working days | `/settings/working-days` |
| `working-hours-policy` | Working hours policy | `/settings/working-hours-policy` |
| `workspace` | Workspace | `/home` |

## Refresh method

Recount the manifest and workspace page globs, parse the navigation catalogue and report definitions, then inspect the versioned OpenAPI GET operations and their response references. Preserve this dated snapshot; add a new dated revision when implementations or definitions change. Do not assume another branch or deployed server has these contracts.
