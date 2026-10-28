import { useMemo, useState } from "react";
import { BadgeCheck, FilePlus2, Pencil, Send } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, DropdownButton, TableMenu, TableMenuHeader } from "@/shared/actions";
import { servicesApi } from "@/shared/api/generated/services";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { MemoStatus, amount, memoPageSchema, memoSchema, memoStatusLabel, proformaPageSchema, serviceAudit, servicePaths, type Proforma, type ServiceMemo } from "../lib/service-procurement";
import { CreateMemoDialog, EditMemoDialog, memoRules } from "./memo-form";

const memoColumn = dataTableColumns<ServiceMemo>();
const readyColumn = dataTableColumns<Proforma>();

/** Service memos, and the approved proformas still waiting for one. */
export function ServiceMemosPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"memos" | "ready">("memos");
  const table = useServerTable({ pageSize: 50, resetKey: view });
  const memos = servicesApi.useGetApiV1ServiceMemosQuery({ ...serviceAudit, page: table.page, pageSize: table.pageSize }, { skip: view !== "memos", refetchOnMountOrArgChange: 30 });
  const ready = servicesApi.useGetApiV1ServiceProformaInvoicesQuery({ ...serviceAudit, page: table.page, pageSize: table.pageSize, memoPending: true }, { skip: view !== "ready", refetchOnMountOrArgChange: 30 });
  const memoRows = useMemo(() => { const p = memos.data ? memoPageSchema.safeParse(memos.data) : null; return p?.success ? p.data.data : []; }, [memos.data]);
  const readyRows = useMemo(() => { const p = ready.data ? proformaPageSchema.safeParse(ready.data) : null; return p?.success ? p.data.data : []; }, [ready.data]);
  const [raising, setRaising] = useState<Proforma | null>(null);
  const memoColumns = useMemo(() => memoColumn.columns([
    memoColumn.accessor("number", { header: "Memo", cell: ({ row }) => <span className="font-medium">{row.original.number}</span> }),
    memoColumn.accessor((m) => m.created ?? "", { id: "created", header: "Created", size: 120, cell: ({ row }) => formatDate(row.original.created) ?? "–" }),
    memoColumn.accessor("provider", { header: "Service provider" }),
    memoColumn.accessor("jobOrder", { header: "Job order", size: 130 }),
    memoColumn.accessor("total", { header: "Total", size: 140, cell: ({ row }) => amount(row.original.total, row.original.currency) }),
    memoColumn.accessor("status", { header: "Status", size: 170, cell: ({ row }) => <span className="flex gap-1"><Badge variant="outline">{memoStatusLabel(row.original.status)}</Badge>{row.original.paid ? <Badge>Paid</Badge> : null}</span> }),
  ]), []);
  const readyColumns = useMemo(() => readyColumn.columns([
    readyColumn.accessor("provider", { header: "Service provider", cell: ({ row }) => <span className="font-medium">{row.original.provider}</span> }),
    readyColumn.accessor("jobOrder", { header: "Job order", size: 140 }),
    readyColumn.accessor((p) => p.invoice ?? "", { id: "invoice", header: "Proforma", size: 140, cell: ({ row }) => row.original.invoice ?? "–" }),
    readyColumn.accessor("total", { header: "Total", size: 140, cell: ({ row }) => amount(row.original.total, row.original.currency) }),
    readyColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.provider}`} items={[
      { id: "raise", label: "Raise memo", icon: FilePlus2, require: memoRules.create, onSelect: () => setRaising(row.original) }]} /> }),
  ]), []);
  const active = view === "memos" ? memos : ready;
  const meta = pageMeta(active.data, table, view === "memos" ? memoRows.length : readyRows.length);
  const shared = { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange,
    loading: active.isLoading, refreshing: active.isFetching && !active.isLoading, onRetry: () => void active.refetch(), error: active.error ? apiErrorMessage(active.error) : null };
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">SERVICES</p><h1 className="text-xl font-semibold">Service memos</h1>
      <p className="text-sm text-muted-foreground">After price comparison, request and approve the provider's proforma invoice. Then open Ready for a memo to raise the memo.</p></div>
      <div className="flex gap-2" role="group" aria-label="View"><Button size="sm" variant={view === "memos" ? "default" : "outline"} aria-pressed={view === "memos"} onClick={() => setView("memos")}>Memos</Button>
        <Button size="sm" variant={view === "ready" ? "default" : "outline"} aria-pressed={view === "ready"} onClick={() => setView("ready")}>Ready for a memo</Button></div></header>
    {view === "memos"
      ? <ServerDataTable label="Service memos" columns={memoColumns} rows={memoRows} getRowId={(m) => m.id} {...shared} onRowOpen={(m) => void navigate(`${servicePaths.memos}/${m.id}`)} emptyTitle="No service memos" />
      : <ServerDataTable label="Approved proformas without a memo" columns={readyColumns} rows={readyRows} getRowId={(p) => p.id} {...shared} emptyTitle="No approved proformas are waiting for a memo" />}
    {raising ? <CreateMemoDialog proforma={raising} onClose={() => setRaising(null)} onCreated={(id) => { setRaising(null); void navigate(`${servicePaths.memos}/${id}`); }} /> : null}
  </section>;
}

/** One service memo: its agreed terms, and the issue and payment steps. */
export function ServiceMemoDetailPage() {
  const { id = "" } = useParams();
  const query = servicesApi.useGetApiV1ServiceMemosByIdQuery({ ...serviceAudit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const [read] = servicesApi.useLazyGetApiV1ServiceMemosByIdQuery();
  const [issue] = servicesApi.usePostApiV1ServiceMemosIssueMutation();
  const [pay] = servicesApi.usePutApiV1ServiceMemosPaidByIdMutation();
  const [dialog, setDialog] = useState<"edit" | "issue" | "pay" | null>(null);
  const parsed = useMemo(() => query.data ? memoSchema.safeParse(query.data) : null, [query.data]);
  const crumbs = [{ label: "Service memos", to: servicePaths.memos }];
  if (query.isLoading) return <DetailPageSkeleton label="Loading service memo" />;
  if (query.error || !parsed?.success) return <article className="space-y-4"><PageHeader title="Service memo" crumbs={crumbs} />
    <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The server returned a memo the app could not read."}</p></article>;
  const memo = parsed.data;
  const recheck = async (status: (s: number) => boolean) => {
    const fresh = await read({ ...serviceAudit, id: memo.id }, false);
    const current = fresh.data ? memoSchema.safeParse(fresh.data) : null;
    return current?.success && status(current.data.status) && !current.data.paid && current.data.total === memo.total ? null : "This memo changed after you opened it. Close this and check it again.";
  };
  const draft = memo.status === MemoStatus.Draft;
  const payable = !memo.paid && (memo.status === MemoStatus.Issued || memo.status === MemoStatus.Completed);
  const row = (label: string, value: React.ReactNode) => <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm">{value}</dd></div>;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={memo.number} crumbs={[...crumbs, { label: memo.number }]} actions={draft || payable ? <DropdownButton label="Actions" items={[
      ...(draft ? [{ id: "edit", label: "Edit", icon: Pencil, require: memoRules.create, onSelect: () => setDialog("edit") },
        { id: "issue", label: "Issue to provider", icon: Send, require: memoRules.create, onSelect: () => setDialog("issue") }] : []),
      ...(payable ? [{ id: "pay", label: "Mark as paid", icon: BadgeCheck, require: memoRules.pay, onSelect: () => setDialog("pay") }] : []),
    ]} /> : null} />
    <section aria-label="Memo" className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex gap-2"><Badge variant="outline">{memoStatusLabel(memo.status)}</Badge><Badge variant={memo.paid ? "default" : "secondary"}>{memo.paid ? "Paid" : "Payment pending"}</Badge></div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {row("Service provider", memo.provider)}
        {row("Job order", memo.jobOrderId ? <Link className="underline-offset-4 hover:underline" to={`/extrals/job-orders/${memo.jobOrderId}/details`}>{memo.jobOrder}</Link> : memo.jobOrder)}
        {row("Quotation", memo.quotation ?? "–")}
        {row("Issued", `${formatDate(memo.issued) ?? "–"}${memo.issuedBy ? ` by ${memo.issuedBy}` : ""}`)}
        {row("Agreed service charge", amount(memo.charge, memo.currency))}
        {row("Agreed materials cost", amount(memo.materials, memo.currency))}
        {row("Total agreed", <span className="font-semibold">{amount(memo.total, memo.currency)}</span>)}
        {row("Expected", `${formatDate(memo.start) ?? "–"} to ${formatDate(memo.completion) ?? "–"}`)}
      </dl>
    </section>
    <section aria-label="Terms" className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-2">
      <div><h2 className="mb-1 font-semibold">Terms and conditions</h2><p className="whitespace-pre-wrap text-sm">{memo.terms ?? "None recorded."}</p></div>
      <div><h2 className="mb-1 font-semibold">Special instructions</h2><p className="whitespace-pre-wrap text-sm">{memo.instructions ?? "None recorded."}</p></div>
    </section>
    {dialog === "edit" ? <EditMemoDialog memo={memo} onClose={() => setDialog(null)} /> : null}
    {dialog === "issue" ? <ConfirmActionDialog title={`Issue ${memo.number}?`} description={`${memo.provider} is sent the memo for ${amount(memo.total, memo.currency)}. It can no longer be edited.`} confirmLabel="Issue memo" busyLabel="Issuing…"
      destructive={false} require={memoRules.create} onClose={() => setDialog(null)} onConfirm={async () => {
        const stale = await recheck((s) => s === MemoStatus.Draft); if (stale) return stale;
        const result = await issue({ ...serviceAudit, domainEntitiesJobRequestsIssueServiceMemoRequest: { serviceMemoId: memo.id } });
        return "error" in result ? apiErrorMessage(result.error) : null;
      }} /> : null}
    {dialog === "pay" ? <ConfirmActionDialog title={`Mark ${memo.number} as paid?`} description={`Records that ${amount(memo.total, memo.currency)} has been paid to ${memo.provider}. This cannot be undone.`} confirmLabel="Mark as paid" busyLabel="Saving…"
      destructive={false} require={memoRules.pay} onClose={() => setDialog(null)} onConfirm={async () => {
        const stale = await recheck((s) => s === MemoStatus.Issued || s === MemoStatus.Completed); if (stale) return stale;
        const result = await pay({ ...serviceAudit, id: memo.id });
        return "error" in result ? apiErrorMessage(result.error) : null;
      }} /> : null}
  </article>;
}
