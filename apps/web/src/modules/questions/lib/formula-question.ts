import type { DomainEntitiesFormsRequestCreateQuestionRequest } from "@/shared/api/generated/forms";
import type { FormQuestion } from "@/shared/form-response/form-model";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { FormulaScope } from "@/shared/formula/core/contracts";
import { formulaValidationIdentity } from "@/shared/formula/core/validation-identity";
import { parseUniversalNamedExpressions } from "@/shared/formula/builder/universal-named-expressions";
import { assertCanonicalUniversalConfigKeys, canonicalizeUniversalInputTokens, UniversalVariableKeyFormat } from "@/shared/formula/builder/universal-variable-keys";
import type { FormulaRevision, FormulaValidation, GovernedQuestion } from "@/shared/formula/governance-api";
import { FormulaType, QuestionType } from "@/shared/questions/question-types";
import { formulaScopeOptions, formulaTypeOptions, type QuestionFormulaValues } from "../schemas/formula-question-schema";
import { buildUniversalOption, safeFormulaOptionParse, type FormulaOptionJson } from "./universal-option";

/** Form field name for a variable key. Dots would be read as nested paths by the form library, so they are escaped as well. */
export const scopeFieldName = (key: string) => encodeURIComponent(key).replaceAll(".", "%2E");

/** Universal formulas use dot-free variable names (standardWeight, sample1Weight) unless their own keys cannot meet that format. */
export function withCanonicalVariableKeys(option: FormulaOptionJson): FormulaOptionJson {
  if (option.variableKeyFormat === UniversalVariableKeyFormat.CanonicalAlphanumeric) return option;
  const candidate = { ...option, variableKeyFormat: UniversalVariableKeyFormat.CanonicalAlphanumeric };
  try {
    assertCanonicalUniversalConfigKeys(candidate);
    parseUniversalNamedExpressions(candidate);
    return candidate;
  } catch {
    return option;
  }
}
/** The dot-free name of a legacy variable key, e.g. sampleInput1.wt becomes sample1Weight. Other keys are unchanged. */
export const canonicalVariableKey = (key: string) => canonicalizeUniversalInputTokens(`:${key}`).slice(1);
const rewriteTokens = (value: unknown) => typeof value === "string" ? canonicalizeUniversalInputTokens(value) : value;
const mapEntries = (value: unknown, map: (entry: unknown) => unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, map(entry)])) : value;
const renameKeys = (value: unknown, rename: (key: string) => string) =>
  value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).map(([key, entry]) => [rename(key), entry])) : value;
const withExpression = (entry: unknown) =>
  entry && typeof entry === "object" && !Array.isArray(entry) && "expression" in entry ? { ...entry, expression: rewriteTokens((entry as { expression: unknown }).expression) } : entry;
/**
 * A stored Universal formula as the editor should show it: switched to dot-free names, with old tokens such as
 * :standardInput.wt rewritten (:standardWeight) everywhere they can appear. Results are unchanged, because the saved
 * definition already reads both spellings the same way. Input storage keys (wt) are kept, so saved answers still match.
 */
export function upgradeUniversalOption(option: FormulaOptionJson): FormulaOptionJson {
  const canonical = withCanonicalVariableKeys(option);
  if (canonical === option) return option;
  return {
    ...canonical,
    expression: rewriteTokens(canonical.expression),
    manualVarExpressions: mapEntries(canonical.manualVarExpressions, rewriteTokens),
    columnExpressions: mapEntries(canonical.columnExpressions, withExpression),
    namedExpressions: Array.isArray(canonical.namedExpressions) ? canonical.namedExpressions.map(withExpression) : canonical.namedExpressions,
    variableScopes: renameKeys(canonical.variableScopes, canonicalVariableKey),
  };
}
/** The live Universal definition the editor checks: the builder's payload in the same key format it will be saved in. */
export function universalEditorDefinition(text: string): string {
  const parsed = safeFormulaOptionParse(text);
  return parsed && !Array.isArray(parsed) ? JSON.stringify(withCanonicalVariableKeys(parsed)) : text;
}

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
  const universal = formulaType === FormulaType.Universal && parsed ? upgradeUniversalOption(parsed) : null;
  const expression = universal ? JSON.stringify(universal) : typeof parsed?.expression === "string" ? parsed.expression.trim() : optionName;
  return {
    label: question?.label ?? "", description: question?.description ?? "", reference: question?.reference ?? "",
    formulaType: formulaTypeOptions.find((entry) => Number(entry.value) === formulaType) ?? formulaTypeOptions[0] ?? null,
    variableScopes: Object.fromEntries(Object.keys(storedScopes((universal ?? parsed)?.variableScopes)).map((key) => [scopeFieldName(key), formulaScopeOptions[1]])),
    expression,
  };
}

const scopesForStorage = (scopes: Readonly<Record<string, SelectOption>>, canonical = false) => Object.fromEntries(Object.entries(scopes).map(([key, entry]) => {
  const variable = decodeURIComponent(key);
  return [canonical ? canonicalVariableKey(variable) : variable, Number(entry.value)];
}));
/** The question's stored option: the whole Universal definition, or the type and expression of a Simple or Uniformity formula. */
export function buildFormulaOptionValue(expression: string, type: FormulaType, previousOptionName = "", scopes: Readonly<Record<string, SelectOption>> = {}): string {
  if (type === FormulaType.Universal) {
    const option = withCanonicalVariableKeys(buildUniversalOption(expression, safeFormulaOptionParse(expression), safeFormulaOptionParse(previousOptionName)));
    const canonical = option.variableKeyFormat === UniversalVariableKeyFormat.CanonicalAlphanumeric;
    return JSON.stringify({ ...option, variableScopes: scopesForStorage(scopes, canonical) });
  }
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
  Object.fromEntries(variables.map(({ key }) => { const field = scopeFieldName(key); return [field, current[field] ?? formulaScopeOptions[0]]; }));
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
  if (validation.testOutcomes.length === 0) return "The server returned no calculation check results, so this revision cannot be submitted yet. Run Validate again; if it repeats, report it.";
  return testsPassed ? validation.statusName : "One or more governed tests failed";
}
