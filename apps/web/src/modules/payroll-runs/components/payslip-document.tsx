import { PrintHeader, PrintFacts, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { formatDate } from "@/shared/format/dates";
import type { Payslip } from "../schemas/contracts";
export const payslipLineTypes = ["Allowance", "Addition", "Statutory deduction", "Other deduction", "Tax", "Tax relief"] as const;
export const payslipTotals = [
  ["basicSalary", "Basic salary"],
  ["totalAllowances", "Allowances"],
  ["totalAdditions", "Additions"],
  ["grossPay", "Gross pay"],
  ["totalReliefs", "Reliefs"],
  ["taxableIncome", "Taxable income"],
  ["ssnitEmployeeContribution", "SSNIT employee"],
  ["ssnitEmployerContribution", "SSNIT employer"],
  ["tier2Contribution", "Tier 2"],
  ["payeTax", "PAYE"],
  ["totalDeductions", "Total deductions"],
  ["netPay", "Net pay"],
] as const;
const columns: PrintColumn<Payslip["lineItems"][number]>[] = [
  { id: "type", header: "Type", cell: (row) => payslipLineTypes[row.type] },
  { id: "description", header: "Description", cell: (row) => row.description },
  { id: "amount", header: "Amount (GHS)", align: "right", cell: (row) => row.amount.toLocaleString(undefined, { maximumFractionDigits: 20 }) },
];
export function PayslipDocument({ row }: { row: Payslip }) {
  return (
    <>
      <PrintHeader title="Payslip" reference={row.staffNumber} />
      <PrintFacts
        facts={[
          { label: "Employee", value: row.employeeName },
          { label: "Department", value: row.department },
          { label: "Designation", value: row.designation },
          { label: "Period starts", value: formatDate(row.periodStart) },
          { label: "Period ends", value: formatDate(row.periodEnd) },
        ]}
      />
      <PrintTable
        caption="Payroll line items"
        columns={columns}
        rows={row.lineItems}
        rowKey={(_item, index) => String(index)}
        empty="No line items recorded."
      />
      <PrintFacts
        facts={payslipTotals.map(([key, label]) => ({ label: `${label} (GHS)`, value: row[key].toLocaleString(undefined, { maximumFractionDigits: 20 }) }))}
      />
    </>
  );
}
