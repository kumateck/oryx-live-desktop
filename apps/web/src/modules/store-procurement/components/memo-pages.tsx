import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { Source, keys, memoPageSchema, memoSchema, memoStatusLabel, money, paths, procurementAudit, type Memo, type MemoItem } from "../lib/procurement";

const column = dataTableColumns<Memo>();

/** Memos raised from chosen prices, newest first. */
export function MemoListPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("memos", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = inventoryApi.useGetApiV1ProcurementInventoryMemoQuery({ ...procurementAudit, page: table.page, pageSize: table.pageSize, ...(search ? { searchQuery: search } : {}) }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? memoPageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => column.columns([
    column.accessor((m) => m.createdAt ?? "", { id: "created", header: "Created", size: 120, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.accessor("code", { header: "Memo", cell: ({ row }) => <span className="font-medium">{row.original.code}</span> }),
    column.accessor((m) => m.items.length, { id: "items", header: "Items", size: 80 }),
    column.accessor("total", { header: "Total value", size: 140, cell: ({ row }) => money(row.original.total) }),
    column.accessor((m) => m.createdBy ?? "", { id: "by", header: "Created by", cell: ({ row }) => row.original.createdBy ?? "–" }),
    column.accessor("paid", { header: "Payment", size: 150, cell: ({ row }) => <Badge variant={row.original.paid ? "default" : "outline"}>{row.original.paid ? "Paid" : `${String(row.original.items.filter((i) => i.purchasedAt).length)} of ${String(row.original.items.length)} paid`}</Badge> }),
    column.accessor("status", { header: "Type", size: 170, cell: ({ row }) => memoStatusLabel(row.original.status) }),
  ]), []);
  return <section className="page-fill">
    <div><p className="eyebrow">STORE PROCUREMENT</p><h1 className="text-xl font-semibold">Memos</h1>
      <p className="text-sm text-muted-foreground">Approved prices to buy at. Paying an item sends it to its store's receiving area.</p></div>
    <ServerDataTable label="Memos" columns={columns} rows={rows} getRowId={(m) => m.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(m) => void navigate(`${paths.memo}/${m.id}`)}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned memos the app could not read." : null}
      emptyTitle={search ? "No memos match" : "No memos yet"} emptyDescription={search ? "Search by memo code." : undefined} />
  </section>;
}

const payKeys = (item: MemoItem) => item.source === Source.OpenMarket ? [keys.marketMemoView, keys.marketOrderCreate] : [keys.trustedMemoView, keys.trustedOrderCreate];

/** One memo: its items, vendors and value, and recording payment item by item. */
export function MemoDetailPage() {
  const { id = "" } = useParams();
  const { can } = useAccess();
  const query = inventoryApi.useGetApiV1ProcurementInventoryMemoByIdQuery({ ...procurementAudit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const [reread] = inventoryApi.useLazyGetApiV1ProcurementInventoryMemoByIdQuery();
  const [markPaid] = inventoryApi.usePostApiV1ProcurementInventoryMemoItemByIdMarkPaidMutation();
  const parsed = useMemo(() => query.data ? memoSchema.safeParse(query.data) : null, [query.data]);
  const [paying, setPaying] = useState<MemoItem | null>(null);
  const crumbs = [{ label: "Memos", to: paths.memo }];
  if (query.isLoading) return <DetailPageSkeleton label="Loading memo" />;
  if (query.error || !parsed?.success) return <article className="space-y-4"><PageHeader title="Memo" crumbs={crumbs} />
    <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The server returned a memo the app could not read."}</p></article>;
  const memo = parsed.data;
  const quantity = memo.items.reduce((s, i) => s + i.quantity, 0);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={memo.code} crumbs={[...crumbs, { label: memo.code }]} />
    <section aria-label="Memo" className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div><p className="text-xs text-muted-foreground">Created</p><p className="text-sm">{formatDate(memo.createdAt) ?? "–"}{memo.createdBy ? ` by ${memo.createdBy}` : ""}</p></div>
      <div><p className="text-xs text-muted-foreground">Items</p><p className="text-sm">{memo.items.length}</p></div>
      <div><p className="text-xs text-muted-foreground">Total quantity</p><p className="text-sm">{quantity.toLocaleString()}</p></div>
      <div><p className="text-xs text-muted-foreground">Total value</p><p className="text-sm font-medium">{money(memo.total)}</p></div>
      <div><p className="text-xs text-muted-foreground">Payment</p><Badge variant={memo.paid ? "default" : "outline"}>{memo.paid ? "Paid" : "Pending payment"}</Badge></div>
      {memo.status === 1 ? <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-5">This memo is above the memo threshold and needs a purchase order.</p> : null}
    </section>
    <section aria-label="Memo items" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">Items</h2>
      <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[52rem] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr>
        {["Item", "Vendor", "Quantity", "Unit price", "Value", "Terms", "Paid", ""].map((h, i) => <th key={i} scope="col" className="p-2">{h}</th>)}</tr></thead>
        <tbody>{memo.items.map((item) => <tr key={item.id} className="border-b last:border-0">
          <td className="p-2"><div className="font-medium">{item.name}</div><div className="font-mono text-xs text-muted-foreground">{item.code}</div></td>
          <td className="p-2">{item.vendor}<div className="text-xs text-muted-foreground">{item.source === Source.OpenMarket ? "Open market" : "Trusted vendor"}</div></td>
          <td className="p-2">{`${String(item.quantity)} ${item.unit}`.trim()}</td><td className="p-2">{money(item.price)}</td><td className="p-2">{money(item.value)}</td>
          <td className="p-2">{[item.terms, item.delivery].filter(Boolean).join(" · ") || "–"}</td>
          <td className="p-2">{item.purchasedAt ? formatDate(item.purchasedAt) : "Not yet"}</td>
          <td className="p-2">{!item.purchasedAt && can({ kind: "all", permissions: payKeys(item) }) ? <Button size="xs" variant="outline" onClick={() => setPaying(item)}>Mark paid</Button> : null}</td>
        </tr>)}</tbody></table></div>
    </section>
    {paying ? <ConfirmActionDialog require={{ kind: "all", permissions: payKeys(paying) }} destructive={false} title={`Mark ${paying.name} as paid?`}
      description={`${String(paying.quantity)} ${paying.unit} from ${paying.vendor} for ${money(paying.value)}. The quantity goes to the store's receiving area, where someone else approves it into stock.`}
      confirmLabel="Mark paid" busyLabel="Saving…" onClose={() => setPaying(null)}
      onConfirm={async () => {
        const fresh = await reread({ ...procurementAudit, id: memo.id }, false);
        const current = fresh.data ? memoSchema.safeParse(fresh.data) : null;
        const line = current?.success ? current.data.items.find((i) => i.id === paying.id) : undefined;
        if (!line || line.purchasedAt) return "This item has already been paid for. Close this to see the memo as it is now.";
        const result = await markPaid({ ...procurementAudit, id: paying.id }); if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Payment recorded", { description: "The item is in the store's receiving area." }); return null;
      }} /> : null}
  </article>;
}
