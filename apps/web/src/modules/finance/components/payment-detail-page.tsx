import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMoney } from "@/shared/procurement/price";
import { financeApi } from "../api/finance-api";
import { financeAudit } from "../lib/access";
import { labelFor, methods, payableTypes, PaymentStatus, statuses } from "../lib/payments";
import { PaymentReview } from "./payment-review";
function PaymentDetail({ id, approval }: { id: string; approval: boolean }) {
  const regular = financeApi.useGetApiV1PaymentsByPaymentIdQuery({ ...financeAudit, paymentId: id }, { skip: approval, refetchOnMountOrArgChange: true });
  const assigned = financeApi.useGetApiV1PaymentsByPaymentIdApprovalDetailsQuery({ ...financeAudit, subModule: "Payment approval", paymentId: id }, { skip: !approval, refetchOnMountOrArgChange: true });
  const query = approval ? assigned : regular; const payment = query.currentData;
  if (query.isLoading) return <DetailPageSkeleton label="Loading payment" groups={4} />;
  if (query.error || !payment?.id || payment.id !== id) return <section role="alert" className="space-y-3"><h1 className="font-semibold">Payment unavailable</h1><p>{query.error ? apiErrorMessage(query.error) : "The server did not return this payment."}</p><Button variant="outline" onClick={() => void query.refetch()}>Retry</Button></section>;
  return <article className="space-y-4"><PageHeader title={`${payment.payableType === 3 ? "Receipt" : "Payment"} ${payment.reference ?? ""}`} crumbs={[{ label: approval ? "My payment approvals" : "Payments & receipts", to: approval ? "/finance/payment-approvals" : "/finance/payments" }, { label: payment.reference ?? "Details" }]} />
    <Badge variant={payment.status === PaymentStatus.Rejected ? "destructive" : "outline"}>{labelFor(statuses, payment.status)}</Badge>
    <KeyFacts><KeyFact label="Amount" value={formatMoney(payment.amount, payment.currency?.name)} /><KeyFact label="Payment date" value={formatDate(payment.paymentDate) ?? "Not recorded"} /><KeyFact label="Method" value={labelFor(methods, payment.method)} /><KeyFact label="Document type" value={labelFor(payableTypes, payment.payableType)} /><KeyFact label="Recorded by" value={[payment.recordedBy?.firstName, payment.recordedBy?.lastName].filter(Boolean).join(" ") || "Not recorded"} /></KeyFacts>
    <dl className="space-y-2"><div><dt className="text-muted-foreground">Document ID</dt><dd className="break-all">{payment.payableId ?? "Not recorded"}</dd></div><div><dt className="text-muted-foreground">Notes</dt><dd className="whitespace-pre-wrap break-words">{payment.notes || "No notes recorded."}</dd></div></dl>
    <section className="space-y-3"><h2 className="font-semibold">Approval history</h2>
      {!payment.approvals?.length ? <p className="text-sm text-muted-foreground">{payment.status === PaymentStatus.Approved ? "Automatically approved because no Payment approval stages were configured when this transaction was recorded." : "No approval stages recorded."}</p> : <ol className="space-y-2">{[...payment.approvals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((stage, index) => <li key={stage.id ?? index} className="space-y-1 rounded-md border p-3"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-medium">Stage {stage.order ?? "–"}{stage.required ? " · Required" : ""}</h3><Badge variant="outline">{labelFor(statuses, stage.status)}</Badge></div><p className="text-muted-foreground">{formatDateTime(stage.approvalTime) ?? "No decision recorded"}</p>{stage.comments ? <p className="whitespace-pre-wrap break-words">{stage.comments}</p> : null}</li>)}</ol>}
    </section>
    {payment.status === PaymentStatus.Pending ? <PaymentReview payment={payment} /> : null}
  </article>;
}
export function PaymentDetailPage({ approval = false }: { approval?: boolean }) { const { id } = useParams(); return id ? <PaymentDetail key={id} id={id} approval={approval} /> : <p role="alert">Payment ID is missing.</p>; }
