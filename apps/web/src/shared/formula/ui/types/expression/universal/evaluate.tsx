import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  startTransition,
  useState,
} from "react";
import { evaluateExpression as safeEval } from "./engine/expressionEngine";
import {
  ComplexEvaluateValue,
  ExpressionExtract,
  LabeledInputField,
  TheAduseiFormulaProps,
  FirstColumnPurpose,
  ManualVarsMap,
} from "./types";
import {
  ArrowLeft,
  Beaker,
  Calculator,
  FunctionSquare,
  Plus,
  Settings,
} from "lucide-react";
import { sanitizeNumber, sanitizeString } from "@/shared/formula/ui/legacy";
import { countOccurrences, sanitizeForEval } from "../../utils";
import { useTableData } from "./hooks";
import { Button } from "@/components/ui/button";
import { resolveToken, expandAutoSampleTemplates } from "./token";
import { normalizeExpressionPayload } from "./normalizer";
import { evaluateDerivedColumns } from "./column-expression";
import {
  inlineUniversalNamedExpressions,
  parseUniversalNamedExpressions,
} from "@/shared/formula/builder/universal-named-expressions";
import {
  buildInputVariables,
  isManualVarKey,
} from "@/shared/formula/compute/formula-compute-helpers";

interface Props extends TheAduseiFormulaProps {
  settings: string;
  showMetaPanels?: boolean | undefined;
}

const PURPOSE_LABEL: Record<FirstColumnPurpose, string> = {
  standard: "Standard",
  blank: "Blank",
  titre: "Titre",
  control: "Control",
};

const hasBalancedParentheses = (expr: string): boolean => {
  let count = 0;
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === "(") count++;
    if (expr[i] === ")") count--;
    if (count < 0) return false;
  }
  return count === 0;
};

const coerceManualVars = (
  mv?: ManualVarsMap | Record<string, { label: string; value: string | number }>,
): ManualVarsMap => {
  if (!mv) return {};
  const result: ManualVarsMap = {};
  Object.entries(mv).forEach(([k, entry]) => {
    const v: { label?: string | undefined; raw?: string | undefined; evaluated?: number | null | undefined; value?: string | number | undefined } = entry;
    if ("raw" in v && "evaluated" in v) {
      result[k] = {
        label: v.label || "",
        raw: v.raw ?? "",
        evaluated: typeof v.evaluated === "number" ? v.evaluated : null,
      };
    } else {
      // legacy structure
      const rawString = String(v.value ?? "");
      let evaluated: number | null = null;
      if (
        rawString !== "" &&
        hasBalancedParentheses(rawString) &&
        sanitizeForEval(rawString) &&
        !/:[A-Za-z0-9_.]+/.test(rawString) &&
        /^[0-9eE+\-*/().\s]*$/.test(rawString)
      ) {
        try {
          const val = safeEval(rawString, {});
          if (val !== null) {
            evaluated = val;
          }
        } catch {}
      }
      result[k] = {
        label: v.label || "",
        raw: rawString,
        evaluated,
      };
    }
  });
  return result;
};

const extractVarKeys = (expression: string): string[] => {
  const regex = /:([A-Za-z0-9_.]+)/g;
  const found = new Set<string>();
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(expression))) {
    if (match[1]) found.add(match[1]);
  }
  return Array.from(found);
};

const acceptsInputScale = (value: string, places = 12) =>
  ((value.split(/[eE]/, 1)[0] ?? value).split(".")[1]?.length ?? 0) <= places;

