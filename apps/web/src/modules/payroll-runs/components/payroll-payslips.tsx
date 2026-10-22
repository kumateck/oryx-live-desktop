import { Link } from "react-router";
import { ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { payrollApi } from "../api/payroll-api";
import { payrollRoot, type Payslip } from "../schemas/contracts";
const c = dataTableColumns<Payslip>();
const columns = c.columns([
  c.accessor("staffNumber", { header: "Staff ID", enableSorting: false }),
  c.display({
    id: "employee",
    header: "Employee",
    cell: ({ row }) => (
      <Link className="text-primary hover:underline" to={`${payrollRoot}/payslips/${encodeURIComponent(row.original.id)}`}>
        {row.original.employeeName || "View payslip"}
      </Link>
    ),
  }),
  c.accessor("department", { header: "Department", enableSorting: false }),
  c.accessor("grossPay", { header: "Gross pay (GHS)", enableSorting: false }),
  c.accessor("payeTax", { header: "PAYE (GHS)", enableSorting: false }),
  c.accessor("totalDeductions", { header: "Deductions (GHS)", enableSorting: false }),
  c.accessor("netPay", { header: "Net pay (GHS)", enableSorting: false }),
]);
export function PayrollPayslips({ id }: { id: string }) {
  const table = useServerTable({ resetKey: id });
  const query = payrollApi.usePayrollRunPayslipsQuery({ id, page: table.page, pageSize: table.pageSize });
  const rows = query.currentData?.data ?? [];
  const meta = pageMeta(query.currentData, table, rows.length);
  const invalid = rows.some((row) => row.payrollRunId !== id) || new Set(rows.map((row) => row.id)).size !== rows.length;
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Generated payslips</h2>
      <ServerDataTable
        label="Payroll payslips"
        rows={invalid ? [] : rows}
        columns={columns}
        getRowId={(row) => row.id}
        page={table.page}
        pageSize={table.pageSize}
        totalRows={meta.totalRows}
        onPageChange={table.onPageChange}
        onPageSizeChange={table.onPageSizeChange}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={invalid ? "The server returned repeated payslips or payslips belonging to a different run." : query.error ? apiErrorMessage(query.error) : null}
        onRetry={() => void query.refetch()}
        emptyTitle="No payslips generated"
        emptyDescription="A draft run generates payslips when submitted for approval."
      />
    </section>
  );
}
