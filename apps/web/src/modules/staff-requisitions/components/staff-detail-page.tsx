import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { hrApi } from "@/shared/api/generated/hr";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { ModelApprovalHistory } from "@/shared/approvals/model-history";
import { staffAudit, staffRoot, appointments, budgets, statuses } from "../lib/staff";
import { StaffActions } from "./staff-actions";
function Detail({ id }: { id: string }) {
  const navigate = useNavigate();
  const query = hrApi.useGetApiV1StaffRequisitionsByIdQuery({ ...staffAudit, id }, { refetchOnMountOrArgChange: true });
  if (query.isLoading) return <DetailPageSkeleton label="Loading staff requisition" groups={4} />;
  const row = query.currentData;
  if (query.error || row?.id !== id)
    return (
      <section role="alert" className="space-y-3">
        <h1 className="font-semibold">Staff requisition unavailable</h1>
        <p>{query.error ? apiErrorMessage(query.error) : "The server did not return this request."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  return (
    <article className="space-y-4">
      <PageHeader
        title={`Staff requisition · ${row.designation?.name ?? "Position"}`}
        crumbs={[{ label: "Staff requisitions", to: staffRoot }, { label: "Request details" }]}
        actions={
          <StaffActions
            row={row}
            detail
            onDeleted={() => {
              void navigate(staffRoot);
            }}
          />
        }
      />
      <KeyFacts>
        <KeyFact label="Employees required" value={row.staffRequired ?? "Not recorded"} />
        <KeyFact label="Department" value={row.department?.name ?? row.departmentName ?? "Not recorded"} />
        <KeyFact label="Job title" value={row.designation?.name ?? "Not recorded"} />
        <KeyFact label="Status" value={row.staffRequisitionStatus === undefined ? "Not recorded" : statuses[row.staffRequisitionStatus]} />
        <KeyFact label="Required by" value={formatDate(row.requestUrgency) ?? "Not recorded"} />
      </KeyFacts>
      <dl className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Appointment type</dt>
          <dd>{row.appointmentType === undefined ? "Not recorded" : appointments[row.appointmentType]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Budget status</dt>
          <dd>{row.budgetStatus === undefined ? "Not recorded" : budgets[row.budgetStatus]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Job qualification</dt>
          <dd className="whitespace-pre-wrap break-words">{row.qualification ?? "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Educational qualification</dt>
          <dd className="whitespace-pre-wrap break-words">{row.educationalQualification ?? "Not recorded"}</dd>
        </div>
      </dl>
      <p className="text-sm text-muted-foreground">
        Requested by {[row.createdBy?.firstName, row.createdBy?.lastName].filter(Boolean).join(" ") || "an unnamed user"} ·{" "}
        {formatDateTime(row.createdAt) ?? "date not recorded"}.
      </p>
      {[
        { label: "Justification", value: row.justification },
        { label: "Additional requirements", value: row.additionalRequirements },
        { label: "Other requests", value: row.additionalRequests },
      ].map((field) => (
        <section key={field.label} className="space-y-2">
          <h2 className="font-semibold">{field.label}</h2>
          {field.value ? <RichTextView html={field.value} /> : <p className="text-muted-foreground">Not recorded.</p>}
        </section>
      ))}
      <ModelApprovalHistory id={id} model="StaffRequisition" audit={staffAudit} />
    </article>
  );
}
export function StaffDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : <p role="alert">Request ID is missing.</p>;
}
