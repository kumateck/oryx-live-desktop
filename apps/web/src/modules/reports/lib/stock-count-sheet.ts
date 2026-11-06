import { reportQuantity, reportSheet, type ReportSheet } from "@/shared/reports/report-data";
import { formatMonthYear } from "@/shared/format/dates";
import type { StockCountReport } from "../schemas/stock-count-report";
import type { ReportOutput } from "./report-model";
const widths = ["18%", "12%", "20%", "22%", "8%", "9%", "11%"];
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
      { label: "Material", read: (row) => `${value(row.materialName)}\n${value(row.materialCode)}` },
      { label: "Batch", read: (row) => `${value(row.batchNumber)}\nAR: ${value(row.arNumber)}` },
      { label: "Source", read: (row) => `${value(row.manufacturerName)}\n${value(row.supplierName)}` },
      { label: "Dates", read: (row) => `Mfg: ${month(row.manufacturingDate)}\nExp: ${month(row.expiryDate)} – Retest: ${month(row.retestDate)}` },
      { label: "Quantity", read: (row) => reportQuantity(row.quantity, row.uoM) },
      { label: "Physical count", read: () => "" }, { label: "Remarks", read: () => "" },
    ]);
    return { ...sheet, id, printColumns: sheet.columns.map((label, column) => ({ label, fields: [{ column }], width: widths[column] ?? "" })),
      printLayout: { orientation: "landscape", rowHeightMm: 14, signatures: ["Counted by", "Count date", "Checked by"] } };
  });
  return { sheets, generatedAt: report.generatedAt, filters: [
    { label: "Department", value: report.departmentName || (report.departmentId ? "Assigned department" : "All departments") },
    { label: "Material kind", value: report.materialKind === 0 ? "Raw material" : report.materialKind === 1 ? "Packaging material" : "All" },
  ], warnings: ["Source: manufacturer above supplier. Dates: manufacture above expiry and retest. Record the physical count in the quantity's unit; use Remarks for differences."] };
}
