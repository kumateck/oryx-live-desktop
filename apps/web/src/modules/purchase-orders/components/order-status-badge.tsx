import { Badge } from "@/components/ui/badge";
import { isOrderStatus, orderStatus, orderStatusLabels } from "../lib/purchase-order-access";

export function OrderStatusBadge({ status }: { status: number }) {
  if (!isOrderStatus(status)) return <Badge variant="outline">Unknown</Badge>;
  const variant = status === orderStatus.cancelled ? "destructive" : status === orderStatus.sent || status === orderStatus.invoiced || status === orderStatus.approved ? "default"
    : status === orderStatus.awaitingCheck || status === orderStatus.checked || status === orderStatus.revised ? "secondary" : "outline";
  return <Badge variant={variant}>{orderStatusLabels[status]}</Badge>;
}
