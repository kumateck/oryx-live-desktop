# Permission key catalog (generated)

Every key the backend defines (`PermissionKeys`, `FullProcedurePermissionKeys`, `QcWorksheetPermissionKeys`) in Manage Permissions order, with where the desktop uses it and which endpoints enforce it on the server.

Flags: **unregistered** = defined but not in `GeneratePermissions()`, so no role can be granted it; **N submodules** = one tick box shown under several screens; **alias** = constant whose value is another key; **frontend-only** = not checked by any endpoint; **unused** = not referenced by the desktop.


## Warehouse › Expired Materials

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanUpdateMigrationRetestDate` | manifest×1 in `modules/expired-materials/components/migration-retest-dialog.tsx` | `PUT /api/v1/material/batch/{batchid}/migration-retest-date` |  |

## Settings › Opening Balances

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewOpeningBalances` | constant×2, some-rule×1, manifest×1 in `modules/upload-center/lib/stock-migration.ts`; `modules/upload-center/lib/upload-center.ts`; `modules/upload-center/manifest.ts` | `POST /api/v1/material/upload/stock`; `POST /api/v1/stock-migrations/top-ups/upload`; `POST /api/v1/stock-migrations/top-ups` (+11) |  |
| `CanUploadOpeningBalances` | constant×1 in `modules/upload-center/lib/stock-migration.ts` | `POST /api/v1/material/upload/stock`; `POST /api/v1/stock-migrations/top-ups/upload`; `POST /api/v1/stock-migrations/top-ups` (+1) |  |
| `CanCorrectOpeningBalances` | constant×1 in `modules/upload-center/lib/stock-migration.ts` | `PUT /api/v1/stock-migrations/{id}/lines/{lineid}`; `PUT /api/v1/stock-migrations/{id}/lines`; `PUT /api/v1/stock-migrations/{id}/units` (+2) |  |
| `CanApproveOpeningBalances` | constant×1 in `modules/upload-center/lib/stock-migration.ts` | `POST /api/v1/stock-migrations/{id}/approve` |  |

## Procurement › Purchase Requisition

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPurchaseRequisitions` | constant×3, some-rule×1, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/procurement-dashboard/manifest.ts`; `modules/sourcing/manifest.ts` | — | frontend-only |
| `CanSourcePurchaseRequisition` | constant×1 in `modules/sourcing/lib/sourcing-access.ts` | — | frontend-only |

## Procurement › Quotations Request

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewForeignQuotation` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/quotation-requests/lib/quotation-request-access.ts`; `modules/quotation-requests/manifest.ts` | — | frontend-only |
| `CanSendForeignQuotationRequest` | constant×1 in `modules/quotation-requests/lib/quotation-request-access.ts` | — | frontend-only |
| `CanViewLocalQuotation` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/quotation-requests/lib/quotation-request-access.ts`; `modules/quotation-requests/manifest.ts` | — | frontend-only |
| `CanSendLocalQuotationRequest` | constant×1 in `modules/quotation-requests/lib/quotation-request-access.ts` | — | frontend-only |

## Procurement › Quotations Responses

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewForeignQuotationResponse` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/quotation-responses/lib/quotation-response-access.ts`; `modules/quotation-responses/manifest.ts` | — | frontend-only |
| `CanSendForeignQuotationResponse` | constant×1 in `modules/quotation-responses/lib/quotation-response-access.ts` | — | frontend-only |
| `CanViewLocalQuotationResponse` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/quotation-responses/lib/quotation-response-access.ts`; `modules/quotation-responses/manifest.ts` | — | frontend-only |
| `CanSendLocalQuotationResponse` | constant×1 in `modules/quotation-responses/lib/quotation-response-access.ts` | — | frontend-only |

## Procurement › Price Comparison

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewForeignVendorPricing` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/price-comparison/lib/comparison-access.ts`; `modules/price-comparison/manifest.ts` | — | frontend-only |
| `CanApplyChangesForForeignVendorPricingSelection` | constant×1 in `modules/price-comparison/lib/comparison-access.ts` | — | frontend-only |
| `CanViewLocalVendorPricing` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/price-comparison/lib/comparison-access.ts`; `modules/price-comparison/manifest.ts` | — | frontend-only |
| `CanApplyChangesForLocalVendorPricingSelection` | constant×1 in `modules/price-comparison/lib/comparison-access.ts` | — | frontend-only |

## Procurement › Proforma Request

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewForeignProformaRequest` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/proforma-requests/lib/proforma-request-access.ts`; `modules/proforma-requests/manifest.ts` | — | frontend-only |
| `CanSendForeignProformaRequest` | constant×1 in `modules/proforma-requests/lib/proforma-request-access.ts` | — | frontend-only |
| `CanViewLocalProformaRequest` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/proforma-requests/lib/proforma-request-access.ts`; `modules/proforma-requests/manifest.ts` | — | frontend-only |
| `CanSendLocalProformaRequest` | constant×1 in `modules/proforma-requests/lib/proforma-request-access.ts` | — | frontend-only |

## Procurement › Proforma Responses

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewForeignProformaInvoiceSubmissions` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/proforma-responses/lib/proforma-response-access.ts`; `modules/proforma-responses/manifest.ts` | — | frontend-only |
| `CanSendForeignProformaInvoice` | constant×1 in `modules/proforma-responses/lib/proforma-response-access.ts` | — | frontend-only |
| `CanViewLocalProformaInvoiceSubmissions` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/proforma-responses/lib/proforma-response-access.ts`; `modules/proforma-responses/manifest.ts` | — | frontend-only |
| `CanSendLocalProformaInvoice` | constant×1 in `modules/proforma-responses/lib/proforma-response-access.ts` | — | frontend-only |

## Procurement › Create Purchase Orders Page

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewForeignPurchaseOrder` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/purchase-order-lists/manifest.ts`; `modules/purchase-orders/lib/purchase-order-access.ts` (+2) | — | 4 submodules, frontend-only |
| `CanViewApprovedForeignPurchaseOrder` | constant×4 in `modules/navigation/catalog.generated.ts`; `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/purchase-orders/manifest.ts` | — | 3 submodules, frontend-only |
| `CanCreateForeignPurchaseOrder` | constant×2 in `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/roles/lib/permission-fixtures.ts` | — | 2 submodules, frontend-only |
| `CanViewLocalPurchaseOrder` | constant×6, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/purchase-order-lists/manifest.ts`; `modules/purchase-orders/lib/purchase-order-access.ts` (+1) | — | 4 submodules, frontend-only |
| `CanViewApprovedLocalPurchaseOrder` | constant×4 in `modules/navigation/catalog.generated.ts`; `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/purchase-orders/manifest.ts` | — | 4 submodules, frontend-only |
| `CanCreateLocalPurchaseOrder` | constant×1 in `modules/purchase-orders/lib/purchase-order-access.ts` | — | 2 submodules, frontend-only |

## Procurement › Check Purchase Order Page

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewForeignPurchaseOrder` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/purchase-order-lists/manifest.ts`; `modules/purchase-orders/lib/purchase-order-access.ts` (+2) | — | 4 submodules, frontend-only |
| `CanViewApprovedForeignPurchaseOrder` | constant×4 in `modules/navigation/catalog.generated.ts`; `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/purchase-orders/manifest.ts` | — | 3 submodules, frontend-only |
| `CanCheckForeignPurchaseOrder` | constant×1 in `modules/purchase-orders/lib/purchase-order-access.ts` | — | frontend-only |
| `CanViewLocalPurchaseOrder` | constant×6, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/purchase-order-lists/manifest.ts`; `modules/purchase-orders/lib/purchase-order-access.ts` (+1) | — | 4 submodules, frontend-only |
| `CanViewApprovedLocalPurchaseOrder` | constant×4 in `modules/navigation/catalog.generated.ts`; `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/purchase-orders/manifest.ts` | — | 4 submodules, frontend-only |
| `CanCheckLocalPurchaseOrder` | constant×1 in `modules/purchase-orders/lib/purchase-order-access.ts` | — | frontend-only |

## Procurement › Approve Purchase Order Page

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewForeignPurchaseOrder` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/purchase-order-lists/manifest.ts`; `modules/purchase-orders/lib/purchase-order-access.ts` (+2) | — | 4 submodules, frontend-only |
| `CanViewApprovedForeignPurchaseOrder` | constant×4 in `modules/navigation/catalog.generated.ts`; `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/purchase-orders/manifest.ts` | — | 3 submodules, frontend-only |
| `CanSendForeignPurchaseOrder` | — | — | unused, unused by desktop |
| `CanSendApprovedForeignPurchaseOrder` | constant×1 in `modules/purchase-orders/lib/purchase-order-access.ts` | — | frontend-only |
| `CanViewLocalPurchaseOrder` | constant×6, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/purchase-order-lists/manifest.ts`; `modules/purchase-orders/lib/purchase-order-access.ts` (+1) | — | 4 submodules, frontend-only |
| `CanViewApprovedLocalPurchaseOrder` | constant×4 in `modules/navigation/catalog.generated.ts`; `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/purchase-orders/manifest.ts` | — | 4 submodules, frontend-only |
| `CanSendLocalPurchaseOrder` | — | — | unused, unused by desktop |
| `CanSendApprovedLocalPurchaseOrder` | constant×1 in `modules/purchase-orders/lib/purchase-order-access.ts` | — | frontend-only |

## Procurement › Purchase Order List Page

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewForeignPurchaseOrder` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/purchase-order-lists/manifest.ts`; `modules/purchase-orders/lib/purchase-order-access.ts` (+2) | — | 4 submodules, frontend-only |
| `CanCreateForeignPurchaseOrder` | constant×2 in `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/roles/lib/permission-fixtures.ts` | — | 2 submodules, frontend-only |
| `CanReviseForeignPurchaseOrder` | some-rule×1, constant×1 in `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/purchase-orders/manifest.ts` | — | frontend-only |
| `CanDeleteForeignPurchaseOrderItem` | — | — | unused, unused by desktop |
| `CanReAssignForeignPurchaseOrderItem` | — | — | unused, unused by desktop |
| `CanChangeSupplySourceForeignPurchaseOrderItem` | — | — | unused, unused by desktop |
| `CanViewLocalPurchaseOrder` | constant×6, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/purchase-order-lists/manifest.ts`; `modules/purchase-orders/lib/purchase-order-access.ts` (+1) | — | 4 submodules, frontend-only |
| `CanViewApprovedLocalPurchaseOrder` | constant×4 in `modules/navigation/catalog.generated.ts`; `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/purchase-orders/manifest.ts` | — | 4 submodules, frontend-only |
| `CanCreateLocalPurchaseOrder` | constant×1 in `modules/purchase-orders/lib/purchase-order-access.ts` | — | 2 submodules, frontend-only |
| `CanReviseLocalPurchaseOrder` | some-rule×1, constant×1 in `modules/purchase-orders/lib/purchase-order-access.ts`; `modules/purchase-orders/manifest.ts` | — | frontend-only |
| `CanDeleteLocalPurchaseOrderItem` | — | — | unused, unused by desktop |
| `CanReAssignLocalPurchaseOrderItem` | — | — | unused, unused by desktop |
| `CanChangeSupplySourceLocalPurchaseOrderItem` | — | — | unused, unused by desktop |

## Procurement › Material Distribution

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewMaterialDistribution` | constant×3, manifest×1 in `modules/material-distribution/lib/distribution.ts`; `modules/material-distribution/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanDistributeMaterial` | constant×1 in `modules/material-distribution/lib/distribution.ts` | — | frontend-only |

## Logistics › Shipment Invoice

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCreateShipmentInvoice` | manifest×1, constant×1 in `modules/shipment-invoices/lib/invoice-access.ts`; `modules/shipment-invoices/manifest.ts` | — | frontend-only |
| `CanViewShipmentInvoice` | constant×4, some-rule×1, manifest×1 in `modules/logistics-dashboard/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/shipment-invoices/lib/invoice-access.ts` (+1) | — | frontend-only |
| `CanEditShipmentInvoice` | — | — | unused, unused by desktop |
| `CanDeleteShipmentInvoice` | — | — | unused, unused by desktop |

## Logistics › Waybill

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCreateWaybill` | manifest×2 in `modules/shipment-documents/lib/shipment-kinds.ts`; `modules/waybills/manifest.ts` | — | frontend-only |
| `CanViewWaybill` | constant×3, manifest×2, some-rule×1 in `modules/logistics-dashboard/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/shipment-documents/lib/shipment-kinds.ts` (+1) | — | frontend-only |
| `CanChangeWaybillStatus` | manifest×1 in `modules/shipment-documents/lib/shipment-kinds.ts` | — | frontend-only |
| `CanEditWaybill` | — | — | unused, unused by desktop |
| `CanDeleteWaybill` | — | — | unused, unused by desktop |

## Logistics › Shipment Document

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCreateShipmentDocument` | manifest×2 in `modules/shipment-documents/lib/shipment-kinds.ts`; `modules/shipment-documents/manifest.ts` | — | frontend-only |
| `CanViewShipmentDocument` | manifest×4, constant×2, require×2, has()×1 in `modules/navigation/catalog.generated.ts`; `modules/shipment-discrepancies/components/create-shipment-discrepancy.tsx`; `modules/shipment-discrepancies/components/shipment-discrepancy-detail.tsx` (+5) | — | frontend-only |
| `CanChangeShipmentDocumentStatus` | manifest×1 in `modules/shipment-documents/lib/shipment-kinds.ts` | — | frontend-only |
| `CanEditShipmentDocument` | — | — | unused, unused by desktop |
| `CanDeleteShipmentDocument` | — | — | unused, unused by desktop |
| `CanViewShipmentDiscrepancy` | constant×3, manifest×1, require×1 in `modules/navigation/catalog.generated.ts`; `modules/pending-approvals/lib/approval-documents.ts`; `modules/shipment-discrepancies/components/shipment-discrepancy-detail.tsx` (+1) | `GET /api/v1/approval/{modeltype}/{modelid}`; `GET /api/v1/approval/my-pending/{modeltype}/{modelid}`; `GET /api/v1/procurement/shipment-discrepancy` (+2) |  |
| `CanRecordShipmentDiscrepancy` | manifest×2, require×2, has()×1 in `modules/shipment-discrepancies/components/create-shipment-discrepancy.tsx`; `modules/shipment-discrepancies/components/shipment-discrepancy-pages.tsx`; `modules/shipment-discrepancies/manifest.ts` (+1) | `POST /api/v1/procurement/shipment-discrepancy` |  |

## Logistics › Shipment Invoice

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCreateShortageMakeUpInvoice` | require×1, constant×1 in `modules/shipment-discrepancies/components/make-up-dialog.tsx`; `modules/shipment-discrepancies/components/shipment-discrepancy-detail.tsx` | `POST /api/v1/procurement/shipment-invoice/shortage-make-up` |  |

## Logistics › Shipment Document

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanApproveShipmentDiscrepancy` | constant×1, has()×1 in `modules/pending-approvals/lib/approval-documents.ts`; `modules/shipment-discrepancies/components/shipment-discrepancy-detail.tsx` | `POST /api/v1/approval/approve/{modeltype}/{modelid}` |  |
| `CanRejectShipmentDiscrepancy` | constant×1, has()×1 in `modules/pending-approvals/lib/approval-documents.ts`; `modules/shipment-discrepancies/components/shipment-discrepancy-detail.tsx` | `POST /api/v1/approval/reject/{modeltype}/{modelid}` |  |

## Logistics › Billing Sheet

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCreateBillingSheet` | require×1, manifest×1, constant×1 in `modules/billing-sheets/lib/billing-access.ts`; `modules/billing-sheets/manifest.ts`; `modules/shipment-documents/components/shipments-table.tsx` | — | frontend-only |
| `CanViewBillingSheet` | constant×3, require×1, manifest×1 in `modules/billing-sheets/lib/billing-access.ts`; `modules/billing-sheets/manifest.ts`; `modules/navigation/catalog.generated.ts` (+1) | — | frontend-only |
| `CanEditBillingSheet` | require×1, manifest×1, constant×1 in `modules/billing-sheets/lib/billing-access.ts`; `modules/billing-sheets/manifest.ts`; `modules/shipment-documents/components/shipments-table.tsx` | — | frontend-only |
| `CanDeleteBillingSheet` | constant×1 in `modules/billing-sheets/lib/billing-access.ts` | — | frontend-only |

## Logistics › Available Stock

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialStock` | constant×3, some-rule×1 in `modules/available-stock/available-stock.ts`; `modules/available-stock/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanViewPackingMaterialStock` | constant×3, some-rule×1 in `modules/available-stock/available-stock.ts`; `modules/available-stock/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |

## Finance › Payments

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPayments` | constant×3 in `modules/finance/lib/access.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/payments`; `GET /api/v1/payments/{paymentid}` |  |
| `CanRecordPayment` | constant×2, require×1 in `modules/billing-sheets/lib/billing-access.ts`; `modules/finance/lib/access.ts`; `modules/shipment-documents/components/shipments-table.tsx` | `POST /api/v1/payments`; `PUT /api/v1/payments/base-currency/{currencyid}`; `POST /api/v1/payments/exchange-rates` (+1) |  |
| `CanApprovePayment` | has()×2, constant×2 in `modules/finance/lib/access.ts`; `modules/navigation/catalog.generated.ts`; `modules/pending-approvals/components/approval-detail-page.tsx` (+1) | `GET /api/v1/payments/{paymentid}/approval-details`; `POST /api/v1/payments/{paymentid}/review` |  |

## Finance › Cashflow Reports

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewCashflowReports` | constant×2 in `modules/finance/lib/access.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/payments/currency-configuration`; `GET /api/v1/payments/ap-aging`; `GET /api/v1/payments/ar-aging` (+2) |  |

