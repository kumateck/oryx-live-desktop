import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { usePageSearch } from "@/shared/search/page-search";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { useGetApiV1FinishedGoodsRecallsQuery, useGetApiV1FinishedGoodsRecallsByIdQuery, useGetApiV1FinishedGoodsRecallsByIdPrintQuery } from "@/modules/fg-dispatch/public";
import { detailSchema, summarySchema, recallPath, recallAudit, recallKeys, type Recall, type RecallSummary, type Trace } from "../lib";
import { FinancialResolutionDialog } from "./financial-resolution-dialog";
import { RecallActionDialog, type RecallAction } from "./recall-action-dialog";

const divisionTabs = [{ value: 0 }, { value: 1 }] as const;
const divisionLabels = { 0: "Beta-lactam", 1: "Non-beta-lactam" } as const;
const listColumn = dataTableColumns<RecallSummary>();
const columns = listColumn.columns([
  listColumn.accessor("code", { header: "Recall" }), listColumn.accessor("productName", { header: "Product" }), listColumn.accessor("batchNumber", { header: "Batch" }),
  listColumn.accessor("regulatoryClassification", { header: "Classification" }), listColumn.accessor("createdAt", { header: "Opened", cell: ({ row }) => formatDateTime(row.original.createdAt) }),
  listColumn.display({ id: "state", header: "Status", cell: ({ row }) => <Badge variant={row.original.closed ? "secondary" : "destructive"}>{row.original.closed ? "Closed · stock remains blocked" : "Open"}</Badge> }),
]);
const traceColumn = dataTableColumns<Trace>();
const traceColumns = traceColumn.columns([
  traceColumn.accessor("customer", { header: "Customer", cell: ({ row }) => <div>{row.original.customer}<div className="text-xs text-muted-foreground">{row.original.contact}</div></div> }),
  traceColumn.accessor("stage", { header: "Location / stage" }), traceColumn.accessor("vehicle", { header: "Vehicle" }), traceColumn.accessor("waybill", { header: "Waybill" }),
  traceColumn.accessor("packingStyle", { header: "Packing" }), traceColumn.accessor("packs", { header: "Packs" }), traceColumn.accessor("recoveredYield", { header: "Recovered base units" }),
  traceColumn.display({ id: "notification", header: "Recall contact", cell: ({ row }) => row.original.acknowledged ? "Acknowledged" : row.original.effectivenessConfirmed ? "Follow-up outcome verified" : row.original.notified ? "Notified; follow up" : "Not yet notified" }),
]);
type Stock = Recall["stocks"][number];
const stockColumn = dataTableColumns<Stock>();
const stockColumns = stockColumn.columns([
  stockColumn.accessor("transferNoteNumber", { header: "Transfer note" }), stockColumn.accessor("packingStyle", { header: "Packing style" }),
  stockColumn.accessor("unitsPerPack", { header: "Base units per pack" }), stockColumn.accessor("physical", { header: "On-site base units" }),
  stockColumn.accessor("reserved", { header: "Reserved base units" }), stockColumn.accessor("quarantinedReturns", { header: "Returns quarantined" }),
]);
const stockPrintColumns: readonly PrintColumn<Stock>[] = [
  { id: "note", header: "Transfer", cell: (row) => row.transferNoteNumber }, { id: "packing", header: "Packing / units per pack", cell: (row) => `${row.packingStyle ?? ""} / ${row.unitsPerPack}` },
  { id: "physical", header: "On-site base units", cell: (row) => row.physical }, { id: "reserved", header: "Reserved", cell: (row) => row.reserved }, { id: "quarantine", header: "Returns in quarantine", cell: (row) => row.quarantinedReturns },
];
const recoveryPrintColumns: readonly PrintColumn<Recall["recoveries"][number]>[] = [
  { id: "evidence", header: "Return receipt", cell: (row) => row.evidence }, { id: "quantity", header: "Base units recovered", cell: (row) => row.quantity },
  { id: "condition", header: "Condition / quarantine", cell: (row) => row.condition }, { id: "disposition", header: "QA disposition evidence", cell: (row) => row.disposed ? row.dispositionEvidence : "Quarantined; disposition pending" },
];
const printColumns: readonly PrintColumn<Trace>[] = [
  { id: "customer", header: "Customer / contact", cell: (row) => `${row.customer ?? ""} / ${row.contact ?? ""}` },
  { id: "packing", header: "Packing style", cell: (row) => row.packingStyle }, { id: "packs", header: "Packs", cell: (row) => row.packs },
  { id: "stage", header: "Stage / vehicle", cell: (row) => `${row.stage ?? ""} / ${row.vehicle ?? ""}` }, { id: "waybill", header: "Waybill", cell: (row) => row.waybill },
  { id: "recovery", header: "Recovered base units", cell: (row) => row.recoveredYield },
];
function RecallPrint({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useGetApiV1FinishedGoodsRecallsByIdPrintQuery({ ...recallAudit, id });
  const parsed = detailSchema.safeParse(query.data);
  return <PrintPreviewDialog title="Product recall record" landscape ready={!query.isFetching && parsed.success && !query.error} onClose={onClose}>
    {query.isLoading ? <p>Loading recall record…</p> : query.error ? <p role="alert">{apiErrorMessage(query.error)}</p> : !parsed.success ? <p role="alert">Recall record unavailable.</p> : <>
      <PrintHeader title="Product Recall and Distribution Reconciliation" reference={parsed.data.code} />
      <PrintFacts facts={[{ label: "Product / batch", value: `${parsed.data.productName ?? ""} / ${parsed.data.batchNumber ?? ""}` }, { label: "Classification", value: parsed.data.regulatoryClassification },
        { label: "Authority", value: parsed.data.authorityReference }, { label: "Reason", value: parsed.data.reason }, { label: "On-site base units", value: parsed.data.onSiteYield },
        { label: "Dispatched / recovered", value: `${parsed.data.dispatchedYield} / ${parsed.data.recoveredYield}` }, { label: "Unrecoverable", value: parsed.data.unrecoverableYield },
        { label: "Final report", value: parsed.data.closureReport }]} />
      <PrintTable columns={printColumns} rows={parsed.data.consignments} rowKey={(row) => `${row.allocationId}/${row.transferNoteId}`} empty="No customer consignments." />
      <PrintTable caption="On-site stock and quarantine" columns={stockPrintColumns} rows={parsed.data.stocks} rowKey={(row) => row.transferNoteId} empty="No on-site transfer records." />
      <PrintTable caption="Recoveries and QA disposition" columns={recoveryPrintColumns} rows={parsed.data.recoveries} rowKey={(row) => row.id} empty="No recoveries recorded." />
      <PrintFacts facts={[{ label: "Transfer shortages", value: parsed.data.transferVariance }, { label: "Unrecoverable outcome", value: parsed.data.unrecoverableReason },
        ...parsed.data.history.map((row, index) => ({ label: `Decision / closure ${index + 1}`, value: `${formatDateTime(row.at) ?? ""} · ${row.actor ?? ""} · ${row.evidence ?? ""}` })),
        ...parsed.data.settlements.map((row, index) => ({ label: `Finance resolution ${index + 1}`, value: `${row.kind ?? ""} · ${row.reference ?? ""} · ${row.currency ?? ""} ${row.amount} · ${row.evidence ?? ""}` }))]} />
      <PrintSignatures roles={["Prepared by", "QA disposition", "Recall closure authorised by"]} />
    </>}
  </PrintPreviewDialog>;
}
export function RecallListPage() {
  const [params, setParams] = useSearchParams(); const division = params.get("division") === "1" ? 1 : 0;
  const navigate = useNavigate(); const { has } = useAccess(); const [creating, setCreating] = useState(false);
  const search = usePageSearch("product recalls"); const table = useServerTable({ pageSize: 30, resetKey: `${search}|${division}` });
  const query = useGetApiV1FinishedGoodsRecallsQuery({ ...recallAudit, division, searchQuery: search, page: table.page, pageSize: table.pageSize });
  const parsed = useMemo(() => query.data ? summarySchema.array().safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : []; const meta = pageMeta(query.data, table, rows.length);
  return <section className="page-fill">
    <PageHeader title="Product recalls" crumbs={[{ label: "FG Warehouse" }, { label: "Product recalls" }]} actions={has(recallKeys.create) ? <Button size="sm" onClick={() => setCreating(true)}>Initiate recall</Button> : null} />
    <KindSwitch tabs={divisionTabs} kind={division} labels={divisionLabels} label="Division" onSelect={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set("division", String(value)); return next; }, { replace: true })} />
    <ServerDataTable label="Product recalls" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
      onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(`${recallPath}/${row.id}`)} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "Recall records could not be read." : null}
      emptyTitle="No product recalls" emptyDescription="A recall blocks the affected batch throughout storage, loading, transit and delivery." />
    {creating ? <RecallActionDialog action="create" onClose={() => setCreating(false)} onSaved={() => void query.refetch()} /> : null}
  </section>;
}
function RecallDetail({ recall, refresh }: { recall: Recall; refresh: () => void }) {
  const { has } = useAccess(); const [action, setAction] = useState<RecallAction | null>(null);
  const [settling, setSettling] = useState(false);
  const actions = ["decision", "notify", "recover", "dispose", "disposeStock", "close"] as const;
  const labels = { decision: "Record authority decision", notify: "Record notification", recover: "Receive recovery", dispose: "Dispose recovery", disposeStock: "Dispose held stock", close: "Close recall" };
  return <article className="space-y-4">
    <PageHeader title={recall.code ?? "Product recall"} crumbs={[{ label: "Product recalls", to: recallPath }, { label: recall.code ?? "Recall" }]}
      actions={has(recallKeys.print) ? <PrintButton preview={(close) => <RecallPrint id={recall.id} onClose={close} />} /> : null} />
    <div className="flex flex-wrap gap-2">{!recall.closed ? actions.filter((a) => has(recallKeys[a])).map((a) => <Button key={a} size="sm" variant="outline" onClick={() => setAction(a)}>{labels[a]}</Button>) : <Badge>Closed · batch remains blocked</Badge>}</div>
    {has("CanRecordProductRecallSettlement") ? <Button size="sm" variant="outline" onClick={() => setSettling(true)}>Record Finance resolution</Button> : null}
    {settling ? <FinancialResolutionDialog id={recall.id} onClose={() => setSettling(false)} onSaved={refresh} /> : null}
    {recall.closed && has(recallKeys.reopen) ? <Button size="sm" variant="outline" onClick={() => setAction("reopen")}>Reopen recall</Button> : null}
    <KeyFacts><KeyFact label="On site (base units)" value={recall.onSiteYield} /><KeyFact label="Dispatched" value={recall.dispatchedYield} /><KeyFact label="Recovered" value={recall.recoveredYield} /><KeyFact label="Unrecoverable" value={recall.unrecoverableYield} /><KeyFact label="Transfer shortages" value={recall.transferVariance} note="Account for these in the final QA report" /></KeyFacts>
    <DetailGroup title="Recall decision"><DetailItem label="Product / batch" value={`${recall.productName ?? ""} / ${recall.batchNumber ?? ""}`} /><DetailItem label="Classification" value={recall.regulatoryClassification} />
      <DetailItem label="Authority reference" value={recall.authorityReference} /><DetailItem label="Reason" value={recall.reason} /><DetailItem label="Final report" value={recall.closureReport} /><DetailItem label="Unrecoverable outcome" value={recall.unrecoverableReason} /></DetailGroup>
    <ClientDataTable label="On-site stock and quarantine" columns={stockColumns} rows={recall.stocks} getRowId={(row) => row.transferNoteId} fill={false} emptyTitle="No on-site transfer records" />
    <ClientDataTable label="Affected consignments" columns={traceColumns} rows={recall.consignments} getRowId={(row) => `${row.allocationId}/${row.transferNoteId}`} fill={false} emptyTitle="No customer consignments" emptyDescription="Stock is held on site; check the transfer notes before disposition." />
    <DetailGroup title="Recovered goods in quarantine">{recall.recoveries.map((row) => <DetailItem key={row.id} label={row.evidence ?? "Recovery"} value={`${row.quantity} base units · ${row.disposed ? `Disposed: ${row.dispositionEvidence ?? "recorded"}` : `Quarantined: ${row.condition ?? "recorded"}`}`} />)}</DetailGroup>
    <DetailGroup title="Authority decisions and closure history">{recall.history.map((row) => <DetailItem key={row.id} label={`${row.event === "FgRecallClose" ? "Closed" : row.event === "FgRecallReopen" ? "Reopened" : "Authority decision"} · ${formatDateTime(row.at) ?? ""} · ${row.actor ?? "QA"}`} value={row.evidence} />)}</DetailGroup>
    <DetailGroup title="Finance resolutions">{recall.settlements.map((row) => <DetailItem key={row.id} label={`${row.kind ?? "Resolution"} · ${row.reference ?? "Reference"}`} value={`${row.invoiceCode ?? "Invoice"} · ${row.currency ?? ""} ${row.amount} · ${row.evidence ?? ""}`} />)}</DetailGroup>
    {action ? <RecallActionDialog action={action} recall={recall} onClose={() => setAction(null)} onSaved={refresh} /> : null}
  </article>;
}
export function RecallDetailPage() {
  const { id = "" } = useParams(); const query = useGetApiV1FinishedGoodsRecallsByIdQuery({ ...recallAudit, id }, { skip: !id });
  const parsed = detailSchema.safeParse(query.data);
  if (query.isLoading) return <DetailPageSkeleton label="Loading product recall" groups={3} />;
  if (!parsed.success) return <div role="alert" className="space-y-3 p-6"><p>{query.error ? apiErrorMessage(query.error) : "Recall record unavailable."}</p><Button variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild variant="outline"><Link to={recallPath}>Product recalls</Link></Button></div>;
  return <RecallDetail recall={parsed.data} refresh={() => void query.refetch()} />;
}
