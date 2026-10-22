import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { useAccess } from "@/shared/auth/use-access";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { ModelApprovalHistory } from "@/shared/approvals/model-history";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { payrollApi } from "../api/payroll-api";
import { payrollRoot, payrollAudit, statuses, payrollPermissions as p } from "../schemas/contracts";
import { PayrollActions } from "./payroll-actions";
import { PayrollPayslips } from "./payroll-payslips";
import { PayrollExports } from "./payroll-exports";
function Detail({ id }: { id: string }) {
  const { has } = useAccess();
  const query = payrollApi.usePayrollRunQuery(id, { refetchOnMountOrArgChange: true });
  const row = query.currentData;
  if (query.isLoading) return <DetailPageSkeleton label="Loading payroll run" groups={4} />;
  if (query.error || row?.id !== id)
    return (
      <section role="alert" className="space-y-3">
        <h1 className="font-semibold">Payroll run unavailable</h1>
        <p>{query.error ? apiErrorMessage(query.error) : "The server did not return this payroll run."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  return (
    <article className="space-y-4">
      <PageHeader
        title={`Payroll · ${formatDate(row.periodStart)} – ${formatDate(row.periodEnd)}`}
        crumbs={[{ label: "Payroll runs", to: payrollRoot }, { label: "Run details" }]}
        actions={<PayrollActions row={row} onChanged={() => void query.refetch()} />}
      />
      <KeyFacts>
        <KeyFact label="Status" value={statuses[row.status]} />
        <KeyFact label="Generated employees" value={row.employeeCount} />
        <KeyFact label="Gross pay (GHS)" value={row.totalGrossPay.toLocaleString(undefined, { maximumFractionDigits: 20 })} />
        <KeyFact label="Net pay (GHS)" value={row.totalNetPay.toLocaleString(undefined, { maximumFractionDigits: 20 })} />
        <KeyFact label="PAYE (GHS)" value={row.totalPayeTax.toLocaleString(undefined, { maximumFractionDigits: 20 })} />
      </KeyFacts>
      <dl className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">SSNIT employee (GHS)</dt>
          <dd>{row.totalSsnitEmployeeContribution.toLocaleString(undefined, { maximumFractionDigits: 20 })}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">SSNIT employer (GHS)</dt>
          <dd>{row.totalSsnitEmployerContribution.toLocaleString(undefined, { maximumFractionDigits: 20 })}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Created</dt>
          <dd>{formatDateTime(row.createdAt)}</dd>
        </div>
      </dl>
      <p className="text-sm text-muted-foreground">
        The server can omit employees whose payslip calculation fails. Approval requires full active-employee/payslip reconciliation and the corresponding read
        permissions. A rejected draft retaining payslips must be cancelled and replaced before generation.
      </p>
      {has(p.payslip) ? (
        <PayrollPayslips id={id} />
      ) : (
        <p className="text-sm text-muted-foreground">Payslip access is required to inspect the generated employee breakdown.</p>
      )}
      <PayrollExports id={id} />
      <ModelApprovalHistory id={id} model="PayrollRun" audit={payrollAudit} />
    </article>
  );
}
export function PayrollDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : <p role="alert">Payroll run ID is missing.</p>;
}
