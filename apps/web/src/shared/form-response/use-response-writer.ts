import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formsApi } from "@/shared/api/generated/forms";
import type { DomainEntitiesFormsRequestSaveResponseDraftRequest } from "@/shared/api/generated/forms";
import type { PermissionRequirement } from "@/shared/auth/access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { answerFingerprint, answerToStored, type AnswerValue } from "./answers";
import { draftStatus } from "./draft-status";
import type { FormField } from "./form-model";
import type { StoredAnswers } from "./use-answer-form";
import { sharedResponseId } from "./use-answer-form";

/** What a response belongs to: one of a material batch, a batch record and production step, a specification, or a routine track. */
export type ResponseContext = Omit<DomainEntitiesFormsRequestSaveResponseDraftRequest, "responseId" | "formId" | "formFieldId" | "value"> & { responseId?: string };
export const finalizePermission = "CanExecuteFormulaResponse";

/**
 * Saves answers as drafts and submits only when every field is complete and saved.
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
  const pendingWrites = useRef(0);
  const submitting = useRef(false);
  const scope = JSON.stringify({ formId, context });
  const response = useRef<{ scope: string; id: string } | null>(null);
  const [confirmed, setConfirmed] = useState<{ scope: string; fields: ReadonlyMap<string, string> }>({ scope, fields: new Map() });
  const acknowledged = useMemo(() => confirmed.scope === scope ? confirmed.fields : new Map<string, string>(), [confirmed, scope]);
  const activeScope = useRef(scope);
  useEffect(() => { activeScope.current = scope; }, [scope]);
  const currentResponseId = useCallback(() => response.current?.scope === scope ? response.current.id : context.responseId ?? sharedResponseId(stored), [scope, stored, context.responseId]);

  const write = useCallback(async (field: FormField, value: AnswerValue | undefined, responseId: string | null): Promise<{ responseId: string } | { error: string }> => {
    const denied = drafts.check();
    if (denied) return { error: denied };
    const fingerprint = answerFingerprint(value, field.question.type);
    const stringValue = await answerToStored(value, field.question.type).catch(() => null);
    if (stringValue === null) return { error: "There is nothing to save for this answer." };
    const stillAllowed = drafts.check();
    if (stillAllowed) return { error: stillAllowed };
    const result = await saveDraft({ ...audit, domainEntitiesFormsRequestSaveResponseDraftRequest: { ...context, formId, formFieldId: field.id, value: stringValue, responseId } });
    if ("error" in result) return { error: apiErrorMessage(result.error) };
    if (typeof result.data !== "string" || !result.data.trim()) return { error: "The server did not confirm a saved draft. Save this answer again." };
    if (activeScope.current !== scope) return { responseId: result.data };
    response.current = { scope, id: result.data };
    if (fingerprint !== null) setConfirmed(current => ({ scope, fields: new Map(current.scope === scope ? current.fields : []).set(field.id, fingerprint) }));
    return { responseId: result.data };
  }, [audit, context, drafts, formId, saveDraft, scope]);

  const mark = (id: string, error: string | null) => setFailed((current) => { const next = new Map(current); if (error) next.set(id, error); else next.delete(id); return next; });
  const saveOne = useCallback(async (field: FormField, value: AnswerValue | undefined) => {
    if (submitting.current) return "Wait for submission to finish.";
    pendingWrites.current += 1;
    setSaving((current) => new Set(current).add(field.id));
    try {
      const result = await write(field, value, currentResponseId());
      mark(field.id, "error" in result ? result.error : null);
      if (!("error" in result)) onChange();
      return "error" in result ? result.error : null;
    } finally {
      pendingWrites.current -= 1;
      setSaving((current) => { const next = new Set(current); next.delete(field.id); return next; });
    }
  }, [onChange, write, currentResponseId]);

  const submissionProblem = (fields: readonly FormField[], editable: ReadonlySet<string>, values: Readonly<Record<string, AnswerValue | undefined>>): string | null => {
    if (saving.size > 0) return "Wait until all drafts have finished saving.";
    for (const field of fields) {
      const status = draftStatus(field, values[field.id], editable.has(field.id), stored, acknowledged);
      if (status === "incomplete") return `${field.question.label}: Complete this answer and save its draft before submitting.`;
      if (status === "unsaved" || failed.has(field.id)) return `${field.question.label}: Save this draft before submitting.`;
    }
    return null;
  };

  /** Never writes drafts implicitly: keyboard and programmatic submissions use the same saved-answer checks. */
  const submit = async (fields: readonly FormField[], editable: ReadonlySet<string>, values: Readonly<Record<string, AnswerValue | undefined>>): Promise<string | null> => {
    if (submitting.current) return "Submission is already in progress.";
    if (pendingWrites.current > 0) return "Wait until all drafts have finished saving.";
    const problem = submissionProblem(fields, editable, values);
    if (problem) return problem;
    submitting.current = true;
    setBusy(true);
    try {
      const responseId = currentResponseId();
      if (!responseId) return "Answer at least one question before submitting.";
      const denied = submitter.check();
      if (denied) return denied;
      const result = await finalize({ ...audit, responseId });
      onChange();
      return "error" in result ? apiErrorMessage(result.error) : null;
    } finally { submitting.current = false; setBusy(false); }
  };

  return { saveOne, submit, submissionProblem, saving, failed, busy, acknowledged, canSubmit: submitter.allowed };
}
