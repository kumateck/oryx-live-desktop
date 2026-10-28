import { useMemo, useState, type ReactNode } from "react";
import { useWatch } from "react-hook-form";
import { ClipboardX, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { PermissionRequirement } from "@/shared/auth/access";
import { AnswerSheet } from "@/shared/form-response/answer-sheet";
import { type AnswerValue } from "@/shared/form-response/answers";
import { assignedSections, formFields, type AnswerForm } from "@/shared/form-response/form-model";
import { useAnswerForm, type StoredAnswers } from "@/shared/form-response/use-answer-form";
import { useResponseWriter, type ResponseContext } from "@/shared/form-response/use-response-writer";
import { useEquipmentOptions } from "@/shared/questions/use-equipment-options";

export function TestEntryEmpty({ kind, details, onBack }: { kind: "not-assigned" | "no-form"; details: readonly { label: string; value: string | null }[]; onBack: () => void }) {
  const Icon = kind === "not-assigned" ? UserX : ClipboardX;
  return <div className="mx-auto max-w-lg space-y-3 rounded-lg border border-dashed bg-card p-8 text-center">
    <Icon aria-hidden="true" className="mx-auto size-6 text-muted-foreground" />
    <h2 className="font-semibold">{kind === "not-assigned" ? "No questions assigned to you" : "Test form not available"}</h2>
    <p className="text-sm text-muted-foreground">{kind === "not-assigned" ? "You have not been given any field of this test. Ask your supervisor or QA lead to assign you before completing this step."
      : "The test form for this step could not be found. Ask your supervisor or QA lead to check how the test is set up."}</p>
    <dl className="rounded-md border bg-muted/30 p-3 text-left text-xs">{details.map((detail) => <div key={detail.label}><dt className="inline font-medium">{detail.label}: </dt><dd className="inline">{detail.value || "Not available"}</dd></div>)}</dl>
    <Button type="button" variant="outline" onClick={onBack}>Back</Button>
  </div>;
}

/**
 * An analyst saves each assigned answer as a draft before submitting the completed response.
 */
export function TestEntry({ form, mine, stored, context, audit, require, summary, onReload, onDone }: {
  form: AnswerForm; mine: ReadonlySet<string>; stored: StoredAnswers; context: ResponseContext; audit: { module: string; subModule: string }; require: PermissionRequirement;
  summary: ReactNode; onReload: () => void; onDone: () => void;
}) {
  const loadEquipment = useEquipmentOptions();
  const sections = useMemo(() => assignedSections(form, mine), [form, mine]);
  const myFields = useMemo(() => sections.flatMap((section) => section.fields), [sections]);
  const everyField = useMemo(() => formFields(form), [form]);
  const answers = useAnswerForm(myFields, stored);
  const writer = useResponseWriter({ formId: form.id, context, stored, audit, require, onChange: onReload });
  const [message, setMessage] = useState("");
  const current = useWatch({ control: answers.control }) as Record<string, AnswerValue | undefined>;
  const blocked = writer.submissionProblem(everyField, mine, current);
  void answers.formState.errors;
  const submit = answers.handleSubmit(async (values) => {
    setMessage("");
    const problem = await writer.submit(everyField, mine, values as Record<string, AnswerValue | undefined>);
    if (problem) { setMessage(problem); return; }
    toast.success("Test results submitted");
    onDone();
  });
  return <div className="min-w-0 space-y-4">
    {summary}
    <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
      <AnswerSheet form={answers} sections={sections} loadEquipment={loadEquipment} disabled={writer.busy}
        drafts={{ acknowledged: (id) => writer.acknowledged.get(id) ?? null, attachments: (id) => stored.get(id)?.attachments ?? [], stored: (id) => stored.get(id)?.value ?? null, saving: writer.saving, failed: writer.failed, save: (field, value) => void writer.saveOne(field, value) }} />
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {blocked ? <span className="min-w-0 flex-1 break-words text-sm text-muted-foreground">{blocked} All analysts' fields must be complete and saved.</span> : null}
        <Button type="button" variant="outline" onClick={onDone}>Back</Button>
        <Button type="submit" disabled={blocked !== null || writer.busy || writer.saving.size > 0 || !writer.canSubmit} title={writer.canSubmit ? undefined : "You do not have permission to submit test results."}>
          {writer.busy ? <><Spinner />Submitting…</> : "Submit results"}</Button>
      </div>
    </form>
  </div>;
}
