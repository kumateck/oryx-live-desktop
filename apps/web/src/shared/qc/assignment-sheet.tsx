import { useMemo, useState, type ReactNode } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import type { PermissionRequirement } from "@/shared/auth/access";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { formFields, type AnswerForm } from "@/shared/form-response/form-model";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { useAnalystDirectory, useAnalystOptions } from "./use-analyst-options";

export interface FieldAssignment { formFieldId: string; assigneeId: string }
const isOption = (value: unknown): value is SelectOption => typeof value === "object" && value !== null && "value" in value && typeof (value as { value: unknown }).value === "string";

/**
 * Gives every field of a test form to an analyst: one at a time, a whole test at once, or the whole form.
 * Only the form's own fields are sent; the "all" pickers are shortcuts, not answers.
 */
export function AssignmentSheet({ form, summary, require, saving, onSubmit, onCancel }: {
  form: AnswerForm; summary: ReactNode; require: PermissionRequirement; saving: boolean; onSubmit: (assignments: FieldAssignment[]) => Promise<string | null>; onCancel: () => void;
}) {
  const loadAnalysts = useAnalystOptions();
  const analystDirectory = useAnalystDirectory();
  const fields = useMemo(() => formFields(form), [form]);
  const values = useForm<FieldValues>({ defaultValues: Object.fromEntries(fields.map((field) => [field.id, null])) });
  const [everyone, setEveryone] = useState<SelectOption | null>(null);
  const [bySection, setBySection] = useState<Record<string, SelectOption>>({});
  const [message, setMessage] = useState("");
  const wizard = useMemo(() => new Map(form.sections.map((section) => [section.id, section.fields.map((field): WizardField<FieldValues> => ({
    type: InputTypes.SELECT, mode: "single", source: "sync", name: field.id, label: field.question.label, required: true, options: analystDirectory.options,
    disabled: analystDirectory.loading || analystDirectory.error !== null, placeholder: "Search or choose an analyst",
  }))])), [form, analystDirectory.options, analystDirectory.loading, analystDirectory.error]);
  const assign = (ids: readonly string[], analyst: SelectOption) => { for (const id of ids) values.setValue(id, analyst, { shouldDirty: true, shouldValidate: true }); };
  const submit = values.handleSubmit(async (entered) => {
    setMessage("");
    const missing = fields.filter((field) => !isOption(entered[field.id]));
    if (missing.length) { for (const field of missing) values.setError(field.id, { message: "Choose an analyst." }); setMessage(`Choose an analyst for every field (${String(missing.length)} left).`); return; }
    const problem = await onSubmit(fields.flatMap((field) => { const chosen: unknown = entered[field.id]; return isOption(chosen) ? [{ formFieldId: field.id, assigneeId: chosen.value }] : []; }));
    if (problem) setMessage(problem);
  });
  return <div className="min-w-0 space-y-4">
    {summary}
    <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border bg-card p-3">
        <div><h2 className="text-sm font-semibold">Assign the tests</h2><p className="text-xs text-muted-foreground">{fields.length} fields in {form.sections.length} tests. Pick for the whole form or a whole test to fill several at once.</p>
          {analystDirectory.loading ? <p role="status" className="mt-1 text-xs text-muted-foreground">Loading eligible analysts…</p> : null}
          {analystDirectory.error ? <div role="alert" className="mt-1 flex flex-wrap items-center gap-2 text-xs text-destructive"><span>{analystDirectory.error}</span><Button type="button" size="xs" variant="ghost" onClick={analystDirectory.retry}>Retry</Button></div> : null}</div>
        <div className="w-80 max-w-full"><AsyncOptionPicker label="Analyst for every field" placeholder="Everything to…" value={everyone} loadOptions={loadAnalysts}
          onChange={(analyst) => { setEveryone(analyst); assign(fields.map((field) => field.id), analyst); }} /></div>
      </div>
      <ol className="space-y-3">{form.sections.map((section, index) => <li key={section.id} className="rounded-lg border bg-card p-3">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 flex-1 gap-2"><span className="font-semibold">{index + 1}.</span><div className="min-w-0 font-medium"><RichTextView html={section.name} /></div></div>
          <div className="w-72 max-w-full"><AsyncOptionPicker label={`Analyst for every field of test ${String(index + 1)}`} placeholder="This whole test to…" value={bySection[section.id] ?? null} loadOptions={loadAnalysts}
            onChange={(analyst) => { setBySection({ ...bySection, [section.id]: analyst }); assign(section.fields.map((field) => field.id), analyst); }} /></div></div>
        <div className="mt-3 pl-6"><FormWizard form={values} fields={wizard.get(section.id) ?? []} className="md:grid-cols-2" /></div>
      </li>)}</ol>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <PermissionGuard require={require}><Button type="submit" disabled={saving || fields.length === 0}>{saving ? <><Spinner />Assigning…</> : "Assign"}</Button></PermissionGuard></div>
    </form>
  </div>;
}
