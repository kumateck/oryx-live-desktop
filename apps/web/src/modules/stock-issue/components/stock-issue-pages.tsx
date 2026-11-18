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
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { ReviewPanel } from "@/shared/reviews/review-panel";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, type PrintSigner } from "@/shared/print/print-sheet";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { RichTextView, richTextToPlain } from "@/shared/rich-text/rich-text-view";
import { usePageSearch } from "@/shared/search/page-search";
import { whitePlaceboPreparationPath } from "@/shared/production/white-placebo-path";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1RequisitionDepartmentQuery, usePostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdMutation } from "../api/stock-issue-api";
import { audit, issueQueues, type IssueQueue, checkNote, issueBlock, issueCheckKeys, issuePermissions, issueRequisitionPath, stockIssueListPath, stockIssuePath, viewPermissions } from "../lib/stock-issue";
import { stockRequisitionRowsSchema, stockRequisitionSchema, type StockRequisition } from "../schemas/stock-issue-schema";
import { AlternativeBatches } from "./alternative-batches";
import { VoucherTable } from "./voucher-table";
import { IssueLines } from "./issue-lines";
import { MaterialChoices } from "./material-choices";

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
  const [queue, setQueue] = useState<IssueQueue>("awaiting");
  const shown = issueQueues.find((entry) => entry.value === queue) ?? issueQueues[0];
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("stock requisitions", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}|${queue}` });
  // Type 0 is a stock requisition.
  const query = useGetApiV1RequisitionDepartmentQuery({ ...audit, type: 0, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search,
    ...(shown.issued === undefined ? {} : { issued: shown.issued }) }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? stockRequisitionRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Issue stock requisitions</h1></div>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Requisition status" className="flex gap-1">{issueQueues.map((entry) =>
          <Button key={entry.value} type="button" size="sm" variant={queue === entry.value ? "default" : "outline"} aria-pressed={queue === entry.value} onClick={() => setQueue(entry.value)}>{entry.label}</Button>)}</div>
        <KindSwitch tabs={tabs} kind={kind} onSelect={select} />
      </div>
    </div>
    <ServerDataTable label="Stock requisitions" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(row.whitePlaceboPreparationId ? whitePlaceboPreparationPath(row.whitePlaceboPreparationId) : issueRequisitionPath(row.id, kind ?? 0))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned requisitions the app could not read." : null}
      emptyTitle={search.trim() ? "No requisitions match this search" : shown.empty} emptyDescription={search.trim() ? "Search by requisition number." : "Requisitions appear here when production asks your store for materials."} />
  </section>;
}

/** The voucher's signature lines: the store user who issued it, the approver who checked the issue, and the requester who receives it. */
function voucherSigners(requisition: StockRequisition): PrintSigner[] {
  const { issuedBy, checkedBy, receivedBy, checkStatus } = requisition.signatories;
  const signer = (role: string, person: typeof issuedBy, note?: string | null): PrintSigner =>
    ({ role, name: person?.name ?? null, signature: person?.signature ?? null, signedOn: formatDateTime(person?.signedAt ?? null) ?? null, note: person ? null : note ?? null });
  return [signer("Issued by", issuedBy), signer("Checked by", checkedBy, checkNote(checkStatus)), signer("Received by", receivedBy)];
}

function Issue({ requisition, kind }: { requisition: StockRequisition; kind: 0 | 1 }) {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [issue] = usePostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdMutation();
  const block = issueBlock(requisition);
  const back = stockIssueListPath(kind);
  const remarks = richTextToPlain(requisition.comments);
  const reference = requisition.contentRevision ? `${requisition.code} · Revision ${requisition.contentRevision}` : requisition.code;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Stock requisition ${reference}`} crumbs={[{ label: "Issue stock requisitions", to: back }, { label: reference }]} actions={<>
      <PrintButton preview={(close) => <PrintPreviewDialog landscape title={`Stock requisition voucher · ${requisition.code}`} onClose={close}>
        <PrintHeader title="Stock requisition voucher" reference={reference} />
        <PrintFacts facts={[{ label: "Product", value: [requisition.product, requisition.productCode].filter(Boolean).join(" · ") }, { label: "Schedule", value: requisition.schedule }, { label: "Batch", value: requisition.batch },
          { label: "Requested by", value: requisition.requestedBy }, { label: "Department", value: requisition.department }, { label: "Requested on", value: formatDateTime(requisition.createdAt) }]} />
        {remarks ? <p className="print-note"><strong>Justification:</strong> {remarks}</p> : null}
        <VoucherTable lines={requisition.items} />
        <PrintSignatures signers={voucherSigners(requisition)} />
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
      {requisition.signatories.issuedBy ? <KeyFact label="Issued by" value={requisition.signatories.issuedBy.name} note={formatDateTime(requisition.signatories.issuedBy.signedAt) ?? undefined} /> : null}
      {requisition.signatories.issuedBy ? <KeyFact label="Checked by" value={requisition.signatories.checkedBy?.name ?? "Not checked yet"}
        note={requisition.signatories.checkedBy ? formatDateTime(requisition.signatories.checkedBy.signedAt) ?? undefined : checkNote(requisition.signatories.checkStatus) ?? undefined} /> : null}
    </KeyFacts>
    {/* The warehouse check of the issue is its review. A returned issue is corrected through the issued-material repair. */}
    {requisition.signatories.issueId ? <ReviewPanel record={{ modelType: "StockRequisitionIssue", modelId: requisition.signatories.issueId }} keys={issueCheckKeys[kind]} label="issue" /> : null}
    {requisition.comments ? <section className="space-y-1 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Justification</h2><RichTextView html={requisition.comments} className="text-sm" /></section> : null}
    {/* The material, like its batches, can change only while the stock has not left the store. Substitutes are on raw-material BOMs only. */}
    {requisition.status !== 3 && requisition.status !== 4 ? <MaterialChoices requisitionId={requisition.id} kind={kind} /> : null}
    {/* Batches can only be swapped while the stock has not left the store. */}
    {requisition.status !== 3 && requisition.status !== 4 ? <AlternativeBatches source={{ requisitionId: requisition.id }} mayAsk={has(issuePermissions[kind])} /> : null}
    <IssueLines requisition={requisition} />
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
  if (requisition.whitePlaceboPreparationId) return <section className="space-y-3"><h1 className="text-lg font-semibold">White Placebo ingredient request</h1>
    <p>Issue the selected ingredient batches from the linked preparation record.</p><Button asChild><Link to={whitePlaceboPreparationPath(requisition.whitePlaceboPreparationId)}>Open White Placebo preparation</Link></Button></section>;
  return <Issue requisition={requisition} kind={kind} />;
}
export function StockIssuePage() {
  const { id } = useParams();
  return id ? <Loaded key={id} id={id} /> : null;
}
