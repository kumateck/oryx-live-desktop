import { useEffect, useMemo, useState } from "react";
import { CircleCheck, ClipboardCheck, Eye, FlaskConical, HandHelping, Pipette, Play, Printer, Target, UserCog } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { arNumber, arNumberPrefix, useNextSerial } from "@/shared/qc/qc-numbers";
import { usePageSearch } from "@/shared/search/page-search";
import { atrApi } from "../api/atr-api";
import { AtrStatus, atrActions, atrAudit, atrPermissions, atrPrintsFilled, atrStatusLabels, atrStepPath, qcQueues, stageCode, stageLabels } from "../lib/atr";
import { atrRowsSchema, type Atr } from "../schemas/atr-schema";
import { AtrAssignmentsDialog, CompleteAtrRetestDialog, TakeSampleDialog } from "./atr-dialogs";
import { AtrWorksheetPrint } from "./atr-worksheet";

type Open = { kind: "sample" | "acknowledge" | "start" | "requestRetest" | "completeRetest" | "assignments" | "print"; atr: Atr } | null;
const column = dataTableColumns<Atr>();

/** Analytical test requests: QA's new requests to sample, or QC's queues from sample received to result released. */
export function AtrListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = Number(params.get("type") ?? "0");
  const qa = status === AtrStatus.New;
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("test requests", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${String(status)}` });
  const query = atrApi.useGetApiV1QaAnalyticalTestsQuery({ ...atrAudit, page: table.page, pageSize: table.pageSize, searchQuery: search, status: status as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 });
  const parsed = useMemo(() => query.data ? atrRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const [open, setOpen] = useState<Open>(null);
  const [update] = atrApi.usePutApiV1QaAnalyticalTestsStatusByIdMutation();
  const [requestRetest] = atrApi.usePostApiV1QaAnalyticalTestsRequestRetestByIdMutation();
  const acknowledger = usePermissionAction(atrPermissions.acknowledge);
  const starter = usePermissionAction(atrPermissions.start);
  const retester = usePermissionAction(atrPermissions.requestRetest);
  const nextSerial = useNextSerial();
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => column.columns([
    column.accessor("product", { header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.product}</div>
      <div className="text-xs text-muted-foreground">{row.original.productCode ?? "No code"} · {stageLabels[row.original.stage ?? -1] ?? "Stage not set"}</div>
      <div className="text-xs text-muted-foreground">{row.original.schedule ?? "–"}{row.original.step !== null ? ` · step ${String(row.original.step)}` : ""}</div></div> }),
    column.display({ id: "batch", header: "Batch", size: 160, cell: ({ row }) => <div className="text-xs"><div className="font-medium">{row.original.batchNumber ?? "–"}</div><div>Made {formatMonthYear(row.original.made) ?? "–"}</div><div>Expires {formatMonthYear(row.original.expires) ?? "–"}</div></div> }),
    column.display({ id: "reference", header: "References", size: 170, cell: ({ row }) => <div className="text-xs"><div>AR {row.original.arNumber ?? "–"}</div><div>Issue {row.original.issueNumber ?? "–"}</div></div> }),
    column.display({ id: "sampling", header: "Sample", size: 190, cell: ({ row }) => <div className="text-xs"><div>{row.original.sampledQuantity ?? "–"}{row.original.containers !== null ? ` · ${String(row.original.containers)} containers` : ""}</div>
      <div>{row.original.sampledBy ?? "Not sampled"}</div><div className="text-muted-foreground">{formatDateTime(row.original.sampledAt) ?? ""}</div></div> }),
    column.display({ id: "analysis", header: "Analysis", size: 170, cell: ({ row }) => <div className="text-xs"><div>{row.original.analysts.join(", ") || "Not assigned"}</div>
      <div className="text-muted-foreground">{row.original.assignedAt ? `Assigned ${formatDate(row.original.assignedAt) ?? ""}` : row.original.acknowledgedAt ? `Received ${formatDateTime(row.original.acknowledgedAt) ?? ""}` : ""}</div></div> }),
    column.accessor((row) => row.status ?? -1, { id: "status", header: "Status", size: 130, cell: ({ row }) => <div className="space-y-1"><Badge variant="outline">{atrStatusLabels[row.original.status ?? -1] ?? "Unknown"}</Badge>
      {row.original.isRetest ? <Badge variant="secondary">Retest</Badge> : null}</div> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const atr = row.original; const actions = atrActions(atr.status, atr.isRetest, atr.analysts.length > 0);
      return <TableMenu label={`Actions for ${atr.product} ${atr.batchNumber ?? ""}`} items={[
        actions.has("sample") && { id: "sample", label: "Take sample", icon: Pipette, require: atrPermissions.sample, onSelect: () => setOpen({ kind: "sample", atr }) },
        actions.has("acknowledge") && { id: "acknowledge", label: "Receive sample", icon: HandHelping, require: atrPermissions.acknowledge, onSelect: () => setOpen({ kind: "acknowledge", atr }) },
        actions.has("assign") && { id: "assign", label: "Assign test", icon: Target, require: atrPermissions.assign, to: atrStepPath(atr.id, "assign") },
        actions.has("start") && { id: "start", label: "Start test", icon: Play, require: atrPermissions.start, onSelect: () => setOpen({ kind: "start", atr }) },
        actions.has("continue") && { id: "continue", label: "Enter results", icon: FlaskConical, require: atrPermissions.start, to: atrStepPath(atr.id, "test") },
        actions.has("reassign") && { id: "reassign", label: "Reassign analysts", icon: UserCog, require: atrPermissions.reassign, to: atrStepPath(atr.id, "reassign") },
        actions.has("assignments") && { id: "assignments", label: "View assignments", icon: Eye, onSelect: () => setOpen({ kind: "assignments", atr }) },
        actions.has("check") && { id: "check", label: "Check results", icon: ClipboardCheck, require: atrPermissions.check, to: atrStepPath(atr.id) },
        actions.has("requestRetest") && { id: "requestRetest", label: "Request retest", icon: FlaskConical, require: atrPermissions.requestRetest, separated: true, onSelect: () => setOpen({ kind: "requestRetest", atr }) },
        actions.has("completeRetest") && { id: "completeRetest", label: "Complete retest", icon: CircleCheck, require: atrPermissions.completeRetest, onSelect: () => setOpen({ kind: "completeRetest", atr }) },
        actions.has("print") && { id: "print", label: atrPrintsFilled(atr.status) ? "Print worksheet with results" : "Print blank worksheet", icon: Printer, require: atrPermissions.start, separated: true, onSelect: () => setOpen({ kind: "print", atr }) },
      ]} />; } }),
  ]), []);
  const acknowledge = async (atr: Atr): Promise<string | null> => {
    const denied = acknowledger.check();
    if (denied) return denied;
    const prefix = arNumberPrefix(stageCode(atr.stage), new Date().getFullYear());
    const serial = await nextSerial("ArNumberProduct", prefix);
    if (serial === null) return "An AR number could not be worked out. Try again.";
    const result = await update({ ...atrAudit, id: atr.id, domainEntitiesAnalyticalTestRequestsUpdateAnalyticalTestRequest: { status: AtrStatus.Acknowledged, arNumber: arNumber(prefix, serial) } });
    return "error" in result ? apiErrorMessage(result.error) : null;
  };
  const start = async (atr: Atr): Promise<string | null> => {
    const denied = starter.check();
    if (denied) return denied;
    const result = await update({ ...atrAudit, id: atr.id, domainEntitiesAnalyticalTestRequestsUpdateAnalyticalTestRequest: { status: AtrStatus.Testing } });
    if ("error" in result) return apiErrorMessage(result.error);
    void navigate(atrStepPath(atr.id, "test"));
    return null;
  };
  const retest = async (atr: Atr): Promise<string | null> => {
    const denied = retester.check();
    if (denied) return denied;
    const result = await requestRetest({ ...atrAudit, id: atr.id });
    return "error" in result ? apiErrorMessage(result.error) : null;
  };
  const close = () => setOpen(null);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">{qa ? "QUALITY ASSURANCE" : "QUALITY CONTROL"}</p><h1 className="text-xl font-semibold">Analytical test requests</h1></div>
      {qa ? null : <div role="group" aria-label="Queue" className="flex flex-wrap gap-1">{qcQueues.map((value) => <Button key={value} type="button" size="sm" variant={status === value ? "default" : "outline"} aria-pressed={status === value}
        onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("type", String(value)); return next; }, { replace: true })}>{atrStatusLabels[value]}</Button>)}</div>}</div>
    <ServerDataTable label="Analytical test requests" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned requests the app could not read." : null}
      emptyTitle={search.trim() ? "No requests match this search" : `No ${(atrStatusLabels[status] ?? "").toLowerCase()} requests`} emptyDescription={qa ? "Requests appear when a batch reaches a testing step in production." : "Nothing is waiting in this queue."} />
    {open?.kind === "sample" ? <TakeSampleDialog atr={open.atr} onClose={close} /> : null}
    {open?.kind === "completeRetest" ? <CompleteAtrRetestDialog atr={open.atr} onClose={close} /> : null}
    {open?.kind === "assignments" ? <AtrAssignmentsDialog atr={open.atr} onClose={close} /> : null}
    {open?.kind === "print" ? <AtrWorksheetPrint id={open.atr.id} filled={atrPrintsFilled(open.atr.status)} onClose={close} /> : null}
    {open?.kind === "acknowledge" ? <ConfirmActionDialog require={atrPermissions.acknowledge} destructive={false} title={`Receive the sample of ${open.atr.batchNumber ?? open.atr.product}?`}
      description="The sample is logged as received by QC and given its AR number." confirmLabel="Receive sample" busyLabel="Receiving…" onClose={close} onConfirm={() => acknowledge(open.atr)} /> : null}
    {open?.kind === "start" ? <ConfirmActionDialog require={atrPermissions.start} destructive={false} title={`Start the test of ${open.atr.batchNumber ?? open.atr.product}?`}
      description="The request moves to testing and its assigned analysts can enter results." confirmLabel="Start test" busyLabel="Starting…" onClose={close} onConfirm={() => start(open.atr)} /> : null}
    {open?.kind === "requestRetest" ? <ConfirmActionDialog require={atrPermissions.requestRetest} destructive={false} title={`Request a retest of ${open.atr.batchNumber ?? open.atr.product}?`}
      description="The released result is reopened and the batch is tested again." confirmLabel="Request retest" busyLabel="Requesting…" onClose={close} onConfirm={() => retest(open.atr)} /> : null}
  </section>;
}