## Finance › Costing

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanManageCosting` | constant×3 in `modules/costing/lib/costing.ts`; `modules/customers/lib/customers.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/costing/list-prices`; `GET /api/v1/costing/list-prices/{productid}/history`; `PUT /api/v1/costing/list-prices/{productid}` (+7) | alias of `ManageCosting` |

## Warehouse › Receiving Area

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialsItems` | constant×7, some-rule×3 in `modules/inventory-command-center/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/receiving-area/lib/receiving.ts` (+2) | — | frontend-only |
| `CanViewRawMaterialsReceivedList` | constant×2 in `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreatePreSamplingChecklist` | — | — | unused, unused by desktop |
| `CanCreateChecklistForRawMaterials` | some-rule×1, constant×1 in `modules/receiving-area/lib/receiving.ts`; `modules/receiving-area/manifest.ts` | — | frontend-only |
| `CanCreateGrnForRawMaterials` | constant×1, manifest×1 in `modules/receiving-area/lib/receiving.ts`; `modules/white-placebo/lib/white-placebo.ts` | `POST /api/v1/white-placebo/{id}/output` |  |
| `CanViewPackagingMaterialsItems` | constant×7, some-rule×3 in `modules/inventory-command-center/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/receiving-area/lib/receiving.ts` (+2) | — | frontend-only |
| `CanCreateChecklistForPackagingMaterials` | some-rule×1, constant×1 in `modules/receiving-area/lib/receiving.ts`; `modules/receiving-area/manifest.ts` | — | frontend-only |
| `CanCreateGrnForPackagingMaterials` | constant×1 in `modules/receiving-area/lib/receiving.ts` | — | frontend-only |

## Warehouse › Quarantine Area / GRN

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterials` | constant×3, some-rule×1 in `modules/materials/lib/material-access.ts`; `modules/materials/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | 3 submodules, frontend-only |
| `CanViewQuarantineRawMaterials` | constant×3, some-rule×1, require×1 in `modules/navigation/catalog.generated.ts`; `modules/quarantine-area/lib/quarantine.ts`; `modules/quarantine-area/manifest.ts` (+1) | — | frontend-only |
| `CanDistributeRawMaterials` | constant×1 in `modules/quarantine-area/lib/quarantine.ts` | — | frontend-only |
| `CanViewDistributedRawMaterials` | constant×3, some-rule×1 in `modules/distributed-area/lib/distributed-access.ts`; `modules/distributed-area/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanViewPackagingMaterials` | constant×3, some-rule×1 in `modules/materials/lib/material-access.ts`; `modules/materials/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | 3 submodules, frontend-only |
| `CanViewDistributedPackagingMaterials` | constant×3, some-rule×1 in `modules/distributed-area/lib/distributed-access.ts`; `modules/distributed-area/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanViewQuarantinePackagingMaterials` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/quarantine-area/lib/quarantine.ts`; `modules/quarantine-area/manifest.ts` | — | frontend-only |
| `CanDistributePackagingMaterials` | constant×1 in `modules/quarantine-area/lib/quarantine.ts` | — | frontend-only |

## Warehouse › Distributed Area

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterials` | constant×3, some-rule×1 in `modules/materials/lib/material-access.ts`; `modules/materials/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | 3 submodules, frontend-only |
| `CanAssignRawMaterialsStockToShelves` | constant×3 in `modules/distributed-area/lib/distributed-access.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanViewPackagingMaterials` | constant×3, some-rule×1 in `modules/materials/lib/material-access.ts`; `modules/materials/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | 3 submodules, frontend-only |
| `CanAssignPackagingMaterialsStockToShelves` | constant×3 in `modules/distributed-area/lib/distributed-access.ts`; `modules/navigation/catalog.generated.ts` | — | 2 submodules, frontend-only |

## Warehouse › Approved Materials

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewApprovedRawMaterials` | constant×3, some-rule×1 in `modules/approved-materials/lib/approved-material-access.ts`; `modules/approved-materials/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanViewApprovedPackagingMaterials` | constant×3, some-rule×1 in `modules/approved-materials/lib/approved-material-access.ts`; `modules/approved-materials/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |

## Warehouse › Linked Materials

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewLinkedRawMaterials` | constant×3 in `modules/materials/lib/material-access.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanEditLinkedRawMaterials` | constant×1 in `modules/materials/lib/material-access.ts` | — | frontend-only |
| `CanUnlinkRawMaterials` | constant×1 in `modules/materials/lib/material-access.ts` | — | frontend-only |
| `CanViewLinkedPackagingMaterials` | constant×3 in `modules/materials/lib/material-access.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanUnlinkPackagingMaterials` | constant×1 in `modules/materials/lib/material-access.ts` | — | frontend-only |

## Warehouse › Unlinked Materials

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewUnlinkedRawMaterials` | constant×3 in `modules/materials/lib/material-access.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanLinkRawMaterials` | constant×1 in `modules/materials/lib/material-access.ts` | — | frontend-only |
| `CanViewUnlinkedPackagingMaterials` | constant×3 in `modules/materials/lib/material-access.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanLinkPackagingMaterials` | constant×2 in `modules/materials/lib/material-access.ts` | — | frontend-only |

## Warehouse › Materials

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterials` | constant×3, some-rule×1 in `modules/materials/lib/material-access.ts`; `modules/materials/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | 3 submodules, frontend-only |
| `CanCreateNewRawMaterials` | constant×1 in `modules/materials/lib/material-access.ts` | — | frontend-only |
| `CanEditRawMaterials` | manifest×2, constant×1 in `modules/materials/lib/material-access.ts`; `modules/white-placebo/lib/white-placebo.ts`; `modules/white-placebo/manifest.ts` | `PUT /api/v1/white-placebo/recipe` |  |
| `CanDeleteRawMaterials` | constant×1 in `modules/materials/lib/material-access.ts` | — | frontend-only |
| `CanViewPackagingMaterials` | constant×3, some-rule×1 in `modules/materials/lib/material-access.ts`; `modules/materials/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | 3 submodules, frontend-only |
| `CanViewPackagingMaterialsReceivedList` | constant×2 in `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateNewPackagingMaterials` | constant×1 in `modules/materials/lib/material-access.ts` | — | frontend-only |
| `CanEditPackagingMaterials` | constant×1 in `modules/materials/lib/material-access.ts` | — | frontend-only |
| `CanDeletePackagingMaterials` | constant×1 in `modules/materials/lib/material-access.ts` | — | frontend-only |

## Warehouse › Rejected Materials

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRejectedRawMaterials` | some-rule×1, manifest×1, constant×1 in `modules/navigation/catalog.generated.ts`; `modules/rejected-area/components/rejected-page.tsx`; `modules/rejected-area/manifest.ts` | — | frontend-only |
| `CanViewRejectedPackagingMaterials` | some-rule×1, manifest×1, constant×1 in `modules/navigation/catalog.generated.ts`; `modules/rejected-area/components/rejected-page.tsx`; `modules/rejected-area/manifest.ts` | — | frontend-only |

## Warehouse › Issue Stock Requisitions

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialRequisitions` | constant×8, manifest×3, some-rule×1, require×1 in `modules/navigation/catalog.generated.ts`; `modules/requisitions/lib/requisition-access.ts`; `modules/requisitions/manifest.ts` (+4) | `GET /api/v1/requisition`; `GET /api/v1/requisition/department`; `GET /api/v1/requisition/{requisitionid}` (+6) |  |
| `CanIssueRawMaterialRequisitions` | constant×8, some-rule×3 in `modules/extra-material-issue/components/extra-material-page.tsx`; `modules/extra-material-issue/manifest.ts`; `modules/navigation/catalog.generated.ts` (+5) | `POST /api/v1/white-placebo/{id}/issue` |  |
| `CanSwapRawMaterialRequisitions` | — | — | unused, unused by desktop |
| `CanViewPackagingMaterialRequisitions` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/requisitions/lib/requisition-access.ts`; `modules/requisitions/manifest.ts` (+2) | — | 2 submodules, frontend-only |
| `CanIssuePackagingMaterialRequisitions` | constant×8, some-rule×3 in `modules/extra-material-issue/components/extra-material-page.tsx`; `modules/extra-material-issue/manifest.ts`; `modules/navigation/catalog.generated.ts` (+4) | — | 2 submodules, frontend-only |
| `CanSwapPackagingMaterialRequisitions` | — | — | unused, unused by desktop |

## Warehouse › Extra Packaging Requisitions

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPackagingMaterialRequisitions` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/requisitions/lib/requisition-access.ts`; `modules/requisitions/manifest.ts` (+2) | — | 2 submodules, frontend-only |
| `CanIssuePackagingMaterialRequisitions` | constant×8, some-rule×3 in `modules/extra-material-issue/components/extra-material-page.tsx`; `modules/extra-material-issue/manifest.ts`; `modules/navigation/catalog.generated.ts` (+4) | — | 2 submodules, frontend-only |

## Warehouse › Material Return Note

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewMaterialsReturnNote` | constant×2, manifest×1 in `modules/material-returns/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanAssignPackagingMaterialsStockToShelves` | constant×3 in `modules/distributed-area/lib/distributed-access.ts`; `modules/navigation/catalog.generated.ts` | — | 2 submodules, frontend-only |

## Warehouse › Expired Materials

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewExpiredMaterials` | manifest×2, constant×2, require×1 in `modules/approved-materials/components/stock-tables.tsx`; `modules/expired-materials/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/material/batches/expired` |  |
| `CanViewAboutToExpireMaterials` | constant×2, manifest×2 in `modules/about-to-expire-materials/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/material/batches/about-to-expire` |  |

## Warehouse › Material Location

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialLocationChartList` | constant×5, some-rule×1 in `modules/location-chart/lib/location-access.ts`; `modules/location-chart/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanReassignRawMaterialStock` | constant×1 in `modules/location-chart/lib/location-access.ts` | — | frontend-only |
| `CanViewRawMaterialLocationList` | constant×3, some-rule×1 in `modules/material-location/lib/material-location-access.ts`; `modules/material-location/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanViewPackagingMaterialLocationChartList` | constant×5, some-rule×1 in `modules/location-chart/lib/location-access.ts`; `modules/location-chart/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanReassignPackagingMaterialStock` | constant×1 in `modules/location-chart/lib/location-access.ts` | — | frontend-only |
| `CanViewPackagingMaterialLocationList` | constant×3, some-rule×1 in `modules/material-location/lib/material-location-access.ts`; `modules/material-location/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |

## Warehouse › Stock Adjustment

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewMaterialStockAdjustment` | constant×5, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/stock-adjustments/adjustments.ts`; `modules/stock-adjustments/manifest.ts` | — | frontend-only |
| `CanCreateMaterialStockAdjustment` | constant×1, manifest×1 in `modules/stock-adjustments/adjustments.ts`; `modules/stock-adjustments/manifest.ts` | — | frontend-only |
| `CanViewStockDiscrepancy` | constant×3, manifest×1, require×1 in `modules/navigation/catalog.generated.ts`; `modules/pending-approvals/lib/approval-documents.ts`; `modules/stock-discrepancies/components/stock-discrepancy-detail.tsx` (+1) | `GET /api/v1/approval/{modeltype}/{modelid}`; `GET /api/v1/approval/my-pending/{modeltype}/{modelid}`; `GET /api/v1/stock-discrepancy` (+1) |  |
| `CanRecordStockDiscrepancy` | require×2, manifest×1, constant×1 in `modules/stock-discrepancies/components/create-stock-discrepancy.tsx`; `modules/stock-discrepancies/components/stock-discrepancy-pages.tsx`; `modules/stock-discrepancies/manifest.ts` | `POST /api/v1/stock-discrepancy` |  |
| `CanApproveStockDiscrepancy` | constant×1, has()×1 in `modules/pending-approvals/lib/approval-documents.ts`; `modules/stock-discrepancies/components/stock-discrepancy-detail.tsx` | `POST /api/v1/approval/approve/{modeltype}/{modelid}` |  |
| `CanRejectStockDiscrepancy` | constant×1, has()×1 in `modules/pending-approvals/lib/approval-documents.ts`; `modules/stock-discrepancies/components/stock-discrepancy-detail.tsx` | `POST /api/v1/approval/reject/{modeltype}/{modelid}` |  |
| `CanReconcileStockDiscrepancy` | constant×1, require×1, has()×1 in `modules/stock-discrepancies/components/stock-discrepancy-detail.tsx` | `POST /api/v1/stock-discrepancy/{id}/reconcile` |  |

## Warehouse › Stock Transfer Issues

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialTransferList` | constant×5 in `modules/navigation/catalog.generated.ts`; `modules/stock-transfers/manifest.ts`; `modules/stock-transfers/transfers.ts` | — | 2 submodules, frontend-only |
| `CanIssueRawMaterialStockTransfers` | constant×5 in `modules/navigation/catalog.generated.ts`; `modules/stock-transfers/manifest.ts`; `modules/stock-transfers/transfers.ts` | — | frontend-only |
| `CanViewPackagingMaterialTransferList` | constant×5 in `modules/navigation/catalog.generated.ts`; `modules/stock-transfers/manifest.ts`; `modules/stock-transfers/transfers.ts` | — | 2 submodules, frontend-only |
| `CanIssuePackagingMaterialStockTransfers` | constant×5 in `modules/navigation/catalog.generated.ts`; `modules/stock-transfers/manifest.ts`; `modules/stock-transfers/transfers.ts` | — | frontend-only |

## Warehouse › Stock Transferred Allocated

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialTransferList` | constant×5 in `modules/navigation/catalog.generated.ts`; `modules/stock-transfers/manifest.ts`; `modules/stock-transfers/transfers.ts` | — | 2 submodules, frontend-only |
| `CanAssignRawMaterialStockTransfers` | — | — | unused, unused by desktop |
| `CanViewPackagingMaterialTransferList` | constant×5 in `modules/navigation/catalog.generated.ts`; `modules/stock-transfers/manifest.ts`; `modules/stock-transfers/transfers.ts` | — | 2 submodules, frontend-only |
| `CanAssignPackagingMaterialStockTransfers` | — | — | unused, unused by desktop |

## Production › REQUISITIONS

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialRequisitionsForProduction` | constant×8, manifest×3, some-rule×1, require×1 in `modules/navigation/catalog.generated.ts`; `modules/requisitions/lib/requisition-access.ts`; `modules/requisitions/manifest.ts` (+4) | — | alias of `CanViewRawMaterialRequisitions`, frontend-only |
| `CanViewPackagingMaterialRequisitionsForProduction` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/requisitions/lib/requisition-access.ts`; `modules/requisitions/manifest.ts` (+2) | — | alias of `CanViewPackagingMaterialRequisitions`, frontend-only |
| `CanCreateInternalStockTransfer` | — | — | unused, unused by desktop |

## Production › Create Purchase Requisitions

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialRequisitionsForCreation` | constant×4 in `modules/navigation/catalog.generated.ts`; `modules/requisitions/lib/requisition-access.ts`; `modules/requisitions/manifest.ts` | — | frontend-only |
| `CanCreateRawMaterialRequisitions` | constant×4, manifest×2 in `modules/navigation/catalog.generated.ts`; `modules/requisitions/lib/requisition-access.ts`; `modules/white-placebo/lib/white-placebo.ts` (+1) | `POST /api/v1/white-placebo/{id}/output` |  |
| `CanViewPackageMaterialRequisitionsForCreation` | constant×4 in `modules/navigation/catalog.generated.ts`; `modules/requisitions/lib/requisition-access.ts`; `modules/requisitions/manifest.ts` | — | frontend-only |
| `CanCreatePackageMaterialRequisitions` | constant×3 in `modules/navigation/catalog.generated.ts`; `modules/requisitions/lib/requisition-access.ts` | — | frontend-only |

## Production › Products

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPlannedProducts` | constant×4, manifest×2, usePermissionAction×2, some-rule×1, require×1, allows()×1 in `modules/activities/components/step/step-workspace.tsx`; `modules/activities/hooks/use-final-packing.ts`; `modules/activities/hooks/use-step-action-records.ts` (+6) | `GET /api/v1/production-schedule/{batchid}/issued-material-repair/{kind}`; `POST /api/v1/production-schedule/{batchid}/issued-material-repair/{kind}`; `GET /api/v1/production-schedule/activity/{activityid}/step/{stepid}/records` |  |
| `CanCreateNewProductionPlan` | manifest×1, constant×1 in `modules/products/lib/product-access.ts`; `modules/products/manifest.ts` | — | frontend-only |
| `CanEditProductionPlan` | manifest×3, constant×1 in `modules/products/lib/product-access.ts`; `modules/products/manifest.ts`; `modules/white-placebo/lib/white-placebo.ts` (+1) | `PUT /api/v1/white-placebo/recipe` |  |
| `CanRepairProcedure` | constant×1 in `modules/activities/components/batch/repair-procedure.tsx` | `POST /api/v1/production-schedule/activity/{productionactivityid}/repair-procedure` |  |
| `CanRepairIssuedBom` | constant×1 in `modules/activities/schemas/issued-material-repair.ts` | `GET /api/v1/production-schedule/{batchid}/issued-material-repair/{kind}`; `POST /api/v1/production-schedule/{batchid}/issued-material-repair/{kind}` |  |
| `CanRepairIssuedPackaging` | constant×1 in `modules/activities/schemas/issued-material-repair.ts` | `GET /api/v1/production-schedule/{batchid}/issued-material-repair/{kind}`; `POST /api/v1/production-schedule/{batchid}/issued-material-repair/{kind}` |  |
| `CanUnstartProduction` | constant×1 in `modules/activities/schemas/production-unstart.ts` | — | frontend-only |

## Production › Product Schedule

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewProductSchedules` | constant×2, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/schedules/lib/schedule-access.ts`; `modules/schedules/manifest.ts` | — | frontend-only |
| `CanCreateProductSchedule` | manifest×1, constant×1 in `modules/schedules/lib/schedule-access.ts`; `modules/schedules/manifest.ts` | — | frontend-only |
| `CanEditProductSchedule` | manifest×1, constant×1 in `modules/schedules/lib/schedule-access.ts`; `modules/schedules/manifest.ts` | — | frontend-only |
| `CanAddProductsToProductSchedule` | manifest×1, constant×1 in `modules/schedules/lib/schedule-access.ts`; `modules/schedules/manifest.ts` | — | frontend-only |
| `CanRemoveProductsFromProductSchedule` | manifest×1, constant×1 in `modules/schedules/lib/schedule-access.ts`; `modules/schedules/manifest.ts` | — | frontend-only |

## Production › Stock Transfer Requests

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewIncomingStockTransferRequests` | constant×2 in `modules/navigation/catalog.generated.ts`; `modules/production-transfers/lib/access.ts` | — | frontend-only |
| `CanApproveIncomingStockTransferRequest` | constant×1 in `modules/production-transfers/lib/access.ts` | — | frontend-only |
| `CanRejectIncomingStockTransferRequest` | — | — | unused, unused by desktop |
| `CanViewOutgoingStockTransferRequests` | constant×2 in `modules/navigation/catalog.generated.ts`; `modules/production-transfers/lib/access.ts` | — | frontend-only |

