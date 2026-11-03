import { reportDate, reportSheet } from "@/shared/reports/report-data";
import { formatQuantityNumber, toLargestUnit } from "@/shared/units/quantity";
import type { IssuedBmrReport } from "../schemas/issued-bmr";

export function issuedBmrSheets(report: IssuedBmrReport) {
  const sheet = reportSheet("BMRs issued", report.rows, [
    { label: "Issued date", read: (item) => reportDate(item.issuedAt) },
    { label: "Issued by", read: (item) => item.issuedByName ?? "Not recorded" },
    { label: "Batch number", read: (item) => item.batchNumber },
    { label: "Manufacturing date", read: (item) => reportDate(item.manufacturingDate) },
    { label: "Expiry date", read: (item) => reportDate(item.expiryDate) },
    { label: "Batch size", read: (item) => item.batchUnit ? toLargestUnit(item.batchQuantity, item.batchUnit)?.text
      : `${formatQuantityNumber(item.batchQuantity, "entered")} (unit unavailable)` },
    { label: "Product name", read: (item) => item.productName },
    { label: "Product code", read: (item) => item.productCode },
    { label: "Department", read: (item) => item.departmentName },
  ]);
  return [{ ...sheet, printColumns: [
    { label: "Product", width: "30%", fields: [{ column: 6 }, { column: 7, label: "Code" }] },
    { label: "Batch", width: "16%", fields: [{ column: 2 }, { column: 5, label: "Size" }] },
    { label: "Validity", width: "20%", fields: [{ column: 3, label: "Mfg" }, { column: 4, label: "Exp" }] },
    { label: "Issued", width: "20%", fields: [{ column: 0 }, { column: 1, label: "By" }] },
    { label: "Department", width: "14%", fields: [{ column: 8 }] },
  ] }];
}
