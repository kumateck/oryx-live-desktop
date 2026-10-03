import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useGetApiV1RequisitionByRequisitionIdQuery } from "@/modules/requisitions/api/requisition-api";
import { requisitionSchema } from "@/modules/requisitions/schemas/requisition-schema";
import { SourcingWorkspace } from "@/modules/sourcing/components/sourcing-workspace";
import { audit, sourcingListPath } from "@/modules/sourcing/lib/sourcing-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";

function Sourcing({ id }: { id: string }) {
  const query = useGetApiV1RequisitionByRequisitionIdQuery({ ...audit, requisitionId: id });
  const requisition = useMemo(() => { const parsed = requisitionSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading requisition" />;
  if (!requisition) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Requisition unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a requisition the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button>
      <Button asChild size="sm"><Link to={sourcingListPath}>All purchase requisitions</Link></Button></div></div>;
  // The lines are keyed to this requisition, so a different one starts with nothing chosen.
  return <SourcingWorkspace key={requisition.id} requisition={requisition} />;
}

export default function SourcingPage() {
  const { id } = useParams();
  return id ? <Sourcing id={id} /> : null;
}
