// Small helpers the ported Oryx Next formula code was written against. New code should not use these.
export { cn } from "cn";
export { FormulaType as FormulaTypes } from "@/shared/questions/question-types";

export interface Option { label: string; value: string }

/** Text from any loose value: strings trimmed, numbers and booleans as text, anything else empty. */
export function sanitizeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  return "";
}
/** A finite number from any loose value, or zero. */
export function sanitizeNumber(value: unknown): number {
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(number) ? number : 0;
}
