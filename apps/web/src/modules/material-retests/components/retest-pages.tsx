import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { qcApi } from "@/shared/api/generated/qc";
import { Badge } from "@/components/ui/badge";
import { DropdownButton } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { RecordState } from "@/shared/workflows/record-state";
import { usePageSearch } from "@/shared/search/page-search";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { materialTestPermissions as test } from "@/modules/qc-grn/public";
import { RetestStatus as S, retestSchema, retestAudit as audit, retestPath, retestStatuses, retestTestPath, retestPermissions as p, type MaterialRetest } from "../schemas/retest";
import { RetestActionDialog, type RetestAction } from "./retest-action";

const root = "/qc/material-retests";
/**
 * The stages a retest passes through, as on the analytical test request list: QA takes the sample, then QC
 * acknowledges, assigns, tests and checks. Each tab shows to the people who act on it.
 */
const tabs = [
  { value: "sample", label: "Awaiting sample", statuses: [S.AwaitingSample], require: p.sample },
  { value: "acknowledge", label: "Sampled", statuses: [S.Sampled], require: p.acknowledge },
  { value: "assign", label: "To assign", statuses: [S.Acknowledged], require: { kind: "some" as const, permissions: [test.test[0], test.test[1]] } },
  { value: "testing", label: "Testing", statuses: [S.Assigned, S.Testing], require: { kind: "some" as const, permissions: [test.test[0], test.test[1]] } },
  { value: "check", label: "Results taken", statuses: [S.TestTaken], require: { kind: "some" as const, permissions: [test.check[0], test.check[1]] } },
  { value: "approval", label: "Awaiting approval", statuses: [S.PendingApproval, S.Checked], require: p.view },
  { value: "closed", label: "Released or rejected", statuses: [S.Released, S.Rejected], require: p.view },
] as const;

const column = dataTableColumns<MaterialRetest>();
const columns = column.columns([
  column.accessor((row) => row.materialName ?? "", { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0">
    <div className="break-words font-medium">{row.original.materialName ?? "Material"}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? ""}</div></div> }),
  column.accessor((row) => row.batchNumber ?? row.materialBatchId, { id: "batch", header: "Batch" }),
  column.accessor((row) => row.arNumber ?? "", { id: "ar", header: "AR number", cell: ({ row }) => row.original.arNumber ?? "–" }),
  column.accessor("status", { header: "Stage", cell: ({ row }) => retestStatuses[row.original.status] }),
  column.accessor((row) => row.originalExpiryDate ?? "", { id: "expiry", header: "Expired", cell: ({ row }) => formatDate(row.original.originalExpiryDate) ?? "–" }),
  column.accessor((row) => row.reason ?? "", { id: "reason", header: "Reason" }),
]);

export function MaterialRetestListPage() {
  const navigate = useNavigate();
  const access = useAccess();
  const [params, setParams] = useSearchParams();
  const batchId = params.get("batchId");
  const shown = tabs.filter((tab) => access.allows(tab.require));
  const active = shown.find((tab) => tab.value === params.get("tab")) ?? shown[0] ?? null;
  const query = qcApi.useGetApiV1QcMaterialRetestsQuery({ ...audit, ...(batchId ? { batchId } : {}) });
  const parsed = useMemo(() => retestSchema.array().safeParse(query.data ?? []), [query.data]);
  const search = usePageSearch("material retests").toLowerCase();
  const rows = parsed.success ? parsed.data.filter((row) => (!active || (active.statuses as readonly number[]).includes(row.status))
    && `${row.materialName} ${row.materialCode} ${row.batchNumber} ${row.arNumber} ${row.reason}`.toLowerCase().includes(search)) : [];
  return <section className="page-fill"><PageHeader title="Material retests" crumbs={[]} />
    <div role="tablist" aria-label="Retest stages" className="flex flex-wrap gap-1 border-b">
      {shown.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={tab === active}
        className={`-mb-px border-b-2 px-3 py-1.5 text-sm ${tab === active ? "border-primary font-medium" : "border-transparent text-muted-foreground"}`}
        onClick={() => setParams((next) => { next.set("tab", tab.value); return next; })}>{tab.label}</button>)}
    </div>
    <ClientDataTable label="Material retests" columns={columns} rows={rows} getRowId={(row) => row.id}
      loading={query.isLoading} refreshing={query.isFetching} error={query.error ? apiErrorMessage(query.error) : query.data && !parsed.success ? "The retest register could not be read." : null}
      onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(retestPath(row.id))} emptyTitle={active ? `No retests ${active.label.toLowerCase()}` : "No material retests"} />
  </section>;
}

