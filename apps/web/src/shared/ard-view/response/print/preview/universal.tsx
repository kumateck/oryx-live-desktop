import React, { useCallback, useMemo } from "react";
import {
  ExpressionExtract,
  FirstColumnPurpose,
  LabeledInputField,
  ManualVarsMap,
  VarMapWithLabels,
} from "@/shared/formula/ui/types/expression/universal/types";
import ExpressionRenderer from "@/shared/formula/ui/math/expression-view";
import { sanitizeNumber } from "@/shared/ard-view/legacy";
import {
  useTableData,
  useVariableExtraction,
} from "@/shared/formula/ui/types/expression/universal/hooks";
import {
  buildInitialHeaders,
  buildInputVariables,
  coerceManualVars,
  computeFormulaResults,
  isManualVarKey,
  normalizeFormulaExpressionText,
  parseFormulaResponse,
  parseJson,
} from "@/shared/formula/compute/formula-compute";

interface Props {
  settings: string;
  response: string;
}

const PURPOSE_LABEL: Record<FirstColumnPurpose, string> = {
  standard: "Standard",
  blank: "Blank",
  titre: "Titre",
  control: "Control",
};

/**
 * UniversalPreview
 * Read-only preview of a Universal formula response.
 * All inputs and table cells are replaced with static displays — no editing.
 */
