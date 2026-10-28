interface TemplateEmployee { staffNumber?: string | null; firstName?: string | null; lastName?: string | null }
/** The first sheet is the shift import template. Metadata must not displace its required header row. */
export async function departmentTemplateBytes(rows: readonly TemplateEmployee[]) {
  const { default: ExcelJS } = await import("exceljs"); const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Employees", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.addRow(["STAFF ID", "STAFF NAME", "CATEGORY", "SHIFT TYPE"]);
  for (const row of rows) sheet.addRow([row.staffNumber ?? "", `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(), "", ""]);
  sheet.columns = [{ width: 22 }, { width: 42 }, { width: 28 }, { width: 28 }]; sheet.getRow(1).font = { bold: true };
  const bytes = await workbook.xlsx.writeBuffer(); return new Uint8Array(bytes).slice().buffer;
}
export async function downloadDepartmentTemplate(rows: readonly TemplateEmployee[]) {
  const url = URL.createObjectURL(new Blob([await departmentTemplateBytes(rows)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a"); link.href = url; link.download = "Department Employee Shift Template.xlsx"; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