## Quality Control › Goods Receipt Note (GRN)

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialGoodsReceiptNotes` | constant×6, some-rule×3, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/qa-qc-dashboard/manifest.ts`; `modules/qc-grn/lib/qc-grn.ts` (+2) | — | frontend-only |
| `CanTakeRawMaterialSample` | constant×1 in `modules/qc-grn/lib/qc-grn.ts` | — | frontend-only |
| `CanAssignRawMaterialTest` | — | — | unused, unused by desktop |

## Quality Control › Testing

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanStartRawMaterialTest` | constant×4, require×1 in `modules/qc-grn/lib/qc-grn.ts`; `modules/qc-grn/manifest.ts`; `modules/qc-rework/components/rework-test-page.tsx` (+1) | — | frontend-only |

## Quality Control › Goods Receipt Note (GRN)

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCheckRawMaterialTestResult` | some-rule×3, constant×2, require×1 in `modules/commercial-certificates/components/generate-coa-button.tsx`; `modules/commercial-certificates/manifest.ts`; `modules/qc-grn/lib/qc-grn.ts` (+2) | `POST /api/v1/form/generate-certificate/{materialbatchid}` |  |
| `CanReassignRawMaterialTest` | constant×2 in `modules/qc-grn/lib/qc-grn.ts`; `modules/qc-grn/manifest.ts` | — | frontend-only |
| `CanViewPackagingMaterialGoodsReceiptNotes` | constant×6, some-rule×3, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/qa-qc-dashboard/manifest.ts`; `modules/qc-grn/lib/qc-grn.ts` (+2) | — | frontend-only |
| `CanTakePackagingMaterialSample` | constant×1 in `modules/qc-grn/lib/qc-grn.ts` | — | frontend-only |
| `CanAssignPackagingMaterialTest` | — | — | unused, unused by desktop |

## Quality Control › Testing

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanStartPackagingMaterialTest` | constant×4, require×1 in `modules/qc-grn/lib/qc-grn.ts`; `modules/qc-grn/manifest.ts`; `modules/qc-rework/components/rework-test-page.tsx` (+1) | — | frontend-only |

## Quality Control › Goods Receipt Note (GRN)

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCheckPackagingMaterialTestResult` | some-rule×3, constant×2, require×1 in `modules/commercial-certificates/components/generate-coa-button.tsx`; `modules/commercial-certificates/manifest.ts`; `modules/qc-grn/lib/qc-grn.ts` (+2) | `POST /api/v1/form/generate-certificate/{materialbatchid}` |  |
| `CanReassignPackagingMaterialTest` | constant×2 in `modules/qc-grn/lib/qc-grn.ts`; `modules/qc-grn/manifest.ts` | — | frontend-only |

## Quality Control › Analytical Test Request (Products)

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewProductAnalyticalTestRequests` | constant×2, some-rule×1 in `modules/analytical-test-requests/manifest.ts`; `modules/navigation/catalog.generated.ts` | `POST /api/v1/formula-repairs/tests/{atrid}/fields/{formfieldid}/evaluate` |  |
| `CanViewProductAnalyticalTestRequestsForAnalysing` | constant×2, some-rule×1 in `modules/analytical-test-requests/manifest.ts`; `modules/navigation/catalog.generated.ts` | `POST /api/v1/formula-repairs/tests/{atrid}/fields/{formfieldid}/evaluate` |  |
| `CanAcknowledgeSampleTaken` | constant×1 in `modules/analytical-test-requests/lib/atr.ts` | — | frontend-only |
| `CanAssignProductTest` | manifest×1, constant×1 in `modules/analytical-test-requests/lib/atr.ts`; `modules/analytical-test-requests/manifest.ts` | — | frontend-only |
| `CanReassignProductTest` | manifest×1, constant×1 in `modules/analytical-test-requests/lib/atr.ts`; `modules/analytical-test-requests/manifest.ts` | — | frontend-only |

## Quality Control › Testing

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanStartProductTest` | constant×2, require×1, manifest×1 in `modules/analytical-test-requests/lib/atr.ts`; `modules/analytical-test-requests/manifest.ts`; `modules/qc-rework/components/rework-test-page.tsx` (+1) | `POST /api/v1/formula-repairs/tests/{atrid}/fields/{formfieldid}/evaluate` |  |

## Quality Control › Analytical Test Request (Products)

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCheckProductTest` | some-rule×3, require×1, manifest×1, constant×1 in `modules/analytical-test-requests/lib/atr.ts`; `modules/analytical-test-requests/manifest.ts`; `modules/commercial-certificates/components/generate-coa-button.tsx` (+2) | — | frontend-only |

## Quality Control › Material STP

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialStps` | constant×6, manifest×1 in `modules/material-stps/lib/material-stps.ts`; `modules/material-stps/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/stp-documents/{ownertype}/{ownerid}`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/versions`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/new` (+6) |  |
| `CanCreateRawMaterialStp` | constant×1 in `modules/material-stps/lib/material-stps.ts` | — | frontend-only |
| `CanEditRawMaterialStp` | constant×1 in `modules/material-stps/lib/material-stps.ts` | `GET /api/v1/stp-documents/{ownertype}/{ownerid}`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/versions`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/new` (+6) |  |
| `CanDeleteRawMaterialStp` | constant×1 in `modules/material-stps/lib/material-stps.ts` | — | frontend-only |
| `CanViewPackagingMaterialStps` | constant×6, manifest×1 in `modules/material-stps/lib/material-stps.ts`; `modules/material-stps/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/stp-documents/{ownertype}/{ownerid}`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/versions`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/new` (+6) |  |
| `CanCreatePackagingMaterialStp` | constant×1 in `modules/material-stps/lib/material-stps.ts` | — | frontend-only |
| `CanEditPackagingMaterialStp` | constant×1 in `modules/material-stps/lib/material-stps.ts` | `GET /api/v1/stp-documents/{ownertype}/{ownerid}`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/versions`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/new` (+6) |  |
| `CanDeletePackagingMaterialStp` | constant×1 in `modules/material-stps/lib/material-stps.ts` | — | frontend-only |

## Quality Control › Material Specification

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialSpecifications` | constant×5, manifest×1 in `modules/material-specifications/lib/material-specifications.ts`; `modules/material-specifications/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateRawMaterialSpecification` | constant×2, some-rule×1 in `modules/material-specifications/lib/material-specifications.ts`; `modules/material-specifications/manifest.ts` | — | frontend-only |
| `CanEditRawMaterialSpecification` | constant×2, some-rule×1 in `modules/material-specifications/lib/material-specifications.ts`; `modules/material-specifications/manifest.ts` | — | frontend-only |
| `CanDeleteRawMaterialSpecification` | constant×1 in `modules/material-specifications/lib/material-specifications.ts` | — | frontend-only |
| `CanViewPackagingMaterialSpecifications` | constant×5, manifest×1 in `modules/material-specifications/lib/material-specifications.ts`; `modules/material-specifications/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreatePackagingMaterialSpecification` | constant×2, some-rule×1 in `modules/material-specifications/lib/material-specifications.ts`; `modules/material-specifications/manifest.ts` | — | frontend-only |
| `CanEditPackagingMaterialSpecification` | constant×2, some-rule×1 in `modules/material-specifications/lib/material-specifications.ts`; `modules/material-specifications/manifest.ts` | — | frontend-only |
| `CanDeletePackagingMaterialSpecification` | constant×1 in `modules/material-specifications/lib/material-specifications.ts` | — | frontend-only |

## Quality Control › Material ARD

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawMaterialArds` | constant×5, manifest×1 in `modules/material-ards/lib/material-ards.ts`; `modules/material-ards/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateRawMaterialArd` | constant×2 in `modules/material-ards/lib/material-ards.ts`; `modules/qc-routines/components/setup-dialogs.tsx` | — | frontend-only |
| `CanEditRawMaterialArd` | constant×1 in `modules/material-ards/lib/material-ards.ts` | — | frontend-only |
| `CanDeleteRawMaterialArd` | constant×1 in `modules/material-ards/lib/material-ards.ts` | — | frontend-only |
| `CanViewPackagingMaterialArds` | constant×5, manifest×1 in `modules/material-ards/lib/material-ards.ts`; `modules/material-ards/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreatePackagingMaterialArd` | constant×2 in `modules/material-ards/lib/material-ards.ts`; `modules/qc-routines/components/setup-dialogs.tsx` | — | frontend-only |
| `CanEditPackagingMaterialArd` | constant×1 in `modules/material-ards/lib/material-ards.ts` | — | frontend-only |
| `CanDeletePackagingMaterialArd` | constant×1 in `modules/material-ards/lib/material-ards.ts` | — | frontend-only |

## Quality Control › Product STP

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewProductStps` | constant×6 in `modules/navigation/catalog.generated.ts`; `modules/product-stps/lib/product-stps.ts`; `modules/product-stps/manifest.ts` | `GET /api/v1/stp-documents/{ownertype}/{ownerid}`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/versions`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/new` (+6) |  |
| `CanCreateProductStp` | constant×1 in `modules/product-stps/lib/product-stps.ts` | — | frontend-only |
| `CanEditProductStp` | constant×1 in `modules/product-stps/lib/product-stps.ts` | `GET /api/v1/stp-documents/{ownertype}/{ownerid}`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/versions`; `POST /api/v1/stp-documents/{ownertype}/{ownerid}/new` (+6) |  |
| `CanDeleteProductStp` | constant×1 in `modules/product-stps/lib/product-stps.ts` | — | frontend-only |

## Quality Control › Product Specification

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewProductSpecifications` | constant×5 in `modules/navigation/catalog.generated.ts`; `modules/product-specifications/lib/product-specifications.ts`; `modules/product-specifications/manifest.ts` | — | frontend-only |
| `CanCreateProductSpecification` | constant×3, some-rule×1 in `modules/product-specifications/lib/product-specifications.ts`; `modules/product-specifications/manifest.ts`; `modules/products/lib/product-access.ts` | — | frontend-only |
| `CanEditProductSpecification` | constant×3, some-rule×1 in `modules/product-specifications/lib/product-specifications.ts`; `modules/product-specifications/manifest.ts`; `modules/products/lib/product-access.ts` | — | frontend-only |
| `CanDeleteProductSpecification` | constant×1 in `modules/product-specifications/lib/product-specifications.ts` | — | frontend-only |

## Quality Control › Product ARD

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewProductArds` | constant×5 in `modules/navigation/catalog.generated.ts`; `modules/product-ards/lib/product-ards.ts`; `modules/product-ards/manifest.ts` | — | frontend-only |
| `CanCreateProductArd` | constant×3 in `modules/product-ards/lib/product-ards.ts`; `modules/products/lib/product-access.ts`; `modules/qc-routines/components/setup-dialogs.tsx` | — | frontend-only |
| `CanEditProductArd` | constant×2 in `modules/product-ards/lib/product-ards.ts`; `modules/products/lib/product-access.ts` | — | frontend-only |
| `CanDeleteProductArd` | constant×1 in `modules/product-ards/lib/product-ards.ts` | — | frontend-only |

## Quality Control › Routine Tests

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRoutineTests` | — | — | unused, unused by desktop |
| `CanCreateRoutineTest` | — | — | unused, unused by desktop |
| `CanAssignRoutineTest` | — | — | unused, unused by desktop |
| `CanPerformRoutineTest` | — | — | unused, unused by desktop |
| `CanCheckRoutineTest` | — | — | unused, unused by desktop |
| `CanApproveRoutineTest` | — | — | unused, unused by desktop |

## Quality Control › Routine Setup

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRoutineSetup` | — | — | unused, unused by desktop |
| `CanManageRoutineSetup` | — | — | unused, unused by desktop |

## Quality Control › Microbial Requirements

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanManageMicrobialRequirements` | — | — | unused, unused by desktop |

## Quality Control › Water Quality

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewWaterQuality` | — | — | unused, unused by desktop |
| `CanManageWaterQuality` | — | — | unused, unused by desktop |

## Quality Control › Quality Certificates

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQualityCertificates` | — | — | unused, unused by desktop |
| `CanGenerateQualityCertificate` | — | — | unused, unused by desktop |

## Quality Assurance › Issue BMR

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewIssuedBmrBprs` | constant×2, some-rule×1 in `modules/issue-bmr/lib/issue-bmr.ts`; `modules/issue-bmr/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanIssueBmr` | constant×2, some-rule×1 in `modules/issue-bmr/lib/issue-bmr.ts`; `modules/issue-bmr/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |

## Quality Assurance › Analytical Test Requests

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewAnalyticalTestRequests` | some-rule×3, constant×2 in `modules/analytical-test-requests/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/qa-qc-dashboard/manifest.ts` | — | frontend-only |
| `CanViewAnalyticalTestRequestsForSampling` | constant×1, some-rule×1 in `modules/analytical-test-requests/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanTakeSamples` | constant×1 in `modules/analytical-test-requests/lib/atr.ts` | — | frontend-only |

## Quality Assurance › Verification

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanVerifyProduct` | constant×1 in `modules/products/lib/product-access.ts` | — | frontend-only |
| `CanVerifyRawMaterialSpecification` | constant×1 in `modules/material-specifications/lib/material-specifications.ts` | — | frontend-only |
| `CanVerifyPackagingMaterialSpecification` | constant×1 in `modules/material-specifications/lib/material-specifications.ts` | — | frontend-only |
| `CanVerifyProductSpecification` | constant×1 in `modules/product-specifications/lib/product-specifications.ts` | — | frontend-only |
| `CanVerifyRawMaterialArd` | constant×1 in `modules/material-ards/lib/material-ards.ts` | — | frontend-only |
| `CanVerifyPackagingMaterialArd` | constant×1 in `modules/material-ards/lib/material-ards.ts` | — | frontend-only |
| `CanVerifyProductArd` | constant×1 in `modules/product-ards/lib/product-ards.ts` | — | frontend-only |

## Quality Assurance › Pending Approvals

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPendingApprovals` | constant×3, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/pending-approvals/lib/approval-documents.ts`; `modules/pending-approvals/manifest.ts` | — | frontend-only |
| `CanApprovePendingApproval` | constant×1 in `modules/pending-approvals/lib/approval-documents.ts` | — | frontend-only |
| `CanRejectPendingApproval` | constant×1 in `modules/pending-approvals/lib/approval-documents.ts` | — | frontend-only |
| `CanApproveResponse` | constant×1 in `modules/pending-approvals/lib/approval-documents.ts` | `POST /api/v1/approval/approve/{modeltype}/{modelid}` |  |
| `CanRejectResponse` | constant×1 in `modules/pending-approvals/lib/approval-documents.ts` | `POST /api/v1/approval/reject/{modeltype}/{modelid}` |  |

## Quality Assurance › Transfer Approval Rights

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanTransferApprovalRights` | manifest×1, require×1 in `modules/approval-rights-transfer/components/transfer-rights-page.tsx`; `modules/approval-rights-transfer/manifest.ts` | — | frontend-only |

## Finished Goods Warehouse › Customer Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewCustomers` | constant×2, some-rule×1, manifest×1 in `modules/customers/lib/customers.ts`; `modules/customers/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/customers/{id}/order-history` |  |
| `CanCreateCustomer` | constant×1 in `modules/customers/lib/customers.ts` | — | frontend-only |
| `CanEditCustomer` | constant×1 in `modules/customers/lib/customers.ts` | — | frontend-only |
| `CanDeleteCustomer` | constant×1 in `modules/customers/lib/customers.ts` | — | frontend-only |
| `CanViewCustomerCreditStatus` | constant×2, some-rule×1 in `modules/customers/lib/customers.ts`; `modules/customers/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/customers/{id}/credit-status`; `GET /api/v1/customers/{id}/summary` | alias of `ViewCustomerCreditStatus` |
| `CanManageCustomerContracts` | constant×1 in `modules/customers/lib/customers.ts` | `GET /api/v1/customers/{id}/contacts`; `POST /api/v1/customers/{id}/contacts`; `PUT /api/v1/customers/{id}/contacts/{contactid}` (+1) | alias of `ManageCustomerContracts` |
| `CanViewCustomerQuotations` | constant×2, some-rule×1, manifest×1 in `modules/customer-quotations/manifest.ts`; `modules/customers/lib/customers.ts`; `modules/customers/manifest.ts` (+1) | `GET /api/v1/customers/{id}/quotations`; `GET /api/v1/customers/{id}/quotations/convertible`; `GET /api/v1/customers/quotations/{quotationid}` | alias of `ViewCustomerQuotations` |
| `CanCreateCustomerQuotation` | manifest×1, constant×1 in `modules/customers/lib/customers.ts`; `modules/customers/manifest.ts` | `POST /api/v1/customers/{id}/quotations`; `GET /api/v1/customers/{id}/quotations/resolve-price`; `POST /api/v1/customers/quotations/{quotationid}/send` | alias of `CreateCustomerQuotation` |
| `CanApproveCustomerQuotation` | — | — | alias of `ApproveCustomerQuotation`, unused, unused by desktop |
| `CanConvertCustomerQuotation` | constant×2 in `modules/customers/lib/customers.ts`; `modules/production-orders/lib/orders.ts` | `POST /api/v1/customers/quotations/{quotationid}/convert` | alias of `ConvertCustomerQuotation` |

## Finished Goods Warehouse › Production Orders

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewOrder` | constant×3, some-rule×1, manifest×1 in `modules/fgtn-dashboard/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/production-orders/lib/orders.ts` (+1) | — | frontend-only |
| `CanCreateOrders` | — | — | unused, unused by desktop |
| `CanGeneratePackingList` | constant×1 in `modules/production-orders/lib/orders.ts` | — | frontend-only |

## Finished Goods Warehouse › Packing List

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPackingList` | constant×2, some-rule×1 in `modules/fg-allocations/manifest.ts`; `modules/fg-dispatch/lib/dispatch.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |

## Finished Goods Warehouse › Proforma Invoice

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanGenerateProformaInvoice` | constant×1 in `modules/fg-dispatch/lib/dispatch.ts` | — | frontend-only |
| `CanViewProformaInvoice` | constant×2, manifest×1 in `modules/fg-dispatch/lib/dispatch.ts`; `modules/fg-proforma-invoices/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanSendProformaInvoice` | constant×1 in `modules/fg-dispatch/lib/dispatch.ts` | — | frontend-only |

