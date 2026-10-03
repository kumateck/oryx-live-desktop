import { ClipboardCheck } from "lucide-react";
import { CheckOrderDialog } from "@/modules/purchase-orders/components/check-order-dialog";
import { OrderStagePage } from "@/modules/purchase-orders/components/order-stage-page";
import { checkOrderPermissions, orderStatus, viewOrderPermissions } from "@/modules/purchase-orders/lib/purchase-order-access";
import { DoneFilter, useDoneFilter } from "@/shared/procurement/sent-filter";

const action = { label: "Review and check", icon: ClipboardCheck };

export default function CheckPurchaseOrdersPage() {
  // A revised order has to be checked again, so it is listed here beside the new ones.
  const filter = useDoneFilter("revised");
  return <OrderStagePage title="Check purchase orders" summary={filter.done ? "Revised orders waiting to be checked again." : "Finalised orders waiting to be checked before approval."}
    status={filter.done ? orderStatus.revised : orderStatus.awaitingCheck} toolbar={<DoneFilter label="Orders to check" waiting="New" done="Revised" value={filter.done} onSelect={filter.select} />}
    viewPermissions={viewOrderPermissions} actionPermissions={checkOrderPermissions} action={action} emptyTitle="No orders to check" emptyDescription="Orders appear here once they are finalised."
    dialog={(order, type, close) => <CheckOrderDialog key={order.id} order={order} type={type} onClose={close} />} />;
}
