import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { purchaseOrderSchema } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { useGetApiV1ProcurementPurchaseOrderByPurchaseOrderIdQuery } from "@/modules/purchase-orders/api/order-api";
import { ReviseOrder } from "@/modules/purchase-orders/components/revise-order";
import { audit, orderListPath, orderPath, orderStatus, reviseOrderPermissions } from "@/modules/purchase-orders/lib/purchase-order-access";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";

function Revise({ id }: { id: string }) {
  const { has } = useAccess();
  const [params] = useSearchParams();
  const query = useGetApiV1ProcurementPurchaseOrderByPurchaseOrderIdQuery({ ...audit, purchaseOrderId: id });
  const order = useMemo(() => { const parsed = purchaseOrderSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading purchase order" />;
  if (!order) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Purchase order unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned an order the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={orderListPath}>Order list</Link></Button></div></div>;
  const type = order.supplier.type ?? (params.get("type") === "1" ? 1 : 0);
  // The page is reached by address as well as by its button, so it applies the button's rule itself.
  if (!has(reviseOrderPermissions[type])) return <NoAccess />;
  if (order.status !== orderStatus.sent) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">This order cannot be revised</h1><p className="text-sm text-muted-foreground">Only an order that has been sent to its supplier can be revised.</p>
    <Button asChild size="sm"><Link to={orderPath(order.id, type)}>Back to the order</Link></Button></div>;
  // Not keyed by revision: moving a line saves a revision while its dialog is still open, and the page must not start over under it.
  return <ReviseOrder key={order.id} order={order} type={type} />;
}

export default function RevisePurchaseOrderPage() {
  const { id } = useParams();
  return id ? <Revise id={id} /> : null;
}
