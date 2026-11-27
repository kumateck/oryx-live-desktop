import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionDialog } from "@/shared/actions";
import { formsApi, type DomainEntitiesFormsResponseDetailDto as ResponseDetail } from "@/shared/api/generated/forms";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { useAccess } from "@/shared/auth/use-access";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import type { FormSectionDto } from "./dto";
import { recheckCompliance, type CoaComplianceItem, type RecheckedCompliance } from "./raw-data/coa-compliance";
import CoaComplianceControl from "./raw-data/coa-compliance-control";

const edits = [
  { permission: "CanEditProductCertificateOfAnalysis", endpoint: formsApi.endpoints.savePendingProductCertificate },
  { permission: "CanEditRawMaterialCertificateOfAnalysis", endpoint: formsApi.endpoints.savePendingRawMaterialCertificate },
  { permission: "CanEditPackagingMaterialCertificateOfAnalysis", endpoint: formsApi.endpoints.savePendingPackagingMaterialCertificate },
] as const;
const requests = [
  [{ permission: "CanRequestProductCertificateReview", endpoint: formsApi.endpoints.requestProductCertificateReview },
    { permission: "CanRequestProductCertificateCorrection", endpoint: formsApi.endpoints.requestProductCertificateCorrection }],
  [{ permission: "CanRequestRawMaterialCertificateReview", endpoint: formsApi.endpoints.requestRawMaterialCertificateReview },
    { permission: "CanRequestRawMaterialCertificateCorrection", endpoint: formsApi.endpoints.requestRawMaterialCertificateCorrection }],
  [{ permission: "CanRequestPackagingMaterialCertificateReview", endpoint: formsApi.endpoints.requestPackagingMaterialCertificateReview },
    { permission: "CanRequestPackagingMaterialCertificateCorrection", endpoint: formsApi.endpoints.requestPackagingMaterialCertificateCorrection }],
] as const;
type CertificateKind = 0 | 1 | 2;
const kind = (value: number | null | undefined): CertificateKind | null => value === 0 || value === 1 || value === 2 ? value : null;
const pending = (response: ResponseDetail | null | undefined) =>
  Boolean(response?.id && response.checkedAt && response.hasPendingApproval && !response.approved && !response.rejected);

export function CertificateChangeRequestNotice({ response }: { response: ResponseDetail | null | undefined }) {
  if (!response?.coaReturnKind) return null;
  return <div role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
    <p className="font-semibold">{response.coaReturnKind === 1 ? "Review requested" : "Correction requested"}</p>
    <p className="whitespace-pre-wrap break-words">{response.coaReturnReason}</p>
    <p className="mt-1">Approval resumes when the preparer resubmits this certificate.</p>
  </div>;
}

