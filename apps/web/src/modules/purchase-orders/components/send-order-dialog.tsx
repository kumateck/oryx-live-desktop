import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formDate, utcBoundary } from "@/shared/format/date-boundary";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { usePostApiV1ProcurementPurchaseOrderByPurchaseOrderIdMutation } from "../api/order-api";
import { audit, sendOrderPermissions } from "../lib/purchase-order-access";
import { sendOrderSchema, type SendOrderValues } from "../schemas/order-form-schema";
import { ReviewOrderDialog } from "./review-order-dialog";

function startOfToday(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); }

/** An approved order to send to its supplier. The server emails the order as a PDF and records when delivery is expected. */
export function SendOrderDialog({ order, type, onClose }: { order: PurchaseOrder; type: SupplierType; onClose: () => void }) {
  const { has } = useAccess();
  const [send] = usePostApiV1ProcurementPurchaseOrderByPurchaseOrderIdMutation();
  const [today] = useState(startOfToday);
  const estimated = formDate(order.estimatedDelivery);
  // The date from the proforma invoice is offered, unless it has already passed.
  const form = useForm<SendOrderValues>({ resolver: zodResolver(sendOrderSchema), defaultValues: estimated && estimated >= today ? { expectedDelivery: estimated } : {} });
  const [fields] = useState((): WizardField<SendOrderValues>[] => [{ type: InputTypes.DATE, name: "expectedDelivery", label: "Expected delivery", required: true, minDate: today }]);
  const maySend = has(sendOrderPermissions[type]);
  return <ReviewOrderDialog order={order} type={type} title="Send purchase order" description="The supplier is emailed this order. It is then recorded as sent and can be invoiced against."
    action={maySend ? { label: "Send order by email", busyLabel: "Sending…" } : null} onClose={onClose}
    block={maySend && !order.supplier.email ? "This supplier has no email address. Add one on the supplier's record, then send the order." : null}
    onAct={async () => {
      if (!await form.trigger()) return null;
      const result = await send({ ...audit, purchaseOrderId: order.id, domainEntitiesPurchaseOrdersRequestSendPurchaseOrderRequest: { expectedDeliveryDate: utcBoundary(form.getValues("expectedDelivery")) } });
      // The server records the order as sent before it emails it, so a failure here may still have moved the order on.
      if ("error" in result) return `${apiErrorMessage(result.error)} The order may already be recorded as sent; check it in the order list before trying again.`;
      toast.success("Purchase order sent", { description: `Emailed to ${order.supplier.email ?? order.supplier.name}.` });
      onClose();
      return null;
    }}>
    {maySend ? <FormWizard form={form} fields={fields} className="md:grid-cols-2" /> : null}
  </ReviewOrderDialog>;
}
