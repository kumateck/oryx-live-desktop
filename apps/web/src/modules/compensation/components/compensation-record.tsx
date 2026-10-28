import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatDate } from "@/shared/format/dates";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { allowanceLabels } from "../schemas/editor-schema";
import type { Compensation } from "../schemas/contracts";
const c = dataTableColumns<Compensation["allowances"][number]>();
const columns = c.columns([
  c.accessor((row) => allowanceLabels[row.type] ?? "Other", { id: "type", header: "Type" }),
  c.accessor("description", { header: "Description" }),
  c.accessor("amount", { header: "Amount (GHS)" }),
  c.accessor((row) => (row.isTaxable ? "Yes" : "No"), { id: "taxable", header: "Taxable" }),
]);
export function CompensationRecord({ row }: { row: Compensation }) {
  return (
    <div className="space-y-3">
      <KeyFacts>
        <KeyFact label="Basic salary (GHS)" value={row.basicSalary.toLocaleString(undefined, { maximumFractionDigits: 20 })} />
        <KeyFact label="Allowances (GHS)" value={row.totalAllowances.toLocaleString(undefined, { maximumFractionDigits: 20 })} />
        <KeyFact label="Pay grade" value={row.payGradeName || "Not assigned"} />
        <KeyFact label="Effective from" value={formatDate(row.effectiveFrom) ?? "Not recorded"} />
        <KeyFact label="Effective until" value={formatDate(row.effectiveTo) ?? "No end date"} />
      </KeyFacts>
      <dl className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
        {[
          { label: "Employee", value: row.employeeName },
          { label: "Staff ID", value: row.staffNumber },
          { label: "Bank", value: row.bankName },
          { label: "Branch", value: row.bankBranch },
          { label: "Account number", value: row.bankAccountNumber },
          { label: "TIN", value: row.tinNumber },
          { label: "Tier 3 voluntary enrollment", value: row.tier3VoluntaryEnrolled ? "Yes" : "No" },
        ].map((fact) => (
          <div key={fact.label}>
            <dt className="text-sm text-muted-foreground">{fact.label}</dt>
            <dd className="break-words">{fact.value || "Not recorded"}</dd>
          </div>
        ))}
      </dl>
      <ClientDataTable
        label="Compensation allowances"
        columns={columns}
        rows={row.allowances}
        getRowId={(allowance) => allowance.id}
        initialPageSize={30}
        emptyTitle="No allowances"
        emptyDescription="This compensation record has no allowances."
      />
    </div>
  );
}
