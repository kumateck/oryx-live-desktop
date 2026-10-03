import { useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { PurchaseOrdersTable } from "@/modules/proforma-requests/components/purchase-orders-table";
import { usePurchaseOrders } from "@/modules/proforma-requests/hooks/use-purchase-orders";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { NoAccess } from "@/shared/auth/no-access";
import { SupplierTypeSwitch, useSupplierTypeTabs, type SupplierType } from "@/shared/procurement/supplier-type";
import { audit, type OrderStatus } from "../lib/purchase-order-access";

/** One stage of the purchase order flow: the orders waiting at it, and the one thing done to them there. */
export function OrderStagePage({ title, summary, status, toolbar, viewPermissions, actionPermissions, action, emptyTitle, emptyDescription, dialog }: {
  title: string; summary: string; status: OrderStatus; toolbar?: ReactNode; viewPermissions: Record<SupplierType, string>; actionPermissions: Record<SupplierType, string>;
  action: { label: string; icon: LucideIcon }; emptyTitle: string; emptyDescription: string; dialog: (order: PurchaseOrder, type: SupplierType, close: () => void) => ReactNode;
}) {
  const types = useSupplierTypeTabs(viewPermissions);
  const list = usePurchaseOrders({ type: types.kind, status, audit });
  const [open, setOpen] = useState<PurchaseOrder | null>(null);
  const permission = types.kind === null ? "" : actionPermissions[types.kind];
  const rowAction = useMemo(() => ({ ...action, permission, onSelect: setOpen }), [action, permission]);
  if (types.kind === null) return <NoAccess />;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PROCUREMENT</p><h1 className="text-xl font-semibold">{title}</h1><p className="text-sm text-muted-foreground">{summary}</p></div>
      <div className="flex flex-wrap items-center gap-3">{toolbar}<SupplierTypeSwitch tabs={types} /></div>
    </div>
    <PurchaseOrdersTable label={title} rows={list.rows} search={list.search} action={rowAction} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
    {open ? dialog(open, types.kind, () => setOpen(null)) : null}
  </section>;
}
