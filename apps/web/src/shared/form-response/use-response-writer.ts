import { useCallback, useState } from "react";
import { formsApi } from "@/shared/api/generated/forms";
import type { DomainEntitiesFormsRequestSaveResponseDraftRequest } from "@/shared/api/generated/forms";
import type { PermissionRequirement } from "@/shared/auth/access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { answerFingerprint, answerToStored, storedFingerprint, type AnswerValue } from "./answers";
import type { FormField } from "./form-model";
import type { StoredAnswers } from "./use-answer-form";
import { sharedResponseId } from "./use-answer-form";

/** What a response belongs to: one of a material batch, a batch record and production step, a specification, or a routine track. */
export type ResponseContext = Omit<DomainEntitiesFormsRequestSaveResponseDraftRequest, "responseId" | "formId" | "formFieldId" | "value">;
export const finalizePermission = "CanExecuteFormulaResponse";

/**
 * Saves answers as drafts one field at a time and submits the response. Writes are sequential: the first draft
 * creates the response and every later one names it, which is what the server requires.
 */
export function useResponseWriter({ formId, context, stored, audit, require, onChange }: {
  formId: string; context: ResponseContext; stored: StoredAnswers; audit: { module: string; subModule: string }; require: PermissionRequirement; onChange: () => void;
}) {
  const [saveDraft] = formsApi.usePostApiV1FormResponsesDraftMutation();
  const [finalize] = formsApi.usePostApiV1FormResponsesFinalizeByResponseIdMutation();
  const drafts = usePermissionAction(require);
  const submitter = usePermissionAction(finalizePermission);
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set());
  const [failed, setFailed] = useState<ReadonlyMap<string, string>>(new Map());
  const [busy, setBusy] = useState(false);

  const write = useCallback(async (field: FormField, value: AnswerValue | undefined, responseId: string | null): Promise<{ responseId: string } | { error: string }> => {
    const denied = drafts.check();
    if (denied) return { error: denied };
    const stringValue = await answerToStored(value, field.question.type).catch(() => null);
    if (stringValue === null) return { error: "There is nothing to save for this answer." };
    const result = await saveDraft({ ...audit, domainEntitiesFormsRequestSaveResponseDraftRequest: { ...context, formId, formFieldId: field.id, value: stringValue, responseId } });
    return "error" in result ? { error: apiErrorMessage(result.error) } : { responseId: result.data };
  }, [audit, context, drafts, formId, saveDraft]);

  const mark = (id: string, error: string | null) => setFailed((current) => { const next = new Map(current); if (error) next.set(id, error); else next.delete(id); return next; });
  const saveOne = useCallback(async (field: FormField, value: AnswerValue | undefined) => {
    setSaving((current) => new Set(current).add(field.id));
    const result = await write(field, value, sharedResponseId(stored));
    setSaving((current) => { const next = new Set(current); next.delete(field.id); return next; });
    mark(field.id, "error" in result ? result.error : null);
    if (!("error" in result)) onChange();
    return "error" in result ? result.error : null;
  }, [onChange, stored, write]);

  /** Saves every answer that differs from what is stored, then submits. A failure stops before the submit, and what was saved stays saved. */
  const submit = useCallback(async (fields: readonly FormField[], values: Readonly<Record<string, AnswerValue | undefined>>): Promise<string | null> => {
    setBusy(true);
    try {
      let responseId = sharedResponseId(stored);
      for (const field of fields) {
        const value = values[field.id];
        const current = answerFingerprint(value, field.question.type);
        if (current === null || current === storedFingerprint(stored.get(field.id)?.value, field.question.type)) continue;
        const result = await write(field, value, responseId);
        if ("error" in result) { mark(field.id, result.error); onChange(); return `${field.question.label}: ${result.error}`; }
        responseId = result.responseId;
      }
      if (!responseId) return "Answer at least one question before submitting.";
      const denied = submitter.check();
      if (denied) return denied;
      const result = await finalize({ ...audit, responseId });
      onChange();
      return "error" in result ? apiErrorMessage(result.error) : null;
    } finally { setBusy(false); }
  }, [audit, finalize, onChange, stored, submitter, write]);

  return { saveOne, submit, saving, failed, busy, canSubmit: submitter.allowed };
}
