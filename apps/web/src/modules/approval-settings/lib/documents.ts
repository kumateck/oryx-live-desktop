import type { SelectOption } from "@/shared/forms/form-wizard-types";
const standard = ["CustomerQuotation", "SupplierPricingAgreement", "Payment", "StaffRequisition", "PayrollRun", "PerformanceReview", "JobRequest", "ProductionOrder", "TrialRequisition", "PurchaseRequisition", "StockRequisition", "PurchaseOrder", "BillingSheet", "LeaveRequest", "OvertimeRequest", "AllocateProductionOrder", "ShipmentDocument", "ProformaInvoice", "FinishedGoodsTransferNote", "StockAdjustment", "RndProject", "RndFormulation", "RndTechnologyTransfer", "QcStandardTestProcedure", "QcWorksheetTemplate", "QcSpecification", "QcWorksheetInstance", "QcOosCase"];
const protectedOptions: readonly SelectOption[] = [
  { value: "ResponseProductFinished", label: "Product ATR · Finished → QA GM" },
  { value: "ResponseMaterial", label: "Material ATR · Raw or Packaging → QA GM" },
  { value: "ResponseProductIntermediateGeneral", label: "Intermediate / Bulk · Tablet, Syrup, Ointment → QA Manager" },
  { value: "ResponseProductIntermediateBeta", label: "Intermediate / Bulk · BETA → Deputy QA Manager" },
  { value: "ProductionExtraPackingQaGmAccess", label: "Extra material · QA GM all-department access" },
];
const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^Rnd /, "R&D ").replace(/^Qc /, "QC ");
export const approvalDocuments: readonly SelectOption[] = [
  ...standard.map((value) => ({ value, label: humanize(value) })),
  { value: "ProductionExtraPacking", label: "Production extra material" }, ...protectedOptions,
];
export const protectedApprovalDocument = (value: string) => protectedOptions.some((option) => option.value === value);
export const approvalDocumentLabel = (value: string) => approvalDocuments.find((option) => option.value === value)?.label ?? humanize(value);
export function documentOptions(current?: string): readonly SelectOption[] {
  return current && !approvalDocuments.some((option) => option.value === current) ? [...approvalDocuments, { value: current, label: approvalDocumentLabel(current) }] : approvalDocuments;
}
