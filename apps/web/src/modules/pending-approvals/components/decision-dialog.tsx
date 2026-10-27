import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DecisionEvidence } from "../api/decision-evidence";
import { useApprovalDecision } from "../hooks/use-approval-decision";
import { documentLabel, type Decision } from "../lib/approval-documents";
import type { PendingApproval } from "../schemas/approval-schema";

interface Values { comments: string; outcome: "" | "0" | "1" }
export function DecisionDialog({ approval, decision, evidence, onClose, onDone }: {
  approval: PendingApproval; decision: Decision; evidence: DecisionEvidence; onClose: () => void; onDone: () => void;
}) {
  const rejecting = decision === "reject";
  const disposition = rejecting && approval.type === "Response";
  const schema = useMemo(() => z.object({
    comments: z.string().trim().max(2000).refine((value) => !rejecting || value.length >= 3, "Say why the request is rejected"),
    outcome: z.enum(["", "0", "1"]).refine((value) => !disposition || value !== "", "Choose rework testing or disposal"),
  }), [rejecting, disposition]);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { comments: "", outcome: "" } });
  const command = useApprovalDecision(approval, decision, evidence);
  const [message, setMessage] = useState("");
  const name = `${documentLabel(approval.type)}${approval.code ? ` ${approval.code}` : ""}`;
  const fields: WizardField<Values>[] = [
    { type: InputTypes.TEXTAREA, name: "comments", label: rejecting ? "Reason for rejecting" : "Comment (optional)", required: rejecting, rows: 4 },
    ...(disposition ? [{ type: InputTypes.RADIO, name: "outcome", label: "Rejected test disposition", required: true,
      options: [{ value: "1", label: "Rework testing" }, { value: "0", label: "Dispose" }] } as const] : []),
  ];
  const submit = form.handleSubmit(async (values) => {
    const failure = await command.submit(values.comments, values.outcome === "1" ? 1 : values.outcome === "0" ? 0 : null);
    if (failure) { setMessage(failure); return; }
    toast.success(rejecting ? "Request rejected" : "Request approved");
    onDone();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !command.busy) onClose(); }}><DialogContent className="sm:max-w-xl">
    <DialogHeader><DialogTitle className="break-words">{rejecting ? "Reject" : "Approve"} {name}?</DialogTitle>
      <DialogDescription>{disposition ? "Rework creates a separate test cycle and preserves these results. Disposal records a final rejection. Choose the intended disposition explicitly."
        : "Your decision is recorded under your name. Current evidence and assignment are checked before saving."}</DialogDescription></DialogHeader>
    <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogBody><fieldset disabled={command.busy || command.attempted}><FormWizard form={form} fields={fields} /></fieldset>
        {message ? <p role="alert" className="mt-3 text-sm text-destructive">{message}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={command.busy} onClick={onClose}>Cancel</Button>
        <Button type="submit" variant={rejecting ? "destructive" : "default"} disabled={command.busy || command.attempted || !command.allowed}>{command.busy ? "Verifying…" : rejecting ? "Reject request" : "Approve request"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