## Finished Goods Warehouse › Invoice

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewInvoice` | constant×4, some-rule×2 in `modules/fg-allocations/manifest.ts`; `modules/fg-dispatch/lib/dispatch.ts`; `modules/fg-invoices/manifest.ts` (+1) | — | frontend-only |

## Finished Goods Warehouse › Allocations

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewWaybillForFgw` | constant×1, some-rule×1 in `modules/fg-invoices/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateWaybillForFgw` | constant×1 in `modules/fg-dispatch/lib/dispatch.ts` | — | frontend-only |

## Finished Goods Warehouse › Finished Goods Transfer Note

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewFgtn` | constant×2, manifest×1 in `modules/finished-goods-notes/manifest.ts`; `modules/finished-goods-notes/notes.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanApproveFgtn` | constant×2, some-rule×1 in `modules/finished-goods-notes/notes.ts`; `modules/upload-center/lib/upload-center.ts`; `modules/upload-center/manifest.ts` | — | frontend-only |

## Finished Goods Warehouse › Approved Products

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewApprovedProducts` | constant×4, manifest×2 in `modules/approved-products/approved-products.tsx`; `modules/approved-products/manifest.ts`; `modules/fg-products/fg-products.tsx` (+2) | — | frontend-only |
| `CanEditApprovedProductPackingStyle` | constant×1 in `modules/products/lib/product-access.ts` | `POST /api/v1/product/{productid}/packing/approved-product` |  |

## STORES › General Inventory

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewItemsInReagentStore` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateNewItemInReagentStore` | — | — | unused, unused by desktop |
| `CanEditItemInReagentStore` | — | — | unused, unused by desktop |
| `CanDeleteItemFromReagentStore` | — | — | unused, unused by desktop |
| `CanViewItemsInEquipmentStore` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateNewItemInEquipmentStore` | — | — | unused, unused by desktop |
| `CanEditItemInEquipmentStore` | — | — | unused, unused by desktop |
| `CanDeleteItemFromEquipmentStore` | — | — | unused, unused by desktop |
| `CanViewItemsInGeneralStore` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateNewItemInGeneralStore` | — | — | unused, unused by desktop |
| `CanEditItemInGeneralStore` | — | — | unused, unused by desktop |
| `CanDeleteItemFromGeneralStore` | — | — | unused, unused by desktop |
| `CanViewItemsInItStore` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateNewItemInItStore` | — | — | unused, unused by desktop |
| `CanEditItemInItStore` | — | — | unused, unused by desktop |
| `CanDeleteItemFromItStore` | — | — | unused, unused by desktop |

## STORES › Receiving Area

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewReagentStoreReceivingArea` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanApproveReagentStoreReceivingAreaEntry` | — | — | unused, unused by desktop |
| `CanRejectReagentStoreReceivingAreaEntry` | — | — | unused, unused by desktop |
| `CanViewEquipmentStoreReceivingArea` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanApproveEquipmentStoreReceivingAreaEntry` | — | — | unused, unused by desktop |
| `CanRejectEquipmentStoreReceivingAreaEntry` | — | — | unused, unused by desktop |
| `CanViewGeneralStoreReceivingArea` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanApproveGeneralStoreReceivingAreaEntry` | — | — | unused, unused by desktop |
| `CanRejectGeneralStoreReceivingAreaEntry` | — | — | unused, unused by desktop |
| `CanViewItStoreReceivingArea` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanApproveItStoreReceivingAreaEntry` | — | — | unused, unused by desktop |
| `CanRejectItStoreReceivingAreaEntry` | — | — | unused, unused by desktop |

## STORES › Available Stocks

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewReagentStoreAvailableStocks` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanViewEquipmentStoreAvailableStocks` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanViewGeneralStoreAvailableStocks` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanViewItStoreAvailableStocks` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |

## STORES › Purchase Requisition

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewReagentStorePurchaseRequisitions` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateReagentStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanEditReagentStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanDeleteReagentStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanViewEquipmentStorePurchaseRequisitions` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateEquipmentStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanEditEquipmentStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanDeleteEquipmentStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanViewGeneralStorePurchaseRequisitions` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateGeneralStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanEditGeneralStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanDeleteGeneralStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanViewItStorePurchaseRequisitions` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateItStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanEditItStorePurchaseRequisition` | — | — | unused, unused by desktop |
| `CanDeleteItStorePurchaseRequisition` | — | — | unused, unused by desktop |

## STORES › Stock Requisition

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewReagentStoreStockRequisitions` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateReagentStoreStockRequisition` | — | — | unused, unused by desktop |
| `CanViewEquipmentStoreStockRequisitions` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateEquipmentStoreStockRequisition` | — | — | unused, unused by desktop |
| `CanViewGeneralStoreStockRequisitions` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateGeneralStoreStockRequisition` | — | — | unused, unused by desktop |
| `CanViewItStoreStockRequisitions` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateItStoreStockRequisition` | — | — | unused, unused by desktop |

## STORES › Issue Stock Requisition

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewReagentStoreIssueStocks` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateReagentStoreIssueStock` | — | — | unused, unused by desktop |
| `CanViewEquipmentStoreIssueStocks` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateEquipmentStoreIssueStock` | — | — | unused, unused by desktop |
| `CanViewGeneralStoreIssueStocks` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateGeneralStoreIssueStock` | — | — | unused, unused by desktop |
| `CanViewItStoreIssueStocks` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateItStoreIssueStock` | — | — | unused, unused by desktop |

## STORES › Return Materials

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewReagentStoreReturnItems` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateReagentStoreReturnItem` | — | — | unused, unused by desktop |
| `CanEditReagentStoreReturnItem` | — | — | unused, unused by desktop |
| `CanDeleteReagentStoreReturnItem` | — | — | unused, unused by desktop |
| `CanViewEquipmentStoreReturnItems` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateEquipmentStoreReturnItem` | — | — | unused, unused by desktop |
| `CanEditEquipmentStoreReturnItem` | — | — | unused, unused by desktop |
| `CanDeleteEquipmentStoreReturnItem` | — | — | unused, unused by desktop |
| `CanViewGeneralStoreReturnItems` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateGeneralStoreReturnItem` | — | — | unused, unused by desktop |
| `CanEditGeneralStoreReturnItem` | — | — | unused, unused by desktop |
| `CanDeleteGeneralStoreReturnItem` | — | — | unused, unused by desktop |
| `CanViewItStoreReturnItems` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateItStoreReturnItem` | — | — | unused, unused by desktop |
| `CanEditItStoreReturnItem` | — | — | unused, unused by desktop |
| `CanDeleteItStoreReturnItem` | — | — | unused, unused by desktop |

## STORES › Damage / Missing Items

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewReagentStoreDamageMissingItems` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateReagentStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanEditReagentStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanDeleteReagentStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanViewEquipmentStoreDamageMissingItems` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateEquipmentStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanEditEquipmentStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanDeleteEquipmentStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanViewGeneralStoreDamageMissingItems` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateGeneralStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanEditGeneralStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanDeleteGeneralStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanViewItStoreDamageMissingItems` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/stores-dashboard/manifest.ts` | — | frontend-only |
| `CanCreateItStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanEditItStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |
| `CanDeleteItStoreDamageMissingItemRecord` | — | — | unused, unused by desktop |

## STORES › Vendor Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewVendors` | constant×4, manifest×2, require×2 in `modules/navigation/catalog.generated.ts`; `modules/store-vendors/components/vendor-actions.tsx`; `modules/store-vendors/hooks/use-vendor-command.ts` (+3) | — | 2 submodules, frontend-only |
| `CanCreateVendor` | has()×1, require×1, manifest×1, constant×1 in `modules/store-vendors/components/vendors-page.tsx`; `modules/store-vendors/hooks/use-vendor-command.ts`; `modules/suppliers/lib/supplier-access.ts` (+1) | — | 2 submodules, frontend-only |
| `CanUpdateVendorDetails` | require×2, constant×2, manifest×1 in `modules/store-vendors/components/vendor-actions.tsx`; `modules/store-vendors/hooks/use-vendor-command.ts`; `modules/suppliers/components/purchase-unit-fixtures.tsx` (+2) | — | 2 submodules, frontend-only |
| `CanDeleteVendor` | require×3, constant×1 in `modules/store-vendors/components/vendor-actions.tsx`; `modules/store-vendors/hooks/use-vendor-command.ts`; `modules/suppliers/lib/supplier-access.ts` | — | 2 submodules, frontend-only |

## Service and Store Procurement › Purchase Requisition Sourcing

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPurchaseRequisitionsSourcing` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/store-procurement/lib/procurement.ts`; `modules/store-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanSourcePurchaseRequisitionSourcing` | constant×1 in `modules/store-procurement/lib/procurement.ts` | — | frontend-only |

## Service and Store Procurement › Quotation Requests

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQuotationRequestsForTrustedVendors` | constant×6, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/store-procurement/lib/procurement.ts`; `modules/store-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanCreateQuotationRequestForTrustedVendor` | constant×1 in `modules/store-procurement/lib/procurement.ts` | — | frontend-only |

## Service and Store Procurement › Quotation Responses

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQuotationResponsesForTrustedVendors` | constant×6, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/store-procurement/lib/procurement.ts`; `modules/store-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanSendQuotationResponseForTrustedVendor` | constant×1 in `modules/store-procurement/lib/procurement.ts` | — | frontend-only |
| `CanViewServicesQuotationResponses` | constant×4, some-rule×2 in `modules/navigation/catalog.generated.ts`; `modules/service-procurement/lib/service-procurement.ts`; `modules/service-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanSendServicesQuotationResponse` | constant×1 in `modules/service-procurement/lib/service-procurement.ts` | — | frontend-only |

## Service and Store Procurement › Open Market Quotation Sheet

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewOpenMarketQuotationSheets` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/store-procurement/lib/procurement.ts`; `modules/store-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanCreateOpenMarketQuotationSheet` | constant×1 in `modules/store-procurement/lib/procurement.ts` | — | frontend-only |

## Service and Store Procurement › Price Comparison

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewTrustedVendorPricingSelection` | constant×6, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/store-procurement/lib/procurement.ts`; `modules/store-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanApplyChangesForTrustedVendorPricingSelection` | — | — | unused, unused by desktop |
| `CanViewOpenMarketPricingSelection` | constant×6, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/store-procurement/lib/procurement.ts`; `modules/store-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanApplyChangesForOpenMarketPricingSelection` | — | — | unused, unused by desktop |
| `CanViewServicesPricingSelection` | constant×4, some-rule×2 in `modules/navigation/catalog.generated.ts`; `modules/service-comparison/manifest.ts`; `modules/service-procurement/lib/service-procurement.ts` (+1) | — | frontend-only |
| `CanApplyChangesForServicesPricingSelection` | constant×1 in `modules/service-procurement/lib/service-procurement.ts` | — | frontend-only |

## Service and Store Procurement › Proforma Requests

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewServicesProformaRequests` | constant×4, some-rule×2 in `modules/navigation/catalog.generated.ts`; `modules/service-procurement/lib/service-procurement.ts`; `modules/service-proformas/manifest.ts` (+1) | — | frontend-only |
| `CanSendServicesProformaRequest` | constant×1 in `modules/service-procurement/lib/service-procurement.ts` | — | frontend-only |

## Service and Store Procurement › Proforma Responses

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewServicesProformaResponses` | constant×4, some-rule×2 in `modules/navigation/catalog.generated.ts`; `modules/service-procurement/lib/service-procurement.ts`; `modules/service-proformas/manifest.ts` (+1) | — | frontend-only |
| `CanSendServicesProformaResponse` | constant×1 in `modules/service-procurement/lib/service-procurement.ts` | — | frontend-only |

## Service and Store Procurement › Memos

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewMemoForTrustedVendors` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/store-procurement/lib/procurement.ts`; `modules/store-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanCreateMemoForTrustedVendor` | constant×1 in `modules/store-procurement/lib/procurement.ts` | — | frontend-only |
| `CanViewOpenMarketMemo` | constant×7, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/store-procurement/lib/procurement.ts`; `modules/store-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanCreateOpenMarketMemo` | constant×1 in `modules/store-procurement/lib/procurement.ts` | — | frontend-only |
| `CanViewServicesMemo` | constant×4, some-rule×3 in `modules/navigation/catalog.generated.ts`; `modules/service-memos/manifest.ts`; `modules/service-procurement/lib/service-procurement.ts` (+1) | — | frontend-only |
| `CanCreateServicesMemo` | constant×1 in `modules/service-procurement/lib/service-procurement.ts` | — | frontend-only |

## Service and Store Procurement › Purchase Orders

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPurchaseOrdersForTrustedVendors` | constant×6, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/store-procurement/lib/procurement.ts`; `modules/store-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanCreatePurchaseOrderForTrustedVendor` | constant×1 in `modules/store-procurement/lib/procurement.ts` | — | frontend-only |
| `CanViewOpenMarketPurchaseOrders` | constant×6, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/store-procurement/lib/procurement.ts`; `modules/store-procurement/manifest.ts` (+1) | — | frontend-only |
| `CanCreateOpenMarketPurchaseOrder` | constant×1 in `modules/store-procurement/lib/procurement.ts` | — | frontend-only |
| `CanViewServicesPurchaseOrders` | constant×4, some-rule×2 in `modules/navigation/catalog.generated.ts`; `modules/service-procurement/lib/service-procurement.ts`; `modules/service-proformas/manifest.ts` (+1) | — | frontend-only |
| `CanCreateServicesPurchaseOrder` | constant×1 in `modules/service-procurement/lib/service-procurement.ts` | — | frontend-only |

## Service and Store Procurement › Service Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewServices` | constant×3, usePermissionAction×3, require×2, allows()×2, some-rule×1, manifest×1, has()×1 in `modules/contractors/components/provider-detail-page.tsx`; `modules/contractors/components/provider-editor.tsx`; `modules/contractors/hooks/use-provider-command.ts` (+6) | — | frontend-only |
| `CanCreateService` | has()×1, usePermissionAction×1 in `modules/store-services/components/services-page.tsx`; `modules/store-services/hooks/use-service-save.ts` | — | frontend-only |
| `CanEditService` | require×3, usePermissionAction×2 in `modules/store-services/components/service-actions.tsx`; `modules/store-services/components/service-attachments.tsx`; `modules/store-services/hooks/use-service-save.ts` | — | frontend-only |
| `CanDeleteService` | require×2, usePermissionAction×1 in `modules/store-services/components/service-actions.tsx` | — | frontend-only |
| `CanViewContractors` | constant×3, manifest×2, some-rule×1 in `modules/contractors/hooks/use-provider-command.ts`; `modules/contractors/manifest.ts`; `modules/navigation/catalog.generated.ts` (+1) | — | frontend-only |
| `CanCreateContractors` | has()×1, manifest×1 in `modules/contractors/components/providers-page.tsx`; `modules/contractors/hooks/use-provider-command.ts` | — | frontend-only |
| `CanEditContractors` | require×1, manifest×1 in `modules/contractors/components/provider-actions.tsx`; `modules/contractors/hooks/use-provider-command.ts` | — | frontend-only |
| `CanDeleteContractors` | require×2, manifest×1 in `modules/contractors/components/provider-actions.tsx`; `modules/contractors/hooks/use-provider-command.ts` | — | frontend-only |

## Service and Store Procurement › Job Requests

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewJobRequests` | constant×4, manifest×2, some-rule×1 in `modules/crm-job-requests/manifest.ts`; `modules/job-requests/lib/job-requests.ts`; `modules/job-requests/manifest.ts` (+2) | — | frontend-only |
| `CanCreateJobRequest` | constant×1 in `modules/job-requests/lib/job-requests.ts` | — | frontend-only |
| `CanEditJobRequest` | constant×1 in `modules/job-requests/lib/job-requests.ts` | — | frontend-only |
| `CanDeleteJobRequest` | constant×1 in `modules/job-requests/lib/job-requests.ts` | — | frontend-only |
| `CanAcknowledgeJobRequest` | constant×1 in `modules/job-requests/lib/job-requests.ts` | — | frontend-only |
| `CanAssignJobRequest` | constant×1 in `modules/job-requests/lib/job-requests.ts` | — | frontend-only |
| `CanStartJobRequest` | constant×1 in `modules/job-requests/lib/job-requests.ts` | — | frontend-only |
| `CanCompleteJobRequest` | constant×1 in `modules/job-requests/lib/job-requests.ts` | — | frontend-only |

## Service and Store Procurement › Job Orders

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewJobOrders` | constant×4, manifest×1, some-rule×1 in `modules/job-orders/manifest.ts`; `modules/job-requests/lib/job-requests.ts`; `modules/navigation/catalog.generated.ts` (+1) | — | frontend-only |
| `CanCreateJobOrder` | constant×1 in `modules/job-requests/lib/job-requests.ts` | — | frontend-only |
| `CanEditJobOrder` | — | — | unused, unused by desktop |
| `CanDeleteJobOrder` | — | — | unused, unused by desktop |

## Human Resources › Employee Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewActiveEmployee` | constant×5, manifest×3, require×2, some-rule×2, allows()×1 in `modules/employees/lib/access.ts`; `modules/hr-dashboard/manifest.ts`; `modules/hr-executive-summary/manifest.ts` (+7) | — | frontend-only |
| `CanViewInactiveEmployee` | constant×3 in `modules/employees/lib/access.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanViewNewEmployee` | constant×3 in `modules/employees/lib/access.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanRegisterEmployee` | constant×1 in `modules/employees/lib/access.ts` | `POST /api/v1/employee/register`; `POST /api/v1/employee`; `POST /api/v1/employee/avatar/{id}` |  |
| `CanUpdateEmployeeInfo` | constant×1 in `modules/employees/lib/access.ts` | `POST /api/v1/employee/avatar/{id}` |  |
| `CanUpdateEmployeeEmail` | constant×1 in `modules/employees/lib/access.ts` | — | frontend-only |
| `CanViewEmployeeDetails` | constant×4, require×3, allows()×2, manifest×2 in `modules/employees/lib/access.ts`; `modules/navigation/catalog.generated.ts`; `modules/performance-goals/components/goal-actions.tsx` (+7) | — | frontend-only |

