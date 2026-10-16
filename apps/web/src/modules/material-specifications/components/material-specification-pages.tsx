import { useMemo, useState } from "react";
import { BadgeCheck, ClipboardCheck, Pencil } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { KeyFact } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton, FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { specificationValuesApi, specificationValuesTag } from "@/shared/specifications/specification-api";
import { specificationSchema, type Specification } from "@/shared/specifications/specification-schema";
import { SpecificationCompletion } from "@/shared/specifications/specification-completion";
import { SpecificationDetail, SpecificationUnavailable } from "@/shared/specifications/specification-views";
import { useApproveSpecification, VerifiableSpecification } from "@/shared/specifications/use-approve-specification";
import { useSpecificationTests } from "@/shared/specifications/use-specification-tests";
import { useDispatch } from "react-redux";
import { materialSpecificationsApi, specificationApproved } from "../api/material-specifications-api";
import { asKind, audit, completePath, completePermission, detailPath, editPath, listOf, specPermissions } from "../lib/material-specifications";

/** The specification in the address with its tests, or what to show while it loads or when it cannot be read. */
function useSpecification() {
  const { id } = useParams();
  const query = materialSpecificationsApi.useGetApiV1MaterialSpecificationsByIdQuery(id ? { ...audit, id } : skipToken);
  const parsed = useMemo(() => query.data ? specificationSchema.safeParse(query.data) : null, [query.data]);
  const specification = parsed?.success ? parsed.data : null;
  const tests = useSpecificationTests(specification, "materialSpecificationNumber");
  const kind = asKind(specification?.item?.kind) ?? 0;
  const unavailable = !specification ? <SpecificationUnavailable message={query.error ? apiErrorMessage(query.error) : "The server returned a specification the app could not read."}
    onRetry={() => void query.refetch()} back={{ label: "Material specifications", to: listOf(0) }} />
    : tests.error ? <SpecificationUnavailable message={tests.error} onRetry={tests.retry} back={{ label: "Material specifications", to: listOf(kind) }} /> : null;
  return { specification, tests, kind, loading: query.isLoading || tests.loading, unavailable };
}
const itemName = (specification: Specification) => specification.item ? `${specification.item.name}${specification.item.code ? ` (${specification.item.code})` : ""}` : null;

export function MaterialSpecificationDetailPage() {
  const { specification, tests, kind, loading, unavailable } = useSpecification();
  const [approving, setApproving] = useState(false);
  const approval = useApproveSpecification(VerifiableSpecification.Material, specificationApproved, audit);
  if (loading) return <DetailPageSkeleton label="Loading specification" />;
  if (!specification || unavailable) return unavailable;
  return <>
    <SpecificationDetail specification={specification} sections={tests.sections} item={specification.item?.name ?? null}
      crumbs={[{ label: "Material specifications", to: listOf(kind) }, { label: specification.number }]}
      facts={<><KeyFact label="Material" value={specification.item?.name ?? "–"} note={specification.item?.code ?? undefined} />
        <KeyFact label="Pharmacopoeia" value={specification.item?.pharmacopoeia ?? "–"} /></>}
      actions={<>
        {!specification.isVerified ? <PermissionGuard require={specPermissions.verify[kind]}><Button variant="outline" onClick={() => setApproving(true)}><BadgeCheck />Approve</Button></PermissionGuard> : null}
        <PermissionGuard require={completePermission(kind)}><Button asChild variant="outline"><Link to={completePath(specification.id)}><ClipboardCheck />Set test references</Link></Button></PermissionGuard>
        <PermissionGuard require={specPermissions.edit[kind]}><Button asChild><Link to={editPath(specification.id)}><Pencil />Edit</Link></Button></PermissionGuard>
      </>} />
    {approving ? <ConfirmActionDialog require={specPermissions.verify[kind]} destructive={false} title={`Approve ${specification.number}?`}
      description="Approving marks the specification as checked. Analysts test against it from then on." confirmLabel="Approve" busyLabel="Approving…" onClose={() => setApproving(false)}
      onConfirm={async () => { const error = await approval.approve(specification.id); if (!error) { setApproving(false); toast.success("Specification approved"); } return error; }} /> : null}
  </>;
}

export function CompleteMaterialSpecificationPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { specification, tests, kind, loading, unavailable } = useSpecification();
  const [save] = specificationValuesApi.usePostApiV1FormResponsesSectionMutation();
  if (loading) return <FormPageSkeleton label="Loading specification" />;
  if (!specification || unavailable) return unavailable;
  if (tests.noTemplate) return <SpecificationUnavailable message="This specification has no template, so it has no tests. Edit it and choose a template." onRetry={tests.retry} back={{ label: specification.number, to: detailPath(specification.id) }} />;
  return <SpecificationCompletion key={specification.id} specification={specification} sections={tests.sections} item={itemName(specification)} require={completePermission(kind)} cancelTo={detailPath(specification.id)}
    crumbs={[{ label: "Material specifications", to: listOf(kind) }, { label: specification.number, to: detailPath(specification.id) }, { label: "Test references" }]}
    onSubmit={async (body) => {
      const result = await save({ ...audit, materialSpecificationId: specification.id, body });
      if ("error" in result) return apiErrorMessage(result.error);
      if (specification.specificationNumber) dispatch(specificationValuesApi.util.invalidateTags([specificationValuesTag(specification.specificationNumber)]));
      toast.success("Test references saved");
      void navigate(detailPath(specification.id));
      return null;
    }} />;
}
