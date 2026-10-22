import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Ban, Check, ClipboardList, Eye, Pencil, Play, Plus, Send, Trash2, UserCheck, UserCog } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmActionDialog, TableMenu, TableMenuHeader, type ActionItem } from "@/shared/actions";
import { servicesApi } from "@/shared/api/generated/services";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { Handling, JobStatus, handlingLabel, jobActions, jobAudit, jobKeys, jobOrderRoot, jobRequestPageSchema, jobRequestRoot, jobRequestSchema, jobStatusLabel, type JobRequest } from "../lib/job-requests";
import { AssignDialog, CompleteDialog, JobOrderDialog, JobRequestEditor, ReassignDialog, useFreshJob } from "./job-dialogs";

type Dialog = { kind: "edit" | "assign" | "reassign" | "complete" | "order" | "delete"; job: JobRequest } | { kind: "status"; job: JobRequest; target: 1 | 3 | 9 } | null;
const statusCopy = {
  1: { title: "Acknowledge", description: "The request is accepted and will be assigned or sent out.", key: jobKeys.acknowledge, done: "Job request acknowledged" },
  3: { title: "Start", description: "You are starting the assigned work now.", key: jobKeys.start, done: "Job started" },
  9: { title: "Cancel", description: "The request is withdrawn before work begins.", key: jobKeys.edit, done: "Job request cancelled" },
} as const;
export const statusVariant = (s: number) => s === JobStatus.Cancelled ? "destructive" as const : s === JobStatus.Completed || s === JobStatus.Approved ? "default" as const : "outline" as const;

/** The actions a user may take on a job request right now, as menu items. */
function useJobMenu(open: (dialog: Dialog) => void) {
  const navigate = useNavigate();
  return (job: JobRequest, withView: boolean): ActionItem[] => {
    const can = jobActions(job);
    const items: ActionItem[] = [];
    if (withView) items.push({ id: "view", label: "View details", icon: Eye, require: jobKeys.view, onSelect: () => void navigate(`${jobRequestRoot}/${job.id}/details`) });
    if (can.acknowledge) items.push({ id: "ack", label: "Acknowledge", icon: Check, require: jobKeys.acknowledge, onSelect: () => open({ kind: "status", job, target: 1 }) });
    if (can.assign) items.push({ id: "assign", label: "Assign in-house", icon: UserCheck, require: jobKeys.assign, onSelect: () => open({ kind: "assign", job }) });
    if (can.order) items.push({ id: "order", label: "Create job order", icon: Send, require: { kind: "all", permissions: [jobKeys.viewOrders, jobKeys.createOrder] }, onSelect: () => open({ kind: "order", job }) });
    if (can.reassign) items.push({ id: "reassign", label: "Reassign", icon: UserCog, require: jobKeys.assign, onSelect: () => open({ kind: "reassign", job }) });
    if (can.start) items.push({ id: "start", label: "Start work", icon: Play, require: jobKeys.start, onSelect: () => open({ kind: "status", job, target: 3 }) });
    if (can.complete) items.push({ id: "complete", label: "Complete", icon: ClipboardList, require: jobKeys.complete, onSelect: () => open({ kind: "complete", job }) });
    if (can.edit) items.push({ id: "edit", label: "Edit", icon: Pencil, require: jobKeys.edit, onSelect: () => open({ kind: "edit", job }) });
    if (can.cancel) items.push({ id: "cancel", label: "Cancel request", icon: Ban, require: jobKeys.edit, separated: true, onSelect: () => open({ kind: "status", job, target: 9 }) });
    if (can.remove) items.push({ id: "delete", label: "Delete", icon: Trash2, destructive: true, require: jobKeys.remove, onSelect: () => open({ kind: "delete", job }) });
    return items;
  };
}