## Human Resources › Department Employee Export

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewDepartmentEmployee` | constant×4, require×2, manifest×1 in `modules/department-employees/components/department-employees-page.tsx`; `modules/department-employees/manifest.ts`; `modules/employees/lib/access.ts` (+3) | — | frontend-only |
| `CanExportDepartmentEmployee` | constant×3, require×1 in `modules/department-employees/components/department-employees-page.tsx`; `modules/employees/lib/access.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |

## Human Resources › Designation Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewDesignation` | constant×3, manifest×1 in `modules/designations/designations.ts`; `modules/designations/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateDesignation` | constant×1 in `modules/designations/designations.ts` | — | frontend-only |
| `CanEditDesignation` | constant×1 in `modules/designations/designations.ts` | — | frontend-only |
| `CanDeleteDesignation` | constant×1 in `modules/designations/designations.ts` | — | frontend-only |

## Human Resources › Staff Requisition

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewStaffRequisition` | constant×3 in `modules/navigation/catalog.generated.ts`; `modules/staff-requisitions/lib/staff.ts` | — | frontend-only |
| `CanCreateStaffRequisition` | constant×1 in `modules/staff-requisitions/lib/staff.ts` | — | frontend-only |
| `CanEditStaffRequisition` | constant×1 in `modules/staff-requisitions/lib/staff.ts` | — | frontend-only |
| `CanDeleteStaffRequisition` | constant×1 in `modules/staff-requisitions/lib/staff.ts` | — | frontend-only |

## Human Resources › Leave Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewLeaveRequests` | constant×3 in `modules/leave-management/lib/leave.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateLeaveRequest` | constant×1 in `modules/leave-management/lib/leave.ts` | — | frontend-only |
| `CanEditLeaveRequest` | constant×1 in `modules/leave-management/lib/leave.ts` | — | frontend-only |
| `CanRecallLeave` | constant×1 in `modules/leave-management/lib/leave.ts` | — | frontend-only |
| `CanCancelLeave` | constant×1 in `modules/leave-management/lib/leave.ts` | — | frontend-only |

## Human Resources › Leave Type Configuration

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewLeaveType` | constant×3, manifest×1 in `modules/designations/designations.ts`; `modules/leave-types/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateLeaveType` | constant×1 in `modules/designations/designations.ts` | — | frontend-only |
| `CanEditLeaveType` | constant×1 in `modules/designations/designations.ts` | — | frontend-only |
| `CanDeleteLeaveType` | constant×1 in `modules/designations/designations.ts` | — | frontend-only |

## Human Resources › Attendance Report Upload

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewAttendanceReportUpload` | manifest×2, constant×2, require×2 in `modules/attendance-upload/manifest.ts`; `modules/attendance/manifest.ts`; `modules/navigation/catalog.generated.ts` (+2) | `GET /api/v1/report/history/capabilities` |  |
| `CanSubmitAttendanceReportUpload` | require×1, some-rule×1, constant×1 in `modules/attendance-upload/components/attendance-upload-page.tsx`; `modules/upload-center/lib/upload-center.ts`; `modules/upload-center/manifest.ts` | — | frontend-only |
| `CanCancelAttendanceReportUpload` | — | — | unused, unused by desktop |

## Human Resources › Shift Schedule Report Upload

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewShiftScheduleReportUpload` | constant×2, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/shift-upload/manifest.ts` | — | frontend-only |
| `CanSubmitShiftScheduleReportUpload` | constant×2, some-rule×1 in `modules/shift-upload/hooks/use-upload-command.ts`; `modules/upload-center/lib/upload-center.ts`; `modules/upload-center/manifest.ts` | `POST /api/v1/shift-schedules/assign/import` |  |

## Human Resources › Overtime Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewOvertimeManagement` | constant×3 in `modules/navigation/catalog.generated.ts`; `modules/overtime/lib/overtime.ts` | — | frontend-only |
| `CanCreateOvertimeManagement` | constant×1 in `modules/overtime/lib/overtime.ts` | — | frontend-only |
| `CanEditOvertimeManagement` | constant×1 in `modules/overtime/lib/overtime.ts` | — | frontend-only |
| `CanDeleteOvertimeManagement` | constant×1 in `modules/overtime/lib/overtime.ts` | — | frontend-only |

## Human Resources › Employee Compensation

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewCompensation` | constant×3, usePermissionAction×2, some-rule×1, manifest×1 in `modules/compensation/hooks/use-adjustment-command.ts`; `modules/compensation/hooks/use-salary-save.ts`; `modules/compensation/manifest.ts` (+2) | `GET /api/v1/payroll/compensation/{employeeid}`; `GET /api/v1/payroll/compensation/{employeeid}/history`; `GET /api/v1/payroll/deductions` (+2) |  |
| `CanManageCompensation` | has()×2, require×2, usePermissionAction×2 in `modules/compensation/components/adjustments-section.tsx`; `modules/compensation/components/compensation-page.tsx`; `modules/compensation/hooks/use-adjustment-command.ts` (+1) | `POST /api/v1/payroll/compensation`; `POST /api/v1/payroll/deductions`; `DELETE /api/v1/payroll/deductions/{id}` (+4) |  |

## Human Resources › Payroll Configuration

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPayrollConfiguration` | constant×3, allows()×2, manifest×1, some-rule×1, has()×1 in `modules/compensation/components/salary-editor.tsx`; `modules/compensation/hooks/use-salary-save.ts`; `modules/hr-dashboard/manifest.ts` (+2) | `GET /api/v1/payroll/pay-grades`; `GET /api/v1/payroll/tax-bands`; `GET /api/v1/payroll/ssnit-rates` |  |
| `CanManagePayrollConfiguration` | require×3, has()×1, usePermissionAction×1 in `modules/payroll-configuration/components/config-actions.tsx`; `modules/payroll-configuration/components/payroll-configuration-page.tsx`; `modules/payroll-configuration/hooks/use-config-command.ts` | `POST /api/v1/payroll/pay-grades`; `PUT /api/v1/payroll/pay-grades/{id}`; `DELETE /api/v1/payroll/pay-grades/{id}` (+4) |  |

## Human Resources › Payroll Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPayrollRuns` | constant×4, has()×2, some-rule×1, manifest×1 in `modules/hr-dashboard/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/payroll-runs/manifest.ts` (+3) | `GET /api/v1/payroll/runs`; `GET /api/v1/payroll/runs/{id}` |  |
| `CanCreatePayrollRun` | constant×1 in `modules/payroll-runs/schemas/contracts.ts` | `POST /api/v1/payroll/runs`; `POST /api/v1/payroll/runs/{id}/submit` |  |
| `CanApprovePayrollRun` | constant×1 in `modules/payroll-runs/schemas/contracts.ts` | `POST /api/v1/payroll/runs/{id}/process` |  |
| `CanCancelPayrollRun` | constant×1 in `modules/payroll-runs/schemas/contracts.ts` | `POST /api/v1/payroll/runs/{id}/cancel` |  |
| `CanViewPayslip` | constant×2, some-rule×1, manifest×1 in `modules/hr-dashboard/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/payroll-runs/manifest.ts` (+1) | `GET /api/v1/payroll/runs/{payrollrunid}/payslips`; `GET /api/v1/payroll/payslips/{id}` |  |
| `CanViewOwnPayslip` | some-rule×1, constant×1 in `modules/hr-dashboard/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/payroll/employees/{employeeid}/payslips` |  |
| `CanExportBankAdvice` | constant×1 in `modules/payroll-runs/schemas/contracts.ts` | `GET /api/v1/payroll/runs/{payrollrunid}/bank-advice` |  |
| `CanExportPayrollRegister` | constant×1 in `modules/payroll-runs/schemas/contracts.ts` | `GET /api/v1/payroll/runs/{payrollrunid}/register` |  |

## Human Resources › Performance Cycle Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPerformanceCycles` | require×5, has()×4, constant×3, manifest×3, allows()×2, some-rule×1, usePermissionAction×1 in `modules/hr-dashboard/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/performance-cycles/components/cycle-actions.tsx` (+8) | `GET /api/v1/performance/cycles`; `GET /api/v1/performance/cycles/{id}` |  |
| `CanManagePerformanceCycles` | manifest×2, require×2, has()×1, usePermissionAction×1 in `modules/performance-cycles/components/cycle-actions.tsx`; `modules/performance-cycles/components/cycles-page.tsx`; `modules/performance-cycles/hooks/use-cycle-command.ts` (+2) | `POST /api/v1/performance/cycles`; `PUT /api/v1/performance/cycles/{id}/status`; `POST /api/v1/performance/reviews` |  |

## Human Resources › Goal Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewOwnGoals` | require×4, constant×3, some-rule×2, has()×2, manifest×1 in `modules/hr-dashboard/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/performance-goals/components/goal-actions.tsx` (+5) | `GET /api/v1/performance/goals`; `GET /api/v1/performance/goals/{id}` |  |
| `CanViewTeamGoals` | require×4, constant×3, some-rule×2, has()×1, manifest×1 in `modules/hr-dashboard/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/performance-goals/components/goal-actions.tsx` (+5) | `POST /api/v1/performance/goals`; `PUT /api/v1/performance/goals/{id}`; `DELETE /api/v1/performance/goals/{id}` (+2) |  |
| `CanCreateGoal` | allows()×2, require×1 in `modules/performance-goals/components/goals-page.tsx`; `modules/performance-goals/components/personal-performance.tsx`; `modules/performance-goals/hooks/use-goal-command.ts` | `POST /api/v1/performance/goals` |  |
| `CanEditGoal` | require×2 in `modules/performance-goals/components/goal-actions.tsx`; `modules/performance-goals/hooks/use-goal-command.ts` | `PUT /api/v1/performance/goals/{id}` |  |
| `CanDeleteGoal` | require×3 in `modules/performance-goals/components/goal-actions.tsx`; `modules/performance-goals/hooks/use-goal-command.ts` | `DELETE /api/v1/performance/goals/{id}` |  |

## Human Resources › Performance Review Management

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPerformanceReviews` | constant×3, manifest×3, has()×2, some-rule×1 in `modules/hr-dashboard/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/pending-approvals/components/approval-detail-page.tsx` (+4) | `GET /api/v1/performance/reviews`; `GET /api/v1/performance/reviews/{id}` |  |
| `CanSubmitSelfAssessment` | some-rule×2, manifest×1, has()×1 in `modules/performance-goals/components/personal-performance.tsx`; `modules/performance-goals/manifest.ts`; `modules/performance-reviews/components/assessment-form.tsx` (+1) | `GET /api/v1/performance/reviews/mine`; `POST /api/v1/performance/reviews/{id}/self-assessment` |  |
| `CanSubmitManagerReview` | some-rule×2, manifest×1, has()×1 in `modules/performance-goals/components/personal-performance.tsx`; `modules/performance-goals/manifest.ts`; `modules/performance-reviews/components/assessment-form.tsx` (+1) | `GET /api/v1/performance/reviews/mine`; `POST /api/v1/performance/reviews/{id}/manager-review` |  |
| `CanApprovePerformanceReview` | require×2, usePermissionAction×1, manifest×1 in `modules/performance-reviews/components/review-actions.tsx`; `modules/performance-reviews/hooks/use-review-decision.ts` | — | frontend-only |

## IT Support › Manage User Directory

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewActiveUser` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/users/lib/user-access.ts`; `modules/users/manifest.ts` | — | frontend-only |
| `CanCreateUser` | manifest×1, constant×1 in `modules/users/lib/user-access.ts`; `modules/users/manifest.ts` | `POST /api/v1/employee/user` |  |
| `CanEditUser` | constant×1 in `modules/users/lib/user-access.ts` | — | frontend-only |
| `CanBlockUser` | constant×1 in `modules/users/lib/user-access.ts` | — | frontend-only |
| `CanViewInactiveUser` | constant×3, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/users/lib/user-access.ts`; `modules/users/manifest.ts` | — | frontend-only |
| `CanUnblockUser` | constant×1 in `modules/users/lib/user-access.ts` | — | frontend-only |
| `CanSwitchDepartment` | constant×1 in `shared/auth/session-api.ts` | `POST /api/v1/user/switch-department`; `POST /api/v1/user/switch-department/{departmentid}` |  |

## IT Support › Audit Trail

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewAuditTrail` | constant×2, manifest×1 in `modules/audit-trail/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/error-log`; `GET /api/v1/error-log/summary`; `GET /api/v1/error-log/{id}` |  |

## IT Support › Manage Roles

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRoles` | constant×4, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/permissions/hooks/use-permissions-workspace.ts`; `modules/roles/lib/permissions.ts` (+1) | `GET /api/v1/role`; `GET /api/v1/role/with-permissions`; `GET /api/v1/role/{id}` |  |
| `CanCreateRole` | manifest×1, constant×1 in `modules/roles/lib/permissions.ts`; `modules/roles/manifest.ts` | — | frontend-only |
| `CanEditRole` | constant×1 in `modules/roles/lib/permissions.ts` | `PUT /api/v1/role/{id}` |  |
| `CanDeleteRole` | constant×1 in `modules/roles/lib/permissions.ts` | `GET /api/v1/role/check/{id}`; `DELETE /api/v1/role/{id}` |  |

## IT Support › Manage Permissions

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPermissions` | constant×3, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/permissions/hooks/use-permissions-workspace.ts`; `modules/permissions/manifest.ts` | — | frontend-only |
| `CanUpdateExistingPermission` | constant×2 in `modules/permissions/hooks/use-permissions-workspace.ts`; `modules/roles/lib/permissions.ts` | — | frontend-only |
| `CanResetPermission` | constant×1 in `modules/permissions/hooks/use-permissions-workspace.ts` | — | frontend-only |

## IT Support › Support Tickets

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCreateTicket` | constant×1 in `modules/it-tickets/lib/tickets.ts` | — | frontend-only |
| `CanViewAllTickets` | constant×2, some-rule×1 in `modules/it-tickets/lib/tickets.ts`; `modules/it-tickets/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/tickets`; `GET /api/v1/tickets/{id}`; `GET /api/v1/tickets/{id}/activity` |  |
| `CanAssignTicket` | constant×2, some-rule×1 in `modules/it-tickets/lib/tickets.ts`; `modules/it-tickets/manifest.ts`; `modules/navigation/catalog.generated.ts` | `PUT /api/v1/tickets/{id}/assign` |  |
| `CanCloseTicket` | constant×2, some-rule×1 in `modules/it-tickets/lib/tickets.ts`; `modules/it-tickets/manifest.ts`; `modules/navigation/catalog.generated.ts` | `PUT /api/v1/tickets/{id}/close`; `PUT /api/v1/tickets/{id}/reopen` |  |
| `CanCommentOnTicket` | constant×2, some-rule×1 in `modules/it-tickets/lib/tickets.ts`; `modules/it-tickets/manifest.ts`; `modules/navigation/catalog.generated.ts` | `POST /api/v1/tickets/{id}/comments` |  |

## Settings › Product Category

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewProductCategories` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateProductCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditProductCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteProductCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |

## Settings › Products

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRawCategories` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateRawCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditRawCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteRawCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanViewPackageCategories` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreatePackageCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditPackageCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeletePackageCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanViewItemCategory` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateItemCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditItemCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteItemCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanViewEquipmentCategory` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateEquipmentCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditEquipmentCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteEquipmentCategory` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanViewMaterialTypes` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateMaterialType` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditMaterialType` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteMaterialType` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanViewUomStyle` | constant×1 in `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateUomStyle` | — | — | unused, unused by desktop |
| `CanEditUomStyle` | — | — | unused, unused by desktop |
| `CanDeleteUomStyle` | — | — | unused, unused by desktop |
| `CanViewPackageStyle` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreatePackageStyle` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditPackageStyle` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeletePackageStyle` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanViewProductState` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateProductState` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditProductState` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteProductState` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |

## Settings › Procedures

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewResources` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateResource` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditResource` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteResource` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanViewOperations` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateOperation` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditOperation` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteOperation` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanViewWorkCenters` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateWorkCenter` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditWorkCenter` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteWorkCenter` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |

## Settings › Site

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewSite` | constant×3, manifest×2 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts`; `modules/sites/manifest.ts` | — | frontend-only |
| `CanCreateSite` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditWorkSite` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteSite` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |

## Settings › Address

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewCountries` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateCountries` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditCountries` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteCountries` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |

## Settings › Terms of Payment

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewPaymentTerms` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreatePaymentTerm` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditPaymentTerm` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeletePaymentTerm` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |

## Settings › Delivery Mode

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewDeliveryModes` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateDeliveryMode` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditDeliveryMode` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteDeliveryMode` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |

## Settings › Charges

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewCharges` | constant×2, manifest×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateCharges` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanEditCharges` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |
| `CanDeleteCharges` | manifest×1 in `modules/collection-configurations/lib/collections.ts` | — | frontend-only |

## Settings › Threshold

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewThreshold` | constant×1 in `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateThreshold` | — | — | unused, unused by desktop |
| `CanEditThreshold` | — | — | unused, unused by desktop |
| `CanDeleteThreshold` | — | — | unused, unused by desktop |

