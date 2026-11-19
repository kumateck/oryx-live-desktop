import type { FormFieldDto, FormResponseDto } from "@/shared/ard-view/dto";
import { formatFormulaEquationResult } from "@/shared/ard-view/raw-data/print/formula-result-display";
import { buildReadingLabels } from "@/shared/ard-view/raw-data/print/formula-print-utils";
import { normalizeFormulaResponse } from "@/shared/ard-view/raw-data/print/normalize-formula-response";
import { isGovernedFormulaResponse, parseStoredFormulaResults, resultLabel, type GovernedFormResponse, type StoredFormulaResult } from "@/shared/ard-view/raw-data/governed-formula-result";
import { weightInputPresentation } from "@/shared/formula/builder/universal-variable-keys";
import {
  buildInitialHeaders, buildInputVariables, coerceManualVars, computeAverageResult, computeFormulaResults, isManualVarKey,
  normalizeFormulaExpressionText, parseFormulaResponse, parseJson,
} from "@/shared/formula/compute/formula-compute";
import { extractFormulaVariables, parseSimpleFormulaResponse, parseSimpleFormulaSettings, substituteFormulaValues } from "@/shared/formula/compute/simple-formula";
import { evaluateExpression } from "@/shared/formula/ui/types/expression/universal/engine/expressionEngine";
import { roundHalfAwayFromZero } from "@/shared/formula/ui/types/expression/universal/decimal-policy";
import { buildFormulaTableVariables } from "@/shared/formula/ui/types/expression/universal/table-variables";
import type { ExpressionExtract, LabeledInputField } from "@/shared/formula/ui/types/expression/universal/types";
import { evaluationSettings } from "@/shared/formula/ui/types/evaluate/settings";
import { calculateStats, sanitizeForEval } from "@/shared/formula/ui/types/utils";
import { FormulaType } from "@/shared/questions/question-types";
import { formatQuantityNumber } from "@/shared/units/quantity";

/** One labelled value on the worksheet: a constant, a recorded variable or an input. Entered values keep every digit typed. */
export interface WorksheetEntry { key: string; label: string; value: string }
export interface SampleInputGroup { label: string; entries: WorksheetEntry[] }
export interface ReadingsRow { label: string; cells: string[]; summary: boolean }
export interface ReadingsTable { columns: string[]; rows: ReadingsRow[] }
/** A sample's calculation: the formula with its recorded values substituted, and the result it gave. */
export interface Calculation { label: string; substituted: string; result: string | null; /** Calculated here but the readings did not give a number. */ unavailable: boolean }
export interface FormulaResultLine { label: string; value: string; primary: boolean }

export interface FormulaWorksheet {
  kind: "worksheet";
  blank: boolean;
  expression: string;
  percent: boolean;
  constants: WorksheetEntry[];
  variables: WorksheetEntry[];
  standardInputs: WorksheetEntry[];
  samples: SampleInputGroup[];
  table: ReadingsTable | null;
  calculations: Calculation[];
  results: FormulaResultLine[];
  /** Why there is no final result, or that it is still a draft. */
  notice: string | null;
}
export { resultLabel };
export type FormulaView = FormulaWorksheet
  | { kind: "uniformity"; settings: string; response: string }
  | { kind: "unavailable" };

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "");
const isAverageKey = (key: string) => /^(average|mean)([ _-]+(content|result|assay))?$/i.test(key.trim());
const hasValue = (value: string) => value.trim() !== "";

export const storedResultText = (result: StoredFormulaResult) => `${result.value}${result.unit ? ` ${result.unit}` : ""}`;

/** A table statistic the system worked out: at most four decimals, never shown as zero. */
export function calculatedText(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value) ? "" : formatQuantityNumber(value, "calculated");
}

/** The configuration the answer was recorded against: the settings saved with it, then the stored question, then the template. */
function formulaSettings(field: FormFieldDto | undefined, response: FormResponseDto | undefined, value: string) {
  const saved = parseJson<Record<string, unknown>>(value);
  const savedSettings = saved && typeof saved === "object" ? saved.settings : null;
  const fromAnswer = savedSettings ? evaluationSettings(typeof savedSettings === "string" ? savedSettings : JSON.stringify(savedSettings)) : null;
  const recorded = response?.formField?.formulaConfigurationHash ? response.formField.question?.options ?? [] : [];
  const candidates = [...recorded, ...(field?.question?.options ?? []), ...(response?.formField?.question?.options ?? [])];
  return fromAnswer ?? candidates.map((option) => evaluationSettings(option.name ?? "")).find((entry) => entry !== null) ?? null;
}

interface Authority { governed: boolean; stored: StoredFormulaResult[]; notice: string | null }
function authority(response: FormResponseDto | undefined, blank: boolean): Authority {
  if (blank || !isGovernedFormulaResponse(response)) return { governed: false, stored: [], notice: null };
  const stored = parseStoredFormulaResults(response);
  const notice = !stored.length
    ? response?.formulaRepairPending ? "Formula repaired — the result is calculated when the readings are saved." : "Authoritative formula result unavailable."
    : (response as GovernedFormResponse | undefined)?.formulaResultFinalized ? null : "Draft result — not finalized.";
  return { governed: true, stored, notice };
}

