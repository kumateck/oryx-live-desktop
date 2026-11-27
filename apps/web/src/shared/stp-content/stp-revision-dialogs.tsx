import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionDialog } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RevisionStatus, type RevisionSummary } from "./stp-content";
import { stpRevisionAudit, stpRevisionKeys, type StpRevisionRoutes } from "./stp-keys";
import { useDeleteStpRevisionMutation, useReviseStpRevisionMutation, useSubmitStpRevisionMutation } from "./stp-revision-api";

type Revision = Pick<RevisionSummary, "id" | "kind" | "stpNumber" | "revisionNumber" | "status">;

/** Starts a new revision of the approved one: a higher number and the reason for the change. The content is copied. */
export function ReviseStpDialog({ current, routes, onClose }: { current: Revision; routes: StpRevisionRoutes; onClose: () => void }) {
  const keys = stpRevisionKeys(current.kind);
  const [number, setNumber] = useState(String(current.revisionNumber + 1));
  const [reason, setReason] = useState("");
  const [revise] = useReviseStpRevisionMutation();
  const permission = usePermissionAction(keys.revise);
  const navigate = useNavigate();
  return <ConfirmActionDialog require={keys.revise} destructive={false} title={`New revision of ${current.stpNumber}`}
    description={`The draft starts as a copy of revision ${String(current.revisionNumber)}, which stays current until the new one is approved.`}
    confirmLabel="Start revision" busyLabel="Starting…" onClose={onClose} onConfirm={async () => {
      const revisionNumber = Number(number);
      if (!Number.isInteger(revisionNumber) || revisionNumber <= current.revisionNumber) return `The revision number must be higher than ${String(current.revisionNumber)}.`;
      if (!reason.trim()) return "Enter the reason for the change.";
      const denied = permission.check();
      if (denied) return denied;
      const result = await revise({ ...stpRevisionAudit, domainEntitiesStpRevisionsReviseStpRevisionRequest: {
        kind: current.kind, stpNumber: current.stpNumber, revisionNumber, reasonForChange: reason.trim() } });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success("Revision started");
      void navigate(routes.draft(result.data));
      return null;
    }}>
    <div className="space-y-3">
      <div className="space-y-1.5"><Label htmlFor="stp-revise-number">Revision No.</Label>
        <Input id="stp-revise-number" inputMode="numeric" value={number} onChange={(event) => setNumber(event.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="stp-revise-reason">Reason for change</Label>
        <Textarea id="stp-revise-reason" value={reason} maxLength={2000} onChange={(event) => setReason(event.target.value)} /></div>
    </div>
  </ConfirmActionDialog>;
}

export function SubmitStpDialog({ revision, version, onClose }: { revision: Revision; version: number; onClose: () => void }) {
  const keys = stpRevisionKeys(revision.kind);
  const [submit] = useSubmitStpRevisionMutation();
  const permission = usePermissionAction(keys.submit);
  return <ConfirmActionDialog require={keys.submit} destructive={false} title="Submit for review?"
    description="The saved draft becomes the fixed revision and goes to the reviewer, then for approval. Corrections are made through its review."
    confirmLabel="Submit for review" busyLabel="Submitting…" onClose={onClose} onConfirm={async () => {
      const denied = permission.check();
      if (denied) return denied;
      const result = await submit({ ...stpRevisionAudit, id: revision.id, domainEntitiesStpRevisionsSubmitStpRevisionRequest: { version } });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success("Submitted for review");
      return null;
    }} />;
}

export function DeleteStpRevisionDialog({ revision, onClose, onDeleted }: { revision: Revision; onClose: () => void; onDeleted?: () => void }) {
  const keys = stpRevisionKeys(revision.kind);
  const draft = revision.status === RevisionStatus.Draft;
  const [reason, setReason] = useState("");
  const [remove] = useDeleteStpRevisionMutation();
  const permission = usePermissionAction(keys.delete);
  return <ConfirmActionDialog require={keys.delete} title={`Delete revision ${String(revision.revisionNumber)} of ${revision.stpNumber}?`}
    description="The revision leaves lists, reviews and approvals. Its content and history are kept. Deleting the current revision leaves the STP without approved content until another is approved."
    confirmLabel="Delete revision" busyLabel="Deleting…" onClose={onClose} onConfirm={async () => {
      const denied = permission.check();
      if (denied) return denied;
      if (draft && !reason.trim()) return "Enter a reason for deleting the draft.";
      const result = await remove({ ...stpRevisionAudit, id: revision.id, ...(reason.trim() ? { reason: reason.trim() } : {}) });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success(`Revision ${String(revision.revisionNumber)} deleted`);
      onDeleted?.();
      return null;
    }}>
    <div className="space-y-1.5"><Label htmlFor="stp-delete-reason">Reason{draft ? "" : " (optional)"}</Label>
      <Textarea id="stp-delete-reason" value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} /></div>
  </ConfirmActionDialog>;
}
