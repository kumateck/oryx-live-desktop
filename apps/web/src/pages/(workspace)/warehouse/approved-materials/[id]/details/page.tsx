import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useGetApiV1MaterialByMaterialIdQuery } from "@/modules/approved-materials/api/approved-material-api";
import { ApprovedMaterialDetail } from "@/modules/approved-materials/components/approved-material-detail";
import { approvedMaterialPermissions, approvedMaterialsPath, audit } from "@/modules/approved-materials/lib/approved-material-access";
import { materialHeaderSchema } from "@/modules/approved-materials/schemas/approved-material-schema";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";

function Material({ id }: { id: string }) {
  const { has } = useAccess();
  const query = useGetApiV1MaterialByMaterialIdQuery({ ...audit, materialId: id });
  const material = useMemo(() => { const parsed = materialHeaderSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading material" />;
  if (!material) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Material unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a material the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button>
      <Button asChild size="sm"><Link to={approvedMaterialsPath}>All approved materials</Link></Button></div></div>;
  // The route opens for either kind's permission; the material's own kind decides.
  if (!has(approvedMaterialPermissions[material.kind])) return <NoAccess />;
  return <ApprovedMaterialDetail material={material} />;
}

export default function ApprovedMaterialPage() {
  const { id } = useParams();
  return id ? <Material id={id} /> : null;
}