function JobDialogs({ dialog, close, onChanged }: { dialog: Dialog; close: () => void; onChanged: () => void }) {
  const navigate = useNavigate();
  const fresh = useFreshJob();
  const [setStatus] = servicesApi.usePutApiV1JobRequestsStatusByIdMutation();
  const [remove] = servicesApi.useDeleteApiV1JobRequestsByIdMutation();
  if (!dialog) return null;
  const done = () => { close(); onChanged(); };
  switch (dialog.kind) {
    case "edit": return <JobRequestEditor job={dialog.job} onClose={close} onSaved={done} />;
    case "assign": return <AssignDialog job={dialog.job} onClose={done} />;
    case "reassign": return <ReassignDialog job={dialog.job} onClose={done} />;
    case "complete": return <CompleteDialog job={dialog.job} onClose={done} />;
    case "order": return <JobOrderDialog job={dialog.job} onClose={close} onCreated={(id) => { close(); onChanged(); if (id) void navigate(`${jobOrderRoot}/${id}/details`); }} />;
    case "delete": return <ConfirmActionDialog require={jobKeys.remove} title={`Delete ${dialog.job.code}?`} description="The request is removed. Work that has begun cannot be deleted."
      confirmLabel="Delete job request" busyLabel="Deleting…" onClose={close} onConfirm={async () => {
        const stale = await fresh(dialog.job); if (stale) return stale;
        const result = await remove({ ...jobAudit, id: dialog.job.id }); if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Job request deleted"); onChanged(); void navigate(jobRequestRoot); return null; }} />;
    case "status": { const copy = statusCopy[dialog.target];
      return <ConfirmActionDialog require={{ kind: "all", permissions: [jobKeys.view, copy.key] }} destructive={dialog.target === 9} title={`${copy.title} ${dialog.job.code}?`} description={copy.description}
        confirmLabel={copy.title} busyLabel="Saving…" onClose={close} onConfirm={async () => {
          const stale = await fresh(dialog.job); if (stale) return stale;
          const result = await setStatus({ ...jobAudit, id: dialog.job.id, domainEntitiesJobRequestsUpdateJobRequestStatusRequest: { status: dialog.target } });
          if ("error" in result) return apiErrorMessage(result.error);
          toast.success(copy.done); onChanged(); return null; }} />; }
  }
}

const column = dataTableColumns<JobRequest>();
const ALL = "all";

/** Job requests raised by the user's department. */
export function JobRequestsPage() {
  const navigate = useNavigate();
  const { has } = useAccess();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("job requests", busy);
  const [status, setStatus] = useState(ALL);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${status}` });
  const query = servicesApi.useGetApiV1JobRequestsQuery({ ...jobAudit, page: table.page, pageSize: table.pageSize, ...(search ? { searchQuery: search } : {}),
    ...(status === ALL ? {} : { status: Number(status) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }) }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? jobRequestPageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [creating, setCreating] = useState(false);
  const menu = useJobMenu(setDialog);
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Job request", cell: ({ row }) => <span className="font-medium">{row.original.code}</span> }),
    column.accessor((r) => r.issued ?? "", { id: "issued", header: "Issued", size: 120, cell: ({ row }) => formatDate(row.original.issued) ?? "–" }),
    column.accessor((r) => r.department?.name ?? "", { id: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "–" }),
    column.accessor((r) => r.site?.name ?? "", { id: "site", header: "Site", cell: ({ row }) => row.original.site?.name ?? "–" }),
    column.accessor((r) => r.wantedBy ?? "", { id: "wanted", header: "Wanted by", size: 120, cell: ({ row }) => formatDate(row.original.wantedBy) ?? "–" }),
    column.accessor((r) => r.issuedBy?.name ?? "", { id: "by", header: "Requested by", cell: ({ row }) => row.original.issuedBy?.name ?? "–" }),
    column.accessor("status", { header: "Status", size: 170, cell: ({ row }) => <div className="flex flex-wrap gap-1"><Badge variant={statusVariant(row.original.status)}>{jobStatusLabel(row.original.status)}</Badge>
      {row.original.approved ? null : <Badge variant="secondary">Awaiting approval</Badge>}</div> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.code}`} items={menu(row.original, true)} /> }),
  ]), [menu]);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">SERVICES</p><h1 className="text-xl font-semibold">Job requests</h1>
      <p className="text-sm text-muted-foreground">Work your department needs done, in-house or by a service provider.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Status" size="sm" className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent position="popper"><SelectItem value={ALL}>All statuses</SelectItem>{Object.values(JobStatus).map((s) => <SelectItem key={s} value={String(s)}>{jobStatusLabel(s)}</SelectItem>)}</SelectContent></Select>
        {has(jobKeys.create) ? <Button size="sm" onClick={() => setCreating(true)}><Plus />Raise job request</Button> : null}</div></header>
    <ServerDataTable label="Job requests" columns={columns} rows={rows} getRowId={(r) => r.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(r) => void navigate(`${jobRequestRoot}/${r.id}/details`)}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned job requests the app could not read." : null}
      emptyTitle={search || status !== ALL ? "No job requests match" : "No job requests"} />
    {creating ? <JobRequestEditor job={null} onClose={() => setCreating(false)} onSaved={(id) => { setCreating(false); if (id) void navigate(`${jobRequestRoot}/${id}/details`); }} /> : null}
    <JobDialogs dialog={dialog} close={() => setDialog(null)} onChanged={() => void query.refetch()} />
  </section>;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm">{children}</dd></div>;
}

