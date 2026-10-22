import { Link } from "react-router";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatDate } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { hrApi } from "../api/shift-api";
import { audit, statuses, frequencies } from "../schemas/contracts";
import type { DomainEntitiesShiftSchedulesShiftScheduleDto as Row } from "@/shared/api/generated/hr";
const c = dataTableColumns<Row>();
const columns = c.columns([
  c.display({
    id: "schedule",
    header: "Schedule",
    cell: ({ row }) =>
      row.original.id ? (
        <Link className="text-primary hover:underline" to={`/plan-shift/${encodeURIComponent(row.original.id)}/calendar`}>
          {row.original.scheduleName || "Unnamed schedule"}
        </Link>
      ) : (
        "Missing schedule identity"
      ),
  }),
  c.accessor((r) => r.department?.name ?? "Not recorded", { id: "department", header: "Department" }),
  c.accessor((r) => (r.frequency === undefined ? "Not recorded" : frequencies[r.frequency]), { id: "frequency", header: "Frequency" }),
  c.accessor((r) => formatDate(r.startDate), { id: "start", header: "Starts" }),
  c.accessor((r) => formatDate(r.endDate), { id: "end", header: "Ends" }),
  c.accessor((r) => (r.scheduleStatus === undefined ? "Not recorded" : statuses[r.scheduleStatus]), { id: "status", header: "Status" }),
]);
export function ShiftListPage() {
  const table = useServerTable();
  const query = hrApi.useGetApiV1ShiftSchedulesQuery({ ...audit, page: table.page, pageSize: table.pageSize });
  const rows = query.currentData?.data ?? [];
  const meta = pageMeta(query.currentData, table, rows.length);
  return (
    <section className="page-fill">
      <PageHeader title="Plan shift" crumbs={[{ label: "Human resources" }, { label: "Plan shift" }]} />
      <ServerDataTable
        label="Shift schedules"
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id ?? "missing"}
        page={table.page}
        pageSize={table.pageSize}
        totalRows={meta.totalRows}
        onPageChange={table.onPageChange}
        onPageSizeChange={table.onPageSizeChange}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={query.error ? apiErrorMessage(query.error) : rows.some((r) => !r.id) ? "A schedule is missing its identity. Refresh before opening it." : null}
        onRetry={() => void query.refetch()}
        emptyTitle="No shift schedules"
        emptyDescription="Create schedules in organisational settings before planning employee assignments."
      />
    </section>
  );
}
