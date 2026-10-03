import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { purchaseOrderSchema } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { useGetApiV1ProcurementPurchaseOrderByPurchaseOrderIdQuery } from "@/modules/purchase-orders/api/order-api";
import { OrderDetail } from "@/modules/purchase-orders/components/order-detail";
import { audit, orderListPath, orderStatus, viewApprovedPermissions, viewOrderPermissions } from "@/modules/purchase-orders/lib/purchase-order-access";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";

function Order({ id }: { id: string }) {
  const { has } = useAccess();
  const [params] = useSearchParams();
  const query = useGetApiV1ProcurementPurchaseOrderByPurchaseOrderIdQuery({ ...audit, purchaseOrderId: id });
  const order = useMemo(() => { const parsed = purchaseOrderSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading purchase order" />;
  if (!order) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Purchase order unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned an order the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button>
      <Button asChild size="sm"><Link to={orderListPath}>Order list</Link></Button></div></div>;
  // The supplier decides whether the order is foreign or local; the address is only believed when the order does not say.
  const type = order.supplier.type ?? (params.get("type") === "1" ? 1 : 0);
  // An approved order may also be opened by someone who only sees approved orders.
  if (!has(viewOrderPermissions[type]) && !(order.status >= orderStatus.approved && has(viewApprovedPermissions[type]))) return <NoAccess />;
  return <OrderDetail order={order} type={type} />;
}

export default function PurchaseOrderPage() {
  const { id } = useParams();
  return id ? <Order id={id} /> : null;
}