/**
 * Attach governed (server-calculated) results to each sample's calculation by name, so "sample1" lands on Sample 1.
 * A lone result belongs to a lone calculation. The average, and anything that matches nothing, is listed as a result.
 */
export function attachStoredResults(calculations: Calculation[], stored: readonly StoredFormulaResult[]): { calculations: Calculation[]; results: FormulaResultLine[] } {
  const perSample = stored.filter((result) => !isAverageKey(result.key));
  const used = new Set<StoredFormulaResult>();
  const attached = calculations.map((calculation, index) => {
    const match = perSample.find((result) => !used.has(result) && (slug(result.key) === slug(calculation.label) || slug(result.key) === `sample${index + 1}`))
      ?? (calculations.length === 1 && perSample.length === 1 ? perSample[0] : undefined);
    if (!match) return { ...calculation, result: null, unavailable: false };
    used.add(match);
    return { ...calculation, result: storedResultText(match), unavailable: false };
  });
  const results = stored.filter((result) => !used.has(result))
    .map((result) => ({ label: resultLabel(result.key), value: storedResultText(result), primary: isAverageKey(result.key) || stored.length === 1 }));
  return { calculations: attached, results };
}

function finish(base: Omit<FormulaWorksheet, "calculations" | "results" | "notice">, calculations: Calculation[], computedAverage: string | null, auth: Authority): FormulaWorksheet {
  if (base.blank) return { ...base, calculations, results: [], notice: null };
  if (auth.governed) {
    const { calculations: attached, results } = attachStoredResults(calculations, auth.stored);
    return { ...base, calculations: attached, results, notice: auth.notice };
  }
  const results: FormulaResultLine[] = computedAverage === null ? [] : [{ label: "Average", value: computedAverage, primary: true }];
  return { ...base, calculations, results, notice: null };
}

function universalWorksheet(settings: string, value: string, auth: Authority, blank: boolean): FormulaWorksheet | null {
  const parsed = parseJson<ExpressionExtract>(settings);
  if (!parsed || typeof parsed.expression !== "string") return null;
  const response = blank ? null : parseFormulaResponse(value);
  const headers = buildInitialHeaders(parsed);
  const recorded = Array.isArray(response?.tableData) ? response.tableData : [];
  const configuredRows = parsed.rowHeaders?.length || parsed.numberOfReadings || parsed.noOfReadings || 0;
  const data = recorded.length ? recorded.map((row) => headers.map((_, column) => String(row[column] ?? ""))) : Array.from({ length: configuredRows }, () => headers.map(() => ""));
  const places = parsed.tableCalculationDecimalPlaces ?? 12;
  const stats = headers.map((_, column) => {
    const numbers = data.map((row) => row[column] ?? "").filter((cell) => hasValue(cell) && Number.isFinite(Number(cell))).map(Number);
    const raw = calculateStats(numbers);
    return { avg: roundHalfAwayFromZero(raw.avg, places), sd: roundHalfAwayFromZero(raw.sd, places), rsd: roundHalfAwayFromZero(raw.rsd, places) };
  });

  const input = (role: "standard" | "sample", field: LabeledInputField, recordedValue: string | undefined): WorksheetEntry =>
    ({ key: field.key, label: weightInputPresentation(parsed, role, field).label || field.key, value: recordedValue ?? "" });
  const standardInputs = (parsed.standardInput === false ? [] : parsed.standardInputs ?? []).map((field) => input("standard", field, response?.standardInputs?.[field.key]));
  const samples = (parsed.sampleInput === false ? [] : parsed.sampleInputs ?? []).map((fields, index) =>
    ({ label: `Sample ${index + 1}`, entries: fields.map((field) => input("sample", field, response?.sampleInputs?.[index]?.[field.key])) }));

  const manual = coerceManualVars(response?.manualVars);
  const expression = normalizeFormulaExpressionText(parsed.expression);
  const keys = [...new Set([...expression.matchAll(/:([A-Za-z0-9_.]+)/g)].map((match) => match[1] ?? ""))];
  const variables: WorksheetEntry[] = Object.entries(manual).map(([key, entry]) => ({ key, label: parsed.manualVarLabels?.[key] || entry.label || key, value: entry.raw }));
  for (const key of keys) {
    if (key && !variables.some((entry) => entry.key === key) && isManualVarKey(key, parsed.constants, undefined, parsed))
      variables.push({ key, label: parsed.manualVarLabels?.[key] || key, value: "" });
  }
  const constants = Object.entries(parsed.constants ?? {}).map(([key, constant]) => ({ key, label: key, value: String(constant) }));

  const filled = data.some((row) => row.some(hasValue)) || [...standardInputs, ...samples.flatMap((sample) => sample.entries), ...variables].some((entry) => hasValue(entry.value));
  const summaries: ReadingsRow[] = [
    ...(parsed.calculateAvgInTable ? [{ label: "Average", cells: blank ? headers.map(() => "") : stats.map((stat) => calculatedText(stat.avg)), summary: true }] : []),
    ...(parsed.calculateSdInTable ? [{ label: "SD", cells: blank ? headers.map(() => "") : stats.map((stat) => calculatedText(stat.sd)), summary: true }] : []),
    ...(parsed.calculateRsdInTable ? [{ label: "RSD (%)", cells: blank ? headers.map(() => "") : stats.map((stat) => calculatedText(stat.rsd)), summary: true }] : []),
  ];
  const readingLabels = buildReadingLabels({ data, hasValues: filled, parsed });
  const table = headers.length && (readingLabels.length || summaries.length)
    ? { columns: headers, rows: [...readingLabels.map((label, index) => ({ label, cells: headers.map((_, column) => data[index]?.[column] ?? ""), summary: false })), ...summaries] }
    : null;

  const percent = Boolean(parsed.percentageResults ?? parsed.percent);
  const base = { kind: "worksheet" as const, blank, expression, percent, constants, variables, standardInputs, samples, table };
  const sampleHeaders = headers.slice(parsed.standardInTable ? 1 : 0);
  if (blank || !filled) return finish(base, blank ? sampleHeaders.map((label) => ({ label, substituted: "", result: null, unavailable: false })) : [], null, auth);

  const computed = computeFormulaResults({ parsed, headers, data, inputVariables: buildInputVariables(parsed, standardInputs.map((entry) => ({ ...entry })), samples.map((sample) => sample.entries.map((entry) => ({ ...entry })))),
    tableVars: buildFormulaTableVariables(stats, parsed.standardInTable ?? false), manualVars: manual });
  const format = (result: number | null) => formatFormulaEquationResult({ value: result, percentageResults: percent, decimalPlaces: parsed.decimalPlaces });
  const calculations = computed.map((entry, index) => {
    const result = format(entry.result);
    return { label: entry.sample || `Sample ${index + 1}`, substituted: entry.substitutedExpression, result, unavailable: result === null };
  });
  const average = computeAverageResult(computed, parsed.averageAllResults ?? parsed.average);
  return finish(base, calculations, format(average), auth);
}

