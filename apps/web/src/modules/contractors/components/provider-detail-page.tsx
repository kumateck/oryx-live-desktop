import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { servicesApi } from "@/shared/api/generated/services";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { useAccess } from "@/shared/auth/use-access";
import type { StoreService } from "@/shared/services/contracts";
import { providerSchema, providerAudit as audit } from "../schemas/provider";
import { ProviderActions } from "./provider-actions";
function Detail({ id }: { id: string }) {
  const query = servicesApi.useGetApiV1ServiceProvidersByIdQuery({ ...audit, id });
  const { has } = useAccess();
  const parsed = providerSchema.safeParse(query.currentData);
  if (query.isLoading) return <DetailPageSkeleton label="Loading contractor" groups={3} />;
  if (query.error || !parsed.success || parsed.data.id !== id)
    return (
      <section role="alert" className="space-y-3">
        <h1 className="font-semibold">Contractor unavailable</h1>
        <p>{query.error ? apiErrorMessage(query.error) : "The contractor response could not be verified."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  const row = parsed.data;
  const c = dataTableColumns<StoreService>();
  const columns = c.columns([
    c.display({
      id: "name",
      header: "Service",
      cell: ({ row }) =>
        has("CanViewServices") ? (
          <Link className="text-primary hover:underline" to={`/extrals/services/${encodeURIComponent(row.original.id)}`}>
            {row.original.name}
          </Link>
        ) : (
          row.original.name
        ),
    }),
    c.accessor("code", { header: "Code" }),
    c.accessor((s) => formatDate(s.startDate), { id: "start", header: "Starts" }),
    c.accessor((s) => formatDate(s.endDate), { id: "end", header: "Ends" }),
    c.accessor((s) => (s.isActive ? "Active" : "Inactive"), { id: "active", header: "Status" }),
  ]);
  return (
    <article className="space-y-5">
      <PageHeader
        title={row.name}
        crumbs={[{ label: "Service providers", to: "/extrals/services-providers" }, { label: "Provider details" }]}
        actions={<ProviderActions id={id} name={row.name} />}
      />
      <KeyFacts>
        <KeyFact label="Telephone" value={row.phone} />
        <KeyFact label="Email" value={row.email} />
        <KeyFact label="Country" value={row.country?.name ?? "Not recorded"} />
        <KeyFact label="Currency" value={row.currency?.name ?? "Not recorded"} />
      </KeyFacts>
      <section className="space-y-2">
        <h2 className="font-semibold">Address</h2>
        <p className="whitespace-pre-wrap break-words">{row.address}</p>
      </section>
      <ClientDataTable
        label="Provided services"
        rows={row.services}
        columns={columns}
        getRowId={(s) => s.id}
        initialPageSize={30}
        emptyTitle="No linked services"
        emptyDescription="Edit the provider to maintain their service associations."
      />
    </article>
  );
}
export function ProviderDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : <p role="alert">Contractor ID is missing.</p>;
}
