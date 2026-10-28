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
import { FormulaChecks } from "@/shared/formula/review/formula-checks";
import { FormulaRevisionDecision } from "@/shared/formula/review/revision-decision";
import { awaitingStage } from "@/shared/formula/review/revision-review";
import { currentRevision, savedValidationFor, validationMessage } from "../lib/formula-question";
import { questionPermissions, questionsAudit } from "../lib/questions";

const reasonSchema = z.object({ reason: z.string().trim().min(10, "Give a reason of at least 10 characters.").max(4000) });
type ReasonValues = z.infer<typeof reasonSchema>;
const reasonFields: WizardField<ReasonValues>[] = [{ type: InputTypes.TEXTAREA, name: "reason", label: "Reason for this step", required: true, rows: 3, placeholder: "Explain the validation, review or approval decision" }];

/**
 * The governed revision of a formula question: run the server's calculation checks, submit it for review, record the review,
 * and approve it. Each step is a separate permission, and review and approval are by someone other than the author on the server.
 * Reviewers and approvers without editing rights use the Quality Assurance queues, which show the same decisions.
 */
export function FormulaRevisionPanel({ questionId, saved, onStatus, onSubmitted }: { questionId: string; saved: GovernedQuestion | null; onStatus: (status: FormulaRevision["status"]) => void; onSubmitted: () => void }) {
  const { allows } = useAccess();
  const query = governanceApi.useGetFormulaRevisionsQuery({ ...questionsAudit, questionId }, { refetchOnMountOrArgChange: true });
  const [validate, validating] = governanceApi.useValidateFormulaRevisionMutation();
  const [submitReview, submitting] = governanceApi.useSubmitFormulaReviewMutation();
  const [reread] = governanceApi.useLazyGetFormulaRevisionsQuery();
  const author = usePermissionAction(questionPermissions.edit);
  const [checked, setChecked] = useState<{ identity: string; validation: FormulaValidation } | null>(null);
  const [message, setMessage] = useState("");
  const form = useForm<ReasonValues>({ resolver: zodResolver(reasonSchema), defaultValues: { reason: "" } });
  const latest = currentRevision(query.data?.[0], saved);
  if (!latest) return <section className="rounded-lg border bg-card p-4"><h2 className="font-semibold">Governed formula revision</h2>
    <p className="text-sm text-muted-foreground">{query.isFetching ? "Checking for a governed revision…" : query.error ? apiErrorMessage(query.error) : "This formula has no governed revision yet. Save it to create revision 1; Validate then appears here."}</p></section>;
  const validation = checked?.identity === formulaValidationIdentity(latest) ? checked.validation : savedValidationFor(latest, saved);
  const passed = validationPassed(validation);
  const busy = query.isFetching || validating.isLoading || submitting.isLoading;
  const submit = form.handleSubmit(async ({ reason }) => {
    setMessage("");
    const denied = author.check();
    if (denied) { setMessage(denied); return; }
    const result = await submitReview({ ...questionsAudit, questionId, revisionId: latest.id, body: { expectedDefinitionHash: latest.definitionHash, reason: reason.trim() } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    onStatus(result.data.status);
    form.reset({ reason: "" });
    toast.success("Submitted for review");
    onSubmitted();
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
  const stage = awaitingStage(latest);
  return <section aria-label="Governed formula revision" className="space-y-4 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">Governed formula revision</h2>
      <p className="text-sm text-muted-foreground">Revision {latest.revision} · {latest.numericPolicyVersion}</p></div><Badge variant="outline">{latest.statusName || "Draft"}</Badge></div>
    <FormulaChecks cases={latest.testCases} outcomes={validation?.testOutcomes} evaluatorVersion={validation?.evaluatorVersion} engineBuildHash={validation?.engineBuildHash} />
    {draft ? <Button type="button" variant="outline" disabled={busy || !allows(questionPermissions.edit)} onClick={() => void runValidation()}>Validate on the server</Button> : null}
    {draft ? <form noValidate className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FormWizard form={form} fields={reasonFields} />
      <Button type="button" disabled={busy || !passed || !allows(questionPermissions.edit)} title={passed ? undefined : "Run Validate until every check passes first."}
        onClick={(event) => void submit(event)}>Submit for review</Button>
    </form> : null}
    {stage ? <FormulaRevisionDecision revision={latest} stage={stage} audit={questionsAudit} onDecided={(updated) => onStatus(updated.status)}
      reread={async () => { const result = await reread({ ...questionsAudit, questionId }, false); return result.error ? apiErrorMessage(result.error) : result.data?.find((item) => item.id === latest.id) ?? null; }} /> : null}
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
  </section>;
}
