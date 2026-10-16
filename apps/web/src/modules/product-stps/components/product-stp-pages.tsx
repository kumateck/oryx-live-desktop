import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { stpDocumentSchema, StpOwner } from "@/shared/stp/stp-document";
import { stpAudit, stpDocumentApi } from "@/shared/stp/stp-document-api";
import { stpSchema } from "@/shared/stp/stp-schema";
import { StpDetail, StpDocumentPage } from "@/shared/stp/stp-views";
import { productStpsApi } from "../api/product-stps-api";
import { detailPath, documentPath, listPath, stpPermissions } from "../lib/product-stps";
import { ProductStpDialog } from "./product-stp-dialog";

function useProductStp() {
  const { id } = useParams();
  const query = productStpsApi.useGetApiV1ProductStpsByIdQuery(id ? { ...stpAudit, id } : skipToken);
  const documentQuery = stpDocumentApi.useGetApiV1StpDocumentsByOwnerTypeAndOwnerIdQuery(id ? { ...stpAudit, ownerType: StpOwner.Product, ownerId: id } : skipToken);
  const stp = useMemo(() => { const parsed = query.data ? stpSchema.safeParse(query.data) : null; return parsed?.success ? parsed.data : null; }, [query.data]);
  const document = useMemo(() => documentQuery.isSuccess ? stpDocumentSchema.safeParse(documentQuery.data ?? null) : null, [documentQuery.isSuccess, documentQuery.data]);
  const error = query.error ? apiErrorMessage(query.error) : documentQuery.error ? apiErrorMessage(documentQuery.error)
    : (query.data && !stp) || (document && !document.success) ? "The server returned an STP the app could not read." : null;
  return { stp, document: document?.success ? document.data : null, loading: query.isLoading || documentQuery.isLoading, error,
    retry: () => { void query.refetch(); void documentQuery.refetch(); } };
}

function Unavailable({ message, retry, back }: { message: string; retry: () => void; back: string }) {
  return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">STP unavailable</h1><p className="text-sm text-muted-foreground">{message}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={retry}>Retry</Button><Button asChild size="sm"><Link to={back}>Product STPs</Link></Button></div></div>;
}

export function ProductStpDetailPage() {
  const { stp, document, loading, error, retry } = useProductStp();
  const [editing, setEditing] = useState(false);
  if (loading) return <DetailPageSkeleton label="Loading STP" />;
  if (!stp || error) return <Unavailable message={error ?? "The STP could not be found."} retry={retry} back={listPath} />;
  return <>
    <StpDetail stp={stp} document={document} itemLabel="Product" documentPath={documentPath(stp.id)} crumbs={[{ label: "Product STPs", to: listPath }, { label: stp.number }]}
      actions={<PermissionGuard require={stpPermissions.edit}><Button variant="outline" onClick={() => setEditing(true)}><Pencil />Edit STP</Button></PermissionGuard>} />
    {editing ? <ProductStpDialog editing={stp} onClose={() => setEditing(false)} /> : null}
  </>;
}

export function ProductStpDocumentPage() {
  const { stp, document, loading, error, retry } = useProductStp();
  if (loading) return <DetailPageSkeleton label="Loading STP document" />;
  if (!stp || error) return <Unavailable message={error ?? "The STP could not be found."} retry={retry} back={listPath} />;
  return <StpDocumentPage stp={stp} document={document} ownerType={StpOwner.Product} require={stpPermissions.edit} detailPath={detailPath(stp.id)}
    crumbs={[{ label: "Product STPs", to: listPath }, { label: stp.number, to: detailPath(stp.id) }, { label: "Document" }]} />;
}
