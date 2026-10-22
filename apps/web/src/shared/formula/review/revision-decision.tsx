import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { governanceApi, type FormulaAudit, type FormulaRevision } from "../governance-api";
import { decisionPermission, decisionProblem, sameDecisionEvidence, type RevisionStage } from "./revision-review";

const reasonSchema = z.object({ reason: z.string().trim().min(10, "Give a reason of at least 10 characters.").max(4000) });
type ReasonValues = z.infer<typeof reasonSchema>;
const fields: Record<RevisionStage, WizardField<ReasonValues>[]> = {
  review: [{ type: InputTypes.TEXTAREA, name: "reason", label: "Review findings", required: true, rows: 3, placeholder: "What you checked and why the formula is correct" }],
  approval: [{ type: InputTypes.TEXTAREA, name: "reason", label: "Reason for approval", required: true, rows: 3, placeholder: "Why this revision can be used from now on" }],
};
const copy = {
  review: { button: "Record review", busy: "Recording…", done: "Review recorded",
    title: (revision: number) => `Record your review of revision ${String(revision)}?`,
    description: "Your review and reason are recorded against this exact definition. The revision then waits for approval by someone other than you and the author." },
  approval: { button: "Approve revision", busy: "Approving…", done: "Revision approved",
    title: (revision: number) => `Approve revision ${String(revision)}?`,
    description: "This revision becomes the formula in use from now on, and any revision approved before it is retired. This cannot be undone." },
} as const;

/** Fresh copy of the revision from the server, a message saying why it could not be read, or null when it is gone. */
export type RevisionReread = () => Promise<FormulaRevision | string | null>;

/**
 * Records the independent review or the approval of a formula revision. The decision is confirmed, the revision
 * is read again just before it is sent, and nothing is sent when it changed, so a decision never applies to
 * evidence the user did not see. The server enforces the same separation of duties.
 */
export function FormulaRevisionDecision({ revision, stage, audit, reread, onDecided }: {
  revision: FormulaRevision; stage: RevisionStage; audit: FormulaAudit; reread: RevisionReread; onDecided?: ((updated: FormulaRevision) => void) | undefined;
}) {
  const { allows } = useAccess();
  const userId = useCurrentUser()?.id ?? null;
  const [recordReview] = governanceApi.useRecordFormulaReviewMutation();
  const [approve] = governanceApi.useApproveFormulaRevisionMutation();
  const [confirming, setConfirming] = useState<string | null>(null);
  const form = useForm<ReasonValues>({ resolver: zodResolver(reasonSchema), defaultValues: { reason: "" } });
  const permission = decisionPermission(stage);
  const problem = decisionProblem(revision, stage, userId);
  const text = copy[stage];
  if (problem) return <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">{problem}</p>;
  if (!allows(permission)) return <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
    You can read this revision but cannot {stage === "review" ? "record its review" : "approve it"}. Ask an administrator for that permission if you should.</p>;
  const decide = async (reason: string) => {
    const fresh = await reread();
    if (typeof fresh === "string") return fresh;
    if (!fresh) return "This revision is no longer available. Go back to the queue and open it again.";
    if (!sameDecisionEvidence(revision, fresh)) return "This revision changed after you opened it. Close this, check the revision again, then decide.";
    const refused = decisionProblem(fresh, stage, userId);
    if (refused) return refused;
    const request = { ...audit, questionId: fresh.questionId || revision.questionId, revisionId: fresh.id, body: { expectedDefinitionHash: fresh.definitionHash, reason } };
    const result = stage === "review" ? await recordReview(request) : await approve(request);
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success(text.done);
    form.reset({ reason: "" });
    onDecided?.(result.data);
    return null;
  };
  return <form noValidate aria-label={text.button} className="space-y-3" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(({ reason }) => setConfirming(reason.trim()))(event); }}>
    <FormWizard form={form} fields={fields[stage]} />
    <Button type="submit">{text.button}</Button>
    {confirming !== null ? <ConfirmActionDialog require={permission} destructive={false} title={text.title(revision.revision)}
      description={`${text.description} Definition hash ${revision.definitionHash.slice(0, 12)}…`} confirmLabel={text.button} busyLabel={text.busy}
      onClose={() => setConfirming(null)} onConfirm={() => decide(confirming)} /> : null}
  </form>;
}
