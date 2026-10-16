import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formulaValidationIdentity } from "@/shared/formula/core/validation-identity";
import { FormulaRevisionStatus, governanceApi, validationPassed, type FormulaRevision, type FormulaValidation, type GovernedQuestion } from "@/shared/formula/governance-api";
import { currentRevision, savedValidationFor, validationMessage } from "../lib/formula-question";
import { questionPermissions, questionsAudit } from "../lib/questions";
import { FormulaChecks } from "./formula-checks";

const reasonSchema = z.object({ reason: z.string().trim().min(10, "Give a reason of at least 10 characters.").max(4000) });
type ReasonValues = z.infer<typeof reasonSchema>;
const reasonFields: WizardField<ReasonValues>[] = [{ type: InputTypes.TEXTAREA, name: "reason", label: "Reason for this step", required: true, rows: 3, placeholder: "Explain the validation, review or approval decision" }];

/**
 * The governed revision of a formula question: run the server's calculation checks, submit it for review, record the review,
 * and approve it. Each step is a separate permission, and review and approval are by someone other than the author on the server.
 */
export function FormulaRevisionPanel({ questionId, saved, onStatus, onSubmitted }: { questionId: string; saved: GovernedQuestion | null; onStatus: (status: FormulaRevision["status"]) => void; onSubmitted: () => void }) {
  const { allows } = useAccess();
  const query = governanceApi.useGetFormulaRevisionsQuery({ ...questionsAudit, questionId }, { refetchOnMountOrArgChange: true });
  const [validate, validating] = governanceApi.useValidateFormulaRevisionMutation();
  const [submitReview, submitting] = governanceApi.useSubmitFormulaReviewMutation();
  const [recordReview, reviewing] = governanceApi.useRecordFormulaReviewMutation();
  const [approve, approving] = governanceApi.useApproveFormulaRevisionMutation();
  const author = usePermissionAction(questionPermissions.edit);
  const reviewer = usePermissionAction(questionPermissions.reviewFormula);
  const approver = usePermissionAction(questionPermissions.approveFormula);
  const [checked, setChecked] = useState<{ identity: string; validation: FormulaValidation } | null>(null);
  const [message, setMessage] = useState("");
  const form = useForm<ReasonValues>({ resolver: zodResolver(reasonSchema), defaultValues: { reason: "" } });
  const latest = currentRevision(query.data?.[0], saved);
  if (!latest) return <section className="rounded-lg border bg-card p-4"><h2 className="font-semibold">Governed formula revision</h2>
    <p className="text-sm text-muted-foreground">{query.isFetching ? "Checking for a governed revision…" : query.error ? apiErrorMessage(query.error) : "This formula has no governed revision yet. Save it to create revision 1; Validate then appears here."}</p></section>;
  const validation = checked?.identity === formulaValidationIdentity(latest) ? checked.validation : savedValidationFor(latest, saved);
  const passed = validationPassed(validation);
  const busy = query.isFetching || validating.isLoading || submitting.isLoading || reviewing.isLoading || approving.isLoading;
  const transition = (action: typeof submitReview, gate: typeof author, done: string, afterwards?: () => void) => form.handleSubmit(async ({ reason }) => {
    setMessage("");
    const denied = gate.check();
    if (denied) { setMessage(denied); return; }
    const result = await action({ ...questionsAudit, questionId, revisionId: latest.id, body: { expectedDefinitionHash: latest.definitionHash, reason: reason.trim() } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    onStatus(result.data.status);
    form.reset({ reason: "" });
    toast.success(done);
    afterwards?.();
  });
  const runValidation = async () => {
    setMessage("");
    const denied = author.check();
    if (denied) { setMessage(denied); return; }
    const result = await validate({ ...questionsAudit, questionId, revisionId: latest.id });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    setChecked({ identity: formulaValidationIdentity(result.data.revision), validation: result.data.validation });
    if (validationPassed(result.data.validation)) toast.success("The server's calculation checks passed. Scientific release evidence is still required.");
    else setMessage(validationMessage(result.data.validation, result.data.validation.testOutcomes.every((outcome) => outcome.passed)));
  };
  const draft = latest.status === FormulaRevisionStatus.Draft;
  const inReview = latest.status === FormulaRevisionStatus.InReview;
  return <section aria-label="Governed formula revision" className="space-y-4 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">Governed formula revision</h2>
      <p className="text-sm text-muted-foreground">Revision {latest.revision} · {latest.numericPolicyVersion}</p></div><Badge variant="outline">{latest.statusName || "Draft"}</Badge></div>
    <FormulaChecks cases={latest.testCases} outcomes={validation?.testOutcomes} evaluatorVersion={validation?.evaluatorVersion} engineBuildHash={validation?.engineBuildHash} />
    {draft ? <Button type="button" variant="outline" disabled={busy || !allows(questionPermissions.edit)} onClick={() => void runValidation()}>Validate on the server</Button> : null}
    {draft || inReview ? <form noValidate className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FormWizard form={form} fields={reasonFields} />
      <div className="flex flex-wrap gap-2">
        {draft ? <Button type="button" disabled={busy || !passed || !allows(questionPermissions.edit)} title={passed ? undefined : "Run Validate until every check passes first."}
          onClick={(event) => void transition(submitReview, author, "Submitted for review", onSubmitted)(event)}>Submit for review</Button> : null}
        {inReview && !latest.reviewedById && allows(questionPermissions.reviewFormula) ? <Button type="button" disabled={busy} onClick={(event) => void transition(recordReview, reviewer, "Review recorded")(event)}>Record review</Button> : null}
        {inReview && latest.reviewedById && allows(questionPermissions.approveFormula) ? <Button type="button" disabled={busy} onClick={(event) => void transition(approve, approver, "Revision approved")(event)}>Approve revision</Button> : null}
      </div>
    </form> : null}
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
  </section>;
}