export const UniversalEvaluate: React.FC<Props> = ({
  settings,
  value,
  onChange,
  testMode,
  onBack,
  showMetaPanels = true,
}) => {
  const parsed = useMemo<ExpressionExtract | null>(() => {
    try {
      if (!settings || settings.trim() === "") return null;
      return normalizeExpressionPayload(
        JSON.parse(settings) as ExpressionExtract,
      );
    } catch (e) {
      console.error("[Evaluate] Failed to parse settings JSON:", e);
      return null;
    }
  }, [settings]);

  // Prefer provided headers verbatim; fallback building if missing
  const providedHeaders =
    parsed?.headers && parsed.headers.length > 0 ? parsed.headers : undefined;
  const initialHeaders = useMemo(() => {
    if (providedHeaders) return providedHeaders;
    const samples = parsed?.numberOfSamples ?? parsed?.noOfSamples ?? 0;
    if (parsed?.standardInTable) {
      return [
        PURPOSE_LABEL[parsed.firstColumnPurpose || "standard"],
        ...Array(samples)
          .fill(null)
          .map((_, i) => `Sample ${i + 1}`),
      ];
    }
    return Array(samples)
      .fill(null)
      .map((_, i) => `Sample ${i + 1}`);
  }, [
    providedHeaders,
    parsed?.numberOfSamples,
    parsed?.noOfSamples,
    parsed?.standardInTable,
    parsed?.firstColumnPurpose,
  ]);

  const { headers, data, stats, tableVars, updateCell, updateTableData } =
    useTableData(
      initialHeaders,
      undefined,
      parsed?.standardInTable ?? false,
      parsed?.inputDecimalPlaces ?? 12,
      parsed?.tableCalculationDecimalPlaces ?? 12,
    );

  // Ensure row count matches snapshot counts (prefer rowHeaders length)
  useEffect(() => {
    const readings =
      parsed?.numberOfReadings ??
      parsed?.noOfReadings ??
      parsed?.rowHeaders?.length ??
      data.length;
    const targetHeaders = providedHeaders || headers;
    const headerCount = targetHeaders.length;
    const currentColCount = data[0]?.length ?? 0;
    if (
      data.length === readings &&
      headers.length === headerCount &&
      currentColCount === headerCount
    )
      return;
    const rows = Array(readings)
      .fill(null)
      .map(() => Array(headerCount).fill(""));
    updateTableData(targetHeaders, rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    parsed?.numberOfReadings,
    parsed?.noOfReadings,
    parsed?.rowHeaders,
    providedHeaders,
  ]);

  // Non-test persisted value hydration (kept, but editing is allowed in test w/o persisting)
  const parsedValue = useMemo(() => {
    if (testMode || !value) return undefined;
    try {
      const vObj = JSON.parse(value);
      return vObj as ComplexEvaluateValue;
    } catch {
      return undefined;
    }
  }, [value, testMode]);

  // Manual variables (coerced)
  const [manualVars, setManualVars] = useState<ManualVarsMap>(() =>
    coerceManualVars(parsed?.manualVars),
  );

  // Inputs initializers (enabled for editing even in test; we just won’t persist onChange)
  const initStandard = (): LabeledInputField[] =>
    parsed?.standardInputs
      ? parsed.standardInputs.map((i) => ({
          ...i,
          value:
            parsedValue?.standardInputs && !testMode
              ? (parsedValue.standardInputs[i.key] ?? "")
              : (i.value ?? ""),
        }))
      : [];

  const initSamples = (): LabeledInputField[][] =>
    parsed?.sampleInputs
      ? parsed.sampleInputs.map((inputs, idx) =>
          inputs.map((i) => ({
            ...i,
            value:
              parsedValue?.sampleInputs?.[idx] && !testMode
                ? (parsedValue.sampleInputs[idx][i.key] ?? "")
                : (i.value ?? ""),
          })),
        )
      : [];

  const [standardInputs, setStandardInputs] =
    useState<LabeledInputField[]>(initStandard);
  const [sampleInputs, setSampleInputs] =
    useState<LabeledInputField[][]>(initSamples);

  // Track last emitted value to prevent re-hydration from our own onChange emissions
  const lastEmittedRef = useRef<string | null>(null);

  // Rehydrate (non-test only) — skip if the incoming value was emitted by us
  useEffect(() => {
    if (!testMode && value && value !== lastEmittedRef.current) {
      setStandardInputs(initStandard());
      setSampleInputs(initSamples());
      setManualVars(coerceManualVars(parsed?.manualVars));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, testMode]);

  const varKeys = useMemo(
    () => extractVarKeys(sanitizeString(parsed?.expression || "")),
    [parsed?.expression],
  );

  // Filter for manual variable keys (exclude system/table/cell tokens)
  const manualVarKeys = useMemo(() => {
    const namedKeys = new Set(parsed?.namedExpressions?.map(({ key }) => key));
    return varKeys.filter(
      (key) =>
        isManualVarKey(key, parsed?.constants, namedKeys, parsed) &&
        !(key in tableVars),
    );
  }, [varKeys, tableVars, parsed]);

  // Ensure manualVars has all current keys
  useEffect(() => {
    setManualVars((prev) => {
      let changed = false;
      const next = { ...prev };
      manualVarKeys.forEach((k) => {
        if (!next[k]) {
          changed = true;
          next[k] = {
            label: "",
            raw: "",
            evaluated: null,
          };
        } else {
          const resolvedLabel = next[k].label;
          if (next[k].label !== resolvedLabel) {
            changed = true;
            next[k].label = resolvedLabel;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [manualVarKeys]);

  const standardInputsRef = useRef(standardInputs);
  const sampleInputsRef = useRef(sampleInputs);
  const manualVarsRef = useRef(manualVars);
  const dataRef = useRef(data);
  const pendingOverridesRef = useRef<Partial<ComplexEvaluateValue>>({});
  const emitTimerRef = useRef<number | null>(null);
  const idleCallbackRef = useRef<number | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);

  useEffect(() => {
    standardInputsRef.current = standardInputs;
  }, [standardInputs]);
  useEffect(() => {
    sampleInputsRef.current = sampleInputs;
  }, [sampleInputs]);
  useEffect(() => {
    manualVarsRef.current = manualVars;
  }, [manualVars]);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const deferredStandardInputs = useDeferredValue(standardInputs);
  const deferredSampleInputs = useDeferredValue(sampleInputs);
  const deferredManualVars = useDeferredValue(manualVars);
  const deferredData = useDeferredValue(data);

  const emitChange = useCallback(
    (overrides?: Partial<ComplexEvaluateValue>) => {
      if (testMode || !onChange) return;
      // return;
      const valueObject: ComplexEvaluateValue = {
        standardInputs: Object.fromEntries(
          standardInputsRef.current.map((input) => [
            input.key,
            input.value ?? "",
          ]),
        ),
        sampleInputs: sampleInputsRef.current.map((inputs) =>
          Object.fromEntries(
            inputs.map((input) => [input.key, input.value ?? ""]),
          ),
        ),
        tableData: dataRef.current,
        manualVars: manualVarsRef.current,
        ...overrides,
      };
      const serialized = JSON.stringify(valueObject);
      if (serialized === value || serialized === lastEmittedRef.current) return;
      lastEmittedRef.current = serialized;
      startTransition(() => {
        onChange(serialized);
      });
    },
    [onChange, testMode, value],
  );

  const cancelScheduledEmit = useCallback(() => {
    if (emitTimerRef.current !== null) {
      window.clearTimeout(emitTimerRef.current);
      emitTimerRef.current = null;
    }
    if (
      idleCallbackRef.current !== null &&
      typeof window !== "undefined" &&
      "cancelIdleCallback" in window
    ) {
      (
        window as unknown as { cancelIdleCallback: (id: number) => void }
      ).cancelIdleCallback(idleCallbackRef.current);
      idleCallbackRef.current = null;
    }
  }, []);

  const flushEmit = useCallback(() => {
    if (testMode || !onChange) return;
    // return;
    const overrides = pendingOverridesRef.current;
    pendingOverridesRef.current = {};
    emitChange(Object.keys(overrides).length > 0 ? overrides : undefined);
  }, [emitChange, onChange, testMode]);

  const scheduleEmit = useCallback(
    (overrides?: Partial<ComplexEvaluateValue>) => {
      if (testMode || !onChange) return;
      // return;
      if (overrides) {
        pendingOverridesRef.current = {
          ...pendingOverridesRef.current,
          ...overrides,
        };
      }
      cancelScheduledEmit();
      emitTimerRef.current = window.setTimeout(() => {
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          idleCallbackRef.current = (
            window as unknown as {
              requestIdleCallback: (
                cb: () => void,
                opts?: { timeout: number },
              ) => number;
            }
          ).requestIdleCallback(
            () => {
              flushEmit();
              idleCallbackRef.current = null;
            },
            { timeout: 300 },
          );
          return;
        }
        flushEmit();
      }, 700);
    },
    [cancelScheduledEmit, flushEmit, onChange, testMode],
  );

  const concludeEmit = useCallback(() => {
    if (testMode || !onChange) return;
    const payload: ComplexEvaluateValue = {
      standardInputs: Object.fromEntries(
        standardInputsRef.current.map((input) => [
          input.key,
          input.value ?? "",
        ]),
      ),
      sampleInputs: sampleInputsRef.current.map((inputs) =>
        Object.fromEntries(
          inputs.map((input) => [input.key, input.value ?? ""]),
        ),
      ),
      tableData: dataRef.current,
      manualVars: manualVarsRef.current,
    };
    const serialized = JSON.stringify(payload);
    if (serialized === value || serialized === lastEmittedRef.current) return;
    lastEmittedRef.current = serialized;
    onChange(serialized);
  }, [onChange, testMode, value]);

  const markUserTyping = useCallback(() => {
    setIsUserTyping(true);
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      setIsUserTyping(false);
      typingTimerRef.current = null;
    }, 180);
  }, []);

  // Allow editing both in test and non-test; in test mode, emitChange is a no-op
  const handleStandardInputChange = useCallback(
    (index: number, value_: string) => {
      if (!acceptsInputScale(value_, parsed?.inputDecimalPlaces)) return;
      const updated = standardInputs.map((input, idx) =>
        idx === index ? { ...input, value: value_ } : input,
      );
      markUserTyping();
      setStandardInputs(updated);
      // scheduleEmit({
      //   standardInputs: Object.fromEntries(
      //     updated.map((input) => [input.key, input.value ?? ""]),
      //   ),
      // });
    },
    [standardInputs, markUserTyping, parsed?.inputDecimalPlaces],
  );

  const handleSampleInputChange = useCallback(
    (sampleIdx: number, inputIdx: number, value_: string) => {
      if (!acceptsInputScale(value_, parsed?.inputDecimalPlaces)) return;
      const updated = sampleInputs.map((sample, idx) =>
        idx === sampleIdx
          ? sample.map((input, jdx) =>
              jdx === inputIdx ? { ...input, value: value_ } : input,
            )
          : sample,
      );
      markUserTyping();
      setSampleInputs(updated);
      // scheduleEmit({
      //   sampleInputs: updated.map((inputs) =>
      //     Object.fromEntries(
      //       inputs.map((input) => [input.key, input.value ?? ""]),
      //     ),
      //   ),
      // });
    },
    [sampleInputs, markUserTyping, parsed?.inputDecimalPlaces],
  );

  const handleManualVarChange = useCallback(
    (key: string, rawInput: string) => {
      if (!acceptsInputScale(rawInput, parsed?.inputDecimalPlaces)) return;
      const next = { ...manualVars };
      if (!next[key]) {
        next[key] = { label: "", raw: rawInput, evaluated: null };
      } else {
        next[key] = { ...next[key], raw: rawInput };
      }

      const trimmed = rawInput.trim();
      if (
        trimmed !== "" &&
        hasBalancedParentheses(trimmed) &&
        sanitizeForEval(trimmed) &&
        !/:[A-Za-z0-9_.]+/.test(trimmed) &&
        /^[0-9eE+\-*/().\s]*$/.test(trimmed)
      ) {
        try {
          const val = safeEval(trimmed, {});
          next[key].evaluated = val;
        } catch {
          next[key].evaluated = null;
        }
      } else {
        next[key].evaluated = null;
      }

      // markUserTyping();
      setManualVars(next);
      // scheduleEmit({ manualVars: next });
    },
    [manualVars, parsed?.inputDecimalPlaces],
  );

  useEffect(() => {
    scheduleEmit({ tableData: data });
  }, [data, scheduleEmit]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      flushEmit();
      cancelScheduledEmit();
    };
  }, [cancelScheduledEmit, flushEmit]);

  // Build inputVariables from snapshot
  const inputVariables = useMemo(() => {
    return buildInputVariables(
      parsed,
      deferredStandardInputs,
      deferredSampleInputs,
    );
  }, [deferredStandardInputs, deferredSampleInputs, parsed]);

  // Only for final results (not constants or manual vars)
  const formatNumber = useCallback(
    (
      n: number | null | string | undefined,
      asPercentage = parsed?.percentageResults,
      digitsOverride?: number,
    ): string => {
      if (n === null || n === undefined || n === "") return "—";
      try {
        const numValue = typeof n === "string" ? Number(n) : n;
        if (!Number.isFinite(numValue)) return "—";
        const displayValue = asPercentage ? numValue * 100 : numValue;
        const digits =
          digitsOverride ??
          parsed?.finalResultDecimalPlaces ??
          (typeof parsed?.decimalPlaces === "number"
            ? parsed.decimalPlaces
            : undefined);
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
    [
      parsed?.percentageResults,
      parsed?.decimalPlaces,
      parsed?.finalResultDecimalPlaces,
    ],
  );

  // Recompute derived columns (row-wise) if enabled (formulaInTable true)
  useEffect(() => {
    if (isUserTyping || !parsed?.formulaInTable || !parsed?.columnExpressions)
      return;
    const entries = Object.entries(parsed.columnExpressions).filter(
      ([, meta]) => meta.enabled && !meta.error,
    );
    if (entries.length === 0) return;

    const newData = evaluateDerivedColumns(
      deferredData,
      headers,
      parsed.columnExpressions,
    );

    const isSame =
      newData.length === deferredData.length &&
      newData.every(
        (row, rowIndex) =>
          row.length === deferredData[rowIndex]?.length &&
          row.every(
            (cell, colIndex) => cell === deferredData[rowIndex]?.[colIndex],
          ),
      );
    if (!isSame) {
      updateTableData(headers, newData);
    }
  }, [
    isUserTyping,
    parsed?.formulaInTable,
    parsed?.columnExpressions,
    headers,
    deferredData,
    updateTableData,
  ]);

  // Build results strictly for sample columns; never create a card for first column
  const results = useMemo(() => {
    try {
      if (!parsed || isUserTyping) return [];
      const out: Array<{
        sample: string;
        result: number | null;
        expression: string;
        substitutedExpression: string;
      }> = [];
      const startIdx = parsed.standardInTable ? 1 : 0;
      const headerList = headers; // trust current hook state (it mirrors parsed.headers)
      if (sanitizeNumber(headerList.length) <= startIdx) return [];

      for (
        let sampleIdx = startIdx;
        sampleIdx < sanitizeNumber(headerList.length);
        sampleIdx++
      ) {
        const sampleNumber = parsed.standardInTable ? sampleIdx : sampleIdx + 1;
        let expr = sanitizeString(parsed.expression);

        expr = inlineUniversalNamedExpressions(
          expr,
          parseUniversalNamedExpressions(
            parsed as unknown as Record<string, unknown>,
          ),
          sampleNumber,
          parsed as unknown as Record<string, unknown>,
        );
        expr = expandAutoSampleTemplates(
          expr,
          sampleNumber,
          (parsed.sampleInputs?.[sampleNumber - 1] ?? []).map(({ key }) => key),
        );

        const displayExpr = expr.replace(
          /:R(\d+)sample\b/gi,
          (_m, r: string) => `:R${r}sample${sampleNumber}`,
        );

        const substituted = expr.replace(
          /:([A-Za-z0-9_.]+)/g,
          (match, varName) =>
            resolveToken(varName, {
              sampleIndex: sampleIdx,
              headers: headerList,
              data: deferredData,
              constants: parsed.constants || {},
              inputVariables,
              tableVars,
              manualVars: deferredManualVars,
            }),
        );

        if (/:([A-Za-z0-9_.]+)/.test(substituted)) {
          out.push({
            sample: headerList[sampleIdx] ?? "",
            result: null,
            expression: displayExpr,
            substitutedExpression: substituted,
          });
          continue;
        }

        if (
          !hasBalancedParentheses(substituted) ||
          !sanitizeForEval(substituted)
        ) {
          out.push({
            sample: headerList[sampleIdx] ?? "",
            result: null,
            expression: displayExpr,
            substitutedExpression: substituted,
          });
          continue;
        }

        try {
          const numeric = safeEval(substituted, {});
          out.push({
            sample: headerList[sampleIdx] ?? "",
            result: numeric,
            expression: displayExpr,
            substitutedExpression: substituted,
          });
        } catch {
          out.push({
            sample: headerList[sampleIdx] ?? "",
            result: null,
            expression: displayExpr,
            substitutedExpression: substituted,
          });
        }
      }
      return out;
    } catch {
      return [];
    }
  }, [
    parsed,
    headers,
    deferredData,
    inputVariables,
    tableVars,
    deferredManualVars,
    isUserTyping,
  ]);

  const averageResult = useMemo(() => {
    if (!parsed?.averageAllResults) return null;
    const valid = results
      .map((r) => r.result)
      .filter((x): x is number => x !== null);
    if (!valid.length) return null;
    return valid.reduce((s, v) => s + v, 0) / valid.length;
  }, [results, parsed?.averageAllResults]);

  // Derive counts from current view (headers/data) for summary
  const sampleCount = Math.max(
    0,
    headers.length - (parsed?.standardInTable ? 1 : 0),
  );
  const readingCount = data.length;

  return (
    <div onBlurCapture={flushEmit}>
      <div className="space-y-6">
        {showMetaPanels && (
          <div className="bg-background border border-border rounded-lg px-4 py-3 mb-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {testMode && (
                  <Button variant="outline" className="gap-1" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
                <div className="flex items-center gap-2 ml-1">
                  <h2 className="text-sm font-semibold text-foreground">
                    Complex Formula — {testMode ? "Test" : "Evaluate"}
                  </h2>
                  {!testMode && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="ml-2"
                      onClick={concludeEmit}
                    >
                      Conclude
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Summary */}
        {showMetaPanels && (
          <section className="bg-background border border-border rounded-lg px-5 py-4 mb-6">
            <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">
              Settings
            </h3>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 text-xs">
              {[
                {
                  label: "First Column",
                  value: parsed?.standardInTable
                    ? PURPOSE_LABEL[parsed.firstColumnPurpose || "standard"]
                    : "Disabled",
                  icon: <Settings className="w-4 h-4 text-info" />,
                  active: parsed?.standardInTable,
                },
                {
                  label: "Standard Inputs",
                  value: parsed?.standardInput ? "Enabled" : "Disabled",
                  icon: <FunctionSquare className="w-4 h-4 text-info" />,
                  active: parsed?.standardInput,
                },
                {
                  label: "Sample Inputs",
                  value: parsed?.sampleInput ? "Enabled" : "Disabled",
                  icon: <Plus className="w-4 h-4 text-success" />,
                  active: parsed?.sampleInput,
                },
                {
                  label: "Formula in Table",
                  value: parsed?.formulaInTable ? "Enabled" : "Disabled",
                  icon: <Calculator className="w-4 h-4 text-warning" />,
                  active: parsed?.formulaInTable,
                },
                {
                  label: "Average in Table",
                  value: parsed?.calculateAvgInTable ? "Enabled" : "Disabled",
                  icon: <Beaker className="w-4 h-4 text-info" />,
                  active: parsed?.calculateAvgInTable,
                },
                {
                  label: "SD in Table",
                  value: parsed?.calculateSdInTable ? "Enabled" : "Disabled",
                  icon: <Beaker className="w-4 h-4 text-info" />,
                  active: parsed?.calculateSdInTable,
                },
                {
                  label: "RSD in Table",
                  value: parsed?.calculateRsdInTable ? "Enabled" : "Disabled",
                  icon: <Beaker className="w-4 h-4 text-info" />,
                  active: parsed?.calculateRsdInTable,
                },
                {
                  label: "Percentage",
                  value: parsed?.percentageResults ? "Yes" : "No",
                  icon: <Calculator className="w-4 h-4 text-warning" />,
                  active: parsed?.percentageResults,
                },
                {
                  label: "Avg All Results",
                  value: parsed?.averageAllResults ? "Yes" : "No",
                  icon: <Calculator className="w-4 h-4 text-warning" />,
                  active: parsed?.averageAllResults,
                },
                {
                  label: "Input / Table / Result Decimals",
                  value: `${parsed?.inputDecimalPlaces ?? 2} / ${parsed?.tableCalculationDecimalPlaces ?? 2} / ${parsed?.finalResultDecimalPlaces ?? parsed?.decimalPlaces ?? 2}`,
                  icon: <FunctionSquare className="w-4 h-4 text-info" />,
                  active: true,
                },
                {
                  label: "Samples",
                  value: sampleCount,
                  icon: <Plus className="w-4 h-4 text-success" />,
                  active: true,
                },
                {
                  label: "Readings",
                  value: readingCount,
                  icon: <Plus className="w-4 h-4 text-success" />,
                  active: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 p-2 rounded-lg shadow-sm border ${
                    item.active
                      ? "border-border bg-muted"
                      : "border-border bg-background"
                  } w-full`}
                >
                  <div>{item.icon}</div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground">
                      {item.label}
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        item.active ? "text-info" : "text-muted-foreground/80"
                      }`}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Expression + Constants + Manual Vars */}
        {showMetaPanels && (
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Expression
              </h3>
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="w-full lg:w-1/2 min-w-0">
                <div className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
                  {sanitizeString(parsed?.expression || "")}
                </div>
              </div>
              <div className="mt-4 lg:mt-0 w-full lg:w-1/2 min-w-0">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Constants
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {Object.entries(parsed?.constants || {}).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between bg-muted/30 border border-border rounded px-2.5 py-1.5"
                      >
                        <span className="text-xs font-semibold text-info">
                          :{key}
                        </span>
                        <span className="text-xs font-semibold">= {value}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            {manualVarKeys.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Manual Variables
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {manualVarKeys.map((k) => {
                    const mv = manualVars[k] || {
                      label: "",
                      raw: "",
                      evaluated: null,
                    };
                    const displayLabel = mv.label || k;
                    return (
                      <div
                        key={k}
                        className="flex flex-col gap-2 bg-muted/30 border border-border rounded-md p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-info">
                              :{k}
                            </span>
                            {displayLabel && displayLabel !== k && (
                              <span className="text-[10px] text-muted-foreground italic">
                                ({displayLabel})
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            ×
                            {countOccurrences(
                              sanitizeString(parsed?.expression || ""),
                              k,
                            )}
                          </span>
                        </div>
                        <label className="text-[10px] font-medium text-muted-foreground">
                          Raw / Expression:
                        </label>
                        <input
                          type="text"
                          value={mv.raw}
                          onChange={(e) =>
                            handleManualVarChange(k, e.target.value)
                          }
                          placeholder="e.g., 12.5+3.1 or 1.2e-3"
                          className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-info/40"
                        />
                        {mv.evaluated !== null && (
                          <div className="flex items-center justify-between bg-muted border border-border rounded px-2 py-1">
                            <span className="text-[10px] font-medium text-success">
                              Evaluated:
                            </span>
                            <span className="text-xs font-bold text-success">
                              {sanitizeString(mv.evaluated)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {showMetaPanels && (
          <div className="grid gap-2 grid-cols-1 ">
            <div className="w-full ">
              <div className="flex items-center justify-between pb-2 mt-4 mb-2 border-b border-border/60">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Expressions Evaluation
                </h3>
              </div>
              {parsed?.averageAllResults && averageResult !== null && (
                <div className="mb-4 bg-muted border-2 border-border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-info">
                      Average of All Results
                    </span>
                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 shadow-sm">
                      <span className="text-xs font-semibold text-info uppercase">
                        Avg
                      </span>
                      <span className="text-lg font-bold text-info">
                        {formatNumber(averageResult)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {results.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic py-2 text-center">
                    No results to display.
                  </div>
                ) : (
                  results.map((res, idx) => (
                    <div
                      key={idx}
                      className="bg-muted border border-border rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">
                          {res.sample}
                        </span>
                        <div className="flex items-center gap-1.5 bg-background border border-border rounded px-2.5 py-1 shadow-sm">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Result
                          </span>
                          <span className="text-sm font-bold text-success">
                            {formatNumber(res.result)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 w-full">
                        <div className="bg-background border border-border rounded p-2 min-w-0">
                          <div className="text-[10px] text-muted-foreground font-semibold mb-1">
                            Formula:
                          </div>
                          <div className="text-xs font-mono bg-muted/30 p-1.5 rounded-sm border border-border/60">
                            <div className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
                              {res.expression}
                            </div>
                          </div>
                        </div>
                        <div className="bg-background border border-border rounded p-2 min-w-0">
                          <div className="text-[10px] text-success font-semibold mb-1">
                            With Values:
                          </div>
                          <div className="text-xs font-mono bg-muted/30 p-1.5 rounded-sm border border-border/60">
                            <div className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
                              {res.substitutedExpression}
                            </div>
                          </div>
                          {res.result !== null && (
                            <div className="text-right text-xs text-success font-semibold mt-1">
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
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1  gap-4">
          <div className="space-y-4">
            {parsed?.standardInput &&
              parsed?.standardInTable &&
              parsed?.standardInputs && (
                <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                    {PURPOSE_LABEL[parsed.firstColumnPurpose || "standard"]}{" "}
                    Inputs
                  </h3>
                  <div className="space-y-2">
                    {standardInputs.map((input, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <label className="text-xs font-medium text-foreground min-w-[120px]">
                          {input.label}:
                        </label>
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={input.value}
                            onChange={(e) =>
                              handleStandardInputChange(index, e.target.value)
                            }
                            className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-info/40"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {parsed?.sampleInput &&
              sanitizeNumber(parsed?.sampleInputs?.length) > 0 && (
                <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                    Sample Inputs
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {sampleInputs.map((sample, sampleIndex) => (
                      <div
                        key={sampleIndex}
                        className="border border-border rounded p-3"
                      >
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-border/60">
                          <h4 className="text-xs font-bold text-foreground">
                            {headers[
                              sampleIndex + (parsed?.standardInTable ? 1 : 0)
                            ] || `Sample ${sampleIndex + 1}`}
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {sample.map((input, inputIndex) => (
                            <div
                              key={inputIndex}
                              className="flex items-center gap-2"
                            >
                              <label className="text-[10px] font-medium text-muted-foreground min-w-[80px]">
                                {input.label}:
                              </label>
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={input.value}
                                  onChange={(e) =>
                                    handleSampleInputChange(
                                      sampleIndex,
                                      inputIndex,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-info/40"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Data Table */}
          <div className="space-y-4">
            <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Data Table
                </h3>
              </div>
              <div className="overflow-x-auto border border-border rounded-lg">
                {headers.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground text-sm">
                    No data table.
                  </div>
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="border-r border-border p-2 text-center font-bold text-foreground text-xs sticky left-0 bg-muted z-10">
                          Reading
                        </th>
                        {headers.map((h, c) => (
                          <th
                            key={c}
                            className="border-r border-border p-1.5 bg-muted/30 min-w-[140px]"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-[10px] text-muted-foreground font-semibold">
                                {String.fromCharCode(65 + c)}
                              </div>
                            </div>
                            <div className="relative">{h}</div>
                            {parsed?.columnExpressions?.[c]?.error && (
                              <div className="text-[9px] text-destructive mt-0.5 truncate">
                                {parsed?.columnExpressions?.[c].error}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, r) => (
                        <tr
                          key={r}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="border-r border-b border-border p-2 bg-muted/30 sticky left-0 z-10">
                            {parsed?.rowHeaders?.[r]?.label ||
                              `Reading ${r + 1}`}
                          </td>
                          {row.map((cell, c) => (
                            <td
                              key={c}
                              className="border-r border-b border-border p-0.5"
                            >
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => {
                                  if (
                                    e.target.value === "" ||
                                    /^-?\d*\.?\d*(e[+-]?\d+)?$/i.test(
                                      e.target.value,
                                    )
                                  ) {
                                    markUserTyping();
                                    updateCell(r, c, e.target.value);
                                  }
                                }}
                                className={`w-full text-center p-1.5 bg-background border rounded text-xs focus:outline-none focus:ring-1 focus:ring-info/40 focus:border-border ${
                                  parsed?.columnExpressions?.[c]?.enabled
                                    ? "bg-muted/30 border-border text-muted-foreground"
                                    : "border-border"
                                }`}
                                placeholder="0"
                                disabled={
                                  parsed?.columnExpressions?.[c]?.enabled
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                      {parsed?.calculateAvgInTable && stats.length > 0 && (
                        <tr className="bg-muted border-t-2 border-border">
                          <td className="border-r border-b border-border p-2 font-bold text-xs text-foreground sticky left-0 bg-muted z-10">
                            Average
                          </td>
                          {stats.map((s, i) => (
                            <td
                              key={i}
                              className="border-r border-b border-border p-1.5 text-center text-xs font-semibold text-foreground"
                            >
                              {formatNumber(
                                s.avg,
                                false,
                                parsed?.tableCalculationDecimalPlaces,
                              )}
                            </td>
                          ))}
                        </tr>
                      )}
                      {parsed?.calculateSdInTable && stats.length > 0 && (
                        <tr className="bg-muted">
                          <td className="border-r border-b border-border p-2 font-bold text-xs text-foreground sticky left-0 bg-muted z-10">
                            SD
                          </td>
                          {stats.map((s, i) => (
                            <td
                              key={i}
                              className="border-r border-b border-border p-1.5 text-center text-xs font-semibold text-foreground"
                            >
                              {formatNumber(
                                s.sd,
                                false,
                                parsed?.tableCalculationDecimalPlaces,
                              )}
                            </td>
                          ))}
                        </tr>
                      )}
                      {parsed?.calculateRsdInTable && stats.length > 0 && (
                        <tr className="bg-muted">
                          <td className="border-r border-b border-border p-2 font-bold text-xs text-foreground sticky left-0 bg-muted z-10">
                            RSD (%)
                          </td>
                          {stats.map((s, i) => (
                            <td
                              key={i}
                              className="border-r border-b border-border p-1.5 text-center text-xs font-semibold text-foreground"
                            >
                              {formatNumber(
                                s.rsd,
                                false,
                                parsed?.tableCalculationDecimalPlaces,
                              )}
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
        </div>
      </div>
    </div>
  );
};
