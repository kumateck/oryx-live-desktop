import { useMemo, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklistQuery, useGetApiV1WarehouseDistributedMaterialByIdQuery } from "../api/receiving-api";
import { audit, canCreateChecklist, checklistPermissions, createChecklistPath, receivingPath, viewChecklistPath, viewPermissions } from "../lib/receiving";
import { checklistSchema, deliveredMaterialSchema, type DeliveredMaterial } from "../schemas/receiving-schema";
import { ChecklistView } from "./checklist-view";
import { CreateChecklistForm } from "./create-checklist-form";

function Notice({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">{title}</h1><p className="text-sm text-muted-foreground">{children}</p>
    <div className="flex justify-center gap-2">{actions}<Button asChild size="sm" variant="outline"><Link to={receivingPath}>Receiving area</Link></Button></div></div>;
}

function Material({ id, children }: { id: string; children: (material: DeliveredMaterial) => ReactNode }) {
  const { has } = useAccess();
  const query = useGetApiV1WarehouseDistributedMaterialByIdQuery({ ...audit, id });
  const material = useMemo(() => { const parsed = deliveredMaterialSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading delivery" />;
  if (!material) return <Notice title="Delivery unavailable" actions={<Button size="sm" onClick={() => void query.refetch()}>Retry</Button>}>{query.error ? apiErrorMessage(query.error) : "The server returned a delivery the app could not read."}</Notice>;
  // Raw and packaging materials sit behind separate permissions, whichever way the page was reached.
  if (!has(viewPermissions[material.kind])) return <Notice title="Not available to you">You do not have access to this kind of material.</Notice>;
  return <>{children(material)}</>;
}

function Create({ material }: { material: DeliveredMaterial }) {
  const { has } = useAccess();
  if (!has(checklistPermissions[material.kind])) return <Notice title="Not available to you">You may not write checklists for this kind of material.</Notice>;
  if (!canCreateChecklist(material.status)) return <Notice title="Already checked" actions={<Button asChild size="sm"><Link to={viewChecklistPath(material.id)}>View the checklist</Link></Button>}>A checklist has already been saved for this delivery of {material.materialName}. It is written once.</Notice>;
  const { materialId } = material;
  if (!materialId || !material.unitId) return <Notice title="Cannot be checked in">The server did not say which material or unit this delivery is in, so its batches cannot be recorded.</Notice>;
  return <CreateChecklistForm material={{ ...material, materialId }} />;
}

function View({ material }: { material: DeliveredMaterial }) {
  const { has } = useAccess();
  const query = useGetApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklistQuery({ ...audit, distributedMaterialId: material.id });
  const checklist = useMemo(() => { const parsed = checklistSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading checklist" />;
  if (!checklist) return <Notice title="No checklist" actions={canCreateChecklist(material.status) && has(checklistPermissions[material.kind]) ? <Button asChild size="sm"><Link to={createChecklistPath(material.id)}>Create the checklist</Link></Button> : <Button size="sm" onClick={() => void query.refetch()}>Retry</Button>}>
    {query.error ? apiErrorMessage(query.error) : "The server returned a checklist the app could not read."}</Notice>;
  return <ChecklistView material={material} checklist={checklist} />;
}

/** Keyed by the delivery so a refetch behind the form never resets what is being typed. */
export function CreateChecklistPage() {
  const { id } = useParams();
  return id ? <Material key={id} id={id}>{(material) => <Create material={material} />}</Material> : null;
}
export function ViewChecklistPage() {
  const { id } = useParams();
  return id ? <Material key={id} id={id}>{(material) => <View material={material} />}</Material> : null;
}
