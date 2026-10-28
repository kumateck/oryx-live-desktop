import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { DropdownButton } from "@/shared/actions";
import { ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { RecordState } from "@/shared/workflows/record-state";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { investigationAudit as audit, investigationSchema, investigationStatuses, type Investigation } from "../schemas/investigation";
import { InvestigationActionDialog, type InvestigationAction } from "./investigation-action";

const root = "/qa/oos-investigations";
const column = dataTableColumns<Investigation>();
const columns = column.columns([
  column.accessor("coaNumber", { header: "Certificate" }),
  column.accessor("productOrMaterialName", { header: "Product / material" }),
  column.accessor("batchNumber", { header: "Batch" }),
  column.accessor("status", { header: "State", cell: ({ row }) => investigationStatuses[row.original.status] }),
  column.accessor("createdAt", { header: "Started", cell: ({ row }) => formatDateTime(row.original.createdAt) ?? "–" }),
]);
export function InvestigationListPage() {
  const navigate = useNavigate();
  const search = usePageSearch("OOS investigations");
  const [status, setStatus] = useState<0 | 1 | 2 | 3 | undefined>();
  const table = useServerTable({ resetKey: `${search}|${status}` });
  const query = analyticalApi.useGetApiV1QaOosInvestigationsQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(status === undefined ? {} : { status }) });
  const parsed = useMemo(() => investigationSchema.array().safeParse(query.data?.data ?? []), [query.data]);
  const rows = parsed.success ? parsed.data : [];
  const meta = pageMeta(query.data, table, rows.length);
  return <section className="page-fill"><PageHeader title="OOS investigations" crumbs={[]} />
    <div role="group" aria-label="Investigation status" className="flex flex-wrap gap-1">
      <Button size="sm" variant={status === undefined ? "default" : "outline"} onClick={() => setStatus(undefined)}>All</Button>
      {([0, 1, 2, 3] as const).map((value) => <Button key={value} size="sm" variant={status === value ? "default" : "outline"} onClick={() => setStatus(value)}>{investigationStatuses[value]}</Button>)}
    </div>
    <ServerDataTable label="OOS investigations" columns={columns} rows={rows} getRowId={(row) => row.id}
      page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : !parsed.success ? "The investigation register could not be read." : null}
      onRowOpen={(row) => void navigate(`${root}/${encodeURIComponent(row.id)}`)} emptyTitle="No investigations" />
  </section>;
}
export function InvestigationDetailPage() {
  const { id = "" } = useParams();
  const query = analyticalApi.useGetApiV1QaOosInvestigationsByIdQuery({ ...audit, id });
  const parsed = investigationSchema.safeParse(query.data);
  const user = useCurrentUser();
  const [action, setAction] = useState<InvestigationAction | null>(null);
  const record = parsed.success ? parsed.data : null;
  return <article className="min-w-0 space-y-4"><PageHeader title={record ? `OOS investigation · ${record.coaNumber}` : "OOS investigation"} crumbs={[{ label: "OOS investigations", to: root }, { label: "Investigation" }]} />
    <RecordState loading={query.isLoading} error={query.error ? apiErrorMessage(query.error) : null} data={record} retry={() => void query.refetch()}>{(value) => <>
      <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{investigationStatuses[value.status]}</Badge>
        <DropdownButton label="Investigation actions" items={[
          value.status === 0 && { id: "edit", label: "Edit investigation", require: "CanSubmitOosInvestigation", onSelect: () => setAction("edit") },
          value.status === 0 && { id: "submit", label: "Submit to QA", require: "CanSubmitOosInvestigation", onSelect: () => setAction("submit") },
          value.status === 1 && { id: "approve", label: "Approve investigation", require: "CanReviewOosInvestigation", disabled: value.createdBy?.id === user?.id || value.submittedBy?.id === user?.id, disabledReason: "The author or submitter cannot review their own investigation.", onSelect: () => setAction("approve") },
          value.status === 1 && { id: "reject", label: "Permanently reject", require: "CanReviewOosInvestigation", destructive: true, disabled: value.createdBy?.id === user?.id || value.submittedBy?.id === user?.id, disabledReason: "The author or submitter cannot review their own investigation.", onSelect: () => setAction("reject") },
        ]} />
      </div>
      <DetailGroup title="Rejected results"><DetailItem label="Product / material" value={value.productOrMaterialName} /><DetailItem label="Batch" value={value.batchNumber} /><DetailItem label="Certificate" value={value.coaNumber} /><DetailItem label="Rejection reason" value={value.rejectionReason} /></DetailGroup>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">{([
        ["Investigation findings", value.investigationDetails], ["Root cause analysis", value.rootCauseAnalysis], ["Corrective actions", value.correctiveActions], ["Preventive actions", value.preventiveActions],
      ] as const).map(([title, content]) => <section key={title} className="min-w-0 space-y-2"><h2 className="font-semibold">{title}</h2><RichTextView html={content || "Not recorded"} /></section>)}</div>
      <DetailGroup title="History"><DetailItem label="Started" value={formatDateTime(value.createdAt)} /><DetailItem label="Started by" value={[value.createdBy?.firstName, value.createdBy?.lastName].filter(Boolean).join(" ")} /><DetailItem label="Submitted to QA" value={formatDateTime(value.submittedToQaAt)} /><DetailItem label="Submitted by" value={[value.submittedBy?.firstName, value.submittedBy?.lastName].filter(Boolean).join(" ")} /><DetailItem label="QA reviewed" value={formatDateTime(value.qaReviewedAt)} /><DetailItem label="QA reviewer" value={[value.qaReviewer?.firstName, value.qaReviewer?.lastName].filter(Boolean).join(" ")} /><DetailItem label="QA decision reason" value={value.qaReviewComments} /></DetailGroup>
      <Button asChild variant="outline"><Link to={root}>Back to investigations</Link></Button>
      {action ? <InvestigationActionDialog record={value} action={action} onClose={() => setAction(null)} onDone={() => { setAction(null); void query.refetch(); }} /> : null}
    </>}</RecordState>
  </article>;
}
