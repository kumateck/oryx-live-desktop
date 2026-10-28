// The question vocabulary shared by question settings, form templates, test completion and response views. The numbers are the server's.
export const QuestionType = {
  ShortAnswer: 0, LongAnswer: 1, Paragraph: 2, Datepicker: 3, SingleChoice: 4, Dropdown: 5, Checkbox: 6, FileUpload: 7,
  Signature: 8, Reference: 9, Formula: 10, Specification: 11, Equipment: 12, Table: 13, Instrument: 14,
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const questionTypeLabels: Record<QuestionType, string> = {
  0: "Short answer", 1: "Long answer", 2: "Paragraph", 3: "Date", 4: "Single choice", 5: "Dropdown", 6: "Checkboxes", 7: "File upload",
  8: "Signature", 9: "Reference", 10: "Formula", 11: "Specification", 12: "Equipment", 13: "Table", 14: "Instrument",
};
const all = Object.values(QuestionType);
export const isQuestionType = (value: number | null | undefined): value is QuestionType => typeof value === "number" && (all as readonly number[]).includes(value);
export const questionTypeLabel = (value: number | null | undefined) => isQuestionType(value) ? questionTypeLabels[value] : "Unknown";

/** Question types whose answers are picked from options written on the question. */
export const choiceQuestionTypes: readonly QuestionType[] = [QuestionType.SingleChoice, QuestionType.Dropdown, QuestionType.Checkbox];
export const isChoiceQuestion = (type: number | null | undefined) => isQuestionType(type) && choiceQuestionTypes.includes(type);

/** The pharmacopoeia a specification answer refers to. The numbers are the server's. */
export const specificationReferences = [
  { value: "0", label: "BP" }, { value: "1", label: "USP" }, { value: "2", label: "Ph. Int." }, { value: "3", label: "In-house" },
] as const;
export const specificationReferenceLabel = (value: string | number | null | undefined) =>
  specificationReferences.find((item) => item.value === String(value))?.label ?? (value === null || value === undefined ? null : String(value));

/** How a formula question computes. The numbers are the server's; Complex (1) is retired. */
export const FormulaType = { Simple: 0, Uniformity: 2, Universal: 3 } as const;
export type FormulaType = (typeof FormulaType)[keyof typeof FormulaType];
export const formulaTypeLabels: Record<FormulaType, string> = { 0: "Simple", 2: "Uniformity", 3: "Universal" };
export const formulaTypeName = (type: FormulaType) => (["Simple", "Complex", "Uniformity", "Universal"] as const)[type];
