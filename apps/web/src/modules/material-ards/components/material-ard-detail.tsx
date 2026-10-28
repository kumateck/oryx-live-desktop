import { useMemo, useState } from "react";
import { BadgeCheck, Pencil } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { ArdDetail } from "@/shared/ard-records/ard-detail";
import { ardAudit, ardRecordSchema } from "@/shared/ard-records/ard-record";
import { MaterialSummary } from "@/shared/ard-view/templates/sumary/material";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { KeyFact } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useApproveSpecification, VerifiableRecord } from "@/shared/specifications/use-approve-specification";
import { materialArdChanged, materialArdsApi } from "../api/material-ards-api";
import { ardPermissions, listOf } from "../lib/material-ards";
import { MaterialArdDialog } from "./material-ard-dialog";

export function MaterialArdDetailPage() {
  const { id } = useParams();
  const { kind } = useKindTabs(ardPermissions.view);
  const query = materialArdsApi.useGetApiV1MaterialArdByIdQuery(id ? { ...ardAudit, id } : skipToken);
  const record = useMemo(() => { const parsed = query.data ? ardRecordSchema.safeParse(query.data) : null; return parsed?.success ? parsed.data : null; }, [query.data]);
  const [open, setOpen] = useState<"edit" | "approve" | null>(null);
  const approval = useApproveSpecification(VerifiableRecord.MaterialArd, materialArdChanged, ardAudit);
  if (query.isLoading) return <DetailPageSkeleton label="Loading analytical raw data" />;
  if (!record || kind === null) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Record unavailable</h1>
    <p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a record the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={listOf(kind ?? 0)}>Material analytical raw data</Link></Button></div></div>;
  const title = `${kind === 1 ? "Packaging" : "Raw"} material analytical raw data`;
  return <>
    <ArdDetail record={record} title={`${record.item?.name ?? "Material"} analytical raw data`} crumbs={[{ label: "Material analytical raw data", to: listOf(kind) }, { label: record.item?.name ?? "Record" }]}
      facts={<KeyFact label="Material" value={record.item?.name ?? "–"} note={record.item?.code ?? undefined} />}
      summary={<MaterialSummary title={title} fallback={{ materialName: record.item?.name, materialCode: record.item?.code ?? undefined, specNumber: record.specNumber ?? undefined, stpNumber: record.stp?.number ?? undefined }} />}
      actions={<>
        {!record.isVerified ? <PermissionGuard require={ardPermissions.verify[kind]}><Button variant="outline" onClick={() => setOpen("approve")}><BadgeCheck />Approve</Button></PermissionGuard> : null}
        <PermissionGuard require={ardPermissions.edit[kind]}><Button variant="outline" onClick={() => setOpen("edit")}><Pencil />Edit</Button></PermissionGuard>
      </>} />
    {open === "edit" ? <MaterialArdDialog kind={kind} editing={record} onClose={() => setOpen(null)} /> : null}
    {open === "approve" ? <ConfirmActionDialog require={ardPermissions.verify[kind]} destructive={false} title="Approve this analytical raw data?" description="Approving marks the worksheet as checked for use in testing."
      confirmLabel="Approve" busyLabel="Approving…" onClose={() => setOpen(null)}
      onConfirm={async () => { const error = await approval.approve(record.id); if (!error) { setOpen(null); toast.success("Approved"); } return error; }} /> : null}
  </>;
}
