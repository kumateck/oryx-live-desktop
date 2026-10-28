import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { formatDate } from "@/shared/format/dates";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { payrollApi } from "../api/payroll-api";
import { payrollRoot, type Payslip } from "../schemas/contracts";
import { PayslipDocument, payslipTotals, payslipLineTypes } from "./payslip-document";
const c = dataTableColumns<Payslip["lineItems"][number] & { id: string }>();
const columns = c.columns([
  c.accessor((row) => payslipLineTypes[row.type], { id: "type", header: "Type" }),
  c.accessor("description", { header: "Description" }),
  c.accessor("amount", { header: "Amount (GHS)" }),
]);
function Detail({ id }: { id: string }) {
  const query = payrollApi.usePayrollPayslipQuery(id, { refetchOnMountOrArgChange: true });
  const row = query.currentData;
  if (query.isLoading) return <DetailPageSkeleton label="Loading payslip" groups={4} />;
  if (query.error || row?.id !== id)
    return (
      <section role="alert" className="space-y-3">
        <h1 className="font-semibold">Payslip unavailable</h1>
        <p>{query.error ? apiErrorMessage(query.error) : "The server did not return this payslip."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  return (
    <article className="space-y-4">
      <PageHeader
        title={`Payslip · ${row.employeeName}`}
        crumbs={[{ label: "Payroll runs", to: payrollRoot }, { label: "Payslip" }]}
        actions={
          <PrintButton
            preview={(close) => (
              <PrintPreviewDialog title="Payslip" onClose={close}>
                <PayslipDocument row={row} />
              </PrintPreviewDialog>
            )}
          />
        }
      />
      <KeyFacts>
        <KeyFact label="Staff ID" value={row.staffNumber} />
        <KeyFact label="Department" value={row.department} />
        <KeyFact label="Designation" value={row.designation} />
        <KeyFact label="Period starts" value={formatDate(row.periodStart)} />
        <KeyFact label="Period ends" value={formatDate(row.periodEnd)} />
      </KeyFacts>
      <dl className="grid gap-4 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3">
        {payslipTotals.map(([key, label]) => (
          <div key={key}>
            <dt className="text-sm text-muted-foreground">{label} (GHS)</dt>
            <dd className="font-medium">{row[key].toLocaleString(undefined, { maximumFractionDigits: 20 })}</dd>
          </div>
        ))}
      </dl>
      <ClientDataTable
        label="Payslip line items"
        columns={columns}
        rows={row.lineItems.map((item, index) => ({ ...item, id: String(index) }))}
        getRowId={(item) => item.id}
        initialPageSize={30}
        emptyTitle="No payslip line items"
        emptyDescription="This payslip has no line-item breakdown."
      />
    </article>
  );
}
export function PayslipPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : <p role="alert">Payslip ID is missing.</p>;
}
