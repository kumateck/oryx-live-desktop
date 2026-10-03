import { useEffect, useMemo, useState } from "react";
import { PackageCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetApiV1RequisitionByRequisitionIdQuery } from "@/modules/requisitions/api/requisition-api";
import { ConfirmActionDialog } from "@/shared/actions";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { RichTextView, richTextToPlain } from "@/shared/rich-text/rich-text-view";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1RequisitionDepartmentQuery, usePostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdMutation } from "../api/stock-issue-api";
import { audit, batchNumber, issueBlock, issuePermissions, issueRequisitionPath, shortfall, stockIssueListPath, stockIssuePath, viewPermissions } from "../lib/stock-issue";
import { stockRequisitionRowsSchema, stockRequisitionSchema, type StockLine, type StockRequisition } from "../schemas/stock-issue-schema";
import { AlternativeBatches } from "./alternative-batches";
import { BatchBreakdown, amount } from "./batch-breakdown";

function Standing({ requisition }: { requisition: Pick<StockRequisition, "approved" | "status"> }) {
  if (requisition.status === 3) return <Badge>Issued</Badge>;
  if (requisition.status === 4) return <Badge variant="destructive">Rejected</Badge>;
  return requisition.approved ? <Badge variant="secondary">Ready to issue</Badge> : <Badge variant="outline">Awaiting approval</Badge>;
}

const column = dataTableColumns<StockRequisition>();
const columns = column.columns([
  column.accessor("code", { header: "Requisition", size: 190, cell: ({ row }) => <span className="break-words font-medium">{row.original.code}</span> }),
  column.accessor((row) => row.product ?? "", { id: "product", header: "For", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.product ?? "–"}</div>
    <div className="break-words text-xs text-muted-foreground">{[row.original.schedule, row.original.batch ? `Batch ${row.original.batch}` : null].filter(Boolean).join(" · ") || "No schedule"}</div></div> }),
  column.accessor((row) => row.requestedBy ?? "", { id: "requestedBy", header: "Requested by", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.requestedBy ?? "–"}</div><div className="text-xs text-muted-foreground">{row.original.department ?? ""}</div></div> }),
  column.accessor((row) => row.createdAt ?? "", { id: "requested", header: "Requested", size: 170, cell: ({ row }) => formatDateTime(row.original.createdAt) ?? "–" }),
  column.accessor((row) => row.items.length, { id: "materials", header: "Materials", size: 110 }),
  column.accessor("status", { header: "Status", size: 170, cell: ({ row }) => <Standing requisition={row.original} /> }),
]);

