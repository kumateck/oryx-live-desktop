import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1ProcurementManufacturerByManufacturerIdQuery } from "@/modules/manufacturers/api/manufacturer-api";
import { ManufacturerDetail } from "@/modules/manufacturers/components/manufacturer-detail";
import { manufacturerAudit, manufacturersPath } from "@/modules/manufacturers/lib/manufacturer-access";

export default function ManufacturerDetailPage() {
  const { id } = useParams();
  const query = useGetApiV1ProcurementManufacturerByManufacturerIdQuery({ ...manufacturerAudit, manufacturerId: id ?? "" }, { skip: !id });
  if (!id) return <p role="alert">Invalid manufacturer address.</p>;
  if (query.isLoading) return <DetailPageSkeleton label="Loading manufacturer" />;
  if (!query.data) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Manufacturer unavailable</h1><p className="text-sm text-muted-foreground">{apiErrorMessage(query.error)}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button>
      <Button asChild size="sm"><Link to={manufacturersPath}>All manufacturers</Link></Button></div></div>;
  return <ManufacturerDetail manufacturer={query.data} />;
}
