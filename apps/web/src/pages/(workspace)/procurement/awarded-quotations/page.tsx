import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { ProformaRequestDialog } from "@/modules/proforma-requests/components/proforma-request-dialog";
import { PurchaseOrdersTable } from "@/modules/proforma-requests/components/purchase-orders-table";
import { usePurchaseOrders } from "@/modules/proforma-requests/hooks/use-purchase-orders";
import { audit, purchaseOrderStatus, sendProformaRequestPermissions, viewProformaRequestPermissions } from "@/modules/proforma-requests/lib/proforma-request-access";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { NoAccess } from "@/shared/auth/no-access";
import { SupplierTypeSwitch, useSupplierTypeTabs } from "@/shared/procurement/supplier-type";

export default function ProformaRequestsPage() {
  const types = useSupplierTypeTabs(viewProformaRequestPermissions);
  const list = usePurchaseOrders({ type: types.kind, status: purchaseOrderStatus.new, audit });
  const [open, setOpen] = useState<PurchaseOrder | null>(null);
  const permission = types.kind === null ? "" : sendProformaRequestPermissions[types.kind];
  const action = useMemo(() => ({ label: "Review and send", icon: Send, permission, onSelect: setOpen }), [permission]);
  if (types.kind === null) return <NoAccess />;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PROCUREMENT</p><h1 className="text-xl font-semibold">Proforma requests</h1>
        <p className="text-sm text-muted-foreground">Awarded orders whose supplier has not yet been asked for a proforma invoice.</p></div>
      <SupplierTypeSwitch tabs={types} />
    </div>
    <PurchaseOrdersTable label="Proforma requests" rows={list.rows} search={list.search} action={action} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      emptyTitle="No orders waiting" emptyDescription="Orders appear here once suppliers are chosen in price comparison." />
    {open ? <ProformaRequestDialog order={open} onClose={() => setOpen(null)} /> : null}
  </section>;
}
