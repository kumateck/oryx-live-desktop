import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { payrollConfigApi } from "../api/config-api";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { PayGrade, TaxBand, PensionRate } from "../schemas/contracts";
import { ConfigActions } from "./config-actions";
const grade = dataTableColumns<PayGrade>();
const band = dataTableColumns<TaxBand>();
const rate = dataTableColumns<PensionRate>();
const gradeColumns = grade.columns([
  grade.accessor("name", { header: "Grade" }),
  grade.accessor("minSalary", { header: "Minimum (GHS)" }),
  grade.accessor("maxSalary", { header: "Maximum (GHS)" }),
  grade.accessor((row) => (row.level === null ? "Not assigned" : ["Junior staff", "Senior staff", "Senior management"][row.level]), {
    id: "level",
    header: "Level",
  }),
  grade.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <ConfigActions record={{ kind: "grade", row: row.original }} /> }),
]);
const bandColumns = band.columns([
  band.accessor("lowerBound", { header: "Lower bound (GHS)" }),
  band.accessor((row) => row.upperBound ?? "Uncapped", { id: "upper", header: "Upper bound (GHS)" }),
  band.accessor("rate", { header: "Rate (%)" }),
  band.accessor((row) => formatDate(row.effectiveFrom) ?? "Not recorded", { id: "from", header: "Effective from" }),
  band.accessor((row) => formatDate(row.effectiveTo) ?? "No end date", { id: "to", header: "Effective until" }),
  band.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <ConfigActions record={{ kind: "band", row: row.original }} /> }),
]);
const pensionColumns = rate.columns([
  rate.accessor("employeeRate", { header: "Employee (%)" }),
  rate.accessor("employerRate", { header: "Employer (%)" }),
  rate.accessor("tier2Rate", { header: "Tier 2 (%)" }),
  rate.accessor("insurableEarningsCeiling", { header: "Ceiling (GHS)" }),
  rate.accessor((row) => formatDate(row.effectiveFrom) ?? "Not recorded", { id: "from", header: "Effective from" }),
  rate.accessor((row) => formatDate(row.effectiveTo) ?? "No end date", { id: "to", header: "Effective until" }),
  rate.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <ConfigActions record={{ kind: "pension", row: row.original }} /> }),
]);
export function GradesTable() {
  const query = payrollConfigApi.usePayrollGradesQuery();
  return (
    <ClientDataTable
      label="Pay grades"
      columns={gradeColumns}
      rows={query.currentData ?? []}
      getRowId={(row) => row.id}
      loading={query.isLoading}
      refreshing={query.isFetching && !query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : null}
      onRetry={() => void query.refetch()}
      initialPageSize={30}
      emptyTitle="No pay grades"
      emptyDescription="Add the configured pay grades for this organisation."
    />
  );
}
export function BandsTable() {
  const query = payrollConfigApi.usePayrollTaxBandsQuery();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        The server returns bands with no end date. End-dated bands are not included in this list; this is not a complete historical tax schedule.
      </p>
      <ClientDataTable
        label="PAYE tax bands"
        columns={bandColumns}
        rows={query.currentData ?? []}
        getRowId={(row) => row.id}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={query.error ? apiErrorMessage(query.error) : null}
        onRetry={() => void query.refetch()}
        initialPageSize={30}
        emptyTitle="No current tax bands"
        emptyDescription="Add the organisation's configured tax bands."
      />
    </div>
  );
}
export function PensionTable() {
  const query = payrollConfigApi.usePayrollPensionRatesQuery();
  return (
    <ClientDataTable
      label="SSNIT rates"
      columns={pensionColumns}
      rows={query.currentData ?? []}
      getRowId={(row) => row.id}
      loading={query.isLoading}
      refreshing={query.isFetching && !query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : null}
      onRetry={() => void query.refetch()}
      initialPageSize={30}
      emptyTitle="No SSNIT rates"
      emptyDescription="Add the organisation's configured effective-dated rates."
    />
  );
}
