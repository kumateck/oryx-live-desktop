import { useCallback, useEffect, useMemo, useState } from "react";
import { PackQuantity } from "@/shared/packing/pack-quantity";
import { addSplits, formatShippers, shipperSplit } from "@/shared/packing/packs";
import { PackagePlus, Plus } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useConvertCustomerQuotationMutation, useGetConvertibleQuotationsQuery, useLazyGetApiV1CustomersQuery } from "@/modules/customers/api/customer-api";
import { customerPath, quotationPath } from "@/modules/customers/lib/customers";
import { quotationRowsSchema } from "@/modules/customers/schemas/customer-schema";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatMoney } from "@/shared/procurement/price";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1ProductionOrdersByIdQuery, useGetApiV1ProductionOrdersQuery } from "../api/order-api";
import { audit, fulfilment, fulfilmentLabels, orderPath, orderPermissions, orderStatusLabels, orderStatuses, ordersPath, readOrderStatus, type OrderStatus } from "../lib/orders";
import { orderRowsSchema, orderSchema, type OrderLine, type ProductionOrder } from "../schemas/order-schema";
import { PackingListDialog } from "./packing-list-dialog";

function Standing({ status }: { status: OrderStatus }) {
  return <Badge variant={status === 2 ? "default" : status === 1 ? "secondary" : "outline"}>{orderStatusLabels[status]}</Badge>;
}

