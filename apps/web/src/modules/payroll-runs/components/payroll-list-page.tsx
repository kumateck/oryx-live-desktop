import { useState } from "react";
import { Link } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatDate } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { payrollApi } from "../api/payroll-api";
import { payrollRoot, payrollPermissions as p, statuses, type PayrollRun } from "../schemas/contracts";
import { CreatePayrollDialog } from "./create-payroll-dialog";
const schema = z.object({ status: z.object({ value: z.enum(["0", "1", "2", "3", "4"]), label: z.string() }).nullable() });
const fields: WizardField<z.infer<typeof schema>>[] = [
  {
    type: I.SELECT,
    name: "status",
    label: "Status",
    mode: "single",
    source: "sync",
    options: statuses.map((label, value) => ({ value: String(value), label })),
    placeholder: "All statuses",
  },
];
const c = dataTableColumns<PayrollRun>();
const columns = c.columns([
  c.display({
    id: "period",
    header: "Payroll period",
    cell: ({ row }) => (
      <Link className="text-primary underline-offset-2 hover:underline" to={`${payrollRoot}/${encodeURIComponent(row.original.id)}`}>
        {formatDate(row.original.periodStart)} – {formatDate(row.original.periodEnd)}
      </Link>
    ),
  }),
  c.accessor((row) => statuses[row.status], { id: "status", header: "Status", enableSorting: false }),
  c.accessor("employeeCount", { header: "Employees", enableSorting: false }),
  c.accessor("totalGrossPay", { header: "Gross pay (GHS)", enableSorting: false }),
  c.accessor("totalNetPay", { header: "Net pay (GHS)", enableSorting: false }),
  c.accessor((row) => formatDate(row.createdAt) ?? "Not recorded", { id: "created", header: "Created", enableSorting: false }),
]);
export function PayrollListPage() {
  const { has } = useAccess();
  const [creating, setCreating] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { status: null } });
  const selected = useWatch({ control: form.control, name: "status" });
  const status =
    selected?.value === "0"
      ? 0
      : selected?.value === "1"
        ? 1
        : selected?.value === "2"
          ? 2
          : selected?.value === "3"
            ? 3
            : selected?.value === "4"
              ? 4
              : undefined;
  const table = useServerTable({ resetKey: String(status) });
  const query = payrollApi.usePayrollRunsQuery({ page: table.page, pageSize: table.pageSize, ...(status === undefined ? {} : { status }) });
  const rows = query.currentData?.data ?? [];
  const meta = pageMeta(query.currentData, table, rows.length);
  return (
    <section className="page-fill">
      <PageHeader
        title="Payroll runs"
        crumbs={[{ label: "Human resources" }, { label: "Payroll runs" }]}
        actions={has(p.create) ? <Button onClick={() => setCreating(true)}>Create payroll run</Button> : null}
      />
      <div className="max-w-xs">
        <FormWizard form={form} fields={fields} />
      </div>
      <ServerDataTable
        label="Payroll runs"
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        page={table.page}
        pageSize={table.pageSize}
        totalRows={meta.totalRows}
        onPageChange={table.onPageChange}
        onPageSizeChange={table.onPageSizeChange}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={query.error ? apiErrorMessage(query.error) : null}
        onRetry={() => void query.refetch()}
        emptyTitle="No matching payroll runs"
        emptyDescription="Change the status filter or create a draft run."
      />
      {creating ? <CreatePayrollDialog onClose={() => setCreating(false)} /> : null}
    </section>
  );
}
