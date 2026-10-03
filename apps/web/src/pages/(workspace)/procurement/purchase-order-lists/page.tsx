import { useNavigate, useSearchParams } from "react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePurchaseOrders } from "@/modules/proforma-requests/hooks/use-purchase-orders";
import { OrderListTable } from "@/modules/purchase-order-lists/components/order-list-table";
import { audit, isOrderStatus, orderPath, orderStatusLabels, viewOrderPermissions, type OrderStatus } from "@/modules/purchase-orders/lib/purchase-order-access";
import { NoAccess } from "@/shared/auth/no-access";
import { SupplierTypeSwitch, useSupplierTypeTabs } from "@/shared/procurement/supplier-type";

const every = "all";
const statuses = Object.keys(orderStatusLabels).map(Number).filter(isOrderStatus);

export default function PurchaseOrderListPage() {
  const types = useSupplierTypeTabs(viewOrderPermissions);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const requested = Number(params.get("status") ?? Number.NaN);
  const status: OrderStatus | null = params.has("status") && isOrderStatus(requested) ? requested : null;
  const list = usePurchaseOrders({ type: types.kind, status, audit });
  if (types.kind === null) return <NoAccess />;
  const type = types.kind;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PROCUREMENT</p><h1 className="text-xl font-semibold">Order list</h1></div>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status === null ? every : String(status)} onValueChange={(value) => setParams((current) => { const next = new URLSearchParams(current); if (value === every) next.delete("status"); else next.set("status", value); return next; }, { replace: true })}>
          <SelectTrigger aria-label="Status" className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={every}>Every status</SelectItem>{statuses.map((value) => <SelectItem key={value} value={String(value)}>{orderStatusLabels[value]}</SelectItem>)}</SelectContent>
        </Select>
        <SupplierTypeSwitch tabs={types} />
      </div>
    </div>
    <OrderListTable rows={list.rows} search={list.search} filtered={status !== null} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      onOpen={(row) => void navigate(orderPath(row.id, type))} />
  </section>;
}
