import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { Payment } from "../api/finance-api";
import { financePermissions } from "../lib/access";
import { PaymentStatus } from "../lib/payments";
import { usePaymentReview } from "../hooks/use-payment-review";
import { reviewSchema, type ReviewValues } from "../schemas/payment-schema";
const fields: WizardField<ReviewValues>[] = [{ type: InputTypes.TEXTAREA, name: "comments", label: "Review comments", rows: 3 }];
export function PaymentReview({ payment }: { payment: Payment }) {
  const action = usePaymentReview(payment);
  const form = useForm<ReviewValues>({ resolver: zodResolver(reviewSchema), defaultValues: { comments: "" } });
  const [decision, setDecision] = useState<{ status: PaymentStatus.Approved | PaymentStatus.Rejected; comments: string; evidence: Payment } | null>(null);
  const choose = (status: PaymentStatus.Approved | PaymentStatus.Rejected) => form.handleSubmit(({ comments }) => {
    if (status === PaymentStatus.Rejected && comments.length < 3) { form.setError("comments", { message: "Give a reason for rejecting this entry." }); return; }
    setDecision({ status, comments, evidence: structuredClone(payment) });
  });
  if (!action.allowed) return null;
  return <section className="space-y-3 border-t pt-4"><h2 className="font-semibold">Review active stage</h2>
    <p className="text-sm text-muted-foreground">Only the assigned user or role can decide the active stage. Your decision is recorded in the approval history.</p>
    {action.blocked ? <p role="status">{action.blocked}</p> : <><FormWizard form={form} fields={fields} />
      <div className="flex flex-wrap gap-2"><Button variant="destructive" onClick={() => void choose(PaymentStatus.Rejected)()}>Reject</Button><Button onClick={() => void choose(PaymentStatus.Approved)()}>Approve stage</Button></div></>}
    {decision ? <ConfirmActionDialog require={financePermissions.approve} destructive={decision.status === PaymentStatus.Rejected} title={decision.status === PaymentStatus.Approved ? "Approve this payment stage?" : "Reject this payment?"}
      description={decision.comments || "Your decision will be recorded against the active payment approval stage."} confirmLabel={decision.status === PaymentStatus.Approved ? "Approve stage" : "Reject payment"} busyLabel="Recording decision…" onClose={() => setDecision(null)}
      onConfirm={async () => { const error = await action.decide(decision.status, decision.comments, decision.evidence); if (!error) { toast.success(decision.status === PaymentStatus.Approved ? "Approval stage approved" : "Payment rejected"); form.reset(); } return error; }} /> : null}
  </section>;
}
