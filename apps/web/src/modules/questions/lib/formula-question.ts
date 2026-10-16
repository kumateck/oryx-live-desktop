import type { DomainEntitiesFormsRequestCreateQuestionRequest } from "@/shared/api/generated/forms";
import type { FormQuestion } from "@/shared/form-response/form-model";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { FormulaScope } from "@/shared/formula/core/contracts";
import { formulaValidationIdentity } from "@/shared/formula/core/validation-identity";
import type { FormulaRevision, FormulaValidation, GovernedQuestion } from "@/shared/formula/governance-api";
import { FormulaType, QuestionType } from "@/shared/questions/question-types";
import { formulaScopeOptions, formulaTypeOptions, type QuestionFormulaValues } from "../schemas/formula-question-schema";
import { buildUniversalOption, safeFormulaOptionParse } from "./universal-option";

const known = (value: number): value is FormulaType => value === FormulaType.Simple || value === FormulaType.Uniformity || value === FormulaType.Universal;
/** Variables that come from another form field. Placement is the default, so only "form" scopes are stored. */
function storedScopes(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
    const raw: unknown = entry !== null && typeof entry === "object" && "value" in entry ? (entry as { value: unknown }).value : entry;
    return Number(raw) === FormulaScope.Form ? [[key, FormulaScope.Form]] : [];
  }));
}

/** The form values of a saved formula question. The latest revision's authoring text wins over the question's stored option. */
export function toFormulaValues(question: FormQuestion | null, authoringPayload?: string | null): QuestionFormulaValues {
  const optionName = (authoringPayload || question?.options[0] || "").trim();
  const parsed = safeFormulaOptionParse(optionName);
  const typeNumber = Number(parsed?.type);
  const formulaType = Number.isFinite(typeNumber) && known(typeNumber) ? typeNumber : FormulaType.Simple;
  const expression = formulaType === FormulaType.Universal && parsed ? optionName : typeof parsed?.expression === "string" ? parsed.expression.trim() : optionName;
  return {
    label: question?.label ?? "", description: question?.description ?? "", reference: question?.reference ?? "",
    formulaType: formulaTypeOptions.find((entry) => Number(entry.value) === formulaType) ?? formulaTypeOptions[0] ?? null,
    variableScopes: Object.fromEntries(Object.keys(storedScopes(parsed?.variableScopes)).map((key) => [encodeURIComponent(key), formulaScopeOptions[1]])),
    expression,
  };
}

const scopesForStorage = (scopes: Readonly<Record<string, SelectOption>>) => Object.fromEntries(Object.entries(scopes).map(([key, entry]) => [decodeURIComponent(key), Number(entry.value)]));
/** The question's stored option: the whole Universal definition, or the type and expression of a Simple or Uniformity formula. */
export function buildFormulaOptionValue(expression: string, type: FormulaType, previousOptionName = "", scopes: Readonly<Record<string, SelectOption>> = {}): string {
  if (type === FormulaType.Universal) return JSON.stringify({ ...buildUniversalOption(expression, safeFormulaOptionParse(expression), safeFormulaOptionParse(previousOptionName)), variableScopes: scopesForStorage(scopes) });
  return JSON.stringify({ type, expression, variableScopes: scopesForStorage(scopes) });
}
export function formulaQuestionRequest(values: QuestionFormulaValues, expression: string, previousOptionName: string): DomainEntitiesFormsRequestCreateQuestionRequest {
  const typeNumber = Number(values.formulaType?.value);
  const type = known(typeNumber) ? typeNumber : FormulaType.Simple;
  return {
    label: values.label.trim(), description: values.description?.trim() || null, reference: values.reference?.trim() || null, type: QuestionType.Formula, isMultiSelect: false,
    options: [{ name: buildFormulaOptionValue(expression, type, previousOptionName, values.variableScopes ?? {}) }],
  };
}

/** Every detected variable gets a scope; new ones start as "inside this formula". */
export const resolveVariableScopes = (variables: readonly { key: string }[], current: Readonly<Record<string, SelectOption>>) =>
  Object.fromEntries(variables.map(({ key }) => { const field = encodeURIComponent(key); return [field, current[field] ?? formulaScopeOptions[0]]; }));
export const readableVariableName = (variable: { key: string; label: string }) => (variable.label === variable.key ? variable.key : variable.label)
  .replaceAll(".", " — ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Za-z])(\d+)/g, "$1 $2").replace(/\bavg\b/gi, "Average").replace(/^./, (character) => character.toUpperCase());

/** The revision to show: the newest of what the server lists and what was just saved, so a stale list never hides the saved draft. */
export function currentRevision(queried: FormulaRevision | undefined, saved: GovernedQuestion | null): FormulaRevision | undefined {
  if (!queried) return saved?.revision;
  if (!saved || queried.revision > saved.revision.revision) return queried;
  if (queried.revision < saved.revision.revision) return saved.revision;
  if (queried.status > saved.revision.status) return queried;
  return queried.definitionHash === saved.revision.definitionHash ? queried : saved.revision;
}
/** Validation evidence belongs to the exact definition and test cases it was run on. */
export const savedValidationFor = (revision: FormulaRevision | undefined, saved: GovernedQuestion | null): FormulaValidation | null =>
  revision && saved?.validation && formulaValidationIdentity(revision) === formulaValidationIdentity(saved.revision) ? saved.validation : null;

export function savedMessage(saved: GovernedQuestion, action: "created" | "updated") {
  const outcomes = saved.validation?.testOutcomes ?? [];
  const passed = outcomes.filter((outcome) => outcome.passed).length;
  return outcomes.length ? `Formula draft ${action}; ${String(passed)}/${String(outcomes.length)} server calculation checks passed (not release approval)` : `Formula draft ${action}; server calculation checks are pending`;
}
export function validationMessage(validation: FormulaValidation, testsPassed: boolean) {
  const issue = [...validation.definitionIssues, ...validation.requestIssues][0];
  if (issue?.message) return issue.path ? `Input "${issue.path}": ${issue.message}` : issue.message;
  return testsPassed ? validation.statusName : "One or more governed tests failed";
}
