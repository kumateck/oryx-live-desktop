import { daysUntil, dueSoonDays, dueState, dueText } from "@/shared/format/due-dates";
import { sortAlerts, type RecordAlert } from "@/shared/detail/record-alerts";

export interface CertificateSummary { valid: number; expiring: number; expired: number; nextExpiry: string | null }
export function certificateSummary(certificates: readonly { expiryDate: string }[], now = new Date()): CertificateSummary {
  const summary: CertificateSummary = { valid: 0, expiring: 0, expired: 0, nextExpiry: null };
  for (const certificate of certificates) {
    const state = dueState(daysUntil(certificate.expiryDate, now));
    if (state === "overdue") { summary.expired += 1; continue; }
    if (state === "soon") summary.expiring += 1; else summary.valid += 1;
    if (!summary.nextExpiry || certificate.expiryDate < summary.nextExpiry) summary.nextExpiry = certificate.expiryDate;
  }
  return summary;
}

/**
 * What needs attention on a supplier, most serious first. Certificates are left out when the
 * user may not read them (null), so nothing is claimed about records that were not looked at.
 */
export function supplierAlerts(input: {
  status: 0 | 1 | 2 | undefined;
  requalificationDueDate: string | null | undefined;
  certificates: CertificateSummary | null;
  materials: number | null;
}, now = new Date()): RecordAlert[] {
  const alerts: RecordAlert[] = [];
  if (input.status === 2) alerts.push({ id: "rejected", level: "problem", text: "This supplier is rejected. It must not be used for new purchases." });
  if (input.status === 0) alerts.push({ id: "new", level: "warning", text: "This supplier is not approved yet. Qualify it before purchasing from it." });
  const requalification = daysUntil(input.requalificationDueDate, now);
  if (input.status === 1 && requalification !== null) {
    if (requalification < 0) alerts.push({ id: "requalification", level: "problem", text: `Requalification is ${dueText(requalification)}.` });
    else if (requalification <= dueSoonDays) alerts.push({ id: "requalification", level: "warning", text: `Requalification is due ${dueText(requalification)}.` });
  }
  const certificates = input.certificates;
  if (certificates?.expired) alerts.push({ id: "expired", level: "problem", tab: "certifications",
    text: `${certificates.expired} ${certificates.expired === 1 ? "certificate has" : "certificates have"} expired.` });
  if (certificates?.expiring) alerts.push({ id: "expiring", level: "warning", tab: "certifications",
    text: `${certificates.expiring} ${certificates.expiring === 1 ? "certificate expires" : "certificates expire"} within ${dueSoonDays} days.` });
  if (input.status === 1 && input.materials === 0) alerts.push({ id: "materials", level: "warning", tab: "materials", text: "No materials are linked to this supplier, so nothing can be ordered from it." });
  return sortAlerts(alerts);
}

export type SupplierTab = "overview" | "materials" | "certifications" | "contacts" | "banking" | "pricing" | "performance";
/** The permission that opens each tab; a tab with none is open to anyone who can view suppliers. */
const tabAccess: Record<SupplierTab, readonly string[]> = {
  overview: [], materials: [],
  certifications: ["CanViewSupplierCertifications"], contacts: ["CanManageSupplierContracts"], banking: ["CanManageSupplierContracts"],
  pricing: ["CanManageSupplierContracts"], performance: ["CanViewSupplierPerformance", "CanViewSupplierSpend"],
};
const tabLabels: Record<SupplierTab, string> = {
  overview: "Overview", materials: "Materials", certifications: "Certifications", contacts: "Contacts", banking: "Banking",
  pricing: "Pricing", performance: "Performance and spend",
};
const tabOrder: readonly SupplierTab[] = ["overview", "materials", "certifications", "contacts", "banking", "pricing", "performance"];

export function supplierTabs(has: (permission: string) => boolean, materials: number | null): { id: SupplierTab; label: string }[] {
  return tabOrder.filter((tab) => tabAccess[tab].length === 0 || tabAccess[tab].some(has))
    .map((id) => ({ id, label: id === "materials" && materials !== null ? `${tabLabels[id]} (${materials})` : tabLabels[id] }));
}
