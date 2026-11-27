import type { SelectOption } from "@/shared/forms/form-wizard-types";
const standard = ["CostingPriceList", "CustomerQuotation", "SupplierPricingAgreement", "Payment", "StaffRequisition", "PayrollRun", "PerformanceReview", "JobRequest", "ProductionOrder", "TrialRequisition", "PurchaseRequisition", "StockRequisition", "PurchaseOrder", "BillingSheet", "LeaveRequest", "OvertimeRequest", "AllocateProductionOrder", "ShipmentDocument", "ProformaInvoice", "FinishedGoodsTransferNote", "StockAdjustment", "StockDiscrepancy", "ShipmentDiscrepancy", "RndProject", "RndFormulation", "RndTechnologyTransfer", "QcStandardTestProcedure", "QcWorksheetTemplate", "QcSpecification", "QcWorksheetInstance", "QcOosCase", "QcMaterialRetest"];
// Test results go through the workflow for what was tested; one without a configured stage uses Test results (Response).
const testResultRoutes: readonly SelectOption[] = [
  { value: "ResponseMaterial", label: "Test results · Material (raw or packaging)" },
  { value: "ResponseProductFinished", label: "Test results · Product, finished" },
  { value: "ResponseProductIntermediateGeneral", label: "Test results · Intermediate or bulk, non-Beta (tablet, syrup, ointment)" },
  { value: "ResponseProductIntermediateBeta", label: "Test results · Intermediate or bulk, Beta" },
];
// Saved under an Oryx Next key the backend does not read.
const legacyOptions: readonly SelectOption[] = [
  { value: "ProductionExtraPackingQaGmAccess", label: "Extra material · QA GM all-department access" },
];
const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^Rnd /, "R&D ").replace(/^Qc /, "QC ");
export const approvalDocuments: readonly SelectOption[] = [
  ...standard.map((value) => ({ value, label: humanize(value) })),
  { value: "ProductionExtraPacking", label: "Production extra material" },
  // The stock issue check is its document review now (Settings → Document reviews), not an approval workflow.
  { value: "Response", label: "Test results (Response)" },
  ...testResultRoutes,
];
export const isLegacyApprovalDocument = (value: string) => legacyOptions.some((option) => option.value === value);
export const approvalDocumentLabel = (value: string) => {
  const legacy = legacyOptions.find((option) => option.value === value);
  return legacy ? `${legacy.label} (legacy)` : approvalDocuments.find((option) => option.value === value)?.label ?? humanize(value);
};
export function documentOptions(current?: string): readonly SelectOption[] {
  return current && !approvalDocuments.some((option) => option.value === current) ? [...approvalDocuments, { value: current, label: approvalDocumentLabel(current) }] : approvalDocuments;
}
