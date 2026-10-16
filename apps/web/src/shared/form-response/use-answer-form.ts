import { useEffect, useMemo, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues, type Resolver } from "react-hook-form";
import { answersSchema, storedToAnswer } from "./answers";
import type { FormField } from "./form-model";

/** What is already saved for a field, and the response it was saved in. */
export interface StoredAnswer { value: string | null; responseId: string | null }
export type StoredAnswers = ReadonlyMap<string, StoredAnswer>;

/** Latest stored answer per field from the server's response rows, keeping the newest when a field was saved twice. */
export function latestAnswers(rows: readonly { formFieldId: string | null; value: string | null; responseId: string | null; createdAt: string | null }[]): Map<string, StoredAnswer> {
  const result = new Map<string, StoredAnswer & { at: number }>();
  for (const row of rows) {
    if (!row.formFieldId) continue;
    const at = row.createdAt ? new Date(row.createdAt).getTime() || 0 : 0;
    const existing = result.get(row.formFieldId);
    if (!existing || at >= existing.at) result.set(row.formFieldId, { value: row.value, responseId: row.responseId, at });
  }
  return new Map([...result].map(([key, entry]) => [key, { value: entry.value, responseId: entry.responseId }]));
}
/** The response every saved answer belongs to, if any has been saved. */
export const sharedResponseId = (stored: StoredAnswers) => [...stored.values()].find((entry) => entry.responseId)?.responseId ?? null;

/**
 * The answer form for some fields. It starts from the saved answers and, when they are reloaded after a save, takes
 * the new saved value only for fields the person has not changed since, so nothing typed is overwritten.
 */
export function useAnswerForm(fields: readonly FormField[], stored: StoredAnswers) {
  const storedIds = useMemo(() => new Set([...stored].flatMap(([id, entry]) => entry.value?.trim() ? [id] : [])), [stored]);
  const schema = useMemo(() => answersSchema(fields, storedIds), [fields, storedIds]);
  const schemaRef = useRef(schema);
  schemaRef.current = schema;
  const resolver = useMemo<Resolver<FieldValues>>(() => (values, context, options) => zodResolver(schemaRef.current)(values, context, options), []);
  const defaults = useMemo(() => Object.fromEntries(fields.map((field) => [field.id, storedToAnswer(stored.get(field.id)?.value, field.question.type)])), [fields, stored]);
  const form = useForm<FieldValues>({ resolver, defaultValues: defaults, mode: "onSubmit" });
  const applied = useRef(defaults);
  useEffect(() => {
    for (const field of fields) {
      const next = defaults[field.id];
      if (JSON.stringify(next) === JSON.stringify(applied.current[field.id]) || form.getFieldState(field.id).isDirty) continue;
      form.resetField(field.id, { defaultValue: next });
    }
    applied.current = defaults;
  }, [defaults, fields, form]);
  return form;
}
