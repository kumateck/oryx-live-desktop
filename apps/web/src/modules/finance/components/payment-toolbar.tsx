import { lazy, Suspense, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { financePermissions } from "../lib/access";
const RecordPaymentDialog = lazy(() => import("./record-payment-dialog").then((module) => ({ default: module.RecordPaymentDialog })));
export function PaymentToolbar() {
  const { has } = useAccess(); const [receipt, setReceipt] = useState<boolean | null>(null);
  return <div className="flex flex-wrap gap-2">
    {has(financePermissions.view) ? <Button asChild variant="outline"><Link to="/finance/payments">Payments &amp; receipts</Link></Button> : null}
    {has(financePermissions.approve) ? <Button asChild variant="outline"><Link to="/finance/payment-approvals">My payment approvals</Link></Button> : null}
    {has(financePermissions.reports) ? <Button asChild variant="outline"><Link to="/finance/cashflow">Cashflow</Link></Button> : null}
    {has(financePermissions.record) ? <><Button variant="outline" onClick={() => setReceipt(true)}>Record receipt</Button><Button onClick={() => setReceipt(false)}>Record payment</Button></> : null}
    {receipt !== null ? <Suspense fallback={<p role="status">Loading payment form…</p>}><RecordPaymentDialog receipt={receipt} onClose={() => setReceipt(null)} /></Suspense> : null}
  </div>;
}