function simpleWorksheet(settings: string, value: string, auth: Authority, blank: boolean): FormulaWorksheet | null {
  const parsed = parseSimpleFormulaSettings(settings);
  const expression = normalizeFormulaExpressionText(parsed?.expression);
  if (!parsed || !expression) return null;
  const constantValues = parsed.constants ?? {};
  const recorded = blank ? {} : parseSimpleFormulaResponse(value);
  const variables = extractFormulaVariables(expression, constantValues).map((key) => {
    const raw = recorded[key];
    return { key, label: parsed.manualVarLabels?.[key] || key, value: raw === undefined || raw === null ? "" : String(raw) };
  });
  const constants = Object.entries(constantValues).map(([key, constant]) => ({ key, label: key, value: String(constant) }));
  const percent = Boolean(parsed.percentageResults ?? parsed.percent);
  const base = { kind: "worksheet" as const, blank, expression, percent, constants, variables, standardInputs: [], samples: [], table: null };
  if (blank) return finish(base, [{ label: "Calculation", substituted: "", result: null, unavailable: false }], null, auth);
  if (!variables.some((entry) => hasValue(entry.value))) return finish(base, [], null, auth);
  const substituted = substituteFormulaValues(expression, Object.fromEntries(variables.map((entry) => [entry.key, entry.value])), constantValues);
  let result: string | null = null;
  if (!auth.governed && !/:[A-Za-z0-9_]+/.test(substituted) && sanitizeForEval(substituted)) {
    try {
      const numeric = Number(evaluateExpression(substituted, {}));
      result = formatFormulaEquationResult({ value: numeric, percentageResults: percent, decimalPlaces: parsed.decimalPlaces });
    } catch { result = null; }
  }
  return finish(base, [{ label: "Calculation", substituted, result, unavailable: !auth.governed && result === null }], null, auth);
}

/**
 * Everything a formula question shows on the worksheet, read from the recorded answer: its constants and variables,
 * inputs, readings table, each sample's substituted calculation and the final results. Governed answers only ever show
 * the results the server stored; older answers are calculated here, as they always were.
 */
export function formulaView(field: FormFieldDto | undefined, response: FormResponseDto | undefined, blank: boolean): FormulaView {
  const value = blank ? "" : normalizeFormulaResponse(response?.value ?? "");
  const definition = formulaSettings(field, response, value);
  if (!definition) return { kind: "unavailable" };
  if (definition.type === FormulaType.Uniformity) return { kind: "uniformity", settings: definition.settings, response: value };
  const auth = authority(response, blank);
  const worksheet = definition.type === FormulaType.Universal
    ? universalWorksheet(definition.settings, value, auth, blank)
    : simpleWorksheet(definition.settings, value, auth, blank);
  return worksheet ?? { kind: "unavailable" };
}
