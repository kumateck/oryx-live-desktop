import {
  FORMULA_LANGUAGE_V1,
  FormulaDataType,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaScope,
  FormulaSourceType,
  FormulaValueShape,
  FORMULA_V1_EVALUATION_LIMITS,
  FORMULA_V1_RUNTIME_LIMITS,
  buildDefaultFormulaTestCasesV1,
  compileFormulaDefinitionV1,
  hashCompiledFormulaDefinitionV1,
  hashResolvedFormulaConfiguration,
  hashWorksheetPreprocessorTestCasesV1,
  parseExpressionV1,
  type FormulaDefinitionV1,
  type FormulaWorksheetPreprocessorV1,
  type ResolvedFormulaPlacement,
} from "../core";

const NUMERIC_POLICY = "oryx-decimal-v1-half-up";

type ColumnEntry = { enabled?: boolean; expression?: string; error?: unknown };

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizedColumns = (
  config: Record<string, unknown>,
  headers: string[],
) => {
  const raw = config.columnExpressions;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return new Map();
  const expressions = new Map<number, string>();
  for (const [targetText, value] of Object.entries(raw)) {
    const target = Number(targetText);
    const entry = value as ColumnEntry;
    if (!entry.enabled) continue;
    if (entry.error || !entry.expression?.trim())
      throw new Error(
        `Derived column ${target + 1} has an invalid expression.`,
      );
    if (!Number.isInteger(target) || target < 0 || target >= headers.length)
      throw new Error("Derived column target is outside the worksheet.");
    let expression = entry.expression.trim();
    headers
      .map((header, index) => ({ header: header.trim(), index }))
      .filter(({ header }) => header.length > 0)
      .sort((left, right) => right.header.length - left.header.length)
      .forEach(({ header, index }) => {
        expression = expression.replace(
          new RegExp(
            `(?<![A-Za-z0-9_]):?${escapeRegex(header)}(?![A-Za-z0-9_])`,
            "gi",
          ),
          `:c${index}`,
        );
      });
    const parsed = parseExpressionV1(expression, FORMULA_V1_RUNTIME_LIMITS);
    if (!parsed.ok || parsed.variables.some((key) => !/^c\d+$/.test(key)))
      throw new Error(`Derived column ${target + 1} uses an unknown column.`);
    if (parsed.variables.includes(`c${target}`))
      throw new Error(`Derived column ${target + 1} cannot reference itself.`);
    expressions.set(target, expression);
  }
  return expressions;
};

const expand = (
  column: number,
  expressions: Map<number, string>,
  path: Set<number>,
): string => {
  const expression = expressions.get(column);
  if (!expression) return `:c${column}`;
  if (path.has(column))
    throw new Error("Derived table columns contain a cycle.");
  const nextPath = new Set(path).add(column);
  return expression.replace(
    /:c(\d+)\b/g,
    (_match, source: string) =>
      `(${expand(Number(source), expressions, nextPath)})`,
  );
};

const rawConfiguration = (placement: ResolvedFormulaPlacement) => ({
  placementKey: placement.placementKey,
  definitionHash: placement.definitionHash,
  methodReference: placement.methodReference,
  displayPolicy: placement.displayPolicy,
  bindings: placement.bindings,
  resultTargets: placement.resultTargets,
});

