import { useNavigate, Link } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { hrApi } from "@/shared/api/generated/hr";
import { useAccess } from "@/shared/auth/use-access";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatDate } from "@/shared/format/dates";
import { usePageSearch } from "@/shared/search/page-search";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { overtimeAudit, overtimeRoot, overtimeDetail, overtimePermissions as p, statuses, type Overtime } from "../lib/overtime";
import { useOvertimeLookups } from "../hooks/use-overtime-lookups";
import { OvertimeActions } from "./overtime-actions";
const selection = z.object({ value: z.string(), label: z.string() }).nullable();
const schema = z.object({ status: selection, department: selection });
const statusValue = (value: string | undefined): 0 | 1 | 2 | 3 | undefined =>
  value === "0" ? 0 : value === "1" ? 1 : value === "2" ? 2 : value === "3" ? 3 : undefined;
const c = dataTableColumns<Overtime>();
const columns = c.columns([
  c.accessor((row) => row.code ?? "", { id: "code", header: "Request", enableSorting: false }),
  c.accessor((row) => row.department?.name ?? "Not recorded", { id: "department", header: "Department", enableSorting: false }),
  c.accessor((row) => formatDate(row.overtimeDate) ?? "Not recorded", { id: "date", header: "Overtime date", enableSorting: false }),
  c.accessor((row) => `${row.startTime ?? "–"} – ${row.endTime ?? "–"}`, { id: "time", header: "Time", enableSorting: false }),
  c.accessor((row) => row.employees?.length ?? 0, { id: "staff", header: "Employees", enableSorting: false }),
  c.accessor((row) => (row.status === undefined ? "Not recorded" : statuses[row.status]), { id: "status", header: "Status", enableSorting: false }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <OvertimeActions row={row.original} /> }),
]);
export function OvertimeListPage() {
  const navigate = useNavigate();
  const { has } = useAccess();
  const search = usePageSearch("overtime requests");
  const load = useOvertimeLookups();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { status: null, department: null } });
  const filters = useWatch({ control: form.control });
  const table = useServerTable({ resetKey: `${search}|${JSON.stringify(filters)}` });
  const status = statusValue(filters.status?.value);
  const query = hrApi.useGetApiV1OvertimeRequestsQuery({
    ...overtimeAudit,
    page: table.page,
    pageSize: table.pageSize,
    searchQuery: search,
    ...(status === undefined ? {} : { status }),
    ...(filters.department?.value ? { departmentId: filters.department.value } : {}),
  });
  const rows = query.currentData?.data ?? [];
  const meta = pageMeta(query.currentData, table, rows.length);
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
    {
      type: I.SELECT,
      name: "department",
      label: "Department",
      mode: "single",
      source: "async",
      loadOptions: (search, page, signal) => load("department", search, page, signal),
      placeholder: "All departments",
    },
  ];
  return (
    <section className="page-fill">
      <PageHeader
        title="Overtime management"
        crumbs={[{ label: "Human resources" }, { label: "Overtime management" }]}
        actions={
          has(p.create) ? (
            <Button asChild>
              <Link to={`${overtimeRoot}/create`}>Request overtime</Link>
            </Button>
          ) : null
        }
      />
      <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
      <ServerDataTable
        label="Overtime requests"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id ?? ""}
        page={table.page}
        pageSize={table.pageSize}
        totalRows={meta.totalRows}
        onPageChange={table.onPageChange}
        onPageSizeChange={table.onPageSizeChange}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={query.error ? apiErrorMessage(query.error) : rows.some((row) => !row.id) ? "A request is missing its identity. Refresh the register." : null}
        onRetry={() => void query.refetch()}
        onRowOpen={(row) => {
          if (row.id) void navigate(overtimeDetail(row.id));
        }}
        emptyTitle="No matching overtime requests"
        emptyDescription="Change the filters or create a request."
      />
    </section>
  );
}
