import { FilePenLine } from "lucide-react";
import { FinaliseOrderDialog } from "@/modules/purchase-orders/components/finalise-order-dialog";
import { OrderStagePage } from "@/modules/purchase-orders/components/order-stage-page";
import { finaliseOrderPermissions, orderStatus, viewOrderPermissions } from "@/modules/purchase-orders/lib/purchase-order-access";

const action = { label: "Finalise order", icon: FilePenLine };

export default function FinalisePurchaseOrdersPage() {
  return <OrderStagePage title="Create purchase orders" summary="Orders whose proforma invoice is in, waiting for their charges and total." status={orderStatus.proformaReceived}
    viewPermissions={viewOrderPermissions} actionPermissions={finaliseOrderPermissions} action={action} emptyTitle="No orders to finalise" emptyDescription="Orders appear here once their proforma invoice is recorded."
    dialog={(order, type, close) => <FinaliseOrderDialog key={order.id} order={order} type={type} onClose={close} />} />;
}
