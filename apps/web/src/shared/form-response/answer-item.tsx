import { useMemo } from "react";
import { useWatch, type FieldValues, type UseFormReturn } from "react-hook-form";
import { FormWizard } from "@/shared/forms/form-wizard";
import type { PersistedAttachment, SelectLoader } from "@/shared/forms/form-wizard-types";
import { answerWizardField } from "./answer-fields";
import { answerFingerprint, storedFingerprint, type AnswerValue } from "./answers";
import { DraftButton, type DraftState } from "./draft-button";
import type { FormField } from "./form-model";

export interface DraftControls { acknowledged?: (fieldId: string) => string | null; attachments?: (fieldId: string) => readonly PersistedAttachment[]; stored: (fieldId: string) => string | null; saving: ReadonlySet<string>; failed: ReadonlyMap<string, string>; save: (field: FormField, value: AnswerValue | undefined) => void }

/** One question being answered, with a button that saves the answer as a draft when it differs from what is saved. */
export function AnswerItem({ form, field, loadEquipment, drafts, label, disabled = false, className }: {
  form: UseFormReturn<FieldValues>; field: FormField; loadEquipment: SelectLoader; drafts: DraftControls | null; label?: string; disabled?: boolean; className?: string;
}) {
  const persisted = drafts?.attachments?.(field.id);
  const fields = useMemo(() => [answerWizardField(field, loadEquipment, { ...(persisted ? { persisted } : {}), ...(label === undefined ? {} : { label }), disabled })], [disabled, field, label, loadEquipment, persisted]);
  const value = useWatch({ control: form.control, name: field.id }) as AnswerValue | undefined;
  const current = answerFingerprint(value, field.question.type);
  const saved = drafts?.acknowledged?.(field.id) ?? (drafts ? storedFingerprint(drafts.stored(field.id), field.question.type) : null);
  const state: DraftState = !drafts ? "empty" : drafts.saving.has(field.id) ? "saving" : drafts.failed.has(field.id) ? "failed" : current === null ? (saved === null ? "empty" : "saved") : current === saved ? "saved" : "unsaved";
  return <div className={className}>
    <div className="flex min-w-0 items-end gap-2"><div className="min-w-0 flex-1"><FormWizard form={form} fields={fields} /></div>
      {drafts && !disabled ? <div className="pb-1"><DraftButton state={state} label={field.question.label} onSave={() => drafts.save(field, value)} /></div> : null}</div>
    {drafts?.failed.get(field.id) ? <p role="alert" className="mt-1 text-xs text-destructive">{drafts.failed.get(field.id)}</p> : null}
  </div>;
}
