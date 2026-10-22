import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { servicesApi } from "@/shared/api/generated/services";
import { PageHeader } from "@/shared/navigation/page-header";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { serviceSchema, servicesAudit as audit } from "@/shared/services/contracts";
import { ServiceActions } from "./service-actions";
import { ServiceAttachments } from "./service-attachments";
function Detail({ id }: { id: string }) {
  const query = servicesApi.useGetApiV1ServicesByIdQuery({ ...audit, id });
  const parsed = serviceSchema.safeParse(query.currentData);
  if (query.isLoading) return <DetailPageSkeleton label="Loading service" groups={3} />;
  if (query.error || !parsed.success || parsed.data.id !== id)
    return (
      <section role="alert" className="space-y-3">
        <h1 className="font-semibold">Service unavailable</h1>
        <p>{query.error ? apiErrorMessage(query.error) : "The service response could not be verified."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  const row = parsed.data;
  return (
    <article className="space-y-5">
      <PageHeader
        title={row.name}
        crumbs={[{ label: "Services", to: "/extrals/services" }, { label: row.code || "Service details" }]}
        actions={<ServiceActions row={row} onChanged={() => void query.refetch()} />}
      />
      <KeyFacts>
        <KeyFact label="Code" value={row.code || "Not recorded"} />
        <KeyFact label="Status" value={row.isActive ? "Active" : "Inactive"} />
        <KeyFact label="Starts" value={formatDate(row.startDate)} />
        <KeyFact label="Ends" value={formatDate(row.endDate)} />
        <KeyFact label="Created" value={formatDateTime(row.createdAt)} />
      </KeyFacts>
      <section className="space-y-2">
        <h2 className="font-semibold">Description</h2>
        <p className="whitespace-pre-wrap break-words">{row.description || "No description"}</p>
      </section>
      <ServiceAttachments row={row} />
    </article>
  );
}
export function ServiceDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : <p role="alert">Service ID is missing.</p>;
}
