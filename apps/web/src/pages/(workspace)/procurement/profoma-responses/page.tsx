import { useMemo, useState } from "react";
import { Paperclip } from "lucide-react";
import { PurchaseOrdersTable } from "@/modules/proforma-requests/components/purchase-orders-table";
import { usePurchaseOrders } from "@/modules/proforma-requests/hooks/use-purchase-orders";
import { purchaseOrderStatus } from "@/modules/proforma-requests/lib/proforma-request-access";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { ProformaInvoiceDialog } from "@/modules/proforma-responses/components/proforma-invoice-dialog";
import { audit, recordProformaPermissions, viewProformaResponsePermissions } from "@/modules/proforma-responses/lib/proforma-response-access";
import { NoAccess } from "@/shared/auth/no-access";
import { SupplierTypeSwitch, useSupplierTypeTabs } from "@/shared/procurement/supplier-type";

export default function ProformaResponsesPage() {
  const types = useSupplierTypeTabs(viewProformaResponsePermissions);
  const list = usePurchaseOrders({ type: types.kind, status: purchaseOrderStatus.proformaRequested, audit });
  const [open, setOpen] = useState<PurchaseOrder | null>(null);
  const permission = types.kind === null ? "" : recordProformaPermissions[types.kind];
  const action = useMemo(() => ({ label: "Record proforma invoice", icon: Paperclip, permission, onSelect: setOpen }), [permission]);
  if (types.kind === null) return <NoAccess />;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PROCUREMENT</p><h1 className="text-xl font-semibold">Proforma responses</h1>
        <p className="text-sm text-muted-foreground">Orders waiting for the supplier's proforma invoice to be recorded.</p></div>
      <SupplierTypeSwitch tabs={types} />
    </div>
    <PurchaseOrdersTable label="Proforma responses" rows={list.rows} search={list.search} action={action} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      emptyTitle="No proforma invoices awaited" emptyDescription="Orders appear here once the supplier has been asked for a proforma invoice." />
    {open ? <ProformaInvoiceDialog key={open.id} order={open} onClose={() => setOpen(null)} /> : null}
  </section>;
}