export function PendingCertificateEditButton({ response, sections, compliance, rechecked = [], onSaved }: {
  response: ResponseDetail | null | undefined;
  sections: readonly FormSectionDto[];
  /** The decisions saved on the certificate. */
  compliance: readonly CoaComplianceItem[];
  /** The compliance check run again on the current results and specification, as generating the certificate does. */
  rechecked?: readonly CoaComplianceItem[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  const { has } = useAccess();
  const subject = kind(response?.coaSubjectKind);
  if (!response?.id || subject === null || !pending(response) || !user?.id
    || !has(edits[subject].permission)) return null;
  if (response.checkedBy?.id !== user.id) return <p role="status" className="text-sm text-muted-foreground">
    Only the original preparer can edit this pending certificate. An assigned approver can request a correction.
  </p>;
  return <>
    <Button type="button" onClick={() => setOpen(true)}>{response.coaReturnKind ? "Review and resubmit" : "Edit COA"}</Button>
    {open ? <CertificateEditDialog response={response} id={response.id} subject={subject} sections={sections} compliance={recheckCompliance(compliance, rechecked)}
      onClose={() => setOpen(false)} onSaved={onSaved} /> : null}
  </>;
}

function CertificateEditDialog({ response, id, subject, sections, compliance, onClose, onSaved }: {
  response: ResponseDetail; id: string; subject: CertificateKind; sections: readonly FormSectionDto[];
  compliance: readonly RecheckedCompliance[]; onClose: () => void; onSaved: () => void;
}) {
  const action = edits[subject];
  const permission = usePermissionAction(action.permission);
  const dispatch = useApiDispatch();
  const fields = useId();
  const [version] = useState(response.coaVersion ?? 0);
  const [notes, setNotes] = useState(response.certificateNotes ?? "");
  const [reason, setReason] = useState("");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const editable = compliance.filter((item): item is RecheckedCompliance & { formSectionId: string } =>
    Boolean(item.formSectionId) && !item.reportingLocked && sections.some(section => section.id === item.formSectionId));
  return <ConfirmActionDialog require={action.permission} destructive={false} title="Edit certificate"
    description="Saving sends the certificate back through approval."
    confirmLabel="Save and resubmit" busyLabel="Saving…" onClose={onClose} onConfirm={async () => {
      const denied = permission.check();
      if (denied) return denied;
      if (!reason.trim()) return "Enter a reason for the resubmission.";
      const result = await dispatch(action.endpoint.initiate({ responseId: id, domainEntitiesFormsSavePendingCertificate: {
        version, reason: reason.trim(), notes: notes.trim(),
        // Every test shown is sent, so the re-checked decisions are saved even when nobody changes them.
        compliance: editable.map(item => ({ formSectionId: item.formSectionId, complies: overrides[item.formSectionId] ?? item.complies ?? false })),
      } }, { track: false }));
      if ("error" in result) return apiErrorMessage(result.error);
      refreshCertificate(dispatch, id);
      onSaved();
      toast.success("Certificate resubmitted for approval");
      return null;
    }}>
    <div className="space-y-3">
      <CertificateChangeRequestNotice response={response} />
      {compliance.flatMap(item => {
        const sectionId = item.formSectionId;
        if (!sectionId || item.reportingLocked) return [];
        const section = sections.find(entry => entry.id === sectionId);
        if (!section) return [];
        return [<fieldset key={sectionId} className="space-y-2 rounded-md border p-3">
          <legend className="px-1 text-sm font-semibold"><RichTextView html={section.name || "Test"} /></legend>
          <CoaComplianceControl formSectionId={`${fields}-${sectionId}`} complies={overrides[sectionId] ?? item.complies ?? false}
            onComplianceChange={(_, complies) => setOverrides(current => ({ ...current, [sectionId]: complies }))} />
          {item.saved !== undefined && overrides[sectionId] === undefined ? <p className="text-xs text-muted-foreground">
            Re-checked against the specification: saved as {item.saved ? "complies" : "does not comply"}.</p> : null}
        </fieldset>];
      })}
      <div className="space-y-2"><Label htmlFor={`${fields}-notes`}>Certificate notes</Label>
        <Textarea id={`${fields}-notes`} value={notes} maxLength={2000} onChange={event => setNotes(event.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor={`${fields}-reason`}>Reason for resubmission</Label>
        <Textarea id={`${fields}-reason`} value={reason} maxLength={2000} onChange={event => setReason(event.target.value)} /></div>
    </div>
  </ConfirmActionDialog>;
}

export function CertificateRequestButtons({ response, onRequested }: { response: ResponseDetail | null | undefined; onRequested: () => void }) {
  const [choice, setChoice] = useState<0 | 1 | null>(null);
  const { has } = useAccess();
  const subject = kind(response?.coaSubjectKind);
  if (!response?.id || subject === null || !pending(response) || response.coaReturnKind) return null;
  const [review, correction] = requests[subject];
  return <>
    {has(review.permission) ? <Button type="button" variant="outline" size="sm" onClick={() => setChoice(0)}>Request review</Button> : null}
    {has(correction.permission) ? <Button type="button" variant="outline" size="sm" onClick={() => setChoice(1)}>Request correction</Button> : null}
    {choice !== null ? <CertificateRequestDialog key={choice} choice={choice} subject={subject} id={response.id} version={response.coaVersion ?? 0}
      onClose={() => setChoice(null)} onRequested={onRequested} /> : null}
  </>;
}

function CertificateRequestDialog({ choice, subject, id, version, onClose, onRequested }: {
  choice: 0 | 1; subject: CertificateKind; id: string; version: number; onClose: () => void; onRequested: () => void;
}) {
  const action = requests[subject][choice];
  const permission = usePermissionAction(action.permission);
  const dispatch = useApiDispatch();
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const label = choice === 0 ? "Request review" : "Request correction";
  return <ConfirmActionDialog require={action.permission} destructive={false} title={label}
    description="The preparer will receive your request. Approval pauses until they resubmit the certificate."
    confirmLabel={label} busyLabel="Sending…" onClose={onClose} onConfirm={async () => {
      const denied = permission.check();
      if (denied) return denied;
      if (!reason.trim()) return "Enter what the preparer needs to address.";
      const result = await dispatch(action.endpoint.initiate({ responseId: id, domainEntitiesFormsRequestCertificateChange: { version, reason: reason.trim() } }, { track: false }));
      if ("error" in result) return apiErrorMessage(result.error);
      refreshCertificate(dispatch, id);
      toast.success(choice === 0 ? "Review requested" : "Correction requested");
      onRequested();
      return null;
    }}>
    <div className="space-y-2"><Label htmlFor={reasonId}>Reason</Label>
      <Textarea id={reasonId} value={reason} maxLength={2000} onChange={event => setReason(event.target.value)} /></div>
  </ConfirmActionDialog>;
}

function refreshCertificate(dispatch: ReturnType<typeof useApiDispatch>, id: string) {
  dispatch(formsApi.util.invalidateTags([
    { type: "form/response", id }, { type: "approval/my-pending", id: "LIST" },
    { type: "approval/my-pending", id: "Response" }, { type: "approval", id: "LIST" },
  ]));
}
