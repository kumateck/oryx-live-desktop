import { z } from "zod";
import { evaluationSettings } from "@/shared/formula/ui/types/evaluate/settings";
import { FormulaType, QuestionType } from "@/shared/questions/question-types";
import { parseTableAnswer, parseTableConfig } from "@/shared/questions/table-question";
import { answerFilled, type AnswerValue } from "./answers";
import { questionDefinition, type FormField } from "./form-model";

type JsonValue = z.infer<ReturnType<typeof z.json>>;
const object = (value: JsonValue | undefined): Record<string, JsonValue> => value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
const array = (value: JsonValue | undefined): JsonValue[] => Array.isArray(value) ? value : [];
const numeric = (value: JsonValue | undefined) => (typeof value === "number" || typeof value === "string" && value.trim() !== "") && Number.isFinite(Number(value));
const numbers = (value: JsonValue | undefined, count: number) => Array.isArray(value) && value.length >= count && value.every(numeric);

const blank = (value: JsonValue | undefined) => value === null || value === undefined || typeof value === "string" && value.trim() === "";
/**
 * Every column has at least one reading and every filled cell is a number. Columns may hold fewer readings than
 * the table has rows (for example five standard injections and two per sample): column statistics use the filled
 * cells only. Mirrors the server.
 */
function readingsComplete(table: JsonValue[], rows: number, columns: number): boolean {
  if (table.length < rows || !table.every(Array.isArray)) return false;
  const filled = Array.from({ length: columns }, () => false);
  for (const row of table) {
    for (const [index, cell] of array(row).slice(0, columns).entries()) {
      if (blank(cell)) continue;
      if (!numeric(cell)) return false;
      filled[index] = true;
    }
  }
  return filled.every(Boolean);
}

function read(raw: string): JsonValue {
  try { return z.json().parse(JSON.parse(raw)); } catch { return null; }
}

/** Checks input completeness only. The server remains authoritative for formula execution and results. */
export function formulaAnswerComplete(raw: string, definition: string): boolean {
  const settings = evaluationSettings(definition);
  if (!settings) return false;
  const config = object(read(settings.settings));
  const value = object(read(raw));
  if (Object.keys(value).length === 0) return false;
  if (settings.type === FormulaType.Simple) {
    const keys = [...String(config.expression ?? "").matchAll(/:([A-Za-z0-9_]+)/g)].flatMap(match => match[1] ? [match[1]] : []);
    const constants = object(config.constants);
    return keys.every(key => numeric(constants[key] ?? value[key])) && Object.values(value).every(numeric);
  }
  if (settings.type === FormulaType.Uniformity) {
    const inputs = object(value.inputs);
    const count = Number(config.sampleCount ?? 0);
    if (count < 1) return false;
    return config.mode === "capsule"
      ? numeric(inputs.bulkCapsules) && numeric(inputs.bulkShells) && numbers(inputs.capsWts, count) && numbers(inputs.shellWts, count)
      : numeric(inputs.bulkTotal) && numbers(inputs.indWts, count);
  }
  const standard = object(value.standardInputs);
  const samples = array(value.sampleInputs);
  const inputsComplete = (configured: JsonValue | undefined, entered: Record<string, JsonValue>) =>
    array(configured).every(input => { const key = object(input).key; return typeof key === "string" && numeric(entered[key]); }) && Object.values(entered).every(numeric);
  // Only the inputs the worksheet shows are required. A formula whose standard (or sample) inputs are switched off
  // can still list them in its settings; the analyst never sees those boxes, so they can never be filled.
  const shown = (enabled: JsonValue | undefined, configured: JsonValue | undefined) => typeof enabled === "boolean" ? enabled : array(configured).length > 0;
  const standardShown = shown(config.standardInput, config.standardInputs) && config.standardInTable === true;
  if (!inputsComplete(standardShown ? config.standardInputs : [], standard)) return false;
  const configuredSamples = shown(config.sampleInput, config.sampleInputs) ? array(config.sampleInputs) : [];
  if (samples.length < configuredSamples.length || !samples.every((sample, index) => inputsComplete(configuredSamples[index], object(sample)))) return false;
  const manual = object(value.manualVars);
  const expressions = [config.expression, ...array(config.namedExpressions).map(entry => object(entry).expression)].join(" ");
  const referenced = new Set([...expressions.matchAll(/:([A-Za-z0-9_.]+)/g)].map(match => match[1]));
  const manualKeys = new Set([...Object.keys(object(config.manualVars)), ...Object.keys(object(config.manualVarLabels)), ...Object.keys(manual)].filter(key => referenced.has(key)));
  if (![...manualKeys].every(key => {
    const entry = manual[key];
    if (numeric(entry)) return true;
    const variable = object(entry);
    return numeric(variable.value) || typeof variable.raw === "string" && variable.raw.trim() !== "" && numeric(variable.evaluated);
  })) return false;
  const rows = Number(config.numberOfReadings ?? config.noOfReadings ?? array(config.rowHeaders).length);
  const columns = array(config.headers).length || Number(config.numberOfSamples ?? config.noOfSamples ?? 0) + (config.standardInTable ? 1 : 0);
  const table = array(value.tableData);
  // A formula without sample or standard columns has no readings table (the worksheet shows none), however
  // many readings its settings default to; only its manual and input values are required. Mirrors the server.
  // Calculated table columns evaluate cell by cell, so a worksheet with them needs every reading.
  const everyCell = config.formulaInTable === true;
  if (columns > 0 && (everyCell ? table.length < rows || !table.every(row => numbers(row, columns)) : !readingsComplete(table, rows, columns))) return false;
  return Object.keys(standard).length > 0 || samples.some(sample => Object.keys(object(sample)).length > 0) || manualKeys.size > 0 || table.some(row => array(row).length > 0);
}

export function answerComplete(field: FormField, value: AnswerValue | undefined): boolean {
  if (!answerFilled(value, field.question.type)) return false;
  if (field.question.type === QuestionType.Formula) return typeof value === "string" && formulaAnswerComplete(value, questionDefinition(field.question));
  if (field.question.type === QuestionType.Table) {
    const config = parseTableConfig(questionDefinition(field.question));
    const cells = parseTableAnswer(typeof value === "string" ? value : null);
    return config !== null && Object.entries(config.cellConfigs).every(([key, cell]) =>
      cell.isMerged || cell.type !== "input" && cell.type !== "select" || Boolean(cells[key]?.trim()));
  }
  return true;
}
