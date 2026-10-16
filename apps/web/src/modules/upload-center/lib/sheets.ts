import { convertUnit, relatedUnits, toSmallestUnit } from "@/shared/units/quantity";
import type { SheetRow } from "./workbook";

// What each upload sheet holds. Columns are found by name, so templates with slightly different headers still read.
export type FieldKind = "text" | "number" | "unit" | "month" | "datetime";
export interface SheetField { key: string; label: string; aliases: readonly string[]; kind: FieldKind; required?: boolean }
export interface SheetProfile { id: string; title: string; fields: readonly SheetField[]; fileName: string }

const field = (key: string, label: string, aliases: readonly string[], kind: FieldKind = "text", required = false): SheetField => ({ key, label, aliases, kind, required });
export const materialStock: SheetProfile = { id: "material", title: "Material stock", fileName: "material-stock-upload.xlsx", fields: [
  field("shelf", "Shelf", ["shelf", "shelve", "shelves", "shelfname"]), field("warehouse", "Warehouse", ["warehouse", "warehousename", "store"]),
  field("materialName", "Material", ["materialname", "name", "itemname", "rawmaterialname"], "text", true), field("materialCode", "Material code", ["materialcode", "code", "itemcode"], "text", true),
  field("batch", "Batch number", ["batchno", "batch", "batchnumber"], "text", true), field("quantity", "Quantity", ["quantity", "qty", "availableqty", "availablequantity"], "number", true),
  field("unit", "Unit", ["uom", "unit", "symbol", "baseuom"], "unit", true), field("manufactured", "Manufactured", ["manufacturingdate", "manufacture", "mfg", "manfac"], "month"),
  field("expiry", "Expiry", ["expirydate", "expiry", "exp", "expiration"], "month"), field("grn", "GRN number", ["grnno", "grn", "grnnumber"]), field("ar", "AR number", ["arno", "ardno", "ardnumber", "analyticalrawdata"]),
] };
export const productStock: SheetProfile = { id: "product", title: "Product stock", fileName: "product-stock-upload.xlsx", fields: [
  field("warehouse", "Warehouse", ["warehouse", "warehousename", "store"]), field("productCode", "Product code", ["productcode", "code", "itemcode"], "text", true),
  field("productName", "Product", ["productname", "name", "itemname"], "text", true), field("packingStyle", "Packing style", ["packingstyle", "packagingstyle", "packstyle"]),
  field("shipperQty", "Shipper quantity", ["shipperqty", "shipperquantity", "cartonqty", "cartonquantity"], "number"), field("looseQty", "Loose quantity", ["looseqty", "loosequantity", "qty", "quantity"], "number"),
  field("unit", "Unit", ["uom", "unit", "symbol"]), field("batch", "Batch number", ["batchno", "batch", "batchnumber"], "text", true), field("fgtn", "FGTN", ["fgtnid", "fgtn", "transfernote", "transfernoteid"]),
  field("ar", "AR number", ["arno", "ardno", "ardnumber", "analyticalrawdata"]), field("manufactured", "Manufactured", ["manufacturingdate", "manufacturedate", "mfg", "manfac"], "month"),
  field("expiry", "Expiry", ["expirydate", "expiry", "exp", "expiration"], "month"),
] };
export const attendance: SheetProfile = { id: "attendance", title: "Attendance", fileName: "attendance-upload.xlsx", fields: [
  field("employeeId", "Employee ID", ["empid", "employeeid", "staffid"], "text", true), field("name", "Name", ["name", "fullname", "employee"]),
  field("time", "Time", ["time", "datetime", "timestamp"], "datetime", true), field("workState", "Work state", ["workstate", "state", "status"], "text", true),
] };
export const shiftSchedule: SheetProfile = { id: "schedule", title: "Shift schedule", fileName: "shift-schedule-upload.xlsx", fields: [
  field("staffId", "Staff ID", ["staffid", "empid", "employeeid"], "text", true), field("staffName", "Staff name", ["staffname", "name", "employee"]),
  field("category", "Category", ["category"]), field("shiftType", "Shift type", ["shifttype", "shift"], "text", true),
] };

const normal = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
/** The sheet column holding each field: an exact name match first, then a column that starts or ends with one of its names. */
export function mapColumns(headers: readonly string[], profile: SheetProfile): Record<string, string | null> {
  const used = new Set<string>();
  const result: Record<string, string | null> = {};
  for (const item of profile.fields) {
    const free = headers.filter((header) => !used.has(header));
    const found = free.find((header) => item.aliases.includes(normal(header))) ?? free.find((header) => item.aliases.some((alias) => normal(header).startsWith(alias) || normal(header).endsWith(alias))) ?? null;
    if (found) used.add(found);
    result[item.key] = found;
  }
  return result;
}

export const cellText = (value: SheetRow[string] | undefined) => value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
/** Fields the sheet does not have a column for, among those every row needs. */
export const missingColumns = (profile: SheetProfile, columns: Record<string, string | null>) => profile.fields.filter((item) => item.required && !columns[item.key]).map((item) => item.label);
/** What is wrong with one row, for the fields that must be filled and must be numbers. */
export function rowProblems(row: SheetRow, profile: SheetProfile, columns: Record<string, string | null>): string[] {
  return profile.fields.flatMap((item) => {
    const column = columns[item.key];
    if (!column) return [];
    const text = cellText(row[column]).trim();
    if (item.required && !text) return [`${item.label} is empty`];
    if (item.kind === "number" && text && !Number.isFinite(Number(text))) return [`${item.label} is not a number`];
    return [];
  });
}

/** Material quantities are uploaded in the smallest unit of their family (2 kg goes as 2,000 g), as the stock is stored. */
export function toSmallestUnits(rows: readonly SheetRow[], columns: Record<string, string | null>): SheetRow[] {
  const quantity = columns.quantity;
  const unit = columns.unit;
  if (!quantity || !unit) return [...rows];
  return rows.map((row) => {
    const amount = Number(cellText(row[quantity]));
    const symbol = cellText(row[unit]).trim();
    const smallest = relatedUnits(symbol)[0];
    if (!smallest || !Number.isFinite(amount) || smallest === symbol) return row;
    return { ...row, [quantity]: toSmallestUnit(amount, symbol), [unit]: smallest };
  });
}
/** A row with its quantity shown in another unit of the same family. */
export function switchUnit(row: SheetRow, columns: Record<string, string | null>, target: string): SheetRow {
  const quantity = columns.quantity;
  const unit = columns.unit;
  if (!unit) return row;
  const converted = quantity ? convertUnit(Number(cellText(row[quantity])), cellText(row[unit]), target) : null;
  return { ...row, [unit]: target, ...(quantity && converted !== null && Number.isFinite(converted) ? { [quantity]: converted } : {}) };
}

/** A cell's month as "YYYY-MM", from a date cell or text such as 2026-03-01 or 01/03/2026. */
export function monthOf(value: SheetRow[string] | undefined): string | null {
  if (value === undefined || value === "") return null;
  const slash = typeof value === "string" ? /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(value.trim()) : null;
  const date = value instanceof Date ? value : slash ? new Date(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1])) : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
/** A month written back to the sheet: manufacture on its first day, expiry on its last, as batch dates are kept. */
export function monthCell(month: string, end: boolean): Date {
  const [year, number] = month.split("-").map(Number);
  return end ? new Date(year ?? 0, number ?? 1, 0) : new Date(year ?? 0, (number ?? 1) - 1, 1);
}
