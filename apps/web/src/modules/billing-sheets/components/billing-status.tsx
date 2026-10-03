import { Badge } from "@/components/ui/badge";
import { chargeState, chargeStateLabels } from "../lib/billing-rules";

/** Whether a sheet is approved, and whether its charges are settled. */
export function BillingSheetStatus({ sheet }: { sheet: { approved: boolean; status: number } }) {
  if (sheet.status === 2) return <Badge>Paid</Badge>;
  return sheet.approved ? <Badge variant="secondary">Approved</Badge> : <Badge variant="outline">Awaiting approval</Badge>;
}

export function ChargeStateBadge({ charge }: { charge: { paid: boolean; paymentStatus: number | null } }) {
  const state = chargeState(charge);
  return <Badge variant={state === "paid" ? "default" : state === "awaiting" ? "secondary" : state === "rejected" ? "destructive" : "outline"}>{chargeStateLabels[state]}</Badge>;
}
