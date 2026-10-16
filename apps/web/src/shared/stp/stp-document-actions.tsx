import { useState } from "react";
import { Check, FilePlus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import type { PermissionRequirement } from "@/shared/auth/access";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DocumentStatus, type StpDocument, type StpOwnerType } from "./stp-document";
import { stpAudit, stpDocumentApi, stpDocumentExtraApi } from "./stp-document-api";
import { ReviseDialog, SignatureDialog } from "./stp-document-dialogs";

type Open = "submit" | "review" | "approve" | "reject" | "revise" | null;

/**
 * The next steps of a document's review, as its status allows: submit a draft, record the review, approve,
 * reject (back to draft), or start a new draft of an approved document. Review, approval and rejection are signed.
 * The server also refuses an approver who wrote or reviewed the version.
 */
export function StpDocumentActions({ document, ownerType, ownerId, require }: { document: StpDocument; ownerType: StpOwnerType; ownerId: string; require: PermissionRequirement }) {
  const [open, setOpen] = useState<Open>(null);
  const permission = usePermissionAction(require);
  const [submit] = stpDocumentApi.usePostApiV1StpDocumentsDocumentsByDocumentIdSubmitReviewMutation();
  const [approve] = stpDocumentApi.usePostApiV1StpDocumentsDocumentsByDocumentIdApproveMutation();
  const [reject] = stpDocumentApi.usePostApiV1StpDocumentsDocumentsByDocumentIdRejectMutation();
  const [review] = stpDocumentExtraApi.useReviewStpDocumentMutation();
  const [upload] = stpDocumentExtraApi.useUploadStpDocumentVersionMutation();
  const documentId = document.id;
  const close = () => setOpen(null);
  const sign = (action: "review" | "approve" | "reject", done: string) => async (values: { password: string; meaning: string }) => {
    const denied = permission.check();
    if (denied) return denied;
    const body = { password: values.password, meaning: values.meaning.trim() };
    const result = action === "review" ? await review({ documentId, body })
      : action === "approve" ? await approve({ ...stpAudit, documentId, domainEntitiesStpDocumentsSubmitStpDocumentVersionRequest: body })
      : await reject({ ...stpAudit, documentId, domainEntitiesStpDocumentsSubmitStpDocumentVersionRequest: body });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success(done);
    close();
    return null;
  };
  const status = document.status;
  return <PermissionGuard require={require}>
    {status === DocumentStatus.Draft ? <Button onClick={() => setOpen("submit")}><Send />Submit for review</Button> : null}
    {status === DocumentStatus.InReview || status === DocumentStatus.Reviewed ? <Button variant="outline" className="text-destructive" onClick={() => setOpen("reject")}><X />Reject</Button> : null}
    {status === DocumentStatus.InReview ? <Button onClick={() => setOpen("review")}><Check />Record review</Button> : null}
    {status === DocumentStatus.Reviewed ? <Button onClick={() => setOpen("approve")}><Check />Approve</Button> : null}
    {status === DocumentStatus.Approved ? <Button variant="outline" onClick={() => setOpen("revise")}><FilePlus />Start new draft</Button> : null}
    {open === "submit" ? <ConfirmActionDialog require={require} destructive={false} title="Submit for review?" description="The draft is locked while it is reviewed. A reviewer signs it, then an approver who is neither its author nor its reviewer."
      confirmLabel="Submit for review" busyLabel="Submitting…" onClose={close}
      onConfirm={async () => { const result = await submit({ ...stpAudit, documentId }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Submitted for review"); close(); return null; }} /> : null}
    {open === "review" ? <SignatureDialog title="Record the review" description="Confirm that you reviewed this version. The approver must be someone else." confirmLabel="Sign review"
      placeholder="e.g. Reviewed for technical accuracy" onClose={close} onSign={sign("review", "Review recorded")} /> : null}
    {open === "approve" ? <SignatureDialog title="Approve the document" description="Approving makes this reviewed version the STP in force. You must be neither its author nor its reviewer." confirmLabel="Sign approval"
      placeholder="e.g. Approved as the effective STP" onClose={close} onSign={sign("approve", "Document approved")} /> : null}
    {open === "reject" ? <SignatureDialog destructive title="Reject the document" description="Rejecting sends this version back to draft. Say why in the signature." confirmLabel="Sign rejection"
      placeholder="e.g. Acceptance criteria need correcting" onClose={close} onSign={sign("reject", "Sent back to draft")} /> : null}
    {open === "revise" ? <ReviseDialog onClose={close} onRevise={async ({ reasonForChange, file }) => {
      const denied = permission.check();
      if (denied) return denied;
      const result = await upload({ ownerType, ownerId, file, reasonForChange });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success("New draft started");
      close();
      return null;
    }} /> : null}
  </PermissionGuard>;
}
