import { Link, useNavigate } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { hrApi } from "@/shared/api/generated/hr";
import { useAccess } from "@/shared/auth/use-access";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { usePageSearch } from "@/shared/search/page-search";
import { formatDate } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { staffAudit, staffRoot, staffDetail, staffPermissions as p, appointments, statuses, type StaffRequest } from "../lib/staff";
import { useStaffLookups } from "../hooks/use-staff-lookups";
import { StaffActions } from "./staff-actions";
const selection = z.object({ value: z.string(), label: z.string() }).nullable();
const schema = z
  .object({ appointment: selection, department: selection, from: z.date().nullable(), to: z.date().nullable() })
  .refine((v) => !v.from || !v.to || v.from <= v.to, { path: ["to"], message: "End date must be on or after the start." });
const c = dataTableColumns<StaffRequest>();
const columns = c.columns([
  c.accessor((row) => row.staffRequired ?? "Not recorded", { id: "staff", header: "Employees", enableSorting: false }),
  c.accessor((row) => row.department?.name ?? row.departmentName ?? "Not recorded", { id: "department", header: "Department", enableSorting: false }),
  c.accessor((row) => row.designation?.name ?? "Not recorded", { id: "role", header: "Job title", enableSorting: false }),
  c.accessor((row) => row.qualification ?? "", { id: "qualification", header: "Qualification", enableSorting: false }),
  c.accessor((row) => (row.appointmentType === undefined ? "Not recorded" : appointments[row.appointmentType]), {
    id: "appointment",
    header: "Appointment",
    enableSorting: false,
  }),
  c.accessor((row) => formatDate(row.requestUrgency) ?? "Not recorded", { id: "urgency", header: "Required by", enableSorting: false }),
  c.accessor((row) => (row.staffRequisitionStatus === undefined ? "Not recorded" : statuses[row.staffRequisitionStatus]), {
    id: "status",
    header: "Status",
    enableSorting: false,
  }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <StaffActions row={row.original} /> }),
]);
export function StaffListPage() {
  const navigate = useNavigate();
  const { has } = useAccess();
  const search = usePageSearch("staff requisitions");
  const load = useStaffLookups();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { appointment: { value: "0", label: appointments[0] }, department: null, from: null, to: null },
  });
  const filters = useWatch({ control: form.control });
  const table = useServerTable({ resetKey: `${search}|${JSON.stringify(filters)}` });
  const appointment = filters.appointment?.value === "0" ? 0 : filters.appointment?.value === "1" ? 1 : undefined;
  const validDates = !filters.from || !filters.to || filters.from <= filters.to;
  const query = hrApi.useGetApiV1StaffRequisitionsQuery(
    {
      ...staffAudit,
      page: table.page,
      pageSize: table.pageSize,
      searchQuery: search,
      ...(appointment === undefined ? {} : { appointmentType: appointment }),
      ...(filters.department?.value ? { departmentId: filters.department.value } : {}),
      ...(filters.from ? { startDate: filters.from.toISOString() } : {}),
      ...(filters.to ? { endDate: new Date(filters.to.getFullYear(), filters.to.getMonth(), filters.to.getDate(), 23, 59, 59, 999).toISOString() } : {}),
    },
    { skip: !validDates },
  );
  const rows = validDates ? (query.currentData?.data ?? []) : [];
  const meta = pageMeta(query.currentData, table, rows.length);
  const fields: WizardField<z.infer<typeof schema>>[] = [
    {
      type: I.SELECT,
      name: "appointment",
      label: "Appointment type",
      mode: "single",
      source: "sync",
      options: appointments.map((label, value) => ({ value: String(value), label })),
      placeholder: "All appointment types",
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
    { type: I.DATE, name: "from", label: "Required from" },
    { type: I.DATE, name: "to", label: "Required through" },
  ];
  return (
    <section className="page-fill">
      <PageHeader
        title="Staff requisitions"
        crumbs={[{ label: "Human resources" }, { label: "Staff requisitions" }]}
        actions={
          has(p.create) ? (
            <Button asChild>
              <Link to={`${staffRoot}/create`}>Request employees</Link>
            </Button>
          ) : null
        }
      />
      <FormWizard form={form} fields={fields} className="sm:grid-cols-2 xl:grid-cols-4" />
      <ServerDataTable
        label="Staff requisitions"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id ?? ""}
        page={table.page}
        pageSize={table.pageSize}
        totalRows={validDates ? meta.totalRows : 0}
        onPageChange={table.onPageChange}
        onPageSizeChange={table.onPageSizeChange}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={
          !validDates
            ? "End date must be on or after the start date."
            : query.error
              ? apiErrorMessage(query.error)
              : rows.some((row) => !row.id)
                ? "A request is missing its identity. Refresh the register."
                : null
        }
        onRetry={() => void query.refetch()}
        onRowOpen={(row) => {
          if (row.id) void navigate(staffDetail(row.id));
        }}
        emptyTitle="No matching staff requisitions"
        emptyDescription="Change the filters or create a request."
      />
    </section>
  );
}
