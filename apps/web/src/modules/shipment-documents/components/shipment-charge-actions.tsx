import { useEffect, useState } from "react";
import { Banknote, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddChargesDialog } from "@/modules/billing-sheets/components/add-charges-dialog";
import { ChargesPrint } from "@/modules/billing-sheets/components/charges-print";
import { PayChargesDialog } from "@/modules/billing-sheets/components/pay-charges-dialog";
import { useInvoiceBillingSheet } from "@/modules/billing-sheets/hooks/use-billing-sheets";
import { billingPermissions } from "@/modules/billing-sheets/lib/billing-access";
import { changeBlock, paymentBlock } from "@/modules/billing-sheets/lib/billing-rules";
import type { BillingSheet } from "@/modules/billing-sheets/schemas/billing-schema";
import { useAccess } from "@/shared/auth/use-access";
import type { Shipment } from "../schemas/shipment-schema";

export type ChargeAction = "pay" | "add" | "print";

/** One of the things done to a shipment's port charges, on the billing sheet it was given. */
export function ShipmentChargeDialog({ action, shipment, sheet, onClose }: { action: ChargeAction; shipment: Shipment; sheet: BillingSheet; onClose: () => void }) {
  if (action === "pay") return <PayChargesDialog sheet={sheet} onClose={onClose} />;
  if (action === "add") return <AddChargesDialog sheet={sheet} onClose={onClose} />;
  const invoice = shipment.invoice;
  return <ChargesPrint sheet={sheet} onClose={onClose} shipment={{ code: shipment.code, arrivedAt: shipment.reached[4] ?? shipment.reached[1], supplier: invoice?.supplier.name ?? null, invoiceCode: invoice?.code ?? null,
    invoiceTotal: invoice?.total ?? null, invoiceCurrency: invoice?.currency ?? null, products: [...new Set(invoice?.items.map((line) => line.materialName) ?? [])] }} />;
}

/** Opened from the shipments list, where only the shipment is known: reads its billing sheet first, then acts on it. */
export function ShipmentChargeLoader({ action, shipment, onClose, onError }: { action: ChargeAction; shipment: Shipment; onClose: () => void; onError: (message: string) => void }) {
  const billing = useInvoiceBillingSheet(shipment.invoice?.id ?? null, true);
  const failed = !billing.sheet && !billing.loading;
  // A sheet that cannot be read is said once, and the action is dropped.
  useEffect(() => { if (failed) { onError(billing.error ?? "The billing sheet of this shipment could not be read."); onClose(); } }, [failed, billing.error, onError, onClose]);
  return billing.sheet ? <ShipmentChargeDialog action={action} shipment={shipment} sheet={billing.sheet} onClose={onClose} /> : null;
}

/** Pay, add to and print a shipment's charges, from the shipment's own page. */
export function ShipmentChargeActions({ shipment, sheet }: { shipment: Shipment; sheet: BillingSheet }) {
  const { has } = useAccess();
  const [action, setAction] = useState<ChargeAction | null>(null);
  const payment = paymentBlock(sheet);
  const change = changeBlock(sheet);
  return <>
    <Button type="button" size="sm" variant="outline" onClick={() => setAction("print")}><Printer />Print charges</Button>
    {has(billingPermissions.edit) ? <Button type="button" size="sm" variant="outline" disabled={change !== null} title={change ?? undefined} onClick={() => setAction("add")}><Plus />Add charges</Button> : null}
    {has(billingPermissions.pay) ? <Button type="button" size="sm" variant="outline" disabled={payment !== null} title={payment ?? undefined} onClick={() => setAction("pay")}><Banknote />Pay charges</Button> : null}
    {action ? <ShipmentChargeDialog action={action} shipment={shipment} sheet={sheet} onClose={() => setAction(null)} /> : null}
  </>;
}
