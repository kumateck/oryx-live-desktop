import { useState } from "react";
import { useLocation, useParams } from "react-router";
import { materialsApi } from "@/shared/api/generated/materials";
import { RequestMaterialRetestDialog, retestPermissions } from "@/modules/material-retests/public";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { PageHeader } from "@/shared/navigation/page-header";
import { RecordState } from "@/shared/workflows/record-state";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import { Link } from "react-router";
export function ExpiryDetailPage() {
  const { id = "" } = useParams();
  const aboutToExpire = useLocation().pathname.startsWith("/warehouse/about-to-expire-materials");
  const label = aboutToExpire ? "Expiring materials" : "Expired materials";
  const root = aboutToExpire ? "/warehouse/about-to-expire-materials" : "/warehouse/expired-materials";
  const query = materialsApi.useGetApiV1MaterialBatchByBatchIdQuery({ batchId: id, module: "Warehouse", subModule: "Expired Materials" });
  const [request, setRequest] = useState(false);
  return <article className="min-w-0 space-y-4"><PageHeader title="Material batch expiry" crumbs={[{ label, to: root }, { label: "Batch" }]} />
    <RecordState loading={query.isLoading} data={query.data} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(record) => <>
      <DetailGroup title="Batch"><DetailItem label="Material" value={record.material?.name} /><DetailItem label="Batch" value={record.batchNumber} /><DetailItem label="Manufactured" value={formatDate(record.manufacturingDate)} /><DetailItem label="Expiry" value={formatDate(record.expiryDate)} /><DetailItem label="Scheduled retest" value={formatDate(record.retestDate)} /><DetailItem label="Quantity" value={toLargestUnit(record.totalQuantity, record.uoM?.symbol)?.text} /></DetailGroup>
      <div className="flex flex-wrap gap-2">{!record.retestDate && (record.status === 3 || record.status === 4 || record.status === 8) ? <PermissionGuard require={retestPermissions.request}><Button onClick={() => setRequest(true)}>Request governed retest</Button></PermissionGuard> : null}
        <PermissionGuard require={retestPermissions.view}><Button asChild variant="outline"><Link to={`/qc/material-retests?batchId=${encodeURIComponent(id)}`}>View batch retests</Link></Button></PermissionGuard></div>
      {record.retestDate ? <p className="text-muted-foreground">This batch follows its scheduled retest date. The due-date scan creates the governed request.</p> : null}
      {request ? <RequestMaterialRetestDialog batchId={id} onClose={() => { setRequest(false); void query.refetch(); }} /> : null}
    </>}</RecordState>
  </article>;
}