## Settings › CODE SETTINGS

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewCodeSettings` | constant×3, manifest×1 in `modules/code-settings/code-settings.ts`; `modules/code-settings/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateNewCodes` | constant×1 in `modules/code-settings/code-settings.ts` | — | frontend-only |
| `CanEditCodeSettings` | constant×1 in `modules/code-settings/code-settings.ts` | — | frontend-only |
| `CanDeleteCodeSettings` | constant×1 in `modules/code-settings/code-settings.ts` | — | frontend-only |

## Settings › Workflow Builder

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQuestions` | manifest×5, constant×3, anyPermissions×2 in `modules/navigation/catalog.generated.ts`; `modules/questions/lib/questions.ts`; `modules/questions/manifest.ts` (+1) | `GET /api/v1/formula-definitions/questions/{questionid}/revisions`; `GET /api/v1/formula-repairs/questions/{questionid}`; `POST /api/v1/formula-repairs/questions/{questionid}/preview` (+3) |  |
| `CanCreateQuestions` | manifest×2, constant×1 in `modules/questions/lib/questions.ts`; `modules/questions/manifest.ts` | `POST /api/v1/formula-questions` |  |
| `CanEditQuestions` | manifest×2, constant×1 in `modules/questions/lib/questions.ts`; `modules/questions/manifest.ts` | `POST /api/v1/formula-definitions/questions/{questionid}/revisions`; `PUT /api/v1/formula-definitions/revisions/{revisionid}`; `POST /api/v1/formula-definitions/revisions/{revisionid}/validate` (+3) |  |
| `CanRepairQuestionFormula` | constant×1, anyPermissions×1 in `modules/questions/manifest.ts`; `shared/formula/repairs/access.ts` | `GET /api/v1/formula-repairs/questions/{questionid}`; `POST /api/v1/formula-repairs/questions/{questionid}/preview`; `POST /api/v1/formula-repairs/questions/{questionid}/apply` (+1) |  |

## Quality Control › Testing

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanRepairTestFormula` | constant×1, anyPermissions×1 in `modules/questions/manifest.ts`; `shared/formula/repairs/access.ts` | `GET /api/v1/formula-repairs/questions/{questionid}`; `POST /api/v1/formula-repairs/questions/{questionid}/preview`; `POST /api/v1/formula-repairs/questions/{questionid}/apply` (+1) |  |

## Settings › Workflow Builder

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanDeleteQuestions` | constant×1 in `modules/questions/lib/questions.ts` | — | frontend-only |
| `CanApplyFormulaMigration` | — | — | unused, unused by desktop |
| `CanViewReviewFormulaRevision` | constant×2, manifest×1 in `modules/formula-reviews/manifest.ts`; `modules/navigation/catalog.generated.ts`; `shared/formula/review/revision-review.ts` | `GET /api/v1/formula-definitions/review-queue`; `GET /api/v1/formula-definitions/questions/{questionid}/review-revisions`; `GET /api/v1/approval/my-pending/document-counts` (+1) |  |
| `CanReviewFormulaRevision` | constant×2 in `modules/questions/lib/questions.ts`; `shared/formula/review/revision-review.ts` | `POST /api/v1/formula-definitions/revisions/{revisionid}/record-review` |  |
| `CanViewApproveFormulaRevision` | constant×2, manifest×1 in `modules/formula-approvals/manifest.ts`; `modules/navigation/catalog.generated.ts`; `shared/formula/review/revision-review.ts` | `GET /api/v1/formula-definitions/approval-queue`; `GET /api/v1/formula-definitions/questions/{questionid}/approval-revisions`; `GET /api/v1/approval/my-pending/document-counts` (+1) |  |
| `CanApproveFormulaRevision` | constant×2 in `modules/questions/lib/questions.ts`; `shared/formula/review/revision-review.ts` | `POST /api/v1/formula-definitions/revisions/{revisionid}/approve` |  |

## Quality Control › Testing

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanExecuteFormulaResponse` | constant×1, usePermissionAction×1, require×1 in `modules/analytical-test-requests/components/atr-formula-actions.tsx`; `shared/form-response/use-response-writer.ts` | `POST /api/v1/form/responses/finalize/{responseid}`; `POST /api/v1/form/responses`; `POST /api/v1/formula-repairs/tests/{atrid}/fields/{formfieldid}/evaluate` (+2) |  |

## Settings › Workflow Builder

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanReviewFormRevision` | — | `POST /api/v1/form-revisions/{id}/record-review` | unused by desktop |
| `CanApproveFormRevision` | — | `POST /api/v1/form-revisions/{id}/approve` | unused by desktop |
| `CanViewTemplate` | constant×3, manifest×3 in `modules/form-templates/lib/templates.ts`; `modules/form-templates/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/form-revisions/forms/{formid}` |  |
| `CanCreateTemplate` | manifest×1, constant×1 in `modules/form-templates/lib/templates.ts`; `modules/form-templates/manifest.ts` | — | frontend-only |
| `CanEditTemplate` | manifest×1, constant×1 in `modules/form-templates/lib/templates.ts`; `modules/form-templates/manifest.ts` | `POST /api/v1/form-revisions/forms/{formid}`; `PUT /api/v1/form-revisions/{id}`; `POST /api/v1/form-revisions/{id}/submit-review` |  |
| `CanDeleteTemplate` | constant×1 in `modules/form-templates/lib/templates.ts` | — | frontend-only |

## Settings › Alerts & Notifications

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewAlerts` | constant×2, manifest×1, has()×1 in `modules/alerts/hooks/use-alerts.ts`; `modules/alerts/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/alert/{alertid}`; `GET /api/v1/alert` |  |
| `CanCreateNewAlerts` | require×1, usePermissionAction×1 in `modules/alerts/components/alert-editor.tsx`; `modules/alerts/components/alerts-workspace.tsx` | `POST /api/v1/alert` |  |
| `CanEditAlerts` | require×2, usePermissionAction×1 in `modules/alerts/components/alert-editor.tsx`; `modules/alerts/components/alerts-table.tsx` | `PUT /api/v1/alert/{alertid}`; `PUT /api/v1/alert/{alertid}/recipients` |  |
| `CanEnableDisableAlerts` | require×2 in `modules/alerts/components/alerts-table.tsx`; `modules/alerts/components/alerts-workspace.tsx` | `PUT /api/v1/alert/{id}/toggle-disable` |  |
| `CanDeleteAlerts` | require×2 in `modules/alerts/components/alerts-table.tsx`; `modules/alerts/components/alerts-workspace.tsx` | `DELETE /api/v1/alert/{id}` |  |

## Settings › Approvals

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewApprovals` | constant×3, manifest×1, has()×1 in `modules/approval-settings/hooks/use-approval-configurations.ts`; `modules/approval-settings/lib/workflows.ts`; `modules/approval-settings/manifest.ts` (+1) | — | frontend-only |
| `CanCreateNewApproval` | usePermissionAction×2, manifest×1, require×1, constant×1 in `modules/approval-settings/components/approval-configurations-workspace.tsx`; `modules/approval-settings/components/approval-editor.tsx`; `modules/approval-settings/components/workflow-form.tsx` (+2) | — | frontend-only |
| `CanEditApprovalWorkflow` | require×2, usePermissionAction×2, manifest×1, has()×1, constant×1 in `modules/approval-settings/components/approval-configurations-table.tsx`; `modules/approval-settings/components/approval-configurations-workspace.tsx`; `modules/approval-settings/components/approval-editor.tsx` (+3) | `PUT /api/v1/approval/{approvalid}` |  |
| `CanDeleteApprovals` | require×3, constant×1 in `modules/approval-settings/components/approval-configurations-table.tsx`; `modules/approval-settings/components/approval-configurations-workspace.tsx`; `modules/approval-settings/components/workflow-pages.tsx` (+1) | — | frontend-only |

## Settings › Signature Settings

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewSignatureSettings` | constant×2, manifest×1, has()×1 in `modules/navigation/catalog.generated.ts`; `modules/signature-settings/components/signature-workspace.tsx`; `modules/signature-settings/manifest.ts` | — | frontend-only |
| `CanCreateSignatureSettings` | has()×1 in `modules/signature-settings/components/signature-workspace.tsx` | — | frontend-only |

## Settings › Change Password

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewChangePassword` | constant×2, manifest×1 in `modules/change-password/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanChangePassword` | require×1 in `modules/change-password/components/password-form.tsx` | — | frontend-only |

## Inventory Management › Manufacturers

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewManufacturers` | constant×2, manifest×1 in `modules/manufacturers/lib/manufacturer-access.ts`; `modules/manufacturers/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateManufacturer` | manifest×1, constant×1 in `modules/manufacturers/lib/manufacturer-access.ts`; `modules/manufacturers/manifest.ts` | — | frontend-only |
| `CanUpdateManufacturerDetails` | manifest×1, constant×1 in `modules/manufacturers/lib/manufacturer-access.ts`; `modules/manufacturers/manifest.ts` | — | frontend-only |
| `CanDeleteManufacturer` | constant×1 in `modules/manufacturers/lib/manufacturer-access.ts` | — | frontend-only |

## Inventory Management › Suppliers

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewVendors` | constant×4, manifest×2, require×2 in `modules/navigation/catalog.generated.ts`; `modules/store-vendors/components/vendor-actions.tsx`; `modules/store-vendors/hooks/use-vendor-command.ts` (+3) | — | 2 submodules, frontend-only |
| `CanCreateVendor` | has()×1, require×1, manifest×1, constant×1 in `modules/store-vendors/components/vendors-page.tsx`; `modules/store-vendors/hooks/use-vendor-command.ts`; `modules/suppliers/lib/supplier-access.ts` (+1) | — | 2 submodules, frontend-only |
| `CanUpdateVendorDetails` | require×2, constant×2, manifest×1 in `modules/store-vendors/components/vendor-actions.tsx`; `modules/store-vendors/hooks/use-vendor-command.ts`; `modules/suppliers/components/purchase-unit-fixtures.tsx` (+2) | — | 2 submodules, frontend-only |
| `CanDeleteVendor` | require×3, constant×1 in `modules/store-vendors/components/vendor-actions.tsx`; `modules/store-vendors/hooks/use-vendor-command.ts`; `modules/suppliers/lib/supplier-access.ts` | — | 2 submodules, frontend-only |
| `CanViewSupplierCertifications` | constant×2, some-rule×1, has()×1, require×1, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/supplier-compliance/manifest.ts`; `modules/suppliers/components/supplier-detail.tsx` (+3) | `GET /api/v1/suppliers/{supplierid}/certifications`; `GET /api/v1/suppliers/certifications/expiring`; `GET /api/v1/suppliers/requalification-due` |  |
| `CanManageSupplierCertifications` | usePermissionAction×1, constant×1 in `modules/suppliers/relationship/certification-dialog.tsx`; `modules/suppliers/relationship/certifications-panel.tsx` | `POST /api/v1/suppliers/{supplierid}/certifications`; `PUT /api/v1/suppliers/{supplierid}/certifications/{id}`; `DELETE /api/v1/suppliers/{supplierid}/certifications/{id}` |  |
| `CanViewSupplierPerformance` | some-rule×1, has()×1, constant×1, require×1, usePermissionAction×1 in `modules/suppliers/components/supplier-detail.tsx`; `modules/suppliers/detail/supplier-overview.ts`; `modules/suppliers/manifest.ts` (+2) | `POST /api/v1/suppliers/{supplierid}/performance/compute`; `POST /api/v1/suppliers/{supplierid}/performance`; `GET /api/v1/suppliers/{supplierid}/performance` |  |
| `CanManageSupplierContracts` | require×12, constant×4, usePermissionAction×3, some-rule×1 in `modules/quotation-responses/lib/quotation-response-access.ts`; `modules/suppliers/detail/supplier-overview.ts`; `modules/suppliers/manifest.ts` (+6) | `GET /api/v1/suppliers/{supplierid}/bank-details`; `POST /api/v1/suppliers/{supplierid}/bank-details`; `PUT /api/v1/suppliers/{supplierid}/bank-details/{id}` (+10) |  |
| `CanViewSupplierSpend` | some-rule×1, has()×1, constant×1 in `modules/suppliers/components/supplier-detail.tsx`; `modules/suppliers/detail/supplier-overview.ts`; `modules/suppliers/manifest.ts` | `GET /api/v1/suppliers/{supplierid}/spend-summary` |  |

## Inventory Management › Warehouses

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewWarehouses` | constant×4, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/warehouses/lib/store-rules.ts`; `modules/warehouses/manifest.ts` | — | frontend-only |

## Inventory Management › Locations

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewLocations` | constant×4, manifest×1 in `modules/locations/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/warehouses/lib/store-rules.ts` | — | frontend-only |
| `CanAddNewLocation` | constant×1 in `modules/warehouses/lib/store-rules.ts` | — | frontend-only |
| `CanEditLocation` | constant×1 in `modules/warehouses/lib/store-rules.ts` | — | frontend-only |
| `CanDeleteLocation` | constant×1 in `modules/warehouses/lib/store-rules.ts` | — | frontend-only |

## Inventory Management › Racks

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRacks` | constant×4, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/racks/lib/rack-access.ts`; `modules/racks/manifest.ts` | — | frontend-only |
| `CanAddNewRack` | constant×1 in `modules/racks/lib/rack-access.ts` | — | frontend-only |
| `CanEditRack` | constant×1 in `modules/racks/lib/rack-access.ts` | — | frontend-only |
| `CanDeleteRack` | constant×1 in `modules/racks/lib/rack-access.ts` | — | frontend-only |

## Inventory Management › Shelves

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewShelves` | constant×4, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/racks/lib/rack-access.ts`; `modules/shelves/manifest.ts` | — | frontend-only |
| `CanAddNewShelf` | constant×1 in `modules/racks/lib/rack-access.ts` | — | frontend-only |
| `CanEditShelf` | constant×1 in `modules/racks/lib/rack-access.ts` | — | frontend-only |
| `CanDeleteShelf` | constant×1 in `modules/racks/lib/rack-access.ts` | — | frontend-only |

## Inventory Management › Equipment

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewEquipment` | constant×4, manifest×1 in `modules/equipment/equipment.ts`; `modules/equipment/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateEquipment` | constant×1 in `modules/equipment/equipment.ts` | — | frontend-only |
| `CanEditEquipmentDetails` | constant×1 in `modules/equipment/equipment.ts` | — | frontend-only |
| `CanDeleteEquipment` | constant×1 in `modules/equipment/equipment.ts` | — | frontend-only |

## Inventory Management › QC Equipment

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQcEquipment` | constant×4, has()×1, manifest×1 in `modules/material-retests/testing/worksheet-editor.tsx`; `modules/navigation/catalog.generated.ts`; `modules/qc-equipment/manifest.ts` (+1) | `GET /api/v1/qc-equipment`; `GET /api/v1/qc-equipment/all`; `GET /api/v1/qc-equipment/{id}` |  |
| `CanCreateQcEquipment` | constant×1 in `modules/qc-equipment/qc-equipment.ts` | `POST /api/v1/qc-equipment` |  |
| `CanEditQcEquipmentDetails` | constant×1 in `modules/qc-equipment/qc-equipment.ts` | `PUT /api/v1/qc-equipment/{id}` |  |
| `CanDeleteQcEquipment` | constant×1 in `modules/qc-equipment/qc-equipment.ts` | `DELETE /api/v1/qc-equipment/{id}` |  |
| `CanViewQcEquipmentCalibration` | — | `GET /api/v1/qc-equipment/calibration-due` | unused by desktop |
| `CanUpdateQcEquipmentCalibration` | — | — | unused, unused by desktop |

## Quality Control › Instrument Calibration

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewInstrumentCalibration` | — | `GET /api/v1/qc/instruments`; `GET /api/v1/qc/instruments/{id}`; `GET /api/v1/qc/instruments/calibration-due` | unused by desktop |
| `CanUpdateInstrumentCalibration` | — | `PUT /api/v1/qc/instruments/{id}/calibration` | unused by desktop |

## Inventory Management › Unit of Measure

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewUnitOfMeasure` | constant×5, manifest×2 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts`; `modules/units-of-measure/manifest.ts` (+1) | — | frontend-only |
| `CanCreateUnitOfMeasure` | usePermissionAction×1, manifest×1, constant×1 in `modules/collection-configurations/components/unit-editor.tsx`; `modules/collection-configurations/lib/collections.ts`; `modules/units-of-measure/units.ts` | — | frontend-only |
| `CanEditUnitOfMeasure` | usePermissionAction×1, manifest×1, constant×1 in `modules/collection-configurations/components/unit-editor.tsx`; `modules/collection-configurations/lib/collections.ts`; `modules/units-of-measure/units.ts` | — | frontend-only |
| `CanDeleteUnitOfMeasure` | manifest×1, constant×1 in `modules/collection-configurations/lib/collections.ts`; `modules/units-of-measure/units.ts` | — | frontend-only |

## Organizational Structure › Departments

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewDepartments` | constant×4, manifest×1 in `modules/departments/departments.ts`; `modules/departments/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateNewDepartment` | constant×1 in `modules/departments/departments.ts` | — | frontend-only |
| `CanEditDepartment` | constant×1 in `modules/departments/departments.ts` | — | frontend-only |
| `CanDeleteDepartment` | constant×1 in `modules/departments/departments.ts` | — | frontend-only |

## Organizational Structure › Working Days

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewWorkingDays` | constant×4, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/working-days/manifest.ts`; `modules/working-days/working-days.ts` | — | frontend-only |
| `CanCreateWorkingDays` | constant×1 in `modules/working-days/working-days.ts` | — | frontend-only |
| `CanResetWorkingDays` | constant×1 in `modules/working-days/working-days.ts` | — | frontend-only |

## Organizational Structure › Holidays

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewHolidays` | constant×4, manifest×1 in `modules/holidays/holidays.ts`; `modules/holidays/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateHoliday` | constant×1 in `modules/holidays/holidays.ts` | — | frontend-only |
| `CanEditHoliday` | constant×1 in `modules/holidays/holidays.ts` | — | frontend-only |
| `CanDeleteHoliday` | constant×1 in `modules/holidays/holidays.ts` | — | frontend-only |

## Organizational Structure › Shifts Type

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewShiftTypes` | constant×4, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/shift-types/manifest.ts`; `modules/shift-types/shifts.ts` | `GET /api/v1/shift-type`; `GET /api/v1/shift-type/{id}` |  |
| `CanCreateShiftType` | constant×1 in `modules/shift-types/shifts.ts` | `POST /api/v1/shift-type` |  |
| `CanEditShiftType` | constant×1 in `modules/shift-types/shifts.ts` | `PUT /api/v1/shift-type/{id}` |  |
| `CanDeleteShiftType` | constant×1 in `modules/shift-types/shifts.ts` | `DELETE /api/v1/shift-type/{id}` |  |

## Organizational Structure › Shifts Schedule

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewShiftSchedule` | constant×7, manifest×2, require×1 in `modules/navigation/catalog.generated.ts`; `modules/shift-planning/hooks/use-shift-command.ts`; `modules/shift-planning/manifest.ts` (+4) | `GET /api/v1/shift-schedules`; `GET /api/v1/shift-schedules/{id}`; `GET /api/v1/shift-schedules/department/{id}` (+2) |  |
| `CanCreateShiftSchedule` | constant×2, allows()×1 in `modules/shift-planning/components/shift-calendar-page.tsx`; `modules/shift-planning/hooks/use-shift-command.ts`; `modules/shift-types/shifts.ts` | `POST /api/v1/shift-schedules`; `POST /api/v1/shift-schedules/assign` |  |
| `CanEditShiftSchedule` | constant×2, require×1 in `modules/shift-planning/components/calendar-rows.tsx`; `modules/shift-planning/hooks/use-shift-command.ts`; `modules/shift-types/shifts.ts` | `POST /api/v1/shift-schedules/swap`; `PUT /api/v1/shift-schedules/{id}`; `PUT /api/v1/shift-schedules/{id}/update-schedule` |  |
| `CanDeleteShiftSchedule` | constant×1 in `modules/shift-types/shifts.ts` | `DELETE /api/v1/shift-schedules/{id}` |  |

