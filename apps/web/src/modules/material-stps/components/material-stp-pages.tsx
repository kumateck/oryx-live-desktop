import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { stpDocumentSchema, StpOwner } from "@/shared/stp/stp-document";
import { stpAudit, stpDocumentApi } from "@/shared/stp/stp-document-api";
import { stpSchema } from "@/shared/stp/stp-schema";
import { StpDetail, StpDocumentPage } from "@/shared/stp/stp-views";
import { materialStpsApi } from "../api/material-stps-api";
import { detailPath, documentPath, listOf, stpPermissions } from "../lib/material-stps";
import { MaterialStpDialog } from "./material-stp-dialog";

function useMaterialStp() {
  const { id } = useParams();
  const { kind } = useKindTabs(stpPermissions.view);
  const query = materialStpsApi.useGetApiV1MaterialStpsByIdQuery(id ? { ...stpAudit, id } : skipToken);
  const documentQuery = stpDocumentApi.useGetApiV1StpDocumentsByOwnerTypeAndOwnerIdQuery(id ? { ...stpAudit, ownerType: StpOwner.Material, ownerId: id } : skipToken);
  const stp = useMemo(() => { const parsed = query.data ? stpSchema.safeParse(query.data) : null; return parsed?.success ? parsed.data : null; }, [query.data]);
  const document = useMemo(() => documentQuery.isSuccess ? stpDocumentSchema.safeParse(documentQuery.data ?? null) : null, [documentQuery.isSuccess, documentQuery.data]);
  const error = query.error ? apiErrorMessage(query.error) : documentQuery.error ? apiErrorMessage(documentQuery.error)
    : (query.data && !stp) || (document && !document.success) ? "The server returned an STP the app could not read." : null;
  return { stp, document: document?.success ? document.data : null, kind, loading: query.isLoading || documentQuery.isLoading, error,
    retry: () => { void query.refetch(); void documentQuery.refetch(); } };
}

function Unavailable({ message, retry, back }: { message: string; retry: () => void; back: string }) {
  return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">STP unavailable</h1><p className="text-sm text-muted-foreground">{message}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={retry}>Retry</Button><Button asChild size="sm"><Link to={back}>Material STPs</Link></Button></div></div>;
}

export function MaterialStpDetailPage() {
  const { stp, document, kind, loading, error, retry } = useMaterialStp();
  const [editing, setEditing] = useState(false);
  if (loading) return <DetailPageSkeleton label="Loading STP" />;
  if (!stp || kind === null || error) return <Unavailable message={error ?? "The STP could not be found."} retry={retry} back={listOf(kind ?? 0)} />;
  return <>
    <StpDetail stp={stp} document={document} itemLabel="Material" documentPath={documentPath(stp.id, kind)} crumbs={[{ label: "Material STPs", to: listOf(kind) }, { label: stp.number }]}
      actions={<PermissionGuard require={stpPermissions.edit[kind]}><Button variant="outline" onClick={() => setEditing(true)}><Pencil />Edit STP</Button></PermissionGuard>} />
    {editing ? <MaterialStpDialog kind={kind} editing={stp} onClose={() => setEditing(false)} /> : null}
  </>;
}

export function MaterialStpDocumentPage() {
  const { stp, document, kind, loading, error, retry } = useMaterialStp();
  if (loading) return <DetailPageSkeleton label="Loading STP document" />;
  if (!stp || kind === null || error) return <Unavailable message={error ?? "The STP could not be found."} retry={retry} back={listOf(kind ?? 0)} />;
  return <StpDocumentPage stp={stp} document={document} ownerType={StpOwner.Material} require={stpPermissions.edit[kind]} detailPath={detailPath(stp.id, kind)}
    crumbs={[{ label: "Material STPs", to: listOf(kind) }, { label: stp.number, to: detailPath(stp.id, kind) }, { label: "Document" }]} />;
}
