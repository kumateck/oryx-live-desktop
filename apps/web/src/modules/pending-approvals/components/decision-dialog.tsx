import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1ApprovalApproveByModelTypeAndModelIdMutation, usePostApiV1ApprovalRejectByModelTypeAndModelIdMutation } from "../api/approval-api";
import { audit, decisionProblem, documentLabel, type Decision } from "../lib/approval-documents";
import type { PendingApproval } from "../schemas/approval-schema";

/** Records the signed-in user's decision on a request. A rejection has to say why. */
export function DecisionDialog({ approval, decision, onClose, onDone }: { approval: PendingApproval; decision: Decision; onClose: () => void; onDone: () => void }) {
  const [approve, approving] = usePostApiV1ApprovalApproveByModelTypeAndModelIdMutation();
  const [reject, rejecting] = usePostApiV1ApprovalRejectByModelTypeAndModelIdMutation();
  const [comments, setComments] = useState("");
  const [problem, setProblem] = useState("");
  const [message, setMessage] = useState("");
  const field = useId();
  const busy = approving.isLoading || rejecting.isLoading;
  const name = `${documentLabel(approval.type).toLowerCase()}${approval.code ? ` ${approval.code}` : ""}`;
  const rejectingIt = decision === "reject";

  const submit = async () => {
    const invalid = decisionProblem(decision, comments);
    setProblem(invalid ?? ""); setMessage("");
    if (invalid) return;
    const arg = { ...audit, modelType: approval.type, modelId: approval.id, domainEntitiesApprovalsApprovalRequestBody: { comments: comments.trim() || null } };
    const result = rejectingIt ? await reject(arg) : await approve(arg);
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(rejectingIt ? "Request rejected" : "Request approved", { description: `${name.charAt(0).toUpperCase()}${name.slice(1)}` });
    onDone();
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>{rejectingIt ? "Reject" : "Approve"} {name}?</DialogTitle>
        <DialogDescription>{rejectingIt ? "The request goes back to the person who made it, with your reason. This cannot be undone." : "Your approval is recorded under your name and the request moves to its next stage. This cannot be undone."}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void submit(); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-2">
          <label htmlFor={field} className="text-sm font-medium">{rejectingIt ? "Reason for rejecting" : "Comment (optional)"}{rejectingIt ? <span aria-hidden="true" className="text-destructive"> *</span> : null}</label>
          <Textarea id={field} rows={4} value={comments} disabled={busy} required={rejectingIt} aria-invalid={problem ? true : undefined} aria-describedby={problem ? `${field}-problem` : undefined} onChange={(event) => { setComments(event.target.value); if (problem) setProblem(""); }} />
          {problem ? <p id={`${field}-problem`} role="alert" className="text-sm text-destructive">{problem}</p> : null}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={rejectingIt ? "destructive" : "default"} disabled={busy}>{busy ? <><Spinner />Saving…</> : rejectingIt ? "Reject request" : "Approve request"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