## Organizational Structure › Shift Category

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewShiftCategories` | constant×7, manifest×2, require×2, allows()×1 in `modules/collection-configurations/lib/collections.ts`; `modules/navigation/catalog.generated.ts`; `modules/shift-categories/manifest.ts` (+6) | `GET /api/v1/shift-category`; `GET /api/v1/shift-category/{id}` |  |
| `CanCreateShiftCategory` | manifest×1, constant×1 in `modules/collection-configurations/lib/collections.ts`; `modules/shift-types/shifts.ts` | `POST /api/v1/shift-category` |  |
| `CanEditShiftCategory` | manifest×1, constant×1 in `modules/collection-configurations/lib/collections.ts`; `modules/shift-types/shifts.ts` | `PUT /api/v1/shift-category/{id}` |  |
| `CanDeleteShiftCategory` | manifest×1, constant×1 in `modules/collection-configurations/lib/collections.ts`; `modules/shift-types/shifts.ts` | `DELETE /api/v1/shift-category/{id}` |  |

## Organizational Structure › Working Hours Policy

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewWorkingHoursPolicy` | constant×6, require×1, allows()×1, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/shift-planning/components/shift-calendar-page.tsx`; `modules/shift-planning/hooks/use-shift-command.ts` (+4) | `GET /api/v1/working-hours-policy` |  |
| `CanManageWorkingHoursPolicy` | constant×1 in `modules/shift-types/shifts.ts` | `POST /api/v1/working-hours-policy`; `DELETE /api/v1/working-hours-policy/{id}` |  |

## Reports › Reports

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewHumanResourcesReport` | manifest×3, constant×2, some-rule×1 in `modules/hr-reports/manifest.ts`; `modules/navigation/catalog.generated.ts`; `modules/reports/lib/report-model.ts` (+1) | `GET /api/v1/report/history/capabilities` |  |
| `CanViewInventoryReport` | constant×1 in `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanViewQcAndQaReport` | constant×2, manifest×2, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/reports/lib/report-model.ts`; `modules/reports/manifest.ts` | `GET /api/v1/report/bmr-issued`; `GET /api/v1/report/production-readiness`; `GET /api/v1/report/history/capabilities` |  |
| `CanViewWarehouseReport` | constant×2, some-rule×1, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/reports/lib/report-model.ts`; `modules/reports/manifest.ts` | `GET /api/v1/report/history/capabilities` |  |
| `CanViewStoreAndInventoryReport` | constant×2, some-rule×1, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/reports/lib/report-model.ts`; `modules/reports/manifest.ts` | `GET /api/v1/report/history/capabilities` |  |
| `CanViewProcurementReport` | constant×2, manifest×2, some-rule×1 in `modules/navigation/catalog.generated.ts`; `modules/reports/lib/report-model.ts`; `modules/reports/manifest.ts` | `GET /api/v1/report/history/capabilities` |  |
| `CanViewFgtnReport` | constant×2, some-rule×1, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/reports/lib/report-model.ts`; `modules/reports/manifest.ts` | `GET /api/v1/report/history/capabilities` |  |

## Audit › Quality Audits

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQualityAudits` | constant×1 in `modules/navigation/catalog.generated.ts` | — | frontend-only |
| `CanCreateQualityAudit` | — | — | unused, unused by desktop |
| `CanConductQualityAudit` | — | — | unused, unused by desktop |
| `CanRaiseCorrectiveAction` | — | — | unused, unused by desktop |
| `CanReviewCorrectiveAction` | — | — | unused, unused by desktop |
| `CanCloseQualityAudit` | — | — | unused, unused by desktop |

## Research & Development › R&D Projects

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRndProjects` | constant×1 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/rnd/projects/{rndprojectid}/development-report`; `GET /api/v1/rnd/projects/{id}`; `GET /api/v1/rnd/projects` |  |
| `CanCreateRndProject` | — | `POST /api/v1/rnd/projects` | unused by desktop |
| `CanEditRndProject` | — | `PUT /api/v1/rnd/projects/{id}` | unused by desktop |
| `CanUpdateRndProjectStatus` | — | `PUT /api/v1/rnd/projects/{id}/status` | unused by desktop |
| `CanDeleteRndProject` | — | `DELETE /api/v1/rnd/projects/{id}` | unused by desktop |

## Research & Development › R&D Formulations

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRndFormulations` | constant×2 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/rnd/projects/{rndprojectid}/formulations/{formulationid}`; `GET /api/v1/rnd/projects/{rndprojectid}/formulations`; `GET /api/v1/rnd/formulation-reviews/{formulationid}` (+1) |  |

## Research & Development › R&D Formula Builder

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewFormulaBuilder` | manifest×1, constant×1 in `modules/formula-builder/manifest.ts`; `modules/navigation/catalog.generated.ts` | — | frontend-only |

## Research & Development › R&D Formulations

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCreateRndFormulation` | — | `POST /api/v1/rnd/projects/{rndprojectid}/formulations`; `POST /api/v1/rnd/projects/{rndprojectid}/formulations/{formulationid}/new-version` | unused by desktop |
| `CanEditRndFormulation` | — | `PUT /api/v1/rnd/projects/{rndprojectid}/formulations/{formulationid}`; `PUT /api/v1/rnd/projects/{rndprojectid}/formulations/{formulationid}/status` | unused by desktop |

## Research & Development › R&D Trial Batches

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRndTrialBatches` | constant×1 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/rnd/projects/{rndprojectid}/trial-batches/{trialbatchid}`; `GET /api/v1/rnd/projects/{rndprojectid}/trial-batches` |  |
| `CanCreateRndTrialBatch` | — | `POST /api/v1/rnd/projects/{rndprojectid}/trial-batches` | unused by desktop |
| `CanEditRndTrialBatch` | — | `PUT /api/v1/rnd/projects/{rndprojectid}/trial-batches/{trialbatchid}/status` | unused by desktop |
| `CanIssueTrialRequisition` | — | `POST /api/v1/requisition/issue-trial-requisition/{requisitionid}` | unused by desktop |

## Research & Development › R&D Analytical Methods

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRndAnalyticalMethods` | constant×1 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/rnd/projects/{rndprojectid}/analytical-methods/{methodid}`; `GET /api/v1/rnd/projects/{rndprojectid}/analytical-methods` |  |
| `CanCreateRndAnalyticalMethod` | — | `POST /api/v1/rnd/projects/{rndprojectid}/analytical-methods` | unused by desktop |
| `CanEditRndAnalyticalMethod` | — | `PUT /api/v1/rnd/projects/{rndprojectid}/analytical-methods/{methodid}`; `PUT /api/v1/rnd/projects/{rndprojectid}/analytical-methods/{methodid}/status` | unused by desktop |
| `CanTransferRndAnalyticalMethod` | — | `POST /api/v1/rnd/projects/{rndprojectid}/analytical-methods/{methodid}/transfer` | unused by desktop |

## Research & Development › R&D Stability Studies

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRndStabilityStudies` | constant×1 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/rnd/stability-chambers`; `GET /api/v1/rnd/stability-chambers/{studyid}`; `GET /api/v1/rnd/stability-chambers` |  |
| `CanCreateRndStabilityStudy` | — | `POST /api/v1/rnd/stability-chambers` | unused by desktop |
| `CanEditRndStabilityStudy` | — | `PUT /api/v1/rnd/stability-chambers/{studyid}/status`; `PUT /api/v1/rnd/stability-chambers/pull-points/{pullpointid}/result` | unused by desktop |
| `CanManageRndStabilityChambers` | constant×1 in `modules/navigation/catalog.generated.ts` | `POST /api/v1/rnd/stability-chambers` |  |

## Research & Development › R&D Technology Transfers

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewRndTechnologyTransfers` | constant×1 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/rnd/projects/{rndprojectid}/technology-transfers/{transferid}`; `GET /api/v1/rnd/projects/{rndprojectid}/technology-transfers`; `GET /api/v1/rnd/technology-transfer-reviews/{transferid}` |  |
| `CanCreateRndTechnologyTransfer` | — | `POST /api/v1/rnd/projects/{rndprojectid}/technology-transfers` | unused by desktop |
| `CanEditRndTechnologyTransfer` | — | `PUT /api/v1/rnd/projects/{rndprojectid}/technology-transfers/{transferid}/status` | unused by desktop |
| `CanPromoteRndTechnologyTransfer` | — | `POST /api/v1/rnd/projects/{rndprojectid}/technology-transfers/{transferid}/promote` | unused by desktop |

## Quality Assurance › OOS Investigations

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanInitiateOosInvestigation` | constant×1 in `modules/pending-approvals/components/details/start-oos-dialog.tsx` | `POST /api/v1/qa/oos-investigations/initiate` |  |
| `CanViewOosInvestigations` | constant×1, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/oos-investigations/manifest.ts` | `GET /api/v1/qa/oos-investigations/{id}`; `GET /api/v1/qa/oos-investigations` |  |
| `CanSubmitOosInvestigation` | require×2, constant×1 in `modules/oos-investigations/components/investigation-action.tsx`; `modules/oos-investigations/components/investigation-pages.tsx` | `PUT /api/v1/qa/oos-investigations/{id}`; `PUT /api/v1/qa/oos-investigations/{id}/submit` |  |
| `CanReviewOosInvestigation` | require×2, constant×1 in `modules/oos-investigations/components/investigation-action.tsx`; `modules/oos-investigations/components/investigation-pages.tsx` | `PUT /api/v1/qa/oos-investigations/{id}/qa-review` |  |

## Full Procedures › Questions & Templates

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQuestionTemplates` | constant×6 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/template-activities/area/{areaid}`; `GET /api/v1/template-activities/{activityid}`; `GET /api/v1/template-adoptions/{adoptionid}` (+13) |  |
| `CanManageTemplateAreas` | — | `POST /api/v1/template-areas`; `PUT /api/v1/template-areas/{id}`; `PUT /api/v1/template-areas/{id}/active` | unused by desktop |
| `CanManageQuestionRevision` | — | `POST /api/v1/template-questions`; `POST /api/v1/template-questions/{questionid}/revisions`; `PUT /api/v1/template-questions/revisions/{revisionid}` (+1) | unused by desktop |
| `CanManageFormTemplateRevision` | — | `POST /api/v1/template-forms`; `POST /api/v1/template-forms/{formid}/revisions`; `PUT /api/v1/template-forms/revisions/{revisionid}` (+5) | unused by desktop |
| `CanManageActivityTemplateRevision` | — | `POST /api/v1/template-activities`; `POST /api/v1/template-activities/{activityid}/revisions`; `PUT /api/v1/template-activities/revisions/{revisionid}` (+1) | unused by desktop |
| `CanManageWorkflowTemplateRevision` | — | `POST /api/v1/template-workflows`; `POST /api/v1/template-workflows/{workflowid}/revisions`; `PUT /api/v1/template-workflows/revisions/{revisionid}` (+2) | unused by desktop |
| `CanShareTemplateRevision` | — | `POST /api/v1/template-adoptions/from-grant/{grantid}`; `POST /api/v1/template-sharing/requests`; `POST /api/v1/template-sharing/{grantid}/approve` (+2) | unused by desktop |
| `CanReviewTemplateRevision` | — | `GET /api/v1/approval/my-pending/document-counts`; `GET /api/v1/approval/my-pending/revisions`; `POST /api/v1/template-activities/revisions/{revisionid}/record-review` (+9) | unused by desktop |
| `CanPublishTemplateRevision` | — | `GET /api/v1/approval/my-pending/document-counts`; `GET /api/v1/approval/my-pending/revisions`; `POST /api/v1/template-activities/revisions/{revisionid}/publish` (+9) | unused by desktop |
| `CanViewHrTemplateResponse` | — | — | unused, unused by desktop |
| `CanViewQcTemplateResponse` | — | — | unused, unused by desktop |
| `CanViewMicrobiologyTemplateResponse` | — | — | unused, unused by desktop |

## Full Procedures › Procedure Definitions

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewProcedures` | — | `GET /api/v1/procedures/area/{areaid}`; `GET /api/v1/procedures/{definitionid}` | unused by desktop |
| `CanCreateProcedure` | — | `POST /api/v1/procedures`; `POST /api/v1/procedures/{definitionid}/revisions` | unused by desktop |
| `CanEditProcedureDraft` | — | `PUT /api/v1/procedures/revisions/{revisionid}` | unused by desktop |
| `CanValidateProcedureDraft` | — | `POST /api/v1/procedures/revisions/{revisionid}/validate` | unused by desktop |
| `CanSubmitProcedureReview` | — | `POST /api/v1/procedures/revisions/{revisionid}/submit-review` | unused by desktop |
| `CanReviewProcedureRevision` | — | `GET /api/v1/approval/my-pending/document-counts`; `GET /api/v1/approval/my-pending/revisions`; `POST /api/v1/procedures/revisions/{revisionid}/record-review` (+1) | unused by desktop |
| `CanApproveProcedureRevision` | — | `GET /api/v1/approval/my-pending/document-counts`; `GET /api/v1/approval/my-pending/revisions`; `POST /api/v1/procedures/revisions/{revisionid}/approve` (+1) | unused by desktop |
| `CanAssignProcedureRevision` | — | — | unused, unused by desktop |

## Full Procedures › BMR/BPR Records

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewBatchRecordDefinitions` | — | — | unused, unused by desktop |
| `CanViewBatchRecordIssues` | — | — | unused, unused by desktop |
| `CanManageBatchRecordMaster` | — | — | unused, unused by desktop |
| `CanApproveBatchRecordMaster` | — | — | unused, unused by desktop |
| `CanApproveProcedureBundle` | — | — | unused, unused by desktop |
| `CanIssueBmrMaster` | — | — | unused, unused by desktop |
| `CanIssueBprMaster` | — | — | unused, unused by desktop |
| `CanReprintBatchRecord` | — | — | unused, unused by desktop |
| `CanReissueBatchRecord` | — | — | unused, unused by desktop |
| `CanAmendBatchRecord` | — | — | unused, unused by desktop |

## Full Procedures › Procedure Runs

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewProcedureRuns` | — | — | unused, unused by desktop |
| `CanIssueProcedureRun` | — | — | unused, unused by desktop |
| `CanStartProcedureRun` | — | — | unused, unused by desktop |
| `CanRecordProcedureEvidence` | — | — | unused, unused by desktop |
| `CanPerformProcedureProcessAction` | — | — | unused, unused by desktop |
| `CanPerformProcedureClearance` | — | — | unused, unused by desktop |
| `CanApproveProcedureClearance` | — | — | unused, unused by desktop |
| `CanRecordProcedureIpc` | — | — | unused, unused by desktop |
| `CanReviewProcedureIpc` | — | — | unused, unused by desktop |
| `CanRequestProcedureStock` | — | — | unused, unused by desktop |
| `CanCreateProcedureAtr` | — | — | unused, unused by desktop |
| `CanPerformProcedurePacking` | — | — | unused, unused by desktop |
| `CanApproveProcedurePackingReconciliation` | — | — | unused, unused by desktop |
| `CanTransferProcedureFinishedProduct` | — | — | unused, unused by desktop |
| `CanDispatchProcedureLot` | — | — | unused, unused by desktop |
| `CanHoldProcedureRun` | — | — | unused, unused by desktop |
| `CanResumeProcedureRun` | — | — | unused, unused by desktop |
| `CanAuthorizeProcedureRework` | — | — | unused, unused by desktop |
| `CanReviewProcedureBatch` | — | — | unused, unused by desktop |
| `CanReleaseProcedureBatch` | — | — | unused, unused by desktop |

