export const approvalsPath = "/qa/pending-approvals";
export const approvalListPath = (type: string) => `${approvalsPath}?type=${encodeURIComponent(type)}`;
export const approvalPath = (type: string, id: string) => `${approvalsPath}/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;
/** Seeing the queue, approving and rejecting are three permissions. */
export const approvalPermissions = { view: "CanViewPendingApprovals", approve: "CanApprovePendingApproval", reject: "CanRejectPendingApproval" } as const;
export const decisionPermission = (type: string, decision: Decision): string =>
  type === "Response"
    ? decision === "approve" ? "CanApproveResponse" : "CanRejectResponse"
    : approvalPermissions[decision];
export const audit = { module: "Quality Assurance", subModule: "Pending Approvals" } as const;

/** Documents whose content this app can show, so they can be read before they are decided. The names are the server's. */
const readable = ["PurchaseOrder", "BillingSheet", "ShipmentDocument", "PurchaseRequisition", "TrialRequisition", "StockRequisition", "RawStockRequisition", "PackageStockRequisition", "ProductionExtraPacking",
  "FinishedGoodsTransferNote", "LeaveRequest", "OvertimeRequest", "StaffRequisition", "JobRequest", "ProductionOrder", "ProformaInvoice", "AllocateProductionOrder", "StockAdjustment", "CustomerQuotation", "SupplierPricingAgreement", "PayrollRun", "PerformanceReview",
  "RndProject", "RndFormulation", "RndTechnologyTransfer", "Response"] as const;
export type ReadableDocument = (typeof readable)[number];
export const isReadable = (type: string): type is ReadableDocument => (readable as readonly string[]).includes(type);

/** Documents that are signed on a page of their own, with their own checks, rather than from this queue. */
const elsewhere: Record<string, string> = { PerformanceReview: "Human resources, under performance reviews, where the complete assessment is checked", PayrollRun: "Human resources, under payroll runs, where the complete employee and payslip totals are reconciled", Payment: "Finance, under payment approvals", FormulaRevision: "the formula's own review page", ProcedureRevision: "the procedure's own review page" };
/** Where a document is decided when it is not decided here, or null when it is decided here. */
export function decidedElsewhere(type: string): string | null {
  if (type in elsewhere) return elsewhere[type] ?? null;
  // Quality control documents need the approver to sign in again, which the general approval request cannot do.
  if (/^Qc[A-Z]/.test(type)) return "Quality Control, where signing asks for your password again";
  if (/^Template[A-Za-z]+Revision$/.test(type)) return "the template's own review page";
  return null;
}

const names: Record<string, string> = { ProductionExtraPacking: "Production extra material", RawStockRequisition: "Raw material stock requisition", PackageStockRequisition: "Packaging material stock requisition",
  AllocateProductionOrder: "Production order allocation", Response: "Certificate of analysis", RndProject: "R&D project", RndFormulation: "R&D formulation", RndTechnologyTransfer: "R&D technology transfer" };
/** A document type as people say it: "PurchaseOrder" is "Purchase order", "QcCoa" is "QC COA". */
export function documentLabel(type: string | null | undefined): string {
  if (!type) return "Document";
  const known = names[type];
  if (known) return known;
  const words = type.replace(/^Qc(?=[A-Z])/, "QC ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/\b(Coa|Oos|Stp)\b/g, (word) => word.toUpperCase()).split(" ");
  return words.map((word, index) => index === 0 || word === word.toUpperCase() ? word : word.toLowerCase()).join(" ");
}

/** The document types with something waiting, most first; the open one is kept even at nothing so its page still makes sense. */
export function waitingDocuments(counts: Record<string, number> | undefined, open?: string | null): { type: string; count: number }[] {
  const rows = Object.entries(counts ?? {}).filter(([, count]) => count > 0).map(([type, count]) => ({ type, count }));
  if (open && !rows.some((row) => row.type === open)) rows.push({ type: open, count: 0 });
  return rows.sort((a, b) => b.count - a.count || documentLabel(a.type).localeCompare(documentLabel(b.type)));
}

/** The server's log status: 0 pending, 1 approved, 2 rejected. */
export const logStatusLabels: Record<number, string> = { 0: "Pending", 1: "Approved", 2: "Rejected" };

export type Decision = "approve" | "reject";
/** Why a decision cannot be sent, or null when it can. A rejection has to say why, so the requester knows what to change. */
export function decisionProblem(decision: Decision, comments: string): string | null {
  const text = comments.trim();
  if (text.length > 2000) return "Keep the comment under 2000 characters";
  if (decision === "reject" && text.length < 3) return "Say why the request is rejected";
  return null;
}
