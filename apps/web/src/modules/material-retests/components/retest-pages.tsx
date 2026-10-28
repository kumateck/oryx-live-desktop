import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { qcApi } from "@/shared/api/generated/qc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownButton } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { RecordState } from "@/shared/workflows/record-state";
import { usePageSearch } from "@/shared/search/page-search";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { retestSchema, retestAudit as audit, retestPath, retestStatuses, retestPermissions as p, type MaterialRetest } from "../schemas/retest";
import { RetestActionDialog, type RetestAction } from "./retest-action";
const root = "/qc/material-retests";
const column = dataTableColumns<MaterialRetest>();
const columns = column.columns([
  column.accessor((row) => row.batchNumber ?? row.materialBatchId, { id: "batch", header: "Batch" }),
  column.accessor("origin", { header: "Origin", cell: ({ row }) => row.original.origin === 0 ? "Scheduled" : "Manual" }),
  column.accessor("status", { header: "State", cell: ({ row }) => retestStatuses[row.original.status] }),
  column.accessor((row) => row.reason ?? "", { id: "reason", header: "Reason" }),
  column.accessor((row) => row.originalExpiryDate ?? "", { id: "expiry", header: "Original expiry", cell: ({ row }) => formatDate(row.original.originalExpiryDate) ?? "–" }),
]);
export function MaterialRetestListPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const batchId = params.get("batchId");
  const query = qcApi.useGetApiV1QcMaterialRetestsQuery({ ...audit, ...(batchId ? { batchId } : {}) });
  const parsed = useMemo(() => retestSchema.array().safeParse(query.data), [query.data]);
  const search = usePageSearch("material retests");
  const rows = parsed.success ? parsed.data.filter((row) => `${row.batchNumber} ${row.reason} ${retestStatuses[row.status]}`.toLowerCase().includes(search.toLowerCase())) : [];
  return <section className="page-fill"><PageHeader title="Material retests" crumbs={[]} />
    <ClientDataTable label="Material retests" columns={columns} rows={rows} getRowId={(row) => row.id}
      loading={query.isLoading} refreshing={query.isFetching} error={query.error ? apiErrorMessage(query.error) : query.data && !parsed.success ? "The retest register could not be read." : null}
      onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(retestPath(row.id))} emptyTitle="No material retests" />
  </section>;
}
export function MaterialRetestDetailPage() {
  const { id = "" } = useParams();
  const query = qcApi.useGetApiV1QcMaterialRetestsByIdQuery({ ...audit, id });
  const parsed = retestSchema.safeParse(query.data);
  const [action, setAction] = useState<RetestAction | null>(null);
  return <article className="min-w-0 space-y-4"><PageHeader title="Material retest" crumbs={[{ label: "Material retests", to: root }, { label: "Retest" }]} />
    <RecordState loading={query.isLoading} data={parsed.success ? parsed.data : null} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(record) => <>
      <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="outline">{retestStatuses[record.status]}</Badge>
        <DropdownButton label="Retest actions" items={[
          ...(record.status === 0 ? [{ id: "approve", label: "Sign approval", require: p.approve, onSelect: () => setAction("approve") }, { id: "reject", label: "Sign rejection", require: p.reject, onSelect: () => setAction("reject") }] : []),
          ...(record.status === 1 ? [{ id: "sample", label: "Record sample", require: p.sample, onSelect: () => setAction("sample") }] : []),
          ...(record.status === 2 ? [{ id: "acknowledge", label: "Acknowledge sample", require: p.acknowledge, onSelect: () => setAction("acknowledge") }] : []),
          ...(record.status === 3 ? [{ id: "link", label: "Link QC test request", require: p.link, onSelect: () => setAction("link") }, { id: "create", label: "Create QC test request", require: { kind: "all" as const, permissions: [p.detail, p.link, "CanCreateUnscheduledQcTestRequest", "CanViewQcSpecifications"] }, to: `/qc/material-retests/${encodeURIComponent(id)}/test-request` }] : []),
        ]} />
      </div>
      <DetailGroup title="Batch and request"><DetailItem label="Batch" value={record.batchNumber ?? record.materialBatchId} /><DetailItem label="Material kind" value={record.materialKind === 0 ? "Raw" : "Packaging"} /><DetailItem label="Origin" value={record.origin === 0 ? "Scheduled" : "Manual"} /><DetailItem label="Reason" value={record.reason} /><DetailItem label="Scheduled for" value={formatDate(record.scheduledFor)} /></DetailGroup>
      <DetailGroup title="Sample and expiry"><DetailItem label="Original expiry" value={formatDate(record.originalExpiryDate)} /><DetailItem label="Proposed expiry" value={formatDate(record.proposedExpiryDate)} /><DetailItem label="Sample quantity (base unit)" value={record.sampleQuantity == null ? null : formatQuantityNumber(record.sampleQuantity, "entered")} /><DetailItem label="Containers" value={record.sampledContainers} /><DetailItem label="Sample taken" value={formatDateTime(record.sampleTakenAt)} /><DetailItem label="Acknowledged" value={formatDateTime(record.acknowledgedAt)} /><DetailItem label="Completed" value={formatDateTime(record.completedAt)} /></DetailGroup>
      <div className="flex flex-wrap gap-2">{record.testRequestId ? <PermissionGuard require="CanViewQcTestRequests"><Button asChild variant="outline"><Link to={`/qc/material-retests/${encodeURIComponent(id)}/testing`}>Open linked QC testing</Link></Button></PermissionGuard> : null}
        {record.coaId ? <PermissionGuard require="CanViewQcCertificate"><Button asChild variant="outline"><Link to={`/qc/material-retests/${encodeURIComponent(id)}/certificate`}>Open linked certificate</Link></Button></PermissionGuard> : null}</div>
      <section className="space-y-2"><h2 className="font-semibold">History</h2><ol className="divide-y">{record.events.map((entry, index) => <li key={`${entry.occurredAt}:${index}`} className="space-y-1 py-2 text-sm"><p>{entry.action} · {formatDateTime(entry.occurredAt)}</p><p className="break-words text-muted-foreground">{entry.detail}</p><p className="text-muted-foreground">Actor: {entry.actorId ?? "Scheduled service"}</p></li>)}</ol></section>
      {action ? <RetestActionDialog record={record} action={action} onClose={() => setAction(null)} onDone={() => { setAction(null); void query.refetch(); }} /> : null}
    </>}</RecordState>
  </article>;
}
