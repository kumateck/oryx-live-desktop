import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { hrApi } from "@/shared/api/generated/hr";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { ModelApprovalHistory } from "@/shared/approvals/model-history";
import { overtimeAudit, overtimeRoot, overtimeDuration, statuses } from "../lib/overtime";
import type { DomainEntitiesEmployeesEmployeeDto as Employee } from "@/shared/api/generated/hr";
import { OvertimeActions } from "./overtime-actions";
const c = dataTableColumns<Employee>();
const columns = c.columns([
  c.accessor((row) => row.staffNumber ?? "Not recorded", { id: "staff", header: "Staff ID" }),
  c.accessor((row) => [row.firstName, row.lastName].filter(Boolean).join(" ") || "Not recorded", { id: "name", header: "Employee" }),
  c.accessor((row) => row.department?.name ?? "Not recorded", { id: "department", header: "Department" }),
  c.accessor((row) => row.designation?.name ?? "Not recorded", { id: "designation", header: "Designation" }),
]);
function Detail({ id }: { id: string }) {
  const navigate = useNavigate();
  const query = hrApi.useGetApiV1OvertimeRequestsByIdQuery({ ...overtimeAudit, id }, { refetchOnMountOrArgChange: true });
  if (query.isLoading) return <DetailPageSkeleton label="Loading overtime request" groups={4} />;
  const row = query.currentData;
  if (query.error || row?.id !== id)
    return (
      <section role="alert" className="space-y-3">
        <h1 className="font-semibold">Overtime request unavailable</h1>
        <p>{query.error ? apiErrorMessage(query.error) : "The server did not return this request."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  const duration = overtimeDuration(row.startTime, row.endTime);
  return (
    <article className="space-y-4">
      <PageHeader
        title={`Overtime · ${row.code ?? "Request"}`}
        crumbs={[{ label: "Overtime management", to: overtimeRoot }, { label: row.code ?? "Details" }]}
        actions={
          <OvertimeActions
            row={row}
            detail
            onDeleted={() => {
              void navigate(overtimeRoot);
            }}
          />
        }
      />
      <KeyFacts>
        <KeyFact label="Status" value={row.status === undefined ? "Not recorded" : statuses[row.status]} />
        <KeyFact label="Department" value={row.department?.name ?? "Not recorded"} />
        <KeyFact label="Date" value={formatDate(row.overtimeDate) ?? "Not recorded"} />
        <KeyFact label="Time" value={`${row.startTime ?? "–"} – ${row.endTime ?? "–"}`} />
        <KeyFact
          label="Requested duration"
          value={duration === null ? "Cannot verify" : `${duration.toLocaleString()} hours`}
          note={duration === null ? "The server supports same-day overtime." : "Calculated from the displayed times."}
        />
      </KeyFacts>
      <p className="text-sm text-muted-foreground">
        Requested by {[row.createdBy?.firstName, row.createdBy?.lastName].filter(Boolean).join(" ") || "an unnamed user"} ·{" "}
        {formatDateTime(row.createdAt) ?? "date not recorded"}. Server reported whole hours: {row.totalHours ?? "not recorded"}.
      </p>
      <section className="space-y-2">
        <h2 className="font-semibold">Justification</h2>
        {row.justification ? <RichTextView html={row.justification} /> : <p className="text-muted-foreground">No justification recorded.</p>}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Employees ({row.employees?.length ?? 0})</h2>
        <ClientDataTable
          label="Overtime employees"
          rows={row.employees ?? []}
          columns={columns}
          getRowId={(employee) => employee.id ?? ""}
          initialPageSize={30}
          emptyTitle="No employees returned"
          emptyDescription="Refresh this request to verify its employee selection."
        />
      </section>
      <ModelApprovalHistory id={id} model="OvertimeRequest" audit={overtimeAudit} />
    </article>
  );
}
export function OvertimeDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : <p role="alert">Request ID is missing.</p>;
}
