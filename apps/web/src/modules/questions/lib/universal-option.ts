import { FormulaType as FormulaTypes } from "@/shared/questions/question-types";
const sanitizeString = (value: unknown) => typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";

export type FormulaOptionJson = {
  type?: unknown;
  expression?: unknown;
  [key: string]: unknown;
};

const universalOptionKeys = [
  "averageAllResults",
  "calculateAvgInTable",
  "calculateRsdInTable",
  "calculateSdInTable",
  "columnExpressions",
  "constants",
  "data",
  "decimalPlaces",
  "inputDecimalPlaces",
  "tableCalculationDecimalPlaces",
  "finalResultDecimalPlaces",
  "expression",
  "firstColumnPurpose",
  "formulaInTable",
  "headers",
  "manualVarExpressions",
  "manualVarLabels",
  "manualVars",
  "noOfReadings",
  "noOfSamples",
  "numberOfReadings",
  "numberOfSamples",
  "percent",
  "percentageResults",
  "rowHeaders",
  "sampleInTable",
  "sampleInput",
  "sampleInputs",
  "standardInTable",
  "standardInput",
  "standardInputs",
  "tableData",
  "type",
] as const;

const defaultUniversalOption = (expression: string): FormulaOptionJson => {
  const readings = 5;
  const samples = 2;
  return {
    averageAllResults: false,
    calculateAvgInTable: true,
    calculateRsdInTable: true,
    calculateSdInTable: true,
    columnExpressions: {},
    constants: {},
    data: [],
    decimalPlaces: 2,
    inputDecimalPlaces: 2,
    tableCalculationDecimalPlaces: 2,
    finalResultDecimalPlaces: 2,
    expression,
    firstColumnPurpose: "standard",
    formulaInTable: false,
    headers: ["Standard", "Sample 1", "Sample 2"],
    manualVarExpressions: {},
    manualVarLabels: {},
    manualVars: {},
    noOfReadings: readings,
    noOfSamples: samples,
    numberOfReadings: readings,
    numberOfSamples: samples,
    percent: false,
    percentageResults: false,
    rowHeaders: Array.from({ length: readings }, (_, index) => ({
      id: `row-${index + 1}`,
      label: `Reading ${index + 1}`,
    })),
    sampleInTable: true,
    sampleInput: true,
    sampleInputs: Array.from({ length: samples }, () => [
      { label: "Weight (g)", value: "", key: "wt" },
    ]),
    standardInTable: true,
    standardInput: true,
    standardInputs: [{ label: "Weight (g)", value: "", key: "wt" }],
    tableData: [],
    type: FormulaTypes.Universal,
  };
};

const mergeDefined = (
  base: FormulaOptionJson,
  next: FormulaOptionJson | null,
) =>
  next
    ? Object.entries(next).reduce<FormulaOptionJson>((result, [key, value]) => {
        if (value !== undefined) result[key] = value;
        return result;
      }, base)
    : base;

const ensureUniversalOptionKeys = (option: FormulaOptionJson) => {
  const defaults = defaultUniversalOption(String(option.expression || ""));
  for (const key of universalOptionKeys) {
    if (!Object.prototype.hasOwnProperty.call(option, key))
      option[key] = defaults[key];
  }
  const percentage =
    typeof option.percentageResults === "boolean"
      ? option.percentageResults
      : Boolean(option.percent);
  option.percent = percentage;
  option.percentageResults = percentage;
  if (!Array.isArray(option.tableData))
    option.tableData = Array.isArray(option.data) ? option.data : [];
  if (!Array.isArray(option.data))
    option.data = Array.isArray(option.tableData) ? option.tableData : [];
  return option;
};

export const buildUniversalOption = (
  expression: string,
  current: FormulaOptionJson | null,
  previous: FormulaOptionJson | null,
) => {
  const expressionValue = current?.expression
    ? sanitizeString(current.expression)
    : expression;
  const merged = mergeDefined(
    mergeDefined(defaultUniversalOption(expressionValue), previous),
    current,
  );
  merged.expression = expressionValue;
  merged.type = FormulaTypes.Universal;
  return ensureUniversalOptionKeys(merged);
};

export const safeFormulaOptionParse = (
  value: string,
): FormulaOptionJson | null => {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object"
      ? (parsed as FormulaOptionJson)
      : null;
  } catch {
    return null;
  }
};
