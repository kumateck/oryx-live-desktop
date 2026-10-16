import { QuestionType, questionTypeLabels, type QuestionType as QuestionTypeValue } from "@/shared/questions/question-types";

export const questionsPath = "/settings/questions";
export const tableQuestionPath = (id: string | null) => id ? `${questionsPath}/table/${id}/edit` : `${questionsPath}/table/create`;
export const formulaQuestionPath = (id: string | null) => id ? `${questionsPath}/formula/${id}/edit` : `${questionsPath}/formula/create`;
export const questionsAudit = { module: "Settings", subModule: "Questions" } as const;
export const questionPermissions = {
  view: "CanViewQuestions", create: "CanCreateQuestions", edit: "CanEditQuestions", remove: "CanDeleteQuestions",
  reviewFormula: "CanReviewFormulaRevision", approveFormula: "CanApproveFormulaRevision",
} as const;

/** Question types written in the question dialog. Formula and table questions have pages of their own. */
export const standardTypes: readonly QuestionTypeValue[] = Object.values(QuestionType).filter((type) => type !== QuestionType.Formula && type !== QuestionType.Table);
export const typeOption = (type: QuestionTypeValue) => ({ value: String(type), label: questionTypeLabels[type] });
export const typeFilterOptions = [{ value: "all", label: "All types" }, ...Object.values(QuestionType).map(typeOption)];
/** Where a question is edited: its own page for formula and table questions, otherwise the dialog. */
export const editRoute = (type: QuestionTypeValue, id: string) => type === QuestionType.Formula ? formulaQuestionPath(id) : type === QuestionType.Table ? tableQuestionPath(id) : null;
