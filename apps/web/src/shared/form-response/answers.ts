import { z } from "zod";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { QuestionType } from "@/shared/questions/question-types";
import { parseTableAnswer, tableAnswerFilled } from "@/shared/questions/table-question";
import type { FormField } from "./form-model";

// Answers are stored as one string per field, in the forms Oryx Next writes, so every client reads every answer:
// choices as their option text, multiple choices and instruments as a JSON list of { value, label }, equipment as a JSON
// { value, label }, dates as ISO strings, files as base64 data URLs joined by "|", tables as a JSON cell map.

export type AnswerValue = string | Date | SelectOption | readonly SelectOption[] | readonly File[] | null;

const option = (value: string, label?: string): SelectOption => ({ value, label: label?.trim() || value });
const optionSchema = z.object({ value: z.coerce.string().min(1), label: z.coerce.string().optional() }).transform((entry) => option(entry.value, entry.label));
function json(raw: string): unknown { try { return JSON.parse(raw) as unknown; } catch { return null; } }
const isOption = (value: AnswerValue | undefined): value is SelectOption => typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date) && "value" in value;
const isOptions = (value: AnswerValue | undefined): value is readonly SelectOption[] => Array.isArray(value) && value.every((entry) => typeof entry === "object" && entry !== null && "value" in entry && !(entry instanceof File));
const isFiles = (value: AnswerValue | undefined): value is readonly File[] => Array.isArray(value) && value.length > 0 && value.every((entry) => entry instanceof File);

/** A list of options stored either as JSON (what Oryx Next writes) or as comma-separated text (what its drafts once read). */
function optionList(raw: string): SelectOption[] {
  const parsed = json(raw);
  if (Array.isArray(parsed)) return parsed.flatMap((entry) => { if (typeof entry === "string") return entry.trim() ? [option(entry.trim())] : []; const read = optionSchema.safeParse(entry); return read.success ? [read.data] : []; });
  return raw.split(",").map((entry) => entry.trim()).filter(Boolean).map((entry) => option(entry));
}

/** The value a form field starts with, from what was stored for it. Files cannot be put back in a file input, so they start empty. */
export function storedToAnswer(raw: string | null | undefined, type: QuestionType): AnswerValue {
  if (!raw?.trim()) return null;
  switch (type) {
    case QuestionType.Dropdown: case QuestionType.Specification: return option(raw);
    case QuestionType.Checkbox: case QuestionType.Instrument: return optionList(raw);
    case QuestionType.Equipment: { const read = optionSchema.safeParse(json(raw)); return read.success ? read.data : option(raw); }
    case QuestionType.Datepicker: { const date = new Date(raw); return Number.isNaN(date.getTime()) ? null : date; }
    case QuestionType.FileUpload: return null;
    default: return raw;
  }
}

const dataUrl = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error ?? new Error("The file could not be read.")); reader.readAsDataURL(file); });
const optionsJson = (options: readonly SelectOption[]) => options.length ? JSON.stringify(options.map((entry) => ({ value: entry.value, label: entry.label }))) : null;

/** The stored string for a form value, or null when nothing was entered. */
export async function answerToStored(value: AnswerValue | undefined, type: QuestionType): Promise<string | null> {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (isFiles(value)) return (await Promise.all(value.map(dataUrl))).join("|");
  if (isOptions(value)) return optionsJson(value);
  if (isOption(value)) return type === QuestionType.Equipment ? JSON.stringify({ value: value.value, label: value.label }) : value.value;
  if (typeof value === "string") return value.trim() ? value : null;
  return null;
}

/** A value to compare with what is stored, to tell whether a field has unsaved changes. Files compare by name and size. */
export function answerFingerprint(value: AnswerValue | undefined, type: QuestionType): string | null {
  if (isFiles(value)) return value.map((file) => `${file.name}:${String(file.size)}`).join("|");
  if (value === null || value === undefined || typeof value !== "string" && Array.isArray(value) && value.length === 0) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (isOptions(value)) return value.map((entry) => entry.value).join(",");
  if (isOption(value)) return value.value;
  if (typeof value === "string") return type === QuestionType.Table ? (tableAnswerFilled(parseTableAnswer(value)) ? JSON.stringify(parseTableAnswer(value)) : null) : value.trim() || null;
  return null;
}
/** The same fingerprint for a stored answer. */
export const storedFingerprint = (raw: string | null | undefined, type: QuestionType) => type === QuestionType.FileUpload ? (raw?.trim() ? "stored-files" : null) : answerFingerprint(storedToAnswer(raw, type), type);
export const answerFilled = (value: AnswerValue | undefined, type: QuestionType) => answerFingerprint(value, type) !== null;
export const storedFilled = (raw: string | null | undefined, type: QuestionType) => storedFingerprint(raw, type) !== null;

const acceptedFiles = ["image/png", "image/jpeg", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
export const acceptedAnswerFiles = acceptedFiles.join(",");

/** How one field is validated. `stored` is true when the field already has a saved answer, which satisfies "required". */
export function answerRule(field: FormField, stored: boolean): z.ZodType<AnswerValue | undefined> {
  const type = field.question.type;
  const required = field.required && !stored;
  const missing = type === QuestionType.FileUpload ? "Attach a file." : choiceType(type) ? "Choose an answer." : "Answer this question.";
  const base: z.ZodType<AnswerValue | undefined> = z.custom<AnswerValue | undefined>(() => true);
  return base.superRefine((value, context) => {
    if (isFiles(value) && value.some((file) => !acceptedFiles.includes(file.type))) context.addIssue({ code: "custom", message: "Attach PNG, JPEG, WEBP, PDF, Word or Excel files only." });
    if (required && !answerFilled(value, type)) context.addIssue({ code: "custom", message: missing });
  });
}
const choiceType = (type: QuestionType) => ([QuestionType.SingleChoice, QuestionType.Dropdown, QuestionType.Checkbox, QuestionType.Specification, QuestionType.Equipment, QuestionType.Instrument] as readonly QuestionType[]).includes(type);

/** Validation for a whole set of fields, keyed by field id. */
export function answersSchema(fields: readonly FormField[], storedIds: ReadonlySet<string> = new Set()) {
  return z.object(Object.fromEntries(fields.map((field) => [field.id, answerRule(field, storedIds.has(field.id))])));
}
