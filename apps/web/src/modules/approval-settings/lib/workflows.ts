import { documentLabel } from "@/modules/pending-approvals/lib/approval-documents";

export const workflowsPath = "/settings/approvals";
export const createWorkflowPath = `${workflowsPath}/create`;
export const editWorkflowPath = (id: string) => `${workflowsPath}/edit/${id}`;
export const workflowPermissions = { view: "CanViewApprovals", create: "CanCreateNewApproval", edit: "CanEditApprovalWorkflow", remove: "CanDeleteApprovals" } as const;
export const audit = { module: "Settings", subModule: "Approvals" } as const;

/** Documents a workflow can be set up for. The names are the server's. */
const documents = ["PurchaseRequisition", "TrialRequisition", "StockRequisition", "PurchaseOrder", "BillingSheet", "ShipmentDocument", "ProductionExtraPacking", "FinishedGoodsTransferNote", "StockAdjustment", "ProductionOrder",
  "AllocateProductionOrder", "ProformaInvoice", "CustomerQuotation", "SupplierPricingAgreement", "Payment", "LeaveRequest", "OvertimeRequest", "StaffRequisition", "JobRequest", "PayrollRun", "PerformanceReview",
  "RndProject", "RndFormulation", "RndTechnologyTransfer", "QcStandardTestProcedure", "QcWorksheetTemplate", "QcSpecification", "QcWorksheetInstance", "QcOosCase"] as const;

/**
 * Routes that send analytical results, or extra material, to one named quality role. The server treats each
 * as a policy with exactly one approver, which has to be a role.
 */
const routes: Record<string, string> = {
  ResponseProductFinished: "Product test results · finished product → QA GM",
  ResponseMaterial: "Material test results · raw or packaging → QA GM",
  ResponseProductIntermediateGeneral: "Product test results · intermediate or bulk (tablet, syrup, ointment) → QA Manager",
  ResponseProductIntermediateBeta: "Product test results · intermediate or bulk (BETA) → Deputy QA Manager",
  ProductionExtraPackingQaGmAccess: "Extra material · QA GM sees every department",
};
export const isSingleRoleRoute = (type: string) => type in routes;
export const workflowLabel = (type: string | null | undefined) => type && routes[type] ? routes[type] : documentLabel(type);
export const workflowDocumentOptions = [...documents.map((value) => ({ value: value as string, label: documentLabel(value) })).sort((a, b) => a.label.localeCompare(b.label)), ...Object.entries(routes).map(([value, label]) => ({ value, label }))];

export interface Wait { days: number; hours: number; minutes: number }
/** How long a stage may wait before it is escalated, read from the server's "d.hh:mm:ss" or "hh:mm:ss". */
export function parseWait(value: string | null | undefined): Wait | null {
  const match = /^(?:(\d+)\.)?(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(value?.trim() ?? "");
  if (!match) return null;
  return { days: Number(match[1] ?? 0), hours: Number(match[2]), minutes: Number(match[3]) };
}
const two = (value: number) => String(value).padStart(2, "0");
export const formatWait = (wait: Wait) => `${wait.days}.${two(wait.hours)}:${two(wait.minutes)}:00`;
export function describeWait(wait: Wait | null): string {
  if (!wait) return "Not set";
  const parts = [wait.days ? `${wait.days} ${wait.days === 1 ? "day" : "days"}` : "", wait.hours ? `${wait.hours} ${wait.hours === 1 ? "hour" : "hours"}` : "", wait.minutes ? `${wait.minutes} ${wait.minutes === 1 ? "minute" : "minutes"}` : ""].filter(Boolean);
  return parts.length ? parts.join(" ") : "Immediately";
}