/** Stock requisitions raised to the user's store, raw or packaging. */
export function StockIssueListPage() {
  const navigate = useNavigate();
  const { kind, select, tabs } = useKindTabs(viewPermissions);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("stock requisitions", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}` });
  // Type 0 is a stock requisition.
  const query = useGetApiV1RequisitionDepartmentQuery({ ...audit, type: 0, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? stockRequisitionRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Issue stock requisitions</h1></div>
      <KindSwitch tabs={tabs} kind={kind} onSelect={select} />
    </div>
    <ServerDataTable label="Stock requisitions" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(issueRequisitionPath(row.id, kind ?? 0))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned requisitions the app could not read." : null}
      emptyTitle={search.trim() ? "No requisitions match this search" : "No stock requisitions"} emptyDescription={search.trim() ? "Search by requisition number." : "Requisitions appear here when production asks your store for materials."} />
  </section>;
}

const lineColumn = dataTableColumns<StockLine>();
const lineColumns = lineColumn.columns([
  lineColumn.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
  lineColumn.accessor("quantity", { header: "Requested", size: 150, cell: ({ row }) => { const short = shortfall(row.original);
    return <div><div>{amount(row.original.quantity, row.original.unit)}</div>{short > 0 && row.original.batches.length > 0 ? <div className="text-xs text-destructive">{amount(short, row.original.unit)} not set aside</div> : null}</div>; } }),
  lineColumn.display({ id: "batches", header: "Issued from", cell: ({ row }) => <BatchBreakdown line={row.original} /> }),
]);
const printColumns: PrintColumn<StockLine>[] = [
  { id: "n", header: "#", cell: (_row, index) => index + 1, width: "6%" },
  { id: "material", header: "Material", cell: (row) => <>{row.materialName}<small>{row.materialCode ?? "No code"}</small></> },
  { id: "quantity", header: "Requested", align: "right", cell: (row) => amount(row.quantity, row.unit) },
  { id: "batches", header: "Batch · quantity · expiry", cell: (row) => row.batches.length ? row.batches.map((batch) => <div key={batch.key}>{batchNumber(batch.number)} · {amount(batch.quantity, row.unit)} · {formatMonthYear(batch.expires) ?? "no expiry"}</div>) : "None set aside" },
];

function Issue({ requisition, kind }: { requisition: StockRequisition; kind: 0 | 1 }) {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [issue] = usePostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdMutation();
  const block = issueBlock(requisition);
  const back = stockIssueListPath(kind);
  const remarks = richTextToPlain(requisition.comments);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Stock requisition ${requisition.code}`} crumbs={[{ label: "Issue stock requisitions", to: back }, { label: requisition.code }]} actions={<>
      <PrintButton preview={(close) => <PrintPreviewDialog title={`Stock requisition voucher · ${requisition.code}`} onClose={close}>
        <PrintHeader title="Stock requisition voucher" reference={requisition.code} />
        <PrintFacts facts={[{ label: "Product", value: [requisition.product, requisition.productCode].filter(Boolean).join(" · ") }, { label: "Schedule", value: requisition.schedule }, { label: "Batch", value: requisition.batch },
          { label: "Requested by", value: requisition.requestedBy }, { label: "Department", value: requisition.department }, { label: "Requested on", value: formatDateTime(requisition.createdAt) }]} />
        {remarks ? <p className="print-note"><strong>Justification:</strong> {remarks}</p> : null}
        <PrintTable columns={printColumns} rows={requisition.items} rowKey={(row) => row.id} empty="No materials on this requisition" />
        <PrintSignatures roles={["Issued by", "Checked by", "Received by"]} />
      </PrintPreviewDialog>} />
      {has(issuePermissions[kind]) && requisition.status !== 3 ? <Button type="button" disabled={block !== null} onClick={() => setConfirming(true)}><PackageCheck />Issue stock</Button> : null}
    </>} />
    <Standing requisition={requisition} />
    {block && requisition.status !== 3 ? <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
    <KeyFacts>
      <KeyFact label="Product" value={requisition.product ?? "–"} note={requisition.productCode ?? undefined} />
      <KeyFact label="Schedule" value={requisition.schedule ?? "–"} note={requisition.batch ? `Batch ${requisition.batch}` : undefined} />
      <KeyFact label="Requested by" value={requisition.requestedBy ?? "Not recorded"} note={requisition.department ?? undefined} />
      <KeyFact label="Requested on" value={formatDateTime(requisition.createdAt) ?? "–"} />
    </KeyFacts>
    {requisition.comments ? <section className="space-y-1 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Justification</h2><RichTextView html={requisition.comments} className="text-sm" /></section> : null}
    {/* Batches can only be swapped while the stock has not left the store. */}
    {requisition.status !== 3 && requisition.status !== 4 ? <AlternativeBatches requisitionId={requisition.id} mayAsk={has(issuePermissions[kind])} /> : null}
    <ClientDataTable label="Materials and the batches set aside" columns={lineColumns} rows={requisition.items} getRowId={(row) => row.id} fill={false} emptyTitle="No materials on this requisition" />
    {confirming ? <ConfirmActionDialog require={issuePermissions[kind]} destructive={false} title={`Issue ${requisition.code}?`}
      description={`The batches shown leave your store for ${requisition.department ?? "production"}${requisition.batch ? `, for batch ${requisition.batch}` : ""}. This cannot be undone.`} confirmLabel="Issue stock" busyLabel="Issuing…" onClose={() => setConfirming(false)}
      onConfirm={async () => { const result = await issue({ ...audit, stockRequisitionId: requisition.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success(`${requisition.code} issued`, { description: "The stock has left your store." });
        void navigate(back);
        return null; }} /> : null}
  </article>;
}

function Loaded({ id }: { id: string }) {
  const { has } = useAccess();
  const query = useGetApiV1RequisitionByRequisitionIdQuery({ ...audit, requisitionId: id });
  const requisition = useMemo(() => { const parsed = stockRequisitionSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading requisition" groups={4} />;
  if (!requisition) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Requisition unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a requisition the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={stockIssuePath}>Stock requisitions</Link></Button></div></div>;
  // The materials say whether this is a raw or a packaging requisition; the permission for that kind is the one checked.
  const kind = requisition.kind ?? 0;
  if (!has(viewPermissions[kind]) && !has(issuePermissions[kind])) return <NoAccess />;
  return <Issue requisition={requisition} kind={kind} />;
}
export function StockIssuePage() {
  const { id } = useParams();
  return id ? <Loaded key={id} id={id} /> : null;
}
