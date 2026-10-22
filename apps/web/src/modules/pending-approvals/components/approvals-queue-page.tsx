import { useAccess } from "@/shared/auth/use-access";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { useGetApiV1ApprovalMyPendingDocumentCountsQuery, useGetApiV1ApprovalMyPendingQuery, useGetApiV1ApprovalMyPendingStatsQuery } from "../api/approval-api";
import { approvalListPath, approvalPath, approvalsPath, audit, decidedElsewhere, documentLabel, isReadable, waitingDocuments } from "../lib/approval-documents";
import { approvalRowsSchema, countsSchema, type PendingApproval } from "../schemas/approval-schema";
import { DelegationPanel } from "./delegation-panel";

/** How many documents of each type wait for the user. The full count is asked first; the older one covers a server without it. */
function useCounts() {
  const full = useGetApiV1ApprovalMyPendingDocumentCountsQuery({ ...audit });
  const basic = useGetApiV1ApprovalMyPendingStatsQuery({ ...audit }, { skip: !full.isError });
  const source = full.isError ? basic : full;
  const counts = useMemo(() => { const parsed = countsSchema.safeParse(source.data ?? null); return parsed.success ? parsed.data : {}; }, [source.data]);
  return { counts, loading: full.isLoading || basic.isLoading, error: source.error ? apiErrorMessage(source.error) : null, retry: () => { void full.refetch(); } };
}

function DocumentCards({ documents }: { documents: readonly { type: string; count: number }[] }) {
  const { has } = useAccess();
  return <ul aria-label="Documents waiting for you" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{documents.map(({ type, count }) => { const place = decidedElsewhere(type);
    const body = <><span className="min-w-0"><span className="block break-words font-medium">{documentLabel(type)}</span>
      <span className="block text-xs text-muted-foreground">{place ? `Decided in ${place}` : isReadable(type) ? "Read and decide here" : "Listed here; decided in the web app for now"}</span></span>
      <span className="flex shrink-0 items-center gap-1"><Badge variant={place ? "outline" : "default"}>{count}</Badge>{place ? null : <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />}</span></>;
    const target = type === "PerformanceReview" && has("CanViewPerformanceReviews") ? "/hr/performance-reviews" : type === "PayrollRun" && has("CanViewPayrollRuns") ? "/hr/payroll-runs" : type === "Payment" && has("CanApprovePayment") ? "/finance/payment-approvals" : !place ? approvalListPath(type) : null;
    return <li key={type}>{!target ? <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-4">{body}</div>
      : <Link to={target} aria-label={`${documentLabel(type)}, ${count} waiting`} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring">{body}</Link>}</li>; })}</ul>;
}

const column = dataTableColumns<PendingApproval>();
const columns = column.columns([
  column.accessor((row) => row.code ?? "", { id: "code", header: "Document", cell: ({ row }) => <span className="break-words font-medium">{row.original.code ?? "No number"}</span> }),
  column.accessor((row) => row.requestedBy ?? "", { id: "requestedBy", header: "Requested by", cell: ({ row }) => row.original.requestedBy ?? "–" }),
  // A request reached through a delegation says whose it is.
  column.accessor((row) => row.onBehalfOf ?? "", { id: "for", header: "Waiting for", size: 180, cell: ({ row }) => row.original.onBehalfOf
    ? <Badge variant="outline" className="whitespace-normal">For {row.original.onBehalfOf}</Badge> : <span className="text-muted-foreground">You</span> }),
  column.accessor((row) => row.department ?? "", { id: "department", header: "Department", cell: ({ row }) => row.original.department ?? "–" }),
  column.accessor((row) => row.createdAt ?? "", { id: "requested", header: "Requested on", size: 160, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
  column.accessor((row) => row.logs.length, { id: "stage", header: "Earlier decisions", size: 170, cell: ({ row }) => row.original.logs.length === 0 ? <span className="text-muted-foreground">You are first</span> : `${row.original.logs.length} recorded` }),
]);

function DocumentList({ type }: { type: string }) {
  const navigate = useNavigate();
  const query = useGetApiV1ApprovalMyPendingQuery({ ...audit, modelType: type });
  const parsed = useMemo(() => query.data ? approvalRowsSchema.safeParse(query.data) : null, [query.data]);
  // The server is asked for one type; anything else it sends back is left out.
  const rows = useMemo(() => parsed?.success ? parsed.data.filter((row) => row.type === type) : [], [parsed, type]);
  return <ClientDataTable label={`${documentLabel(type)} waiting for you`} columns={columns} rows={rows} getRowId={(row) => row.id} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
    error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned requests the app could not read." : null} onRowOpen={(row) => void navigate(approvalPath(row.type, row.id))}
    emptyTitle="Nothing is waiting" emptyDescription={`No ${documentLabel(type).toLowerCase()} needs your decision.`} />;
}

/** Everything waiting for the signed-in user's decision: by document type first, then the documents of one type. */
export function ApprovalsQueuePage() {
  const [params] = useSearchParams();
  const type = params.get("type");
  const state = useCounts();
  const documents = useMemo(() => waitingDocuments(state.counts), [state.counts]);
  const total = documents.reduce((sum, item) => sum + item.count, 0);
  const place = type ? decidedElsewhere(type) : null;

  if (type) return <section className="page-fill">
    <PageHeader title={documentLabel(type)} crumbs={[{ label: "My pending approvals", to: approvalsPath }, { label: documentLabel(type) }]} />
    {place ? <p role="status" className="rounded-md border bg-muted/50 p-3 text-sm">These are decided in {place}, not from this list.</p> : <DocumentList type={type} />}
  </section>;

  return <section className="min-w-0 space-y-4">
    <div><p className="eyebrow">QUALITY ASSURANCE</p><h1 className="text-xl font-semibold">My pending approvals</h1>
      <p className="text-sm text-muted-foreground">{state.loading ? "Counting what is waiting…" : total === 0 ? "Nothing is waiting for your decision." : `${total} ${total === 1 ? "request is" : "requests are"} waiting for your decision.`}</p></div>
    {state.loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading…</p> : null}
    {state.error ? <p role="alert" className="text-sm text-destructive">{state.error} <Button type="button" size="sm" variant="link" onClick={state.retry}>Retry</Button></p> : null}
    {documents.length > 0 ? <DocumentCards documents={documents} /> : null}
    <DelegationPanel />
  </section>;
}
