// Helpers the ported Oryx Next result-view code was written against. New code should use the shared formatters directly.
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { relatedUnits, toLargestUnit } from "@/shared/units/quantity";
export { cn } from "cn";
export { QuestionType, FormulaType as FormulaTypes } from "@/shared/questions/question-types";
export { sanitizeNumber, sanitizeString } from "@/shared/formula/ui/legacy";

export const toSentenceCase = (text: string | undefined) => { const trimmed = (text ?? "").trim().toLowerCase(); return trimmed.charAt(0).toUpperCase() + trimmed.slice(1); };
export const fullname = (first?: string | null, last?: string | null) => `${first ?? ""} ${last ?? ""}`.trim();
/** A quantity stored in the smallest unit of its family (mg, ml), in the largest that keeps it at one or more, as "12.5 kg". */
export const quantityText = (value: number | null | undefined, unit: string | null | undefined) => value === null || value === undefined ? "-" : toLargestUnit(value, relatedUnits(unit)[0] ?? unit, "calculated")?.text ?? "-";
/** A full date, or null when unset (the backend sends 0001-01-01 for that). */
export const formatNullableDate = (value: string | null | undefined) => formatDate(value);
/** Manufacturing and expiry are shown as month and year. */
export const formatBatchMonth = (value: string | null | undefined) => formatMonthYear(value) ?? "-";