interface Choice { customer: SelectOption | null; quotation: SelectOption | null }
/** A production order is only ever raised from an approved quotation, at the prices and discounts that were approved. */
function CreateOrderDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [loadCustomers] = useLazyGetApiV1CustomersQuery();
  const [convert, mutation] = useConvertCustomerQuotationMutation();
  const [message, setMessage] = useState("");
  const form = useForm<Choice>({ defaultValues: { customer: null, quotation: null } });
  const [customer, chosen] = useWatch({ control: form.control, name: ["customer", "quotation"] });
  const query = useGetConvertibleQuotationsQuery(customer?.value ?? "", { skip: !customer });
  const quotations = useMemo(() => { const parsed = quotationRowsSchema.safeParse(customer ? query.data ?? [] : []); return parsed.success ? parsed.data : []; }, [query.data, customer]);
  const quotation = quotations.find((item) => item.id === chosen?.value) ?? null;
  // The quotations belong to the customer, so another customer starts with none chosen.
  useEffect(() => { form.setValue("quotation", null); }, [form, customer?.value]);
  const customers = useCallback<SelectLoader>(async (search, page) => {
    const result = await loadCustomers({ ...audit, searchQuery: search, page, pageSize: 20 });
    return { options: (result.data?.data ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.name ?? "Unnamed customer" }] : []), hasNext: (result.data?.pageIndex ?? 1) < (result.data?.pageCount ?? 1), hasPrevious: (result.data?.pageIndex ?? 1) > 1 };
  }, [loadCustomers]);
  const fields: WizardField<Choice>[] = [
    { type: InputTypes.SELECT, name: "customer", label: "Customer", mode: "single", source: "async", loadOptions: customers, required: true, placeholder: "Search for a customer" },
    { type: InputTypes.SELECT, name: "quotation", label: "Approved quotation", mode: "single", source: "sync", required: true, disabled: !customer,
      options: quotations.map((item) => ({ value: item.id, label: `${item.code} · ${item.items.length} ${item.items.length === 1 ? "item" : "items"} · ${formatMoney(item.total, item.currency)}` })),
      placeholder: !customer ? "Choose the customer first" : query.isFetching ? "Loading…" : quotations.length ? "Select a quotation" : "This customer has no approved quotation to convert" },
  ];
  const busy = mutation.isLoading;
  const submit = async () => {
    setMessage("");
    if (!quotation) { setMessage("Choose the customer and one of their approved quotations."); return; }
    const result = await convert(quotation.id);
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`Production order created from ${quotation.code}`);
    onClose();
    if (typeof result.data === "string" && result.data) void navigate(orderPath(result.data));
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>Create production order from quotation</DialogTitle><DialogDescription>Only approved quotations that have not expired and are not already an order are offered.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-3"><FormWizard form={form} fields={fields} className="md:grid-cols-2" />
        {quotation ? <div className="overflow-x-auto rounded-md border"><table className="w-full min-w-[640px] text-sm"><caption className="border-b px-3 py-2 text-left font-semibold">Quotation {quotation.code} · {formatMoney(quotation.total, quotation.currency)}</caption>
          <thead><tr className="border-b text-left text-xs text-muted-foreground"><th scope="col" className="px-3 py-1.5 font-medium">Product</th><th scope="col" className="px-3 py-1.5 font-medium">Packing</th><th scope="col" className="px-3 py-1.5 text-right font-medium">Quantity</th><th scope="col" className="px-3 py-1.5 text-right font-medium">Price per pack</th><th scope="col" className="px-3 py-1.5 text-right font-medium">Discount</th><th scope="col" className="px-3 py-1.5 text-right font-medium">Total</th></tr></thead>
          <tbody>{quotation.items.map((line) => <tr key={line.id} className="border-b last:border-0"><td className="px-3 py-1.5 break-words">{line.product}</td><td className="px-3 py-1.5">{line.packing ?? "–"}</td>
            <td className="px-3 py-1.5 text-right"><PackQuantity packs={line.quantity} split={{ shippers: line.shippers, loose: line.loose }} /></td><td className="px-3 py-1.5 text-right">{formatMoney(line.unitPrice, quotation.currency)}</td>
            <td className="px-3 py-1.5 text-right">{line.discount}%</td><td className="px-3 py-1.5 text-right font-medium">{formatMoney(line.total, quotation.currency)}</td></tr>)}</tbody></table></div> : null}
        {query.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)}</p> : null}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="button" disabled={busy || !quotation} onClick={() => void submit()}>{busy ? <><Spinner />Creating…</> : "Create production order"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

const column = dataTableColumns<ProductionOrder>();
const columns = column.columns([
  column.accessor("code", { header: "Order", size: 190, cell: ({ row }) => <span className="break-words font-medium">{row.original.code}</span> }),
  column.accessor((row) => row.customer.name, { id: "customer", header: "Customer", cell: ({ row }) => <span className="break-words">{row.original.customer.name}</span> }),
  column.accessor((row) => row.createdAt ?? "", { id: "date", header: "Order date", size: 150, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
  column.accessor((row) => row.lines.length, { id: "products", header: "Products", size: 110 }),
  column.accessor("total", { header: "Total value", size: 170, cell: ({ row }) => formatMoney(row.original.total, null) }),
  column.accessor("status", { header: "Status", size: 150, cell: ({ row }) => <Standing status={row.original.status} /> }),
]);

/** What customers have ordered, by how far each order has been packed. */
export function OrderListPage() {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = readOrderStatus(params.get("status"));
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("production orders", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${status}` });
  const query = useGetApiV1ProductionOrdersQuery({ ...audit, page: table.page, pageSize: table.pageSize, status, ...(search.trim() ? { searchQuery: search } : {}) });
  const parsed = useMemo(() => query.data ? orderRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">FG WAREHOUSE</p><h1 className="text-xl font-semibold">Production orders</h1></div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Status" className="flex gap-1">{orderStatuses.map((item) => <Button key={item} type="button" size="sm" variant={status === item ? "default" : "outline"} aria-pressed={status === item}
          onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("status", String(item)); return next; }, { replace: true })}>{orderStatusLabels[item]}</Button>)}</div>
        {has(orderPermissions.convert) ? <Button type="button" size="sm" onClick={() => setCreating(true)}><Plus />From approved quotation</Button> : null}
      </div>
    </div>
    <ServerDataTable label="Production orders" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(orderPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned orders the app could not read." : null}
      emptyTitle={search.trim() ? "No orders match this search" : `No ${orderStatusLabels[status].toLowerCase()} orders`} emptyDescription={search.trim() ? "Search by order number or customer." : "An order is raised from a customer's approved quotation."} />
    {creating ? <CreateOrderDialog onClose={() => setCreating(false)} /> : null}
  </section>;
}

const lineColumn = dataTableColumns<OrderLine>();
const lineColumns = lineColumn.columns([
  lineColumn.accessor("productName", { header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.productName}</div><div className="text-xs text-muted-foreground">{[row.original.productCode ?? "No code", row.original.packing].filter(Boolean).join(" · ")}</div></div> }),
  lineColumn.accessor("perShipper", { header: "Packs per shipper", size: 150 }),
  lineColumn.accessor("ordered", { header: "Ordered", size: 190, cell: ({ row }) => <PackQuantity packs={row.original.ordered} split={{ shippers: row.original.shippers, loose: row.original.loose }} /> }),
  lineColumn.accessor("fulfilled", { header: "Packed", size: 190, cell: ({ row }) => <div><PackQuantity packs={row.original.fulfilled} perShipper={row.original.perShipper} /><div className="text-xs text-muted-foreground">{formatShippers(shipperSplit(row.original.remaining, row.original.perShipper))} still to pack</div></div> }),
  lineColumn.display({ id: "status", header: "Status", size: 150, cell: ({ row }) => { const state = row.original.complete ? "fulfilled" : fulfilment(row.original.ordered, row.original.fulfilled);
    return <Badge variant={state === "fulfilled" ? "default" : state === "part" ? "secondary" : "outline"}>{fulfilmentLabels[state]}</Badge>; } }),
]);

function Detail({ order }: { order: ProductionOrder }) {
  const { has } = useAccess();
  const [packing, setPacking] = useState(false);
  const open = order.lines.some((line) => !line.complete && line.remaining > 0);
  const ordered = order.lines.reduce((sum, line) => sum + line.ordered, 0);
  const packed = order.lines.reduce((sum, line) => sum + line.fulfilled, 0);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Order ${order.code}`} crumbs={[{ label: "Production orders", to: ordersPath }, { label: order.code }]}
      actions={order.status !== 2 && has(orderPermissions.generatePackingList) ? <Button type="button" size="sm" disabled={!open} title={open ? undefined : "Every product on this order is packed."} onClick={() => setPacking(true)}><PackagePlus />Generate packing list</Button> : null} />
    <div className="flex flex-wrap items-center gap-2"><Standing status={order.status} />{order.approved ? <Badge variant="secondary">Approved</Badge> : null}
      <span className="text-sm text-muted-foreground">Created {formatDate(order.createdAt) ?? "on an unrecorded date"}{order.createdBy ? ` by ${order.createdBy}` : ""}</span></div>
    <KeyFacts>
      <KeyFact label="Products" value={order.lines.length} />
      <KeyFact label="Ordered" value={formatShippers(addSplits(order.lines.map((line) => ({ shippers: line.shippers, loose: line.loose }))))} note={`${ordered.toLocaleString()} packs · ${packed.toLocaleString()} packed`} />
      <KeyFact label="Total value" value={formatMoney(order.total, null)} />
      <KeyFact label="Promised delivery" value={formatDate(order.promised) ?? "Not set"} />
      <KeyFact label="Delivered" value={formatDate(order.delivered) ?? "Not yet"} />
    </KeyFacts>
    <DetailGroup title="Customer">
      <DetailItem label="Company" value={order.customer.id ? <Link className="text-primary underline-offset-2 hover:underline" to={customerPath(order.customer.id)}>{order.customer.name}</Link> : order.customer.name} />
      <DetailItem label="Email" value={order.customer.email} />
      <DetailItem label="Phone" value={order.customer.phone} />
      <DetailItem label="Address" value={order.customer.address} />
      <DetailItem label="Quotation" value={order.quotationId ? <Link className="text-primary underline-offset-2 hover:underline" to={quotationPath(order.quotationId)}>Open the quotation this order came from</Link> : null} />
    </DetailGroup>
    <ClientDataTable label="Ordered products" columns={lineColumns} rows={order.lines} getRowId={(row) => row.key} fill={false} emptyTitle="No products on this order" />
    {packing ? <PackingListDialog order={order} onClose={() => setPacking(false)} /> : null}
  </article>;
}

/** One order: the customer, what was ordered, and how far it has been packed. */
export function OrderDetailPage() {
  const { id = "" } = useParams();
  const query = useGetApiV1ProductionOrdersByIdQuery({ ...audit, id }, { skip: !id });
  const order = useMemo(() => { const parsed = orderSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading order" groups={3} />;
  if (!order) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Order unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned an order the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={ordersPath}>Production orders</Link></Button></div></div>;
  return <Detail order={order} />;
}
