import { useState } from "react";
import { Ban, FilePenLine, FileText } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PurchaseOrderLines } from "@/modules/proforma-requests/components/purchase-order-lines";
import { PurchaseOrderPrint } from "@/modules/proforma-requests/components/purchase-order-print";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { useAccess } from "@/shared/auth/use-access";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { Tabs, useTabParam } from "@/shared/detail/tabs";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { formatMoney } from "@/shared/procurement/price";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import { supplierTypeLabels, type SupplierType } from "@/shared/procurement/supplier-type";
import { cancelOrderPermissions, mayCancelOrder, orderListPath, orderStatus, reviseOrderPath, reviseOrderPermissions } from "../lib/purchase-order-access";
import { describeChange, revisionKind } from "../lib/revisions";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderTerms, OrderTotals } from "./order-terms";

type Tab = "lines" | "attachments" | "revisions";
const safeLink = (link: string | null) => link && /^https?:\/\//i.test(link) ? link : null;

/** One purchase order: who it is with, what it is for, what it costs, and how it has changed. */
export function OrderDetail({ order, type }: { order: PurchaseOrder; type: SupplierType }) {
  const tabs = [{ id: "lines" as const, label: `Lines (${order.items.length})` }, { id: "attachments" as const, label: `Attachments (${order.attachments.length})` },
    ...(order.revisions.length ? [{ id: "revisions" as const, label: `Revisions (${order.revisions.length})` }] : [])];
  const [active, select] = useTabParam<Tab>(tabs, "lines");
  const currency = order.supplier.currency;
  const { has } = useAccess();
  const mayRevise = order.status === orderStatus.sent && has(reviseOrderPermissions[type]);
  const mayCancel = mayCancelOrder(order.status) && has(cancelOrderPermissions[type]);
  const [cancelling, setCancelling] = useState(false);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={order.code} crumbs={[{ label: "Order list", to: `${orderListPath}?type=${type}` }, { label: order.code }]}
      actions={<>{mayRevise ? <Button asChild variant="outline"><Link to={reviseOrderPath(order.id, type)}><FilePenLine />Revise order</Link></Button> : null}
        {mayCancel ? <Button type="button" variant="outline" className="text-destructive" onClick={() => setCancelling(true)}><Ban />Cancel order</Button> : null}
        <PrintButton size="default" preview={(close) => <PurchaseOrderPrint order={order} title="Purchase order" type={type} onClose={close} />} /></>} />
    <div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={order.status} /><Badge variant="outline">{supplierTypeLabels[type]} supplier</Badge>
      {order.revised ? <Badge variant="outline">Revision {order.revisionNumber}</Badge> : null}</div>
    <KeyFacts>
      <KeyFact label="Supplier" value={order.supplier.name} note={order.supplier.country ?? undefined} />
      <KeyFact label="Awarded" value={formatDate(order.createdAt) ?? "–"} />
      <KeyFact label="Delivery expected" value={formatDate(order.expectedDelivery ?? order.estimatedDelivery) ?? "Not set"} note={order.expectedDelivery ? "Confirmed when sent" : order.estimatedDelivery ? "From the proforma invoice" : undefined} />
      <KeyFact label="Value of lines" value={order.total === null ? "Not available" : formatMoney(order.total, currency)} />
      <KeyFact label={type === 0 ? "Total CIF value" : "Grand total"} value={order.recorded.grandTotal === null ? "Not finalised" : formatMoney(order.recorded.grandTotal, currency)} />
    </KeyFacts>
    <SupplierSummary supplier={order.supplier} />
    <OrderTerms order={order} />
    <Tabs label="Order records" tabs={tabs} active={active} onSelect={select}>
      {active === "lines" ? <div className="space-y-4"><PurchaseOrderLines order={order} />{order.recorded.grandTotal !== null ? <OrderTotals order={order} type={type} /> : null}</div> : null}
      {active === "attachments" ? order.attachments.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nothing is attached to this order.</p>
        : <ul className="space-y-2">{order.attachments.map((file) => { const link = safeLink(file.link);
          return <li key={file.id} className="flex items-center gap-2 rounded-md border p-3 text-sm"><FileText className="size-4 shrink-0 text-muted-foreground" />
            {link ? <a className="min-w-0 break-all text-primary underline-offset-2 hover:underline" href={link} target="_blank" rel="noreferrer">{file.name}</a> : <span className="min-w-0 break-all">{file.name}</span>}</li>; })}</ul> : null}
      {active === "revisions" ? <div className="space-y-4">{order.revisions.map((revision) => <section key={revision.number} className="space-y-2">
        <h3 className="text-sm font-semibold">Revision {revision.number} <span className="font-normal text-muted-foreground">{formatDate(revision.date) ?? ""}</span></h3>
        <Table><TableHeader><TableRow><TableHead>Change</TableHead><TableHead>Material</TableHead><TableHead>Before</TableHead><TableHead>After</TableHead></TableRow></TableHeader>
          <TableBody>{revision.changes.map((change) => { const text = describeChange(change, currency);
            return <TableRow key={change.id}><TableCell>{revisionKind(change.type)}</TableCell>
              <TableCell className="break-words">{change.material}{change.materialBefore && change.materialBefore !== change.material ? <span className="block text-xs text-muted-foreground">was {change.materialBefore}</span> : null}</TableCell>
              <TableCell>{text.before}</TableCell><TableCell>{text.after}</TableCell></TableRow>; })}</TableBody></Table>
      </section>)}</div> : null}
    </Tabs>
    {cancelling ? <CancelOrderDialog order={order} type={type} onClose={() => setCancelling(false)} /> : null}
  </article>;
}