## Full Procedures › R&D Product Batches

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanChangeRndProjectTarget` | — | — | unused, unused by desktop |
| `CanViewRndProductBatches` | — | — | unused, unused by desktop |
| `CanCreateRndProductBatch` | — | — | unused, unused by desktop |
| `CanIssueRndProductBatch` | — | — | unused, unused by desktop |
| `CanStartRndProductBatch` | — | — | unused, unused by desktop |
| `CanAbortRndProcedure` | — | — | unused, unused by desktop |
| `CanViewRndBatchCloseout` | — | — | unused, unused by desktop |
| `CanPerformRndBatchCloseout` | — | — | unused, unused by desktop |
| `CanApproveRndBatchDisposition` | — | — | unused, unused by desktop |
| `CanApproveRndBatchCloseout` | — | — | unused, unused by desktop |
| `CanRequestRndProductionStock` | — | — | unused, unused by desktop |
| `CanReviewRndProductionStock` | — | — | unused, unused by desktop |
| `CanIssueRndProductionStock` | — | — | unused, unused by desktop |
| `CanReceiveRndProductionStock` | — | — | unused, unused by desktop |
| `CanConsumeRndBatchMaterial` | — | — | unused, unused by desktop |
| `CanReturnRndBatchMaterial` | — | — | unused, unused by desktop |
| `CanCaptureRndRedevelopmentBaseline` | — | — | unused, unused by desktop |
| `CanManageRndRedevelopmentCandidate` | — | — | unused, unused by desktop |
| `CanReviewRndRedevelopmentCandidate` | — | — | unused, unused by desktop |
| `CanTransferRndRedevelopment` | — | — | unused, unused by desktop |
| `CanActivateRndRedevelopment` | — | — | unused, unused by desktop |

## Quality Control › QC Standard Test Procedures

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQcStps` | constant×2 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/qc/worksheets/stps`; `GET /api/v1/qc/worksheets/stps/{id}` |  |
| `CanCreateQcStp` | — | `POST /api/v1/qc/worksheets/stps` | unused by desktop |
| `CanEditQcStp` | — | `PUT /api/v1/qc/worksheets/stps/{id}`; `POST /api/v1/qc/worksheets/stps/{id}/create-new-version`; `POST /api/v1/qc/worksheets/stps/{id}/submit-for-review` | unused by desktop |
| `CanApproveQcStp` | constant×2 in `modules/navigation/catalog.generated.ts` | `POST /api/v1/qc/worksheets/stps/{id}/approve`; `POST /api/v1/qc/worksheets/stps/{id}/reject`; `POST /api/v1/qc/worksheets/stps/{id}/make-effective` |  |
| `CanSupersedeQcStp` | — | `POST /api/v1/qc/worksheets/stps/{id}/supersede` | unused by desktop |
| `CanImportQcStp` | — | `POST /api/v1/qc/worksheets/stps/import` | unused by desktop |

## Quality Control › QC Worksheet Templates

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewWorksheetTemplates` | constant×2 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/qc/worksheets/templates`; `GET /api/v1/qc/worksheets/templates/{id}` |  |
| `CanCreateWorksheetTemplate` | — | `POST /api/v1/qc/worksheets/templates` | unused by desktop |
| `CanEditWorksheetTemplate` | — | `PUT /api/v1/qc/worksheets/templates/{id}`; `POST /api/v1/qc/worksheets/templates/{id}/create-new-version`; `POST /api/v1/qc/worksheets/templates/{id}/submit-for-review` | unused by desktop |
| `CanApproveWorksheetTemplate` | constant×2 in `modules/navigation/catalog.generated.ts` | `POST /api/v1/qc/worksheets/templates/{id}/approve`; `POST /api/v1/qc/worksheets/templates/{id}/reject`; `POST /api/v1/qc/worksheets/templates/{id}/make-effective` |  |
| `CanSupersedeWorksheetTemplate` | — | `POST /api/v1/qc/worksheets/templates/{id}/supersede` | unused by desktop |
| `CanImportQcWorksheetTemplates` | constant×2 in `modules/navigation/catalog.generated.ts` | `POST /api/v1/qc/specification-proposals`; `POST /api/v1/qc/worksheets/templates/import` |  |
| `CanUseAiWorksheetExtraction` | — | `POST /api/v1/qc/worksheets/templates/import` | unused by desktop |
| `CanManageAiWorksheetExtractionSettings` | constant×3, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/qc-ai-extraction/lib/ai-extraction.ts`; `modules/qc-ai-extraction/manifest.ts` | `GET /api/v1/qc/ai-extraction-settings`; `PUT /api/v1/qc/ai-extraction-settings/{provider}/key`; `PUT /api/v1/qc/ai-extraction-settings/active` |  |

## Quality Control › QC Specifications

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQcSpecifications` | manifest×2, constant×2, require×1 in `modules/material-retests/components/retest-pages.tsx`; `modules/material-retests/manifest.ts`; `modules/material-retests/testing/create-testing-page.tsx` (+1) | `GET /api/v1/qc/worksheets/specifications`; `GET /api/v1/qc/worksheets/specifications/{id}` |  |
| `CanCreateQcSpecification` | — | `POST /api/v1/qc/worksheets/specifications` | unused by desktop |
| `CanEditQcSpecification` | — | `GET /api/v1/qc/worksheets/specifications/{id}/available-fields`; `PUT /api/v1/qc/worksheets/specifications/{id}`; `POST /api/v1/qc/worksheets/specifications/{id}/create-new-version` (+1) | unused by desktop |
| `CanApproveQcSpecification` | constant×2 in `modules/navigation/catalog.generated.ts` | `POST /api/v1/qc/worksheets/specifications/{id}/approve`; `POST /api/v1/qc/worksheets/specifications/{id}/reject`; `POST /api/v1/qc/worksheets/specifications/{id}/make-effective` |  |
| `CanSupersedeQcSpecification` | — | `POST /api/v1/qc/worksheets/specifications/{id}/supersede` | unused by desktop |

## Quality Control › QC Specification Proposals

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQcSpecificationProposals` | constant×2 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/qc/specification-proposals`; `GET /api/v1/qc/specification-proposals/{id}` |  |
| `CanApplyQcSpecificationProposals` | — | `POST /api/v1/qc/specification-proposals/draft`; `POST /api/v1/qc/specification-proposals/apply` | unused by desktop |
| `CanDismissQcSpecificationProposals` | — | `POST /api/v1/qc/specification-proposals/{id}/dismiss` | unused by desktop |

## Quality Control › QC Sampling Point Groups

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewSamplingPointGroups` | — | `GET /api/v1/qc/worksheets/sampling-point-groups`; `GET /api/v1/qc/worksheets/sampling-point-groups/{id}` | unused by desktop |
| `CanManageSamplingPointGroups` | constant×2 in `modules/navigation/catalog.generated.ts` | `POST /api/v1/qc/worksheets/sampling-point-groups`; `PUT /api/v1/qc/worksheets/sampling-point-groups/{id}`; `DELETE /api/v1/qc/worksheets/sampling-point-groups/{id}` |  |

## Quality Control › QC Sampling Points

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewSamplingPoints` | — | `GET /api/v1/qc/worksheets/monitoring-programs/sampling-points`; `GET /api/v1/qc/worksheets/monitoring-programs/sampling-points/{id}` | unused by desktop |
| `CanManageSamplingPoints` | — | `POST /api/v1/qc/worksheets/monitoring-programs/sampling-points`; `PUT /api/v1/qc/worksheets/monitoring-programs/sampling-points/{id}`; `DELETE /api/v1/qc/worksheets/monitoring-programs/sampling-points/{id}` | unused by desktop |

## Quality Control › QC Test Requests

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQcTestRequests` | constant×3, manifest×1, require×1 in `modules/material-retests/components/retest-pages.tsx`; `modules/material-retests/manifest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/qc/worksheets/test-requests`; `GET /api/v1/qc/worksheets/test-requests/{id}`; `GET /api/v1/qc/worksheets/instances/{id}/files/{reference}` (+3) |  |

## Quality Control › QC Retests

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewMaterialRetests` | constant×3, manifest×1 in `modules/material-retests/manifest.ts`; `modules/material-retests/schemas/retest.ts`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/qc/material-retests` |  |
| `CanViewMaterialRetestDetail` | manifest×4, constant×1 in `modules/material-retests/manifest.ts`; `modules/material-retests/schemas/retest.ts` | `GET /api/v1/qc/material-retests/{id}`; `GET /api/v1/qc/material-retests/{id}/certificates` |  |
| `CanRequestMaterialRetest` | constant×1 in `modules/material-retests/schemas/retest.ts` | `POST /api/v1/qc/material-retests/batches/{batchid}` |  |
| `CanApproveMaterialRetest` | constant×1 in `modules/material-retests/schemas/retest.ts` | `POST /api/v1/qc/material-retests/{id}/approve` |  |
| `CanRejectMaterialRetest` | constant×1 in `modules/material-retests/schemas/retest.ts` | `POST /api/v1/qc/material-retests/{id}/reject` |  |
| `CanRecordMaterialRetestSample` | constant×1 in `modules/material-retests/schemas/retest.ts` | `POST /api/v1/qc/material-retests/{id}/sample` |  |
| `CanAcknowledgeMaterialRetest` | constant×1 in `modules/material-retests/schemas/retest.ts` | `POST /api/v1/qc/material-retests/{id}/acknowledge` |  |
| `CanLinkMaterialRetestTestRequest` | manifest×2, constant×1, require×1 in `modules/material-retests/manifest.ts`; `modules/material-retests/schemas/retest.ts`; `modules/material-retests/testing/create-testing-page.tsx` | `POST /api/v1/qc/material-retests/{id}/test-request`; `POST /api/v1/qc/material-retests/{id}/test-request/create` |  |

## Quality Control › QC Rework

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewResponseReworkTasks` | constant×2, manifest×1 in `modules/navigation/catalog.generated.ts`; `modules/qc-rework/manifest.ts` | `GET /api/v1/qc/rework-tasks` |  |
| `CanViewResponseReworkTaskDetail` | manifest×2 in `modules/qc-rework/manifest.ts` | `GET /api/v1/qc/rework-tasks/{id}`; `GET /api/v1/qc/rework-tasks/{id}/form` |  |
| `CanStartResponseReworkTask` | constant×1, require×1, has()×1 in `modules/qc-rework/components/rework-pages.tsx` | `POST /api/v1/qc/rework-tasks/{id}/start` |  |

## Quality Control › QC Test Requests

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanCreateScheduledQcTestRequest` | — | `POST /api/v1/qc/worksheets/monitoring-programs/scan`; `POST /api/v1/qc/worksheets/test-requests`; `POST /api/v1/qc/worksheets/test-requests/{id}/subjects` | unused by desktop |
| `CanCreateUnscheduledQcTestRequest` | manifest×2, require×2 in `modules/material-retests/components/retest-pages.tsx`; `modules/material-retests/manifest.ts`; `modules/material-retests/testing/create-testing-page.tsx` | `POST /api/v1/qc/material-retests/{id}/test-request/create`; `POST /api/v1/qc/worksheets/test-requests`; `POST /api/v1/qc/worksheets/test-requests/{id}/subjects` |  |
| `CanRecordQcSample` | require×2, constant×1 in `modules/material-retests/testing/record-sample-dialog.tsx`; `modules/material-retests/testing/retest-testing-page.tsx` | `POST /api/v1/qc/worksheets/test-requests/{id}/record-sample` |  |
| `CanAssignQcTestRequest` | — | — | unused, unused by desktop |

## Quality Control › QC Test Room

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanAssignWorksheet` | require×2 in `modules/material-retests/testing/worksheet-action.tsx`; `modules/material-retests/testing/worksheet-editor.tsx` | `POST /api/v1/qc/worksheets/instances/{id}/assign` |  |
| `CanReassignWorksheet` | require×2 in `modules/material-retests/testing/worksheet-action.tsx`; `modules/material-retests/testing/worksheet-editor.tsx` | `POST /api/v1/qc/worksheets/instances/{id}/reassign` |  |
| `CanStartChemicalWorksheet` | constant×2 in `modules/material-retests/testing/worksheet-action.tsx`; `modules/material-retests/testing/worksheet-model.ts` | `POST /api/v1/qc/worksheets/instances/{id}/start` |  |
| `CanStartMicrobialWorksheet` | constant×2 in `modules/material-retests/testing/worksheet-action.tsx`; `modules/material-retests/testing/worksheet-model.ts` | `POST /api/v1/qc/worksheets/instances/{id}/start` |  |
| `CanEnterChemicalWorksheetResult` | constant×1 in `modules/material-retests/testing/worksheet-model.ts` | `POST /api/v1/qc/worksheets/instances/{id}/files/{reference}`; `PUT /api/v1/qc/worksheets/instances/{id}/values` |  |
| `CanEnterMicrobialWorksheetResult` | constant×1 in `modules/material-retests/testing/worksheet-model.ts` | `POST /api/v1/qc/worksheets/instances/{id}/files/{reference}`; `PUT /api/v1/qc/worksheets/instances/{id}/values` |  |
| `CanSubmitChemicalWorksheet` | constant×1 in `modules/material-retests/testing/worksheet-model.ts` | `POST /api/v1/qc/worksheets/instances/{id}/submit` |  |
| `CanSubmitMicrobialWorksheet` | constant×1 in `modules/material-retests/testing/worksheet-model.ts` | `POST /api/v1/qc/worksheets/instances/{id}/submit` |  |
| `CanReviewChemicalWorksheet` | constant×3 in `modules/material-retests/testing/worksheet-model.ts`; `modules/navigation/catalog.generated.ts` | `POST /api/v1/qc/worksheets/instances/{id}/review` |  |
| `CanReviewMicrobialWorksheet` | constant×3 in `modules/material-retests/testing/worksheet-model.ts`; `modules/navigation/catalog.generated.ts` | `POST /api/v1/qc/worksheets/instances/{id}/review` |  |
| `CanReturnWorksheetForCorrection` | — | `POST /api/v1/qc/worksheets/instances/{id}/return-for-correction` | unused by desktop |

## Quality Control › QC OOS Cases

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQcOosCases` | constant×2, require×1 in `modules/material-retests/testing/oos-case.tsx`; `modules/navigation/catalog.generated.ts` | `GET /api/v1/qc/worksheets/oos-cases`; `GET /api/v1/qc/worksheets/oos-cases/{id}` |  |
| `CanInvestigateQcOosCase` | constant×1 in `modules/material-retests/testing/oos-case.tsx` | `POST /api/v1/qc/worksheets/oos-cases/{id}/start-investigation`; `PUT /api/v1/qc/worksheets/oos-cases/{id}/investigation` |  |
| `CanAuthorizeQcOosRetest` | constant×1 in `modules/material-retests/testing/oos-case.tsx` | `POST /api/v1/qc/worksheets/oos-cases/{id}/authorize-retest`; `POST /api/v1/qc/worksheets/oos-cases/{id}/escalate` |  |
| `CanDispositionQcOosCase` | constant×1 in `modules/material-retests/testing/oos-case.tsx` | `GET /api/v1/approval/my-pending/document-counts`; `GET /api/v1/approval/my-pending/revisions`; `POST /api/v1/qc/worksheets/oos-cases/{id}/disposition` |  |

## Quality Control › QC Certificates

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQcCertificate` | require×2, constant×2, some-rule×2, manifest×1 in `modules/commercial-certificates/manifest.ts`; `modules/material-retests/components/retest-pages.tsx`; `modules/material-retests/manifest.ts` (+2) | `GET /api/v1/qc/material-retests/{id}/certificates`; `GET /api/v1/qc/worksheets/certificates`; `GET /api/v1/qc/worksheets/certificates/{id}` |  |
| `CanIssueQcCertificate` | require×2, constant×1 in `modules/material-retests/testing/retest-certificate-page.tsx` | `POST /api/v1/qc/worksheets/certificates/{id}/issue` |  |
| `CanReviseQcCertificate` | — | `POST /api/v1/qc/worksheets/certificates/{id}/revise` | unused by desktop |

## Quality Control › QC Monitoring Programs

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewMonitoringPrograms` | constant×2 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/qc/worksheets/monitoring-programs`; `GET /api/v1/qc/worksheets/monitoring-programs/{id}` |  |
| `CanCreateMonitoringProgram` | — | `POST /api/v1/qc/worksheets/monitoring-programs` | unused by desktop |
| `CanEditMonitoringProgram` | — | `PUT /api/v1/qc/worksheets/monitoring-programs/{id}` | unused by desktop |
| `CanPauseMonitoringProgram` | — | `POST /api/v1/qc/worksheets/monitoring-programs/{id}/pause`; `POST /api/v1/qc/worksheets/monitoring-programs/{id}/resume` | unused by desktop |

## Quality Control › QC Water Quality

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQcWaterQualityPeriods` | constant×2 in `modules/navigation/catalog.generated.ts` | `GET /api/v1/qc/worksheets/water-quality/periods`; `GET /api/v1/qc/worksheets/water-quality/periods/{id}` |  |
| `CanActivateQcWaterQualityPeriod` | — | `POST /api/v1/qc/worksheets/water-quality/periods/{id}/activate` | unused by desktop |
| `CanHoldQcWaterQualityPeriod` | — | `POST /api/v1/qc/worksheets/water-quality/periods/{id}/hold` | unused by desktop |
| `CanRecordQcWaterUse` | — | `POST /api/v1/qc/worksheets/water-quality/uses` | unused by desktop |

## Quality Control › QC Approval History

| Key | Desktop usage | Server endpoints enforcing | Flags |
| --- | --- | --- | --- |
| `CanViewQcApprovalHistory` | — | `GET /api/v1/qc/worksheets/approvals/{entitytype}/{entityid}` | unused by desktop |

## Defined but never registered

These cannot be granted from Manage Permissions, so any check on them denies everyone.

- `CanDeleteWaybillForFgw` — desktop: unused; server: none
- `CanEditWaybillForFgw` — desktop: unused; server: none

## Used by the desktop but not defined by the backend

Checks on these always deny: the key cannot exist in any role.

- `CanCompleteRetestProductTest` — `modules/analytical-test-requests/lib/atr.ts:7`
- `CanCreateQcRoutineTest` — `modules/qc-routines/lib/routines.ts:36`
- `CanManageQcMicrobialRequirements` — `modules/qc-routines/lib/routines.ts:37`
- `CanManageQcRoutineSetup` — `modules/qc-routines/lib/routines.ts:37`
- `CanManageQcRoutineWaterQuality` — `modules/qc-routines/lib/routines.ts:38`
- `CanPerformQcRoutineTest` — `modules/qc-routines/lib/routines.ts:36`
- `CanRequestRetestProductTest` — `modules/analytical-test-requests/lib/atr.ts:7`
- `CanViewProductCategory` — `modules/roles/lib/permission-fixtures.ts:14`
- `CanViewQcRoutineSetup` — `modules/navigation/catalog.generated.ts:1198`; `modules/navigation/catalog.generated.ts:1215`; `modules/qc-routines/lib/routines.ts:37`; `modules/qc-routines/manifest.ts:10`
- `CanViewQcRoutineTests` — `modules/navigation/catalog.generated.ts:1197`; `modules/navigation/catalog.generated.ts:1207`; `modules/qc-routines/lib/routines.ts:36`; `modules/qc-routines/manifest.ts:12`; `modules/qc-routines/manifest.ts:13`; `modules/qc-routines/manifest.ts:14`; `modules/qc-routines/manifest.ts:8`
- `CanViewQcRoutineWaterQuality` — `modules/navigation/catalog.generated.ts:1199`; `modules/navigation/catalog.generated.ts:1223`; `modules/qc-routines/lib/routines.ts:38`; `modules/qc-routines/manifest.ts:11`; `modules/qc-routines/manifest.ts:14`
