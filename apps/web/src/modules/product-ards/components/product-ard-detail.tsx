import { useMemo, useState } from "react";
import { BadgeCheck, Pencil } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { ArdDetail } from "@/shared/ard-records/ard-detail";
import { ardAudit, ardRecordSchema } from "@/shared/ard-records/ard-record";
import { ProductSummary } from "@/shared/ard-view/templates/sumary/product";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { KeyFact } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { testStageLabel } from "@/shared/specifications/specification-rules";
import { useApproveSpecification, VerifiableRecord } from "@/shared/specifications/use-approve-specification";
import { productArdChanged, productArdsApi } from "../api/product-ards-api";
import { ardPermissions, listPath } from "../lib/product-ards";
import { ProductArdDialog } from "./product-ard-dialog";

export function ProductArdDetailPage() {
  const { id } = useParams();
  const query = productArdsApi.useGetApiV1ProductArdByIdQuery(id ? { ...ardAudit, id } : skipToken);
  const record = useMemo(() => { const parsed = query.data ? ardRecordSchema.safeParse(query.data) : null; return parsed?.success ? parsed.data : null; }, [query.data]);
  const [open, setOpen] = useState<"edit" | "approve" | null>(null);
  const approval = useApproveSpecification(VerifiableRecord.ProductArd, productArdChanged, ardAudit);
  if (query.isLoading) return <DetailPageSkeleton label="Loading analytical raw data" />;
  if (!record) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Record unavailable</h1>
    <p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a record the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={listPath}>Product analytical raw data</Link></Button></div></div>;
  return <>
    <ArdDetail record={record} title={`${record.item?.name ?? "Product"} · ${testStageLabel(record.stage)} analytical raw data`} crumbs={[{ label: "Product analytical raw data", to: listPath }, { label: record.item?.name ?? "Record" }]}
      facts={<KeyFact label="Product" value={record.item?.name ?? "–"} note={testStageLabel(record.stage)} />}
      summary={<ProductSummary title="Product analytical raw data" fallback={{ productName: record.item?.name, productCode: record.item?.code ?? undefined, stageLabel: testStageLabel(record.stage) }} />}
      actions={<>
        {!record.isVerified ? <PermissionGuard require={ardPermissions.verify}><Button variant="outline" onClick={() => setOpen("approve")}><BadgeCheck />Approve</Button></PermissionGuard> : null}
        <PermissionGuard require={ardPermissions.edit}><Button variant="outline" onClick={() => setOpen("edit")}><Pencil />Edit</Button></PermissionGuard>
      </>} />
    {open === "edit" ? <ProductArdDialog editing={record} onClose={() => setOpen(null)} /> : null}
    {open === "approve" ? <ConfirmActionDialog require={ardPermissions.verify} destructive={false} title="Approve this analytical raw data?" description="Approving marks the worksheet as checked for use in testing."
      confirmLabel="Approve" busyLabel="Approving…" onClose={() => setOpen(null)}
      onConfirm={async () => { const error = await approval.approve(record.id); if (!error) { setOpen(null); toast.success("Approved"); } return error; }} /> : null}
  </>;
}
