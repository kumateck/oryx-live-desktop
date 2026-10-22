import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  lineSourced, lineStatusLabel, purchaseRequisitionPageSchema, purchaseRequisitionSchema, requisitionStatusLabel, samePurchaseRequisition, type PurchaseLine, type PurchaseRequisition,
} from "@/modules/store-purchase-requisitions/lib/purchase-requisitions";
import { ConfirmActionDialog } from "@/shared/actions";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { stores } from "@/shared/inventory/stores";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { Source, keys, paths, procurementAudit } from "../lib/procurement";

const column = dataTableColumns<PurchaseRequisition>();

/** Store purchase requisitions still waiting to be sourced, from every store. */
export function SourcingListPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("requisitions to source", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = inventoryApi.useGetApiV1ProcurementInventoryQuery({ ...procurementAudit, status: 0, page: table.page, pageSize: table.pageSize, ...(search ? { searchQuery: search } : {}) },
    { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? purchaseRequisitionPageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Requisition", cell: ({ row }) => <span className="font-medium">{row.original.code}</span> }),
    column.accessor((r) => r.store === null ? "" : stores[r.store] ?? "", { id: "store", header: "Store", size: 150 }),
    column.accessor((r) => r.createdAt ?? "", { id: "raised", header: "Raised", size: 120, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.accessor((r) => r.expectedDelivery ?? "", { id: "delivery", header: "Expected delivery", size: 150, cell: ({ row }) => formatDate(row.original.expectedDelivery) ?? "–" }),
    column.accessor((r) => r.lines.length, { id: "items", header: "Items", size: 80 }),
    column.accessor((r) => r.lines.filter((l) => lineSourced(l.status)).length, { id: "sourced", header: "Sourced", size: 100, cell: ({ row }) => `${String(row.original.lines.filter((l) => lineSourced(l.status)).length)} of ${String(row.original.lines.length)}` }),
  ]), []);
  return <section className="page-fill">
    <div><p className="eyebrow">STORE PROCUREMENT</p><h1 className="text-xl font-semibold">Requisition sourcing</h1>
      <p className="text-sm text-muted-foreground">Store purchase requisitions waiting to be sent to trusted vendors or the open market.</p></div>
    <ServerDataTable label="Requisitions to source" columns={columns} rows={rows} getRowId={(r) => r.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(r) => void navigate(`${paths.sourcing}/${r.id}`)}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned requisitions the app could not read." : null}
      emptyTitle={search ? "No requisitions match" : "Nothing waiting to be sourced"} />
  </section>;
}

interface Choice { source: Source | null; vendors: string[] }

function VendorChoice({ line, choice, onChange }: { line: PurchaseLine; choice: Choice; onChange: (choice: Choice) => void }) {
  const vendors = inventoryApi.useGetApiV1VendorsItemByIdQuery({ ...procurementAudit, id: line.itemId }, { skip: choice.source !== Source.Trusted || !line.itemId });
  const list = (vendors.data ?? []).flatMap((v) => v.id ? [{ id: v.id, name: v.name ?? "Unnamed vendor" }] : []);
  if (choice.source !== Source.Trusted) return null;
  if (vendors.isLoading) return <p className="text-xs text-muted-foreground">Loading the vendors who supply this item…</p>;
  if (vendors.error) return <p role="alert" className="text-xs text-destructive">{apiErrorMessage(vendors.error)}</p>;
  if (list.length === 0) return <p className="text-xs text-muted-foreground">No trusted vendor supplies this item. Link one under Vendors, or use the open market.</p>;
  return <fieldset className="space-y-1"><legend className="sr-only">Vendors for {line.name}</legend>
    {list.map((vendor) => <label key={vendor.id} className="flex items-center gap-2 text-sm">
      <Checkbox checked={choice.vendors.includes(vendor.id)} aria-label={vendor.name}
        onCheckedChange={(checked) => onChange({ ...choice, vendors: checked ? [...choice.vendors, vendor.id] : choice.vendors.filter((id) => id !== vendor.id) })} />{vendor.name}</label>)}
  </fieldset>;
}

/** Sourcing one requisition: each unsourced item goes to chosen trusted vendors for quotation, or to the open market. */
export function SourcingDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { has } = useAccess();
  const query = inventoryApi.useGetApiV1ProcurementInventoryByIdQuery({ ...procurementAudit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const [reread] = inventoryApi.useLazyGetApiV1ProcurementInventoryByIdQuery();
  const [sourceTrusted] = inventoryApi.usePostApiV1ProcurementInventorySourceMutation();
  const [sourceMarket] = inventoryApi.usePostApiV1ProcurementInventoryMarketMutation();
  const parsed = useMemo(() => query.data ? purchaseRequisitionSchema.safeParse(query.data) : null, [query.data]);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [confirming, setConfirming] = useState(false);
  const crumbs = [{ label: "Requisition sourcing", to: paths.sourcing }];
  if (query.isLoading) return <DetailPageSkeleton label="Loading requisition" />;
  if (query.error || !parsed?.success) return <article className="space-y-4"><PageHeader title="Requisition" crumbs={crumbs} />
    <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The server returned a requisition the app could not read."}</p></article>;
  const requisition = parsed.data;
  const canSource = has(keys.source) && requisition.status === 0;
  const open = requisition.lines.filter((l) => !lineSourced(l.status));
  const choiceOf = (line: PurchaseLine): Choice => choices[line.id] ?? { source: null, vendors: [] };
  const trusted = open.filter((l) => choiceOf(l).source === Source.Trusted);
  const market = open.filter((l) => choiceOf(l).source === Source.OpenMarket);
  const incomplete = trusted.filter((l) => choiceOf(l).vendors.length === 0);
  const ready = (trusted.length > 0 || market.length > 0) && incomplete.length === 0;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={requisition.code} crumbs={[...crumbs, { label: requisition.code }]} actions={canSource && open.length > 0
      ? <Button size="sm" disabled={!ready} onClick={() => setConfirming(true)}>Save sourcing</Button> : undefined} />
    <section aria-label="Requisition" className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div><p className="text-xs text-muted-foreground">Store</p><p className="text-sm">{requisition.store === null ? "–" : stores[requisition.store]}</p></div>
      <div><p className="text-xs text-muted-foreground">Raised</p><p className="text-sm">{formatDate(requisition.createdAt) ?? "–"}{requisition.raisedBy ? ` by ${requisition.raisedBy}` : ""}</p></div>
      <div><p className="text-xs text-muted-foreground">Expected delivery</p><p className="text-sm">{formatDate(requisition.expectedDelivery) ?? "–"}</p></div>
      <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline">{requisitionStatusLabel(requisition.status)}</Badge></div>
      {requisition.remarks ? <p className="whitespace-pre-wrap text-sm sm:col-span-2 lg:col-span-4">{requisition.remarks}</p> : null}
    </section>
    <section aria-label="Items and sourcing" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">Items and sourcing</h2>
      <p className="text-sm text-muted-foreground">Choose where each item is bought. Items can be sourced now and the rest later; the requisition is complete when every item is sourced.</p>
      <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[48rem] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr>
        {["Item", "Quantity", "Source", "Vendors"].map((h) => <th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead>
        <tbody>{requisition.lines.map((line) => { const choice = choiceOf(line); const done = lineSourced(line.status);
          return <tr key={line.id} className="border-b align-top last:border-0">
            <td className="p-2"><div className="font-medium">{line.name}</div><div className="font-mono text-xs text-muted-foreground">{line.code}</div></td>
            <td className="p-2">{`${String(line.quantity)} ${line.unit}`.trim()}</td>
            <td className="p-2">{done ? <Badge>{lineStatusLabel(line.status)}</Badge> : canSource
              ? <Select value={choice.source === null ? "" : String(choice.source)} onValueChange={(value) => setChoices((current) => ({ ...current, [line.id]: { source: Number(value) as Source, vendors: [] } }))}>
                  <SelectTrigger aria-label={`Source for ${line.name}`} className="w-44"><SelectValue placeholder="Choose" /></SelectTrigger>
                  <SelectContent position="popper"><SelectItem value={String(Source.Trusted)}>Trusted vendors</SelectItem><SelectItem value={String(Source.OpenMarket)}>Open market</SelectItem></SelectContent></Select>
              : <span className="text-muted-foreground">Not sourced</span>}</td>
            <td className="p-2">{done ? "–" : <VendorChoice line={line} choice={choice} onChange={(next) => setChoices((current) => ({ ...current, [line.id]: next }))} />}</td>
          </tr>; })}</tbody></table></div>
      {incomplete.length > 0 ? <p className="text-sm text-muted-foreground">Choose at least one vendor for {incomplete.map((l) => l.name).join(", ")}.</p> : null}
      {!has(keys.source) ? <p className="text-sm text-muted-foreground">You can view this requisition but not source it.</p> : null}
    </section>
    {confirming ? <ConfirmActionDialog require={{ kind: "all", permissions: [keys.sourcingView, keys.source] }} destructive={false} title={`Source ${String(trusted.length + market.length)} item(s) of ${requisition.code}?`}
      description={[trusted.length ? `Trusted vendors: ${trusted.map((l) => l.name).join(", ")} — quotation requests are prepared for the chosen vendors.` : "",
        market.length ? `Open market: ${market.map((l) => l.name).join(", ")}.` : ""].filter(Boolean).join(" ")}
      confirmLabel="Save sourcing" busyLabel="Saving…" onClose={() => setConfirming(false)}
      onConfirm={async () => {
        const fresh = await reread({ ...procurementAudit, id: requisition.id }, false);
        const current = fresh.data ? purchaseRequisitionSchema.safeParse(fresh.data) : null;
        if (!current?.success || !samePurchaseRequisition(requisition, current.data)) return "This requisition changed after you opened it. Close this and check it again.";
        if (trusted.length) {
          const result = await sourceTrusted({ ...procurementAudit, domainEntitiesItemsRequisitionsCreateSourceInventoryRequisition: { inventoryPurchaseRequisitionId: requisition.id,
            items: trusted.map((l) => ({ itemId: l.itemId, uoMId: l.unitId, quantity: l.quantity, source: Source.Trusted, vendors: choiceOf(l).vendors.map((vendorId) => ({ vendorId })) })) } });
          if ("error" in result) { void query.refetch(); return apiErrorMessage(result.error); }
        }
        if (market.length) {
          const result = await sourceMarket({ ...procurementAudit, body: market.map((l) => ({ inventoryPurchaseRequisitionItemId: l.id, itemId: l.itemId, uoMId: l.unitId, quantity: l.quantity })) });
          if ("error" in result) { void query.refetch(); return `${trusted.length ? "The trusted-vendor items were sourced, but the open-market items were not: " : ""}${apiErrorMessage(result.error)}`; }
        }
        toast.success("Sourcing saved", { description: trusted.length ? "Send the quotation requests from Supplier quote requests." : undefined });
        setChoices({});
        void query.refetch();
        if (requisition.lines.every((l) => lineSourced(l.status) || trusted.includes(l) || market.includes(l))) void navigate(paths.sourcing);
        return null;
      }} /> : null}
    {has(keys.requestsView) && requisition.lines.some((l) => lineSourced(l.status)) ? <p className="text-sm"><Link className="underline-offset-4 hover:underline" to={paths.requests}>Supplier quote requests</Link></p> : null}
  </article>;
}
