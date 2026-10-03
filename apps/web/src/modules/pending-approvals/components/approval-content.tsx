import type { ReactNode } from "react";
import { isReadable, type ReadableDocument } from "../lib/approval-documents";
import { ArdDetails } from "./details/ard-details";
import { CustomerQuotationDetails, PayrollRunDetails, PerformanceReviewDetails, PricingAgreementDetails, RndFormulationDetails, RndProjectDetails, RndTransferDetails } from "./details/commercial-details";
import { JobRequestDetails, LeaveRequestDetails, OvertimeRequestDetails, StaffRequisitionDetails } from "./details/people-details";
import { BillingSheetDetails, PurchaseOrderDetails, RequisitionDetails, ShipmentDetails } from "./details/procurement-details";
import { AllocationDetails, ExtraMaterialDetails, ProductionOrderDetails, ProformaInvoiceDetails, StockAdjustmentDetails, TransferNoteDetails } from "./details/production-details";

interface Context { supplierId: string | null }
const views: Record<ReadableDocument, (id: string, context: Context) => ReactNode> = {
  PurchaseOrder: (id) => <PurchaseOrderDetails id={id} />, BillingSheet: (id) => <BillingSheetDetails id={id} />, ShipmentDocument: (id) => <ShipmentDetails id={id} />,
  PurchaseRequisition: (id) => <RequisitionDetails id={id} />, TrialRequisition: (id) => <RequisitionDetails id={id} />, StockRequisition: (id) => <RequisitionDetails id={id} />,
  RawStockRequisition: (id) => <RequisitionDetails id={id} />, PackageStockRequisition: (id) => <RequisitionDetails id={id} />,
  ProductionExtraPacking: (id) => <ExtraMaterialDetails id={id} />, FinishedGoodsTransferNote: (id) => <TransferNoteDetails id={id} />,
  LeaveRequest: (id) => <LeaveRequestDetails id={id} />, OvertimeRequest: (id) => <OvertimeRequestDetails id={id} />, StaffRequisition: (id) => <StaffRequisitionDetails id={id} />, JobRequest: (id) => <JobRequestDetails id={id} />,
  ProductionOrder: (id) => <ProductionOrderDetails id={id} />, ProformaInvoice: (id) => <ProformaInvoiceDetails id={id} />, AllocateProductionOrder: (id) => <AllocationDetails id={id} />, StockAdjustment: (id) => <StockAdjustmentDetails id={id} />,
  CustomerQuotation: (id) => <CustomerQuotationDetails id={id} />, SupplierPricingAgreement: (id, context) => <PricingAgreementDetails id={id} supplierId={context.supplierId} />,
  PayrollRun: (id) => <PayrollRunDetails id={id} />, PerformanceReview: (id) => <PerformanceReviewDetails id={id} />, RndProject: (id) => <RndProjectDetails id={id} />, RndFormulation: (id) => <RndFormulationDetails id={id} />,
  RndTechnologyTransfer: (id) => <RndTransferDetails id={id} />, Response: (id) => <ArdDetails id={id} />,
};

/** The document being decided, laid out for reading. Null for a type this app cannot show yet. */
export function ApprovalContent({ type, id, supplierId = null }: { type: string; id: string; supplierId?: string | null }) {
  return isReadable(type) ? <>{views[type](id, { supplierId })}</> : null;
}
