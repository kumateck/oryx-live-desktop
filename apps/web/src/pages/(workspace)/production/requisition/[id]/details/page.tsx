import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useGetApiV1RequisitionByRequisitionIdQuery } from "@/modules/requisitions/api/requisition-api";
import { RequisitionDetail } from "@/modules/requisitions/components/requisition-detail";
import { listAudit, requisitionsPath } from "@/modules/requisitions/lib/requisition-access";
import { requisitionSchema } from "@/modules/requisitions/schemas/requisition-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";

function Requisition({ id }: { id: string }) {
  const query = useGetApiV1RequisitionByRequisitionIdQuery({ ...listAudit, requisitionId: id });
  const requisition = useMemo(() => { const parsed = requisitionSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading requisition" />;
  if (!requisition) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Requisition unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a requisition the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button>
      <Button asChild size="sm"><Link to={requisitionsPath}>All requisitions</Link></Button></div></div>;
  return <RequisitionDetail requisition={requisition} />;
}

export default function RequisitionPage() {
  const { id } = useParams();
  return id ? <Requisition id={id} /> : null;
}