export async function buildWorksheetPreprocessor(
  config: Record<string, unknown>,
  tableDigits: number,
  inputDigits: number,
): Promise<FormulaWorksheetPreprocessorV1 | undefined> {
  if (config.formulaInTable !== true) return undefined;
  const headers = Array.isArray(config.headers)
    ? config.headers.map((value) => String(value))
    : [];
  if (
    headers.length === 0 ||
    new Set(headers.map((item) => item.trim().toLowerCase())).size !==
      headers.length
  )
    throw new Error("Derived table columns require unique worksheet headers.");
  const expressions = normalizedColumns(config, headers);
  if (expressions.size === 0)
    throw new Error(
      "Formula in Table requires at least one derived column expression.",
    );
  const rows = Number(config.numberOfReadings ?? config.noOfReadings ?? 5);
  if (!Number.isInteger(rows) || rows < 1 || rows * expressions.size > 20)
    throw new Error(
      "Derived worksheet results exceed the governed limit of 20 cells.",
    );
  const inputs = new Map<
    string,
    { variableKey: string; row: number; column: number }
  >();
  const outputs: FormulaWorksheetPreprocessorV1["outputs"] = [];
  const results = [...expressions.keys()].flatMap((column) =>
    Array.from({ length: rows }, (_, row) => {
      const resultKey = `r${row}c${column}`;
      const expression = expand(column, expressions, new Set()).replace(
        /:c(\d+)\b/g,
        (_match, source: string) => {
          const variableKey = `r${row}c${source}`;
          inputs.set(variableKey, { variableKey, row, column: Number(source) });
          return `:${variableKey}`;
        },
      );
      outputs.push({ resultKey, row, column });
      return {
        key: resultKey,
        label: resultKey,
        expression,
        unit: null,
        numericScale: FormulaNumericScale.Absolute,
        rounding: {
          kind: FormulaRoundingKind.DecimalPlaces,
          digits: tableDigits,
        },
      };
    }),
  );
  const definition: FormulaDefinitionV1 = {
    formulaLanguageVersion: FORMULA_LANGUAGE_V1,
    numericPolicyVersion: NUMERIC_POLICY,
    precisionPolicy: {
      inputDecimalPlaces: inputDigits,
      tableCalculationDecimalPlaces: tableDigits,
    },
    variables: [...inputs.values()].map(({ variableKey }) => ({
      key: variableKey,
      label: variableKey,
      dataType: FormulaDataType.Decimal,
      valueShape: FormulaValueShape.Scalar,
      scope: FormulaScope.Placement,
      unit: null,
      required: true,
    })),
    results,
  };
  const compiled = compileFormulaDefinitionV1(
    definition,
    FORMULA_V1_RUNTIME_LIMITS,
  );
  if (!compiled.ok) throw new Error("Derived worksheet definition is invalid.");
  const definitionHash = await hashCompiledFormulaDefinitionV1(
    compiled.definition,
  );
  const validationCases = buildDefaultFormulaTestCasesV1(
    compiled.definition,
    FORMULA_V1_EVALUATION_LIMITS,
  );
  const placement: ResolvedFormulaPlacement = {
    placementKey: "worksheet-preprocessor",
    definitionHash,
    definition: compiled.definition,
    methodReference: null,
    displayPolicy: {
      policyVersion: "oryx-formula-display-v1",
      showResult: false,
      showUnit: false,
      showTrace: false,
    },
    bindings: [...inputs.values()].map(({ variableKey, row, column }) => ({
      variableKey,
      source: {
        sourceType: FormulaSourceType.LocalInput,
        reference: `worksheet:row:${row}:column:${column}`,
        dataType: FormulaDataType.Decimal,
        valueShape: FormulaValueShape.Scalar,
        scope: FormulaScope.Placement,
        unit: null,
        inputDecimalPlaces: inputDigits,
      },
    })),
    resultTargets: outputs.map(({ resultKey, row, column }) => ({
      resultKey,
      targetKey: `worksheet:row:${row}:column:${column}`,
      dataType: FormulaDataType.Decimal,
      valueShape: FormulaValueShape.Scalar,
      unit: null,
    })),
  };
  return {
    definitionHash,
    definition,
    validationCaseHash:
      await hashWorksheetPreprocessorTestCasesV1(validationCases),
    configurationHash: await hashResolvedFormulaConfiguration(placement),
    configuration: rawConfiguration(placement),
    inputs: [...inputs.values()],
    outputs,
  };
}
