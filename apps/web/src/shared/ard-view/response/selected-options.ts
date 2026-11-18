import { z } from "zod";
import { sanitizeString } from "@/shared/ard-view/legacy";
import type { FormResponseDto, QuestionOptionDto } from "@/shared/ard-view/dto";

const json = z.json();
type Json = z.infer<typeof json>;
const normalize = (value: Json | undefined): string => typeof value === "string"
  ? value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim().toLowerCase()
  : typeof value === "number" || typeof value === "boolean" ? String(value) : "";
export const optionValues = (option: QuestionOptionDto): string[] => {
  const choice: QuestionOptionDto & { value?: string | number | null; label?: string | null } = option;
  return [choice.id, choice.value, choice.label, choice.name].map(normalize).filter(Boolean);
};
export function selectedValues(value: Json | undefined): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(selectedValues);
  if (typeof value === "object") return [...selectedValues(value.value), ...selectedValues(value.label)];
  if (typeof value !== "string") return [normalize(value)];
  const raw = value.trim();
  if (!raw) return [];
  try { return selectedValues(json.parse(JSON.parse(raw))); }
  catch { return [normalize(raw), ...raw.split(",").map(normalize)].filter(Boolean); }
}
/** Keep saved short answers visible when their question later becomes a choice. */
export function selectedOptionLabels(response: FormResponseDto): string[] {
  const values = new Set(selectedValues(response.value));
  const matched = (response.formField?.question?.options ?? []).filter(option => optionValues(option).some(value => values.has(value)))
    .map(option => sanitizeString(option.name));
  return matched.length ? matched : [...values];
}
