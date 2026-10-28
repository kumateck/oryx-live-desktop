import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { qcApi } from "@/shared/api/generated/qc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionDialog } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useAccess } from "@/shared/auth/use-access";
import { RecordState } from "@/shared/workflows/record-state";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { usePageSearch } from "@/shared/search/page-search";
import { reworkAudit as audit, reworkDetailSchema, reworkTaskSchema, reworkPath, reworkStatuses, type ReworkDetail } from "../schemas/rework";
import { ReworkResponsePreview } from "./response-preview";
const column = dataTableColumns<ReworkDetail["task"]>();
const columns = column.columns([
  column.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch" }),
  column.accessor("reason", { header: "QA reason" }),
  column.accessor("status", { header: "State", cell: ({ row }) => reworkStatuses[row.original.status] }),
  column.accessor("requestedAt", { header: "Requested", cell: ({ row }) => formatDateTime(row.original.requestedAt) ?? "–" }),
]);
export function ReworkListPage() {
  const navigate = useNavigate();
  const query = qcApi.useGetApiV1QcReworkTasksQuery(audit);
  const search = usePageSearch("QC rework");
  const parsed = useMemo(() => reworkTaskSchema.array().safeParse(query.data), [query.data]);
  const rows = parsed.success ? parsed.data.filter((row) => `${row.batchNumber} ${row.reason} ${reworkStatuses[row.status]}`.toLowerCase().includes(search.toLowerCase())) : [];
  return <section className="page-fill"><PageHeader title="QC rework" crumbs={[]} />
    <ClientDataTable label="QC rework" columns={columns} rows={rows} getRowId={(row) => row.id} loading={query.isLoading} refreshing={query.isFetching}
      error={query.error ? apiErrorMessage(query.error) : query.data && !parsed.success ? "Rework tasks could not be read." : null} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(reworkPath(row.id))} emptyTitle="No rework tasks" />
  </section>;
}
function StartRework({ record, onClose, onDone }: { record: ReworkDetail; onClose: () => void; onDone: () => void }) {
  const command = useVerifiedMutation<ReworkDetail>("CanStartResponseReworkTask", record);
  const [read] = qcApi.useLazyGetApiV1QcReworkTasksByIdQuery();
  const [start] = qcApi.usePostApiV1QcReworkTasksByIdStartMutation();
  return <ConfirmActionDialog title="Start a new test cycle?" description="A separate response is created. Rejected values and earlier cycles remain unchanged and readable." confirmLabel="Start new test cycle" busyLabel="Starting…"
    destructive={false} require="CanStartResponseReworkTask" onClose={onClose} onConfirm={async () => {
      const error = await command.run(record, async () => reworkDetailSchema.parse(await read({ ...audit, id: record.task.id }, false).unwrap()), async (fresh) => {
        if (fresh.task.status !== 0 || fresh.task.newResponseId) throw new Error("This rework task has already started.");
        const result = await start({ ...audit, id: fresh.task.id });
        if ("error" in result) throw new Error(apiErrorMessage(result.error));
      });
      if (!error) onDone();
      return error;
    }} />;
}
export function ReworkDetailPage() {
  const { id = "" } = useParams();
  const query = qcApi.useGetApiV1QcReworkTasksByIdQuery({ ...audit, id });
  const parsed = reworkDetailSchema.safeParse(query.data);
  const [confirm, setConfirm] = useState(false);
  const { has } = useAccess();
  return <article className="min-w-0 space-y-4"><PageHeader title="QC rework" crumbs={[{ label: "QC rework", to: "/qc/rework-tasks" }, { label: "Task" }]} />
    <RecordState loading={query.isLoading} error={query.error ? apiErrorMessage(query.error) : null} data={parsed.success ? parsed.data : null} retry={() => void query.refetch()}>{(record) => <>
      <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="outline">{reworkStatuses[record.task.status]}</Badge>
        {record.task.status === 0 && has("CanStartResponseReworkTask") ? <Button size="sm" onClick={() => setConfirm(true)}>Start new test cycle</Button> : null}
        {record.task.newResponseId ? <Button asChild variant="outline"><Link to={`${reworkPath(id)}/test`}>{record.task.status === 1 ? "Enter new test results" : "Review new test"}</Link></Button> : null}
      </div>
      <DetailGroup title="QA decision"><DetailItem label="Batch" value={record.task.batchNumber} /><DetailItem label="Reason" value={record.task.reason} /><DetailItem label="Requested" value={formatDateTime(record.task.requestedAt)} /><DetailItem label="Rejected response" value={record.task.sourceResponseId} /><DetailItem label="Root response" value={record.task.rootResponseId} /><DetailItem label="New response" value={record.task.newResponseId} /></DetailGroup>
      <section className="space-y-2"><h2 className="font-semibold">Rework history</h2><ol className="divide-y">{record.history.map((item, index) => <li key={item.id} className="py-2"><Link className="text-primary underline" to={reworkPath(item.id)}>Cycle {index + 1}</Link> · {reworkStatuses[item.status]}<p className="break-words text-muted-foreground">{item.reason}</p></li>)}</ol></section>
      <ReworkResponsePreview id={record.task.sourceResponseId} title="Rejected test values" />
      {record.task.newResponseId ? <ReworkResponsePreview id={record.task.newResponseId} title="New test values" /> : null}
      {confirm ? <StartRework record={record} onClose={() => setConfirm(false)} onDone={() => { setConfirm(false); void query.refetch(); }} /> : null}
    </>}</RecordState>
  </article>;
}
