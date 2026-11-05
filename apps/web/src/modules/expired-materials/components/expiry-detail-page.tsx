import { MigrationRetestDialog, migrationRetestPermission } from "./migration-retest-dialog";
import { useState } from "react";
import { useLocation, useParams } from "react-router";
import { expiryApi as materialsApi } from "../api/expiry-api";
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
  const [correction, setCorrection] = useState<"retest" | "ar-number" | null>(null);
  return <article className="min-w-0 space-y-4"><PageHeader title="Material batch expiry" crumbs={[{ label, to: root }, { label: "Batch" }]} />
    <RecordState loading={query.isLoading} data={query.data} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(record) => <>
      <DetailGroup title="Batch"><DetailItem label="Material" value={record.material?.name} /><DetailItem label="Batch" value={record.batchNumber} /><DetailItem label="AR number" value={record.arNumber} /><DetailItem label="Manufactured" value={formatDate(record.manufacturingDate)} /><DetailItem label="Expiry" value={formatDate(record.expiryDate)} /><DetailItem label="Retest date" value={formatDate(record.retestDate)} /><DetailItem label="Valid until" value={formatDate(record.effectiveExpiryDate)} /><DetailItem label="Quantity" value={toLargestUnit(record.totalQuantity, record.uoM?.symbol)?.text} /></DetailGroup>
      <div className="flex flex-wrap gap-2">{record.isOpeningBalanceBatch && record.status === 3 ? <PermissionGuard require={migrationRetestPermission}>
        <Button variant="outline" onClick={() => setCorrection("retest")}>Update migration retest date</Button>
        <Button variant="outline" onClick={() => setCorrection("ar-number")}>Update migration AR number</Button>
      </PermissionGuard> : null}{!record.retestDate && (record.status === 3 || record.status === 4 || record.status === 8) ? <PermissionGuard require={retestPermissions.request}><Button onClick={() => setRequest(true)}>Request governed retest</Button></PermissionGuard> : null}
        <PermissionGuard require={retestPermissions.view}><Button asChild variant="outline"><Link to={`/qc/material-retests?batchId=${encodeURIComponent(id)}`}>View batch retests</Link></Button></PermissionGuard></div>
      {record.retestDate ? <p className="text-muted-foreground">Expiry applies while active. After expiry, an active retest date extends raw-material usability. Quality and stock restrictions still apply.</p> : null}
      {correction ? <MigrationRetestDialog record={record} mode={correction} onClose={() => setCorrection(null)} onDone={() => { setCorrection(null); void query.refetch(); }} /> : null}
      {request ? <RequestMaterialRetestDialog batchId={id} onClose={() => { setRequest(false); void query.refetch(); }} /> : null}
    </>}</RecordState>
  </article>;
}