/** One job request: what is needed, where, who is doing it, and the next step. */
export function JobRequestDetailPage() {
  const { id = "" } = useParams();
  const { has } = useAccess();
  const query = servicesApi.useGetApiV1JobRequestsByIdQuery({ ...jobAudit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const orders = servicesApi.useGetApiV1JobOrdersQuery({ ...jobAudit, jobRequestId: id, page: 1, pageSize: 10 }, { skip: !id || !has(jobKeys.viewOrders) });
  const parsed = useMemo(() => query.data ? jobRequestSchema.safeParse(query.data) : null, [query.data]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const menu = useJobMenu(setDialog);
  const crumbs = [{ label: "Job requests", to: jobRequestRoot }];
  if (query.isLoading) return <DetailPageSkeleton label="Loading job request" />;
  if (query.error || !parsed?.success) return <article className="space-y-4"><PageHeader title="Job request" crumbs={crumbs} />
    <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The server returned a job request the app could not read."}</p></article>;
  const job = parsed.data;
  const actions = menu(job, false);
  const orderList = (orders.data?.data ?? []).flatMap((o) => o.id ? [{ id: o.id, code: o.code ?? "Job order" }] : []);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={job.code} crumbs={[...crumbs, { label: job.code }]} actions={actions.length ? <TableMenu label={`Actions for ${job.code}`} items={actions} /> : undefined} />
    <section aria-label="Job request" className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2"><Badge variant={statusVariant(job.status)}>{jobStatusLabel(job.status)}</Badge>
        {job.approved ? <Badge variant="secondary">Approved</Badge> : <Badge variant="secondary">Awaiting approval</Badge>}
        <span className="text-sm text-muted-foreground">{handlingLabel(job.handling)}</span></div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Date of issue">{formatDate(job.issued) ?? "–"}</Fact><Fact label="Preferred completion">{formatDate(job.wantedBy) ?? "–"}</Fact>
        <Fact label="Requested by">{job.issuedBy?.name ?? "–"}</Fact><Fact label="Department">{job.department?.name ?? "–"}</Fact>
        <Fact label="Site">{job.site?.name ?? "–"}</Fact><Fact label="Equipment">{job.equipment ? `${job.equipment.name}${job.equipmentNumber ? ` (${job.equipmentNumber})` : ""}` : "–"}</Fact>
        <Fact label="Instrument">{job.instrument ? `${job.instrument}${job.instrumentNumber ? ` (${job.instrumentNumber})` : ""}` : "–"}</Fact><Fact label="Service">{job.service?.name ?? "–"}</Fact>
        {job.handling === Handling.Internal ? <><Fact label="Assigned to">{job.assignee?.name ?? "–"}</Fact><Fact label="Assigned">{job.assignedAt ? `${formatDate(job.assignedAt) ?? ""}${job.assignedBy ? ` by ${job.assignedBy.name}` : ""}` : "–"}</Fact></> : null}
      </dl>
      <div><p className="text-xs text-muted-foreground">Description of work</p><p className="whitespace-pre-wrap text-sm">{job.description ?? "No description provided."}</p></div>
      {!job.approved ? <p className="text-sm text-muted-foreground">It must be approved before it can be acknowledged, assigned or sent out.</p> : null}
    </section>
    {orderList.length ? <section aria-label="Job orders" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">Job orders</h2>
      <ul className="text-sm">{orderList.map((o) => <li key={o.id}><Link className="underline-offset-4 hover:underline" to={`${jobOrderRoot}/${o.id}/details`}>{o.code}</Link></li>)}</ul></section> : null}
    <JobDialogs dialog={dialog} close={() => setDialog(null)} onChanged={() => void query.refetch()} />
  </article>;
}
