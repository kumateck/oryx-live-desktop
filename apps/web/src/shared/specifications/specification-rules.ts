import { z } from "zod";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";

// What material and product specifications share: their pharmacopoeia reference, dates, numbering rules and per-test values.

/** The pharmacopoeia a whole specification follows, stored by name ("In House 2024" is read back as "In House"). */
export const documentReferences: readonly SelectOption[] = ["BP", "USP", "PhInt", "In House"].map((name) => ({ value: name, label: name }));
export function documentReference(stored: string | null | undefined): SelectOption | null {
  const base = stored?.trim().replace(/\s+\d{4}$/, "").trim();
  return base ? { value: base, label: base } : null;
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
/** A revision (review) date must be after both the effective date and today. */
export function earliestRevisionDate(effective: Date | null | undefined, now = new Date()) {
  const today = startOfDay(now);
  const base = effective && !Number.isNaN(effective.getTime()) && startOfDay(effective) > today ? startOfDay(effective) : today;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
}
/** The server wants a due date; Oryx Next always sent tomorrow. */
export const tomorrowIso = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

const required = (label: string) => z.string({ message: `Enter the ${label}.` }).trim().min(1, `Enter the ${label}.`);
const option = z.object({ value: z.string(), label: z.string() });
/** The fields every specification has. Add the linked items, then `.superRefine(checkRevisionDate)`. */
export const specificationBaseSchema = z.object({
  specificationNumber: required("specification number"), revisionNumber: required("revision"), supersedesNumber: required("number it supersedes"),
  effectiveDate: z.date({ message: "Choose the effective date." }), reviewDate: z.date({ message: "Choose the revision date." }),
  form: z.object({ value: z.string().min(1, "Choose the template."), label: z.string() }, { message: "Choose the template." }),
  /** Optional: the template that holds the microbial tests. */
  microbialForm: option.nullish(),
  reference: option.nullish(), description: z.string().nullish(),
  revisionReason: z.string().max(1000, "Keep the reason to 1000 characters.").optional(),
});
export type SpecificationBaseValues = z.infer<typeof specificationBaseSchema>;
export function checkRevisionDate(values: { effectiveDate: Date; reviewDate: Date; form?: { value: string } | null | undefined; microbialForm?: { value: string } | null | undefined }, context: z.RefinementCtx) {
  if (startOfDay(values.reviewDate) < earliestRevisionDate(values.effectiveDate)) context.addIssue({ code: "custom", path: ["reviewDate"], message: "The revision date must be after the effective date and after today." });
  if (values.microbialForm?.value && values.microbialForm.value === values.form?.value)
    context.addIssue({ code: "custom", path: ["microbialForm"], message: "Choose a different template from the chemical one, or leave it empty." });
}
/** Every edit of a saved specification is a revision and must say why; the server refuses it otherwise. */
export function requireRevisionReason(values: { revisionReason?: string | undefined }, context: z.RefinementCtx) {
  if ((values.revisionReason ?? "").trim().length < 10)
    context.addIssue({ code: "custom", path: ["revisionReason"], message: "State the reason for this revision in at least 10 characters." });
}
/** The reason field shown when editing a saved specification. */
export const revisionReasonField = { type: InputTypes.TEXTAREA, name: "revisionReason", label: "Reason for revision", required: true, rows: 3, className: "md:col-span-2",
  description: "Why this specification is being revised. It is recorded in the specification's revision history." } as const;
/** The request body. An edit keeps the saved due date; a new specification is due tomorrow, as Oryx Next set it. */
export const specificationBody = (values: SpecificationBaseValues, savedDue: string | null = null, now = new Date()) => ({
  specificationNumber: values.specificationNumber, revisionNumber: values.revisionNumber, supersedesNumber: values.supersedesNumber,
  effectiveDate: values.effectiveDate.toISOString(), reviewDate: values.reviewDate.toISOString(), formId: values.form.value,
  microbialFormId: values.microbialForm?.value ?? null, dueDate: savedDue ?? tomorrowIso(now),
  reference: values.reference?.value ?? null, description: values.description ?? "",
});
/** A saved specification as form values; dates the server returned unreadable are left for the user to choose. */
export function specificationDefaults(saved: { specificationNumber: string | null; revisionNumber: string | null; supersedesNumber: string | null; effectiveDate: string | null; reviewDate: string | null;
  form: { id: string; name: string } | null; microbialForm?: { id: string; name: string } | null; reference: string | null; description: string | null }) {
  const date = (value: string | null) => { const parsed = value ? new Date(value) : null; return parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined; };
  const effectiveDate = date(saved.effectiveDate);
  const reviewDate = date(saved.reviewDate);
  return {
    specificationNumber: saved.specificationNumber ?? "", revisionNumber: saved.revisionNumber ?? "", supersedesNumber: saved.supersedesNumber ?? "",
    ...(effectiveDate ? { effectiveDate } : {}), ...(reviewDate ? { reviewDate } : {}),
    ...(saved.form ? { form: { value: saved.form.id, label: saved.form.name } } : {}),
    microbialForm: saved.microbialForm ? { value: saved.microbialForm.id, label: saved.microbialForm.name } : null,
    reference: documentReference(saved.reference), description: saved.description ?? "",
  };
}
/** Which linked items to add and which to remove when a specification's materials or products change. */
export function linkDelta(before: readonly string[], after: readonly string[]) {
  const was = new Set(before);
  const now = new Set(after);
  return { add: [...now].filter((id) => !was.has(id)), remove: [...was].filter((id) => !now.has(id)) };
}
/** "QCD/SPC/RM/007", the material series; product series are department and stage based. */
export const materialSpecificationPrefix = (kind: 0 | 1) => `QCD/SPC/${kind === 1 ? "PM" : "RM"}`;
export const serialNumber = (prefix: string, serial: number) => `${prefix}/${String(serial).padStart(3, "0")}`;
/**
 * "BMP/IPC/SPC" or "NMP/FP/SPC": beta-lactam (BMP) or non-beta-lactam (NMP) by the first product's division, then the stage.
 * Null when the division is not set, so the number is typed rather than guessed.
 */
export function productSpecificationPrefix(division: number | null | undefined, stage: number) {
  const plant = division === 0 ? "BMP" : division === 1 ? "NMP" : null;
  return plant ? `${plant}/${stage === 1 ? "B" : stage === 2 ? "FP" : "IPC"}/SPC` : null;
}
export const testStages = [{ value: "0", label: "Intermediate" }, { value: "1", label: "Bulk" }, { value: "2", label: "Finished" }] as const;
export const testStageLabel = (stage: number | null | undefined) => testStages.find((item) => item.value === String(stage))?.label ?? "–";
/** Document numbers in reading order, so "/010" follows "/009". */
export const compareNumbers = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
/** The microbial template field, shown after the chemical one on both editors. */
export const microbialTemplateField = { name: "microbialForm", label: "Microbial template", placeholder: "No microbial tests", searchPlaceholder: "Search templates",
  description: "Optional. Its tests and references are kept apart from the chemical template's. A microbial ARD must use this template." } as const;
