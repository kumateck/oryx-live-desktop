import { useNavigate } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { DropdownButton } from "@/shared/actions";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { usePageSearch } from "@/shared/search/page-search";
import { formatDate } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { leaveApi } from "../api/leave-api";
import {
  leaveAudit,
  categories,
  statuses,
  options,
  label,
  employeeName,
  detailPath,
  leavePermissions as p,
  leaveRoot,
  type Leave,
  type Status,
  type Category,
} from "../lib/leave";
import { useLeaveLookups } from "../hooks/use-leave-lookups";
import { LeaveActions } from "./leave-actions";
const selection = z.object({ value: z.string(), label: z.string() }).nullable();
const schema = z.object({ category: selection, status: selection, department: selection });
const statusValue = (value: string | undefined): Status | undefined =>
  value === "0" ? 0 : value === "1" ? 1 : value === "2" ? 2 : value === "3" ? 3 : value === "4" ? 4 : value === "5" ? 5 : value === "6" ? 6 : undefined;
const categoryValue = (value: string | undefined): Category | undefined =>
  value === "0" ? 0 : value === "1" ? 1 : value === "2" ? 2 : value === "3" ? 3 : undefined;
const c = dataTableColumns<Leave>();
const columns = c.columns([
  c.accessor(employeeName, { id: "employee", header: "Employee", enableSorting: false }),
  c.accessor((row) => row.employee?.department?.name ?? "", { id: "department", header: "Department", enableSorting: false }),
  c.accessor((row) => formatDate(row.startDate) ?? "Not recorded", { id: "start", header: "Start", enableSorting: false }),
  c.accessor((row) => formatDate(row.endDate) ?? "Not recorded", { id: "end", header: "End", enableSorting: false }),
  c.accessor((row) => row.leaveType?.name ?? "Not applicable", { id: "type", header: "Leave type", enableSorting: false }),
  c.accessor((row) => label(categories, row.requestCategory), { id: "category", header: "Category", enableSorting: false }),
  c.accessor((row) => label(statuses, row.leaveStatus), { id: "status", header: "Status", enableSorting: false }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <LeaveActions row={row.original} /> }),
]);
export function LeaveListPage() {
  const navigate = useNavigate();
  const search = usePageSearch("leave requests");
  const load = useLeaveLookups();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { category: null, status: null, department: null } });
  const filters = useWatch({ control: form.control });
  const table = useServerTable({ resetKey: `${search}|${JSON.stringify(filters)}` });
  const status = statusValue(filters.status?.value);
  const category = categoryValue(filters.category?.value);
  const query = leaveApi.useGetApiV1LeaveRequestQuery({
    ...leaveAudit,
    page: table.page,
    pageSize: table.pageSize,
    searchQuery: search,
    ...(status === undefined ? {} : { status }),
    ...(category === undefined ? {} : { leaveCategory: category }),
    ...(filters.department?.value ? { departmentId: filters.department.value } : {}),
  });
  const rows = query.currentData?.data ?? [];
  const meta = pageMeta(query.currentData, table, rows.length);
  const fields: WizardField<z.infer<typeof schema>>[] = [
    { type: I.SELECT, name: "status", label: "Status", mode: "single", source: "sync", options: options(statuses), placeholder: "All statuses" },
    { type: I.SELECT, name: "category", label: "Category", mode: "single", source: "sync", options: options(categories), placeholder: "All categories" },
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
        title="Leave management"
        crumbs={[{ label: "Human resources" }, { label: "Leave management" }]}
        actions={
          <DropdownButton
            label="Request leave"
            icon={Plus}
            items={options(categories).map((option) => ({
              id: option.value,
              label: option.label,
              to: `${leaveRoot}/create/${option.value}`,
              require: p.create,
            }))}
          />
        }
      />
      <FormWizard form={form} fields={fields} className="sm:grid-cols-3" />
      <ServerDataTable
        label="Leave requests"
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
        error={
          query.error ? apiErrorMessage(query.error) : rows.some((row) => !row.id) ? "A request is missing its identity. Refresh before taking action." : null
        }
        onRetry={() => void query.refetch()}
        onRowOpen={(row) => {
          if (row.id) void navigate(detailPath(row.id));
        }}
        emptyTitle="No matching leave requests"
        emptyDescription="Change the filters or create a request."
      />
    </section>
  );
}
