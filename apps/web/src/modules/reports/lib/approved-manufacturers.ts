import { formatMonthYear } from "@/shared/format/dates";
import { reportEnum, type ReportRow, type ReportSheet } from "@/shared/reports/report-data";
import type { SupplierMapping } from "../api/contract-adapters";
import type { ReportFilters } from "../schemas/report-filters";
import { reportSelection } from "./selections";
import { packText } from "./supplier-mappings";

/** Approvals that end within this many months are flagged as expiring. */
export const expiringWithinMonths = 6;
export type ApprovalStatus = "Valid" | "Expiring" | "Expired" | "No validity date";

/** Column positions in the approved manufacturer sheet. Screen, print and summary read the same row. */
export const amlColumn = {
  number: 0, code: 1, material: 2, kind: 3, manufacturer: 4, manufacturerAddress: 5, supplier: 6, supplierAddress: 7,
  pack: 8, unit: 9, approvedOn: 10, validUntil: 11, status: 12,
} as const;
const columns = ["#", "Item code", "Material name", "Material type", "Manufacturer", "Manufacturer address", "Supplier", "Supplier address",
  "Quantity per pack", "Unit", "Date of approval", "Validity date", "Status"] as const;

/** "Approved manufacturer list for raw materials", following the material types chosen in the filters. */
export function approvedManufacturerTitle(filters: ReportFilters): string {
  const kinds = new Set(reportSelection(filters, "materialKind").map((option) => option.value));
  if (kinds.size === 1 && kinds.has("0")) return "Approved manufacturer list for raw materials";
  if (kinds.size === 1 && kinds.has("1")) return "Approved manufacturer list for packaging materials";
  return "Approved manufacturer list for raw and packaging materials";
}

/** Valid, expiring within six months, or expired, judged on the calendar day of `today`. */
export function approvalStatus(validity: string | null | undefined, today: Date): ApprovalStatus {
  if (!validity) return "No validity date";
  const until = new Date(validity);
  if (!Number.isFinite(until.getTime())) return "No validity date";
  const day = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  if (until.getTime() < day.getTime()) return "Expired";
  const horizon = new Date(day); horizon.setUTCMonth(horizon.getUTCMonth() + expiringWithinMonths);
  return until.getTime() <= horizon.getTime() ? "Expiring" : "Valid";
}

const byText = (a: string | null | undefined, b: string | null | undefined) => (a ?? "").localeCompare(b ?? "", undefined, { numeric: true, sensitivity: "base" });

/** One row per approved material, manufacturer and supplier, ordered by item code as on the controlled list. */
export function approvedManufacturerSheet(mappings: readonly SupplierMapping[], today: Date): ReportSheet {
  const pairs = mappings.flatMap((mapping) => (mapping.materials ?? []).map((entry) => ({ mapping, entry })));
  pairs.sort((a, b) => byText(a.entry.material?.code, b.entry.material?.code) || byText(a.entry.material?.name, b.entry.material?.name)
    || byText(a.mapping.manufacturers?.name, b.mapping.manufacturers?.name) || byText(a.mapping.supplier?.name, b.mapping.supplier?.name));
  const rows: ReportRow[] = pairs.map(({ mapping, entry }, index) => ({
    id: String(index),
    cells: [
      index + 1, entry.material?.code ?? null, entry.material?.name ?? null, reportEnum(entry.material?.kind, ["Raw material", "Packaging material"]),
      mapping.manufacturers?.name ?? null, mapping.manufacturers?.address ?? null, mapping.supplier?.name ?? null, mapping.supplier?.address ?? null,
      packText(entry.quantityPerPackOption), mapping.uom?.symbol ?? mapping.uom?.name ?? null,
      formatMonthYear(mapping.manufacturers?.approvedAt), formatMonthYear(mapping.manufacturers?.validityDate),
      approvalStatus(mapping.manufacturers?.validityDate, today),
    ],
  }));
  return { id: "approved-manufacturers", name: "Approved manufacturers", columns, rows };
}

export interface ApprovedManufacturerSummary { materials: number; approvals: number; expiring: number; expired: number }

/** Counts for the tiles above the list: distinct materials, approved pairs, and approvals running out. */
export function approvedManufacturerSummary(sheet: ReportSheet): ApprovedManufacturerSummary {
  const status = (row: ReportRow) => row.cells[amlColumn.status];
  const materials = new Set(sheet.rows.map((row) => `${String(row.cells[amlColumn.code] ?? "")}|${String(row.cells[amlColumn.material] ?? "")}`));
  return {
    materials: materials.size, approvals: sheet.rows.length,
    expiring: sheet.rows.filter((row) => status(row) === "Expiring").length,
    expired: sheet.rows.filter((row) => status(row) === "Expired").length,
  };
}