export const UniversalPreview: React.FC<Props> = ({ settings, response }) => {
  const parsed = useMemo(
    () => parseJson<ExpressionExtract>(settings),
    [settings],
  );

  const parsedResponse = useMemo(
    () => parseFormulaResponse(response),
    [response],
  );

  const providedHeaders =
    parsed?.headers && parsed.headers.length > 0 ? parsed.headers : undefined;

  const initialHeaders = useMemo(() => {
    if (providedHeaders) return providedHeaders;
    return buildInitialHeaders(parsed);
  }, [providedHeaders, parsed]);

  const { headers, data, stats, tableVars } = useTableData(
    initialHeaders,
    parsedResponse?.tableData,
    parsed?.standardInTable ?? false,
  );

  const standardInputs = useMemo<LabeledInputField[]>(() => {
    if (!parsed?.standardInputs) return [];
    return parsed.standardInputs.map((i) => ({
      ...i,
      value: parsedResponse?.standardInputs?.[i.key] ?? "",
    }));
  }, [parsed, parsedResponse]);

  const sampleInputs = useMemo<LabeledInputField[][]>(() => {
    if (!parsed?.sampleInputs) return [];
    return parsed.sampleInputs.map((inputs, idx) =>
      inputs.map((i) => ({
        ...i,
        value: parsedResponse?.sampleInputs?.[idx]?.[i.key] ?? "",
      })),
    );
  }, [parsed, parsedResponse]);

  const manualVars = useMemo<ManualVarsMap>(
    () =>
      coerceManualVars(
        (parsedResponse?.manualVars as ManualVarsMap | undefined) ??
          parsed?.manualVars,
      ),
    [parsedResponse, parsed?.manualVars],
  );

  const { vars: extractedVars, varKeys } = useVariableExtraction(
    normalizeFormulaExpressionText(parsed?.expression),
    true,
  );

  const manualVarKeys = useMemo(
    () =>
      varKeys.filter(
        (key) =>
          isManualVarKey(key, parsed?.constants, undefined, parsed) &&
          !(key in tableVars),
      ),
    [varKeys, parsed, tableVars],
  );

  const formatNumber = useCallback(
    (
      n: number | null | string | undefined,
      asPercentage = parsed?.percentageResults,
    ): string => {
      if (n === null || n === undefined || n === "") return "—";
      try {
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
      } catch {
        return "—";
      }
    },
    [parsed],
  );
  const showAverageRow = parsed?.calculateAvgInTable === true;
  const showSdRow = parsed?.calculateSdInTable === true;
  const showRsdRow = parsed?.calculateRsdInTable === true;

  const inputVariables = useMemo(
    () => buildInputVariables(parsed, standardInputs, sampleInputs),
    [parsed, standardInputs, sampleInputs],
  );

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

  // const averageResult = useMemo(() => {
  //   if (!parsed?.averageAllResults) return null;
  //   const valid = results
  //     .map((r) => r.result)
  //     .filter((x): x is number => x !== null);
  //   if (!valid.length) return null;
  //   return valid.reduce((s, v) => s + v, 0) / valid.length;
  // }, [results, parsed?.averageAllResults]);

  // const sampleCount = Math.max(
  //   0,
  //   headers.length - (parsed?.standardInTable ? 1 : 0),
  // );
  // const readingCount = data.length;

  return (
    <div className="space-y-3 w-full">
      {/* Settings summary */}

      {/* Expression + Constants + Manual Vars */}
      <div className="bg-card border border-border rounded p-2">
        <div className="flex items-center justify-between pb-1 mb-1 border-b border-border">
          <h3 className="text-document-11 font-bold text-foreground uppercase tracking-wider">
            Expression
          </h3>
        </div>
        <div className="flex justify-between gap-2">
          <div className="w-full">
            <ExpressionRenderer
              print
              className="text-document-11 font-mono p-1"
              expression={normalizeFormulaExpressionText(parsed?.expression)}
              option={{ append100: parsed?.percentageResults, result: null }}
            />
          </div>
          {Object.keys(parsed?.constants || {}).length > 0 && (
            <div className="mt-2 w-full">
              <h4 className="text-document-11 font-bold text-foreground uppercase tracking-wider mb-1">
                Constants
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(parsed?.constants || {}).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-muted border border-border rounded px-2 py-1"
                  >
                    <span className="text-document-11 font-semibold text-info">
                      :{key}
                    </span>
                    <span className="text-document-11 font-semibold">= {value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {manualVarKeys.length > 0 && (
          <div className="mt-2">
            <h4 className="text-document-11 font-bold text-foreground uppercase tracking-wider mb-1">
              Manual Variables
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {manualVarKeys.map((k) => {
                const mv = manualVars[k] || {
                  label: "",
                  raw: "",
                  evaluated: null,
                };
                const displayLabel =
                  mv.label ||
                  (extractedVars as VarMapWithLabels)[k]?.label ||
                  k;
                return (
                  <div
                    key={k}
                    className="flex flex-col gap-1 bg-muted border border-border rounded p-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-document-11 font-bold text-info">
                          :{k}
                        </span>
                        {displayLabel && displayLabel !== k && (
                          <span className="text-document-10 text-muted-foreground italic">
                            ({displayLabel})
                          </span>
                        )}
                      </div>
                      {mv.evaluated !== null && (
                        <span className="text-document-9 bg-muted text-success border border-border rounded-full px-2 py-0.5">
                          = {String(mv.evaluated)}
                        </span>
                      )}
                    </div>
                    {/* Static display: raw value, not an input */}
                    <span className="bg-card border border-border rounded px-2 py-1 text-document-11 text-foreground tabular-nums">
                      {mv.raw !== "" ? (
                        mv.raw
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Expressions Evaluation */}
      <div className="bg-card border border-border rounded p-2">
        <div className="flex items-center justify-between pb-1 mb-1 border-b border-border">
          <h3 className="text-document-11 font-bold text-foreground uppercase tracking-wider">
            Expressions Evaluation
          </h3>
        </div>
        {/* {parsed?.averageAllResults && averageResult !== null && (
          <div className="mb-2 bg-muted border border-border rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-document-11 font-bold text-info">
                Average of All Results
              </span>
              <div className="flex items-center gap-2 bg-card border border-border rounded px-2 py-1">
                <span className="text-document-10 font-semibold text-info uppercase">
                  Avg
                </span>
                <span className="text-sm font-bold text-info">
                  {formatNumber(averageResult)}
                </span>
              </div>
            </div>
          </div>
        )} */}
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="text-document-11 text-muted-foreground italic py-1 text-center">
              No results to display.
            </div>
          ) : (
            results.map((res) => (
              <div key={res.sample} className=" p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-document-11 font-bold text-foreground">
                    {res.sample}
                  </span>
                </div>
                <div className="flex gap-2 justify-between w-full">
                  <div className="bg-card border border-border rounded p-2 mb-2 w-full">
                    <div className="text-document-9 text-muted-foreground font-semibold mb-1">
                      With Values:
                    </div>
                    <div className="text-document-11 font-mono bg-muted p-1 rounded border border-border">
                      <ExpressionRenderer
                        print
                        className="text-document-11 font-mono p-1"
                        expression={res.substitutedExpression}
                        option={{
                          append100: parsed?.percentageResults,
                          result: sanitizeNumber(formatNumber(res.result)),
                        }}
                      />
                    </div>
                    {res.result !== null && (
                      <div className="text-right text-document-11 text-success font-semibold mt-1">
                        = {formatNumber(res.result)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Standard Inputs — static display */}
      {parsed?.standardInput &&
        parsed?.standardInTable &&
        standardInputs.length > 0 && (
          <div className="bg-card border border-border rounded p-2">
            <h3 className="text-document-11 font-bold text-foreground uppercase tracking-wider mb-2">
              {PURPOSE_LABEL[parsed.firstColumnPurpose || "standard"]} Inputs
            </h3>
            <div className="space-y-1.5">
              {standardInputs.map((input) => (
                <div key={input.key} className="flex items-center gap-2">
                  <label className="text-document-11 font-medium text-foreground min-w-[120px]">
                    {input.label}:
                  </label>
                  <span className="flex-1 bg-muted border border-border rounded px-2 py-1 text-document-11 text-foreground tabular-nums">
                    {input.value || (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Sample Inputs — static display */}
      {parsed?.sampleInput &&
        sanitizeNumber(parsed?.sampleInputs?.length) > 0 && (
          <div className="bg-card border border-border rounded p-2">
            <h3 className="text-document-11 font-bold text-foreground uppercase tracking-wider mb-2">
              Sample Inputs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {sampleInputs.map((sample, sampleIndex) => (
                <div
                  key={sampleIndex}
                  className="border border-border rounded p-2"
                >
                  <div className="flex items-center justify-between mb-1 pb-1 border-b border-border">
                    <h4 className="text-document-11 font-bold text-foreground">
                      {headers[
                        sampleIndex + (parsed?.standardInTable ? 1 : 0)
                      ] || `Sample ${sampleIndex + 1}`}
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {sample.map((input, inputIndex) => (
                      <div key={inputIndex} className="flex items-center gap-2">
                        <label className="text-document-10 font-medium text-muted-foreground min-w-[80px]">
                          {input.label}:
                        </label>
                        <span className="flex-1 bg-muted border border-border rounded px-2 py-1 text-document-11 text-foreground tabular-nums">
                          {input.value || (
                            <span className="text-muted-foreground italic">
                              —
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Data Table — static display */}
      {/* <div className="bg-card border border-border rounded p-2 w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-document-11 font-bold text-foreground uppercase tracking-wider">
            Data Table
          </h3>
        </div>
        <div className="overflow-x-auto border border-border rounded">
          {headers.length === 0 ? (
            <div className="text-center p-3 text-muted-foreground text-document-11">
              No data table to display.
            </div>
          ) : (
            <table className="w-full border-collapse text-document-11">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="border-r border-border p-1.5 text-center font-bold text-foreground text-document-11 sticky left-0 bg-muted z-10">
                    Reading
                  </th>
                  {headers.map((h, c) => (
                    <th
                      key={c}
                      className="border-r border-border p-1 bg-muted min-w-[120px]"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="text-document-9 text-muted-foreground font-semibold">
                          {String.fromCharCode(65 + c)}
                        </div>
                      </div>
                      <div className="relative">{h}</div>
                      {parsed?.columnExpressions?.[c]?.error && (
                        <div className="text-document-9 text-destructive mt-0.5 truncate">
                          {parsed?.columnExpressions?.[c].error}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, r) => (
                  <tr key={r} className="hover:bg-muted transition-colors">
                    <td className="border-r border-b border-border p-1.5 bg-muted sticky left-0 z-10">
                      {parsed?.rowHeaders?.[r]?.label || `Reading ${r + 1}`}
                    </td>
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className="border-r border-b border-border p-1 text-center"
                      >
                        <span
                          className={`inline-block w-full text-document-11 text-center tabular-nums ${
                            parsed?.columnExpressions?.[c]?.enabled
                              ? "text-muted-foreground italic"
                              : "text-foreground"
                          }`}
                        >
                          {cell !== "" ? (
                            cell
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
                {showAverageRow && (
                  <tr className="bg-muted border-t-2 border-border">
                    <td className="border-r border-b border-border p-1.5 font-bold text-document-11 text-foreground sticky left-0 bg-muted z-10">
                      Average
                    </td>
                    {stats.map((s, i) => (
                      <td
                        key={`avg-${headers[i]}`}
                        className="border-r border-b border-border p-1 text-center text-document-11 font-semibold text-foreground"
                      >
                        {formatNumber(s.avg, false)}
                      </td>
                    ))}
                  </tr>
                )}
                {showSdRow && (
                  <tr className="bg-muted">
                    <td className="border-r border-b border-border p-1.5 font-bold text-document-11 text-foreground sticky left-0 bg-muted z-10">
                      SD
                    </td>
                    {stats.map((s, i) => (
                      <td
                        key={`sd-${headers[i]}`}
                        className="border-r border-b border-border p-1 text-center text-document-11 font-semibold text-foreground"
                      >
                        {formatNumber(s.sd, false)}
                      </td>
                    ))}
                  </tr>
                )}
                {showRsdRow && (
                  <tr className="bg-muted">
                    <td className="border-r border-b border-border p-1.5 font-bold text-document-11 text-foreground sticky left-0 bg-muted z-10">
                      RSD (%)
                    </td>
                    {stats.map((s, i) => (
                      <td
                        key={`rsd-${headers[i]}`}
                        className="border-r border-b border-border p-1 text-center text-document-11 font-semibold text-foreground"
                      >
                        {formatNumber(s.rsd, false)}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div> */}
      <div className="bg-card border border-border rounded p-2 w-full print:p-0 print:border-0">
        <div className="flex items-center justify-between mb-2 print:mb-1">
          <h3 className="text-document-11 font-bold text-foreground uppercase tracking-wider">
            Data Table
          </h3>
        </div>

        <div className="border border-border rounded w-full">
          {headers.length === 0 ? (
            <div className="text-center p-3 text-muted-foreground text-document-11">
              No data table to display.
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse text-document-10 print:text-document-9">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="border-r border-border p-1 text-center font-bold w-[70px]">
                    Reading
                  </th>

                  {headers.map((h, c) => (
                    <th
                      key={c}
                      className="border-r border-border p-1 bg-muted break-words"
                    >
                      <div className="text-document-8 text-muted-foreground font-semibold">
                        {String.fromCharCode(65 + c)}
                      </div>

                      <div className="break-words leading-tight">{h}</div>

                      {parsed?.columnExpressions?.[c]?.error && (
                        <div className="text-document-8 text-destructive mt-0.5 break-words">
                          {parsed?.columnExpressions?.[c].error}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.map((row, r) => (
                  <tr key={r} className="break-inside-avoid">
                    <td className="border-r border-b border-border p-1 bg-muted">
                      {parsed?.rowHeaders?.[r]?.label || `Reading ${r + 1}`}
                    </td>

                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className="border-r border-b border-border p-1 text-center break-words"
                      >
                        {cell !== "" ? (
                          cell
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}

                {showAverageRow && (
                  <tr className="bg-muted font-semibold break-inside-avoid">
                    <td className="border-r border-b border-border p-1">
                      Average
                    </td>

                    {stats.map((s, i) => (
                      <td
                        key={`avg-${headers[i]}`}
                        className="border-r border-b border-border p-1 text-center"
                      >
                        {formatNumber(s.avg, false)}
                      </td>
                    ))}
                  </tr>
                )}
                {showSdRow && (
                  <tr className="bg-muted font-semibold break-inside-avoid">
                    <td className="border-r border-b border-border p-1">SD</td>

                    {stats.map((s, i) => (
                      <td
                        key={`sd-${headers[i]}`}
                        className="border-r border-b border-border p-1 text-center"
                      >
                        {formatNumber(s.sd, false)}
                      </td>
                    ))}
                  </tr>
                )}
                {showRsdRow && (
                  <tr className="bg-muted font-semibold break-inside-avoid">
                    <td className="border-r border-b border-border p-1">
                      RSD (%)
                    </td>

                    {stats.map((s, i) => (
                      <td
                        key={`rsd-${headers[i]}`}
                        className="border-r border-b border-border p-1 text-center"
                      >
                        {formatNumber(s.rsd, false)}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