/** The next steps for a retest at its stage, each for the people who may take it, as on an analytical test request. */
function nextSteps(record: MaterialRetest, id: string, open: (action: RetestAction) => void) {
  const kind = record.materialKind;
  const to = (step: Parameters<typeof retestTestPath>[1]) => retestTestPath(id, step);
  switch (record.status) {
    case S.PendingApproval: return [{ id: "approve", label: "Sign approval", require: p.approve, onSelect: () => open("approve") },
      { id: "reject", label: "Sign rejection", require: p.reject, onSelect: () => open("reject") }];
    case S.AwaitingSample: return [{ id: "sample", label: "Take sample", require: p.sample, onSelect: () => open("sample") }];
    case S.Sampled: return [{ id: "acknowledge", label: "Acknowledge sample", require: p.acknowledge, onSelect: () => open("acknowledge") }];
    case S.Acknowledged: return [{ id: "assign", label: "Assign analysts", require: test.test[kind], to: to("assign") }];
    case S.Assigned: case S.Testing: return [{ id: "test", label: "Enter results", require: test.test[kind], to: to("test") },
      { id: "reassign", label: "Reassign analysts", require: test.reassign[kind], to: to("reassign") },
      { id: "progress", label: "Test progress", require: { kind: "some" as const, permissions: [test.test[kind], test.check[kind]] }, to: to("progress") }];
    case S.TestTaken: return [{ id: "check", label: "Check results", require: test.check[kind], to: to("results") },
      { id: "progress", label: "Test progress", require: { kind: "some" as const, permissions: [test.test[kind], test.check[kind]] }, to: to("progress") }];
    case S.Checked: case S.Released: case S.Rejected: return [{ id: "results", label: "View results", require: test.check[kind], to: to("results") }];
    default: return [];
  }
}

export function MaterialRetestDetailPage() {
  const { id = "" } = useParams();
  const query = qcApi.useGetApiV1QcMaterialRetestsByIdQuery({ ...audit, id });
  const parsed = retestSchema.safeParse(query.data);
  const [action, setAction] = useState<RetestAction | null>(null);
  return <article className="min-w-0 space-y-4"><PageHeader title="Material retest" crumbs={[{ label: "Material retests", to: root }, { label: "Retest" }]} />
    <RecordState loading={query.isLoading} data={parsed.success ? parsed.data : null} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(record) => <>
      <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="outline">{retestStatuses[record.status]}</Badge>
        <DropdownButton label="Next step" items={nextSteps(record, id, setAction)} />
      </div>
      {record.status === S.Checked ? <p role="status" className="text-sm text-muted-foreground">The certificate is waiting for approval. Its approval extends the expiry and returns the batch to stock.</p> : null}
      <DetailGroup title="Batch and request"><DetailItem label="Material" value={record.materialName} /><DetailItem label="Batch" value={record.batchNumber ?? record.materialBatchId} />
        <DetailItem label="Material kind" value={record.materialKind === 0 ? "Raw" : "Packaging"} /><DetailItem label="Origin" value={record.origin === 0 ? "Scheduled" : "Manual"} />
        <DetailItem label="Reason" value={record.reason} /><DetailItem label="Scheduled for" value={formatDate(record.scheduledFor)} /></DetailGroup>
      <DetailGroup title="Sample and expiry"><DetailItem label="AR number" value={record.arNumber} /><DetailItem label="Original expiry" value={formatDate(record.originalExpiryDate)} />
        <DetailItem label="Proposed expiry" value={formatDate(record.proposedExpiryDate)} /><DetailItem label="Sample quantity (base unit)" value={record.sampleQuantity == null ? null : formatQuantityNumber(record.sampleQuantity, "entered")} />
        <DetailItem label="Containers" value={record.sampledContainers} /><DetailItem label="Sample taken" value={formatDateTime(record.sampleTakenAt)} />
        <DetailItem label="Acknowledged" value={formatDateTime(record.acknowledgedAt)} /><DetailItem label="Released" value={formatDateTime(record.completedAt)} /></DetailGroup>
      <section className="space-y-2"><h2 className="font-semibold">History</h2><ol className="divide-y">{record.events.map((entry, index) => <li key={`${entry.occurredAt}:${index}`} className="space-y-1 py-2 text-sm"><p>{entry.action} · {formatDateTime(entry.occurredAt)}</p><p className="break-words text-muted-foreground">{entry.detail}</p></li>)}</ol></section>
      {action ? <RetestActionDialog record={record} action={action} onClose={() => setAction(null)} onDone={() => { setAction(null); void query.refetch(); }} /> : null}
    </>}</RecordState>
  </article>;
}
