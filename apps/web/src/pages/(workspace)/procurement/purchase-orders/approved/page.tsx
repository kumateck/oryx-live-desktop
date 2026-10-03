import { Send } from "lucide-react";
import { OrderStagePage } from "@/modules/purchase-orders/components/order-stage-page";
import { SendOrderDialog } from "@/modules/purchase-orders/components/send-order-dialog";
import { orderStatus, sendOrderPermissions, viewApprovedPermissions } from "@/modules/purchase-orders/lib/purchase-order-access";

const action = { label: "Review and send", icon: Send };

export default function ApprovedPurchaseOrdersPage() {
  return <OrderStagePage title="Approved purchase orders" summary="Approved orders waiting to be sent to their supplier." status={orderStatus.approved}
    viewPermissions={viewApprovedPermissions} actionPermissions={sendOrderPermissions} action={action} emptyTitle="No approved orders waiting" emptyDescription="Orders appear here once they are approved."
    dialog={(order, type, close) => <SendOrderDialog key={order.id} order={order} type={type} onClose={close} />} />;
}
