import type { DomainEntitiesProcurementManufacturersManufacturerMaterialDto as ManufacturedMaterial } from "@/shared/api/generated/procurement";
import { sortAlerts, type RecordAlert } from "@/shared/detail/record-alerts";
import { daysUntil, dueSoonDays, dueText } from "@/shared/format/due-dates";

export type ApprovalState = "approved" | "lapsed" | "pending";
/** A manufacturer is approved from its approval date until its validity date passes. */
export function approvalState(manufacturer: { approvedAt?: string | null; validityDate?: string | null }, now = new Date()): ApprovalState {
  if (!manufacturer.approvedAt) return "pending";
  const validity = daysUntil(manufacturer.validityDate, now);
  return validity !== null && validity < 0 ? "lapsed" : "approved";
}
export const approvalLabels: Record<ApprovalState, string> = { approved: "Approved", lapsed: "Approval lapsed", pending: "Awaiting approval" };

const kinds = ["Raw material", "Packaging material"] as const;
export function materialKindLabel(kind: number | null | undefined): string { return typeof kind === "number" ? kinds[kind] ?? "Other" : "Other"; }

/** How much of the material comes in one pack: a set of pack sizes, or a range. */
export function packQuantity(item: ManufacturedMaterial): string | null {
  const option = item.quantityPerPackOption;
  if (item.quantityType === 1) return option?.min != null && option.max != null ? `${option.min} to ${option.max}` : option?.min != null ? `from ${option.min}` : option?.max != null ? `up to ${option.max}` : null;
  const values = option?.values ?? [];
  return values.length ? values.join(", ") : null;
}

export function materialCounts(materials: readonly ManufacturedMaterial[]): { total: number; raw: number; packaging: number } {
  const raw = materials.filter((item) => item.material?.kind === 0).length;
  const packaging = materials.filter((item) => item.material?.kind === 1).length;
  return { total: materials.length, raw, packaging };
}

export function manufacturerAlerts(manufacturer: { approvedAt?: string | null; validityDate?: string | null }, materials: number, now = new Date()): RecordAlert[] {
  const alerts: RecordAlert[] = [];
  const state = approvalState(manufacturer, now);
  const validity = daysUntil(manufacturer.validityDate, now);
  if (state === "pending") alerts.push({ id: "pending", level: "warning", text: "This manufacturer is not approved yet. It is approved when a supplier that offers its materials is approved." });
  if (state === "lapsed" && validity !== null) alerts.push({ id: "lapsed", level: "problem", text: `The approval ran out ${dueText(validity).replace(" overdue", " ago")}. Materials from this manufacturer should not be ordered until it is renewed.` });
  if (state === "approved" && validity !== null && validity <= dueSoonDays) alerts.push({ id: "expiring", level: "warning", text: `The approval runs out ${dueText(validity)}.` });
  if (state === "approved" && validity === null) alerts.push({ id: "no-validity", level: "warning", text: "No validity date is recorded, so the approval never comes up for renewal." });
  if (materials === 0) alerts.push({ id: "materials", level: "warning", tab: "materials", text: "No materials are recorded for this manufacturer." });
  return sortAlerts(alerts);
}
