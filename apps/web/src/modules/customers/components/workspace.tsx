import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { Tabs, useTabParam, type TabItem } from "@/shared/detail/tabs";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatMoney } from "@/shared/procurement/price";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetCustomerOrdersQuery, useGetCustomerProfileQuery, useGetCustomerQuotationsQuery } from "../api/customer-api";
import { createQuotationPath, customerPermissions, customerPricingPath, customersPath, customerTypeLabels, orderStatusLabels, quotationPath, quotationStatusLabels } from "../lib/customers";
import { ordersSchema, profileSchema, quotationRowsSchema } from "../schemas/customer-schema";
import { ContactsPanel } from "./contacts-panel";
import { OverviewPanel } from "./overview-panel";
import { ProfilePanel } from "./profile-panel";

type TabId = "overview" | "profile" | "contacts" | "quotations" | "orders";

function QuotationsPanel({ customerId }: { customerId: string }) {
  const { has } = useAccess();
  const query = useGetCustomerQuotationsQuery({ customerId, page: 1, pageSize: 50 });
  const rows = useMemo(() => { const parsed = quotationRowsSchema.safeParse(query.data?.data ?? []); return parsed.success ? parsed.data : []; }, [query.data]);
  return <section className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Active quotations</h2><p className="text-xs text-muted-foreground">Drafts and quotations being approved. Converted and expired ones are still reachable by their own address.</p></div>
      {has(customerPermissions.createQuotation) ? <Button asChild type="button" size="sm"><Link to={createQuotationPath(customerId)}><Plus />New quotation</Link></Button> : null}</div>
    {query.isLoading ? <div role="status" aria-label="Loading quotations" className="h-20 animate-pulse rounded-md bg-muted" />
      : query.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)}</p>
      : rows.length === 0 ? <p className="text-sm text-muted-foreground">No active quotations.</p>
      : <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><caption className="sr-only">Quotations</caption>
        <thead><tr className="border-b text-left text-xs text-muted-foreground"><th scope="col" className="py-1.5 font-medium">Quotation</th><th scope="col" className="py-1.5 font-medium">Status</th><th scope="col" className="py-1.5 font-medium">Valid until</th><th scope="col" className="py-1.5 text-right font-medium">Value</th></tr></thead>
        <tbody>{rows.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="py-1.5"><Link className="font-medium text-primary underline-offset-2 hover:underline" to={quotationPath(item.id)}>{item.code}</Link></td>
          <td className="py-1.5"><Badge variant="outline">{quotationStatusLabels[item.status] ?? "Unknown"}</Badge></td><td className="py-1.5">{formatDate(item.validUntil) ?? "–"}</td><td className="py-1.5 text-right font-medium">{formatMoney(item.total, item.currency)}</td></tr>)}</tbody></table></div>}
  </section>;
}

function OrdersPanel({ customerId }: { customerId: string }) {
  const query = useGetCustomerOrdersQuery({ customerId, page: 1, pageSize: 50 });
  const rows = useMemo(() => { const parsed = ordersSchema.safeParse(query.data?.data ?? []); return parsed.success ? parsed.data : []; }, [query.data]);
  return <section className="space-y-3 rounded-lg border bg-card p-4">
    <div><h2 className="text-sm font-semibold">Order and delivery history</h2><p className="text-xs text-muted-foreground">Production orders for this customer, with the promised and the actual delivery dates.</p></div>
    {query.isLoading ? <div role="status" aria-label="Loading orders" className="h-20 animate-pulse rounded-md bg-muted" />
      : query.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)}</p>
      : rows.length === 0 ? <p className="text-sm text-muted-foreground">No orders recorded for this customer.</p>
      : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><caption className="sr-only">Orders</caption>
        <thead><tr className="border-b text-left text-xs text-muted-foreground"><th scope="col" className="py-1.5 font-medium">Order</th><th scope="col" className="py-1.5 font-medium">Status</th><th scope="col" className="py-1.5 text-right font-medium">Value</th><th scope="col" className="py-1.5 pl-4 font-medium">Promised</th><th scope="col" className="py-1.5 font-medium">Delivered</th></tr></thead>
        <tbody>{rows.map((item) => { const late = Boolean(item.promisedDeliveryDate && item.deliveredAt && new Date(item.deliveredAt) > new Date(item.promisedDeliveryDate));
          return <tr key={item.id} className="border-b last:border-0"><td className="py-1.5"><Link className="font-medium text-primary underline-offset-2 hover:underline" to={`/crm/production-order/${item.id}`}>{item.code ?? "No number"}</Link></td>
            <td className="py-1.5">{orderStatusLabels[item.status ?? 0] ?? "Unknown"}</td><td className="py-1.5 text-right">{formatMoney(item.totalValue, null)}</td><td className="py-1.5 pl-4">{formatDate(item.promisedDeliveryDate) ?? "–"}</td>
            <td className={late ? "py-1.5 font-medium text-destructive" : "py-1.5"}>{formatDate(item.deliveredAt) ?? "–"}{late ? " · late" : ""}</td></tr>; })}</tbody></table></div>}
  </section>;
}

/** Everything about one customer: credit, commercial terms, contacts, quotations and orders. Negotiated prices are in Finance → Costing. */
export function CustomerWorkspace() {
  const { id = "" } = useParams();
  const { has } = useAccess();
  const [params] = useSearchParams();
  // The pricing tab moved to Finance → Costing; saved links to it open the customer's agreements there.
  const movedToCosting = params.get("tab") === "pricing" && Boolean(id);
  const query = useGetCustomerProfileQuery(id, { skip: !id || movedToCosting });
  const profile = useMemo(() => { const parsed = profileSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  // Each tab is shown only to someone who may use it; order history is open to anyone who can open the customer.
  const tabs = useMemo((): TabItem<TabId>[] => [
    ...(has(customerPermissions.credit) ? [{ id: "overview" as const, label: "Credit overview" }] : []),
    ...(has(customerPermissions.contracts) ? [{ id: "profile" as const, label: "Profile" }, { id: "contacts" as const, label: "Contacts" }] : []),
    ...(has(customerPermissions.quotations) ? [{ id: "quotations" as const, label: "Quotations" }] : []),
    { id: "orders" as const, label: "Order history" },
  ], [has]);
  const [active, select] = useTabParam(tabs, tabs[0]?.id ?? "orders");
  if (movedToCosting) return <Navigate replace to={customerPricingPath(id)} />;
  if (query.isLoading) return <DetailPageSkeleton label="Loading customer" groups={3} />;
  if (!profile) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Customer unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a customer the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={customersPath}>Customers</Link></Button></div></div>;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={profile.name ?? "Customer"} crumbs={[{ label: "Customers", to: customersPath }, { label: profile.name ?? "Customer" }]}
      actions={has(customerPermissions.pricing) ? <Button asChild size="sm" variant="outline"><Link to={customerPricingPath(id)}>Pricing agreements</Link></Button> : null} />
    <p className="text-sm text-muted-foreground">{[typeof profile.type === "number" ? customerTypeLabels[profile.type] : null, profile.email, profile.phone].filter(Boolean).join(" · ") || "No contact details"}</p>
    <Tabs label="Customer records" tabs={tabs} active={active} onSelect={select}>
      {active === "overview" ? <OverviewPanel customerId={id} /> : active === "profile" ? <ProfilePanel key={profile.id} profile={profile} /> : active === "contacts" ? <ContactsPanel customerId={id} />
        : active === "quotations" ? <QuotationsPanel customerId={id} /> : <OrdersPanel customerId={id} />}
    </Tabs>
  </article>;
}
