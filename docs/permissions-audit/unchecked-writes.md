# Desktop write call sites without an execution-time check (generated)

Files that call a mutation hook but contain neither `usePermissionAction`/`allowsNow` nor a `ConfirmActionDialog`/`ConfirmDeleteDialog` with `require`. Some are checked by a parent component; each needs review. Read-only POST lookups (collections, document download) are excluded.

| File | Mutations |
| --- | --- |
| `shared/specifications/use-approve-specification.ts` | `PostApiV1Verification` |
| `shared/auth/avatar-form.tsx` | `PostApiV1UserAvatarById` |
| `shared/notifications/use-notifications.ts` | `PutApiV1AlertByIdMarkAsRead` |
| `modules/customers/components/profile-panel.tsx` | `UpdateCustomerProfile` |
| `modules/location-chart/components/move-stock-dialog.tsx` | `MoveShelfStock` |
| `modules/stock-adjustments/components/adjustment-pages.tsx` | `PostApiV1StockAdjustment` |
| `modules/material-retests/testing/oos-case.tsx` | `PostApiV1QcWorksheetsOosCasesByIdAuthorizeRetest`, `PostApiV1QcWorksheetsOosCasesByIdDisposition`, `PostApiV1QcWorksheetsOosCasesByIdEscalate`, `PostApiV1QcWorksheetsOosCasesByIdStartInvestigation`, `PutApiV1QcWorksheetsOosCasesByIdInvestigation` |
| `modules/material-retests/testing/worksheet-action.tsx` | `PostApiV1QcWorksheetsInstancesByIdAssign`, `PostApiV1QcWorksheetsInstancesByIdReassign`, `PostApiV1QcWorksheetsInstancesByIdReview`, `PostApiV1QcWorksheetsInstancesByIdStart`, `PostApiV1QcWorksheetsInstancesByIdSubmit`, `PutApiV1QcWorksheetsInstancesByIdValues` |
| `modules/material-retests/components/retest-action.tsx` | `PostApiV1QcMaterialRetestsByIdAcknowledge`, `PostApiV1QcMaterialRetestsByIdApprove`, `PostApiV1QcMaterialRetestsByIdReject`, `PostApiV1QcMaterialRetestsByIdSample`, `PostApiV1QcMaterialRetestsByIdTestRequest` |
| `modules/material-retests/components/request-dialog.tsx` | `PostApiV1QcMaterialRetestsBatchesByBatchId` |
| `modules/material-distribution/components/confirm-distribution-dialog.tsx` | `ConfirmMaterialDistribution` |
| `modules/proforma-responses/components/proforma-invoice-dialog.tsx` | `PutApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderId`, `UploadPurchaseOrderFiles` |
| `modules/warehouses/components/store-dialog.tsx` | `PostApiV1Warehouse`, `PutApiV1WarehouseByWarehouseId` |
| `modules/finished-goods-notes/note-pages.tsx` | `ApproveTransferNote` |
| `modules/distributed-area/components/shelve-stock-dialog.tsx` | `PostApiV1MaterialDistributeMaterialMoveBatch` |
| `modules/purchase-orders/components/reassign-line-dialog.tsx` | `PostApiV1RequisitionSourceQuotationProcessPurchaseOrder`, `PutApiV1ProcurementPurchaseOrderByPurchaseOrderIdRevise` |
| `modules/purchase-orders/components/finalise-order-dialog.tsx` | `PutApiV1ProcurementPurchaseOrderByPurchaseOrderId` |
| `modules/purchase-orders/components/check-order-dialog.tsx` | `PutApiV1ProcurementPurchaseOrderCheckByPurchaseOrderId` |
| `modules/purchase-orders/components/send-order-dialog.tsx` | `PostApiV1ProcurementPurchaseOrderByPurchaseOrderId` |
| `modules/signature-settings/hooks/use-save-signature.ts` | `PostApiV1UserSignatureById` |
| `modules/shelves/components/remove-shelf-dialog.tsx` | `DeleteApiV1WarehouseShelfByShelfId` |
| `modules/shelves/components/shelf-dialog.tsx` | `PostApiV1WarehouseByRackIdShelf`, `PutApiV1WarehouseShelfByShelfId` |
| `modules/pending-approvals/components/details/start-oos-dialog.tsx` | `PostApiV1QaOosInvestigationsInitiate` |
| `modules/pending-approvals/hooks/use-approval-decision.ts` | `PostApiV1ApprovalApproveByModelTypeAndModelId`, `PostApiV1ApprovalRejectByModelTypeAndModelId` |
| `modules/quotation-requests/components/quotation-request-dialog.tsx` | `PostApiV1RequisitionSourceSupplierBySupplierIdSendQuotation` |
| `modules/requisitions/components/purchase-requisition-dialog.tsx` | `PostApiV1Requisition` |
| `modules/stock-issue/hooks/use-raise-swaps.ts` | `PostApiV1WarehouseSwap` |
| `modules/it-tickets/components/ticket-activity.tsx` | `PostApiV1TicketsByIdComments` |
| `modules/it-tickets/hooks/use-ticket-moves.ts` | `PutApiV1TicketsByIdClose`, `PutApiV1TicketsByIdDone`, `PutApiV1TicketsByIdStart` |
| `modules/shipment-invoices/components/create-invoice-form.tsx` | `PostApiV1ProcurementShipmentInvoice` |
| `modules/departments/department-dialog.tsx` | `PostApiV1Department`, `PutApiV1DepartmentByDepartmentId` |
| `modules/stock-transfers/components/allocation-page.tsx` | `ShelveHeldStock` |
| `modules/proforma-requests/components/proforma-request-dialog.tsx` | `PostApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderId` |
| `modules/material-returns/components/return-pages.tsx` | `PostApiV1MaterialBatchSupply` |
| `modules/oos-investigations/components/investigation-action.tsx` | `PutApiV1QaOosInvestigationsById`, `PutApiV1QaOosInvestigationsByIdQaReview`, `PutApiV1QaOosInvestigationsByIdSubmit` |
| `modules/racks/components/rack-dialog.tsx` | `PostApiV1WarehouseByLocationIdRack`, `PutApiV1WarehouseRackByRackId` |
| `modules/shipment-discrepancies/components/make-up-dialog.tsx` | `PostApiV1ProcurementShipmentInvoiceShortageMakeUp` |
| `modules/locations/components/location-dialog.tsx` | `PostApiV1WarehouseByWarehouseIdLocation`, `PutApiV1WarehouseLocationByLocationId` |
| `modules/activities/components/step/atr-dialog.tsx` | `PostApiV1QaAnalyticalTests` |
| `modules/activities/components/step/stock-requisition-dialog.tsx` | `PostApiV1Requisition` |
| `modules/activities/components/step/finished-goods-dialog.tsx` | `PostApiV1ProductionScheduleFinishedGoodsTransferNote` |
| `modules/activities/components/extra-material/extra-material-form.tsx` | `PostApiV1ProductionScheduleExtraPackingByProductionScheduleProductId` |
| `modules/fg-dispatch/components/proforma-dialog.tsx` | `PostApiV1ProductionOrdersProformaInvoice` |
| `modules/working-days/working-days-page.tsx` | `SaveWorkingDays` |
| `modules/production-orders/components/packing-list-dialog.tsx` | `PostApiV1ProductionOrdersAllocate`, `PutApiV1ProductionOrdersAllocateByAllocateProductionOrderId` |
| `modules/production-orders/components/order-pages.tsx` | `ConvertCustomerQuotation` |
| `modules/change-password/components/password-form.tsx` | `PostApiV1AuthUserResetPassword` |
| `modules/shipment-documents/components/create-shipment-form.tsx` | `UploadShipmentFiles` |
| `modules/shipment-documents/hooks/use-shipments.ts` | `PostApiV1ProcurementShipmentDocument`, `PostApiV1ProcurementWaybill` |
| `modules/receiving-area/components/create-checklist-form.tsx` | `CreateChecklist` |
| `modules/upload-center/components/upload-center-page.tsx` | `ProductTemplate`, `UploadAttendance`, `UploadProductStock`, `UploadShiftAssignments` |
| `modules/billing-sheets/components/create-billing-sheet-form.tsx` | `PostApiV1ProcurementBillingSheet`, `UploadBillingSheetFiles` |
| `modules/billing-sheets/components/add-charges-dialog.tsx` | `PostApiV1ProcurementBillingSheetChargeByBillingSheetId` |
| `modules/billing-sheets/components/edit-billing-sheet-form.tsx` | `PutApiV1ProcurementBillingSheetByBillingSheetId` |
| `modules/billing-sheets/components/pay-charges-dialog.tsx` | `PutApiV1ProcurementBillingSheetCharge` |
| `modules/leave-management/components/leave-change-dialog.tsx` | `PutApiV1LeaveRequestByLeaveRequestIdReapply`, `PutApiV1LeaveRequestRecall` |
| `modules/employees/components/employee-change-dialog.tsx` | `PutApiV1EmployeeByIdChangeType`, `PutApiV1EmployeeByIdStatus`, `PutApiV1EmployeeEmailById` |
