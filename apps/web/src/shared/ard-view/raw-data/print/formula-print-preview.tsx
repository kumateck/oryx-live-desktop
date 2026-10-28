import { useCallback, useEffect, useMemo } from "react";
import { sanitizeNumber, sanitizeString } from "@/shared/ard-view/legacy";
import {
  ExpressionExtract,
  LabeledInputField,
  ManualVarsMap,
  VarMapWithLabels,
} from "@/shared/formula/ui/types/expression/universal/types";
import {
  useTableData,
  useVariableExtraction,
} from "@/shared/formula/ui/types/expression/universal/hooks";
import {
  buildInitialHeaders,
  buildInputVariables,
  coerceManualVars,
  computeAverageResult,
  computeFormulaResults,
  isManualVarKey,
  normalizeFormulaExpressionText,
  parseFormulaResponse,
  parseJson,
} from "@/shared/formula/compute/formula-compute";
import FormulaPrintSummary from "./formula-print-summary";
import {
  buildReadingLabels,
  hasFormulaResponseValues,
} from "./formula-print-utils";
import FormulaPrintWorksheet from "./formula-print-worksheet";

interface FormulaPrintPreviewProps {
  settings: string;
  response: string;
}

const resolveFormulaLabel = (label?: string, key?: string) => {
  const safeLabel = sanitizeString(label);
  return safeLabel || sanitizeString(key);
};

const resolveFormulaValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
};

const FormulaPrintPreview = ({
  settings,
  response,
}: FormulaPrintPreviewProps) => {
  const parsed = useMemo(
    () => parseJson<ExpressionExtract>(settings),
    [settings],
  );
  const parsedResponse = useMemo(
    () => parseFormulaResponse(response),
    [response],
  );

  const initialHeaders = useMemo(() => buildInitialHeaders(parsed), [parsed]);
  const { headers, data, stats, tableVars, updateTableData } = useTableData(
    initialHeaders,
    parsedResponse?.tableData || [],
  );

  useEffect(() => {
    if (!headers.length) return;
    const responseTableData = parsedResponse?.tableData;
    if (Array.isArray(responseTableData) && responseTableData.length > 0) {
      updateTableData(headers, responseTableData);
      return;
    }

    const configuredRows = sanitizeNumber(parsed?.rowHeaders?.length);
    const emptyRows = Array.from({ length: configuredRows }).map(() =>
      Array.from({ length: headers.length }).map(() => ""),
    );
    updateTableData(headers, emptyRows);
  }, [
    headers,
    parsedResponse?.tableData,
    parsed?.rowHeaders?.length,
    updateTableData,
  ]);

  const standardInputs = useMemo(() => {
    return (parsed?.standardInputs || []).map((input: LabeledInputField) => ({
      label: resolveFormulaLabel(input.label, input.key),
      key: sanitizeString(input.key),
      value: sanitizeString(parsedResponse?.standardInputs?.[input.key]),
    }));
  }, [parsed?.standardInputs, parsedResponse?.standardInputs]);

  const sampleInputs = useMemo(() => {
    return (parsed?.sampleInputs || []).map((inputs, sampleIndex) => {
      return inputs.map((input: LabeledInputField) => ({
        sampleIndex,
        label: resolveFormulaLabel(input.label, input.key),
        key: sanitizeString(input.key),
        value: sanitizeString(
          parsedResponse?.sampleInputs?.[sampleIndex]?.[input.key],
        ),
      }));
    });
  }, [parsed?.sampleInputs, parsedResponse?.sampleInputs]);

  const manualVars = useMemo<ManualVarsMap>(
    () => coerceManualVars(parsedResponse?.manualVars ?? parsed?.manualVars),
    [parsedResponse?.manualVars, parsed?.manualVars],
  );

  const { vars: extractedVars, varKeys } = useVariableExtraction(
    normalizeFormulaExpressionText(parsed?.expression),
    true,
  );

  const inputVariables = useMemo(
    () => buildInputVariables(parsed, standardInputs, sampleInputs),
    [parsed, standardInputs, sampleInputs],
  );

  const formatNumber = useCallback(
    (
      n: number | null | string | undefined,
      asPercentage = parsed?.percentageResults,
    ): string => {
      if (n === null || n === undefined || n === "") return "—";
      const numValue = typeof n === "string" ? Number(n) : n;
      if (!Number.isFinite(numValue)) return "—";
      const displayValue = asPercentage ? numValue * 100 : numValue;
      const digits =
        typeof parsed?.decimalPlaces === "number"
          ? parsed?.decimalPlaces
          : undefined;
      const formatted =
        digits !== undefined
          ? displayValue.toLocaleString(undefined, {
              maximumFractionDigits: digits,
              minimumFractionDigits: digits,
            })
          : displayValue.toLocaleString(undefined, {
              maximumFractionDigits: 6,
            });
      return asPercentage ? `${formatted}%` : formatted;
    },
    [parsed],
  );

  const constants = useMemo(
    () =>
      Object.entries(parsed?.constants || {}).map(([key, value]) => ({
        key,
        label: resolveFormulaLabel(undefined, key),
        value: String(value),
      })),
    [parsed?.constants],
  );

  const mergedManualEntries = useMemo(() => {
    const entries = Object.entries(manualVars).map(([key, value]) => ({
      key,
      label: resolveFormulaLabel(
        value.label,
        (extractedVars as VarMapWithLabels)?.[key]?.label || key,
      ),
      value: resolveFormulaValue(value.raw),
    }));

    const missingKeys = varKeys.filter(
      (key) =>
        isManualVarKey(key, parsed?.constants, undefined, parsed) &&
        !entries.find((entry) => entry.key === key),
    );

    missingKeys.forEach((key) => {
      const extracted = (extractedVars as VarMapWithLabels)?.[key];
      entries.push({
        key,
        label: sanitizeString(extracted?.label) || key,
        value: "",
      });
    });

    return entries;
  }, [manualVars, extractedVars, varKeys, parsed]);

  const results = useMemo(
    () =>
      computeFormulaResults({
        parsed,
        headers,
        data,
        inputVariables,
        tableVars,
        manualVars,
      }),
    [parsed, headers, data, inputVariables, tableVars, manualVars],
  );

  const averageResult = useMemo(
    () => computeAverageResult(results, parsed?.averageAllResults),
    [results, parsed?.averageAllResults],
  );
  const hasFormulaValues = useMemo(
    () =>
      hasFormulaResponseValues({
        data,
        manualVars,
        sampleInputs,
        standardInputs,
      }),
    [data, manualVars, sampleInputs, standardInputs],
  );
  const readingLabels = useMemo(
    () => buildReadingLabels({ data, hasValues: hasFormulaValues, parsed }),
    [data, hasFormulaValues, parsed],
  );

  if (!parsed) {
    return (
      <span className="text-sm text-muted-foreground">
        Formula is not configured.
      </span>
    );
  }

  return (
    <div className="space-y-2 text-sm text-foreground print:text-black">
      <FormulaPrintSummary
        constants={constants}
        manualEntries={mergedManualEntries}
        sampleInputs={sampleInputs}
        standardInputs={standardInputs}
      />
      <FormulaPrintWorksheet
        averageResult={averageResult}
        data={data}
        formatNumber={formatNumber}
        hasFormulaValues={hasFormulaValues}
        headers={headers}
        parsed={parsed}
        readingLabels={readingLabels}
        results={results}
        stats={stats}
      />
    </div>
  );
};

export default FormulaPrintPreview;
