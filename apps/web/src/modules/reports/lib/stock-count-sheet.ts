import { reportQuantity, reportSheet, type ReportSheet } from "@/shared/reports/report-data";
import { formatMonthYear } from "@/shared/format/dates";
import type { StockCountReport } from "../schemas/stock-count-report";
import type { ReportOutput } from "./report-model";
const widths = ["8%", "17%", "8%", "9%", "9%", "7%", "7%", "13%", "13%", "9%"];
const value = (text: string | null | undefined) => text || "–";
const month = (text: string | null | undefined) => formatMonthYear(text) ?? "–";
export function stockCountOutput(report: StockCountReport): ReportOutput {
  const seen = new Set<string>();
  const groups = new Map<string, { name: string; rows: StockCountReport["rows"] }>();
  for (const row of report.rows) {
    if (report.departmentId && row.departmentId !== report.departmentId) throw new Error("The stock report contains another department's records.");
    const key = `${row.batchId}:${row.departmentId}:${row.uoMId}`;
    if (seen.has(key)) throw new Error("The stock report contains duplicate stock positions. Generate it again.");
    seen.add(key);
    const id = row.departmentId ?? "unassigned";
    const group = groups.get(id) ?? { name: row.departmentName || "Department not recorded", rows: [] };
    group.rows.push(row); groups.set(id, group);
  }
  if (!groups.size) groups.set(report.departmentId ?? "unassigned", { name: report.departmentName || "All departments", rows: [] });
  const sheets: ReportSheet[] = [...groups].map(([id, group]) => {
    const sheet = reportSheet(`${report.expiredOnly ? "Expired stock" : "Current stock"} · ${group.name}`, group.rows, [
      { label: "Item Code", read: (row) => value(row.materialCode) },
      { label: "Material", read: (row) => value(row.materialName) },
      { label: "GRN No", read: (row) => value(row.grnNumber) },
      { label: "Batch", read: (row) => value(row.batchNumber) },
      { label: "AR Number", read: (row) => value(row.arNumber) },
      { label: "MFG", read: (row) => month(row.manufacturingDate) },
      { label: "EXP", read: (row) => month(row.expiryDate) },
      { label: "Manufacturer", read: (row) => value(row.manufacturerName) },
      { label: "Supplier", read: (row) => value(row.supplierName) },
      { label: "Quantity", read: (row) => reportQuantity(row.quantity, row.uoM) },
    ]);
    return { ...sheet, id, printColumns: sheet.columns.map((label, column) => ({ label, fields: [{ column }], width: widths[column] ?? "" })),
      printLayout: { orientation: "landscape", rowHeightMm: 14, signatures: ["Counted by", "Count date", "Checked by"] } };
  });
  return { sheets, generatedAt: report.generatedAt, filters: [
    { label: "Department", value: report.departmentName || (report.departmentId ? "Assigned department" : "All departments") },
    { label: "Material kind", value: report.materialKind === 0 ? "Raw material" : report.materialKind === 1 ? "Packaging material" : "All" },
  ] };
}
