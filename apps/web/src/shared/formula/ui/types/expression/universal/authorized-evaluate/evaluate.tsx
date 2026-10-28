import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { ArrowLeft } from "lucide-react";
import { sanitizeString } from "@/shared/formula/ui/legacy";
import { normalizeMathExpression, sanitizeForEval } from "./utils";
import { useTableData } from "./hooks";
import { Button } from "@/components/ui/button";
import { normalizeExpressionPayload } from "../normalizer";
import { Worksheet } from "./worksheet";
import {
  buildInputVariables,
  computeFormulaResults,
  isManualVarKey,
  normalizeFormulaExpressionText,
} from "@/shared/formula/compute/formula-compute";

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
        /^[0-9eE+\-*/().\s]*$/.test(normalizeMathExpression(rawString))
      ) {
        try {
          const val = safeEval(normalizeMathExpression(rawString), {});
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

const applyManualVarMetadata = (
  manualVars: ManualVarsMap,
  labels?: Record<string, string>,
  expressions?: Record<string, string>,
): ManualVarsMap => {
  const next = { ...manualVars };
  for (const [key, label] of Object.entries(labels || {})) {
    next[key] = {
      label,
      raw: expressions?.[key] ?? next[key]?.raw ?? "",
      evaluated: next[key]?.evaluated ?? null,
    };
  }
  return next;
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

const fitTableData = (data: string[][], rows: number, columns: number) =>
  Array(rows)
    .fill(null)
    .map((_, rowIndex) => {
      const row = data[rowIndex] || [];
      return Array(columns)
        .fill("")
        .map((__, columnIndex) => sanitizeString(row[columnIndex]));
    });

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const AuthorizedUniversalEvaluate: React.FC<Props> = ({
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

  // Non-test persisted value hydration
  const parsedValue = useMemo(() => {
    if (testMode || !value) return undefined;
    try {
      const vObj = JSON.parse(value);
      return vObj as ComplexEvaluateValue;
    } catch {
      return undefined;
    }
  }, [value, testMode]);
  const lastEmittedRef = useRef<string | null>(null);
  const latestValueRef = useRef(value);
  const suppressNextDataEmitRef = useRef(true);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  const initialTableData = useMemo(() => {
    const rows = parsedValue?.tableData;
    if (!Array.isArray(rows) || rows.length === 0) return [];
    return rows.map((row) =>
      Array.isArray(row) ? row.map((cell) => sanitizeString(cell)) : [],
    );
  }, [parsedValue?.tableData]);

  const { headers, data, stats, tableVars, updateCell, updateTableData } =
    useTableData(
      initialHeaders,
      initialTableData,
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
    const rows = fitTableData(data, readings, headerCount);
    suppressNextDataEmitRef.current = true;
    updateTableData(targetHeaders, rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    parsed?.numberOfReadings,
    parsed?.noOfReadings,
    parsed?.rowHeaders,
    providedHeaders,
  ]);

  // Manual variables (coerced)
  const [manualVars, setManualVars] = useState<ManualVarsMap>(() =>
    applyManualVarMetadata(
      coerceManualVars(
        (parsedValue?.manualVars as unknown as ManualVarsMap | undefined) ??
          parsed?.manualVars,
      ),
      parsed?.manualVarLabels,
      parsed?.manualVarExpressions,
    ),
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

  // Rehydrate (non-test only) — skip if the incoming value was emitted by us
  useEffect(() => {
    if (!testMode && value && value !== lastEmittedRef.current) {
      setStandardInputs(initStandard());
      setSampleInputs(initSamples());
      setManualVars(
        applyManualVarMetadata(
          coerceManualVars(
            (parsedValue?.manualVars as unknown as ManualVarsMap | undefined) ??
              parsed?.manualVars,
          ),
          parsed?.manualVarLabels,
          parsed?.manualVarExpressions,
        ),
      );
      const tableData = parsedValue?.tableData;
      if (Array.isArray(tableData) && tableData.length > 0) {
        suppressNextDataEmitRef.current = true;
        updateTableData(
          headers,
          tableData.map((row) =>
            Array.isArray(row) ? row.map((cell) => sanitizeString(cell)) : [],
          ),
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, testMode]);

  const varKeys = useMemo(
    () => extractVarKeys(normalizeFormulaExpressionText(parsed?.expression)),
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
            label: parsed?.manualVarLabels?.[k] || "",
            raw: parsed?.manualVarExpressions?.[k] || "",
            evaluated: null,
          };
        } else {
          const resolvedLabel = parsed?.manualVarLabels?.[k] || next[k].label;
          if (next[k].label !== resolvedLabel) {
            changed = true;
            next[k].label = resolvedLabel;
          }
          const resolvedExpression = parsed?.manualVarExpressions?.[k];
          if (resolvedExpression && !next[k].raw) {
            changed = true;
            next[k].raw = resolvedExpression;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [manualVarKeys, parsed?.manualVarLabels, parsed?.manualVarExpressions]);

  const standardInputsRef = useRef(standardInputs);
  const sampleInputsRef = useRef(sampleInputs);
  const manualVarsRef = useRef(manualVars);
  const dataRef = useRef(data);
  const pendingOverridesRef = useRef<Partial<ComplexEvaluateValue>>({});
  const emitTimerRef = useRef<number | null>(null);
  const idleCallbackRef = useRef<number | null>(null);

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

  const emitChange = useCallback(
    (overrides?: Partial<ComplexEvaluateValue>) => {
      if (testMode || !onChange) return;
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
      if (
        serialized === latestValueRef.current ||
        serialized === lastEmittedRef.current
      )
        return;
      lastEmittedRef.current = serialized;
      onChange(serialized);
    },
    [onChange, testMode],
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
    const overrides = pendingOverridesRef.current;
    pendingOverridesRef.current = {};
    emitChange(Object.keys(overrides).length > 0 ? overrides : undefined);
  }, [emitChange, onChange, testMode]);

  const scheduleEmit = useCallback(
    (overrides?: Partial<ComplexEvaluateValue>) => {
      if (testMode || !onChange) return;
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
    if (
      serialized === latestValueRef.current ||
      serialized === lastEmittedRef.current
    )
      return;
    lastEmittedRef.current = serialized;
    onChange(serialized);
  }, [onChange, testMode]);

  // Allow editing both in test and non-test; in test mode, emitChange is a no-op
  const handleStandardInputChange = useCallback(
    (index: number, value_: string) => {
      if (!acceptsInputScale(value_, parsed?.inputDecimalPlaces)) return;
      const updated = standardInputs.map((input, idx) =>
        idx === index ? { ...input, value: value_ } : input,
      );
      setStandardInputs(updated);
      scheduleEmit({
        standardInputs: Object.fromEntries(
          updated.map((input) => [input.key, input.value ?? ""]),
        ),
      });
    },
    [standardInputs, scheduleEmit, parsed?.inputDecimalPlaces],
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
      setSampleInputs(updated);
      scheduleEmit({
        sampleInputs: updated.map((inputs) =>
          Object.fromEntries(
            inputs.map((input) => [input.key, input.value ?? ""]),
          ),
        ),
      });
    },
    [sampleInputs, scheduleEmit, parsed?.inputDecimalPlaces],
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
        /^[0-9eE+\-*/().\s]*$/.test(normalizeMathExpression(trimmed))
      ) {
        try {
          const val = safeEval(normalizeMathExpression(trimmed), {});
          next[key].evaluated = val;
        } catch {
          next[key].evaluated = null;
        }
      } else {
        next[key].evaluated = null;
      }

      setManualVars(next);
      scheduleEmit({ manualVars: next });
    },
    [manualVars, scheduleEmit, parsed?.inputDecimalPlaces],
  );

  useEffect(() => {
    if (suppressNextDataEmitRef.current) {
      suppressNextDataEmitRef.current = false;
      return;
    }
    scheduleEmit({ tableData: data });
  }, [data, scheduleEmit]);

  useEffect(() => {
    return () => {
      flushEmit();
      cancelScheduledEmit();
    };
  }, [cancelScheduledEmit, flushEmit]);

  const inputVariables = useMemo(
    () => buildInputVariables(parsed, standardInputs, sampleInputs),
    [parsed, standardInputs, sampleInputs],
  );

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
    if (!parsed?.formulaInTable || !parsed?.columnExpressions) return;
    const entries = Object.entries(parsed.columnExpressions).filter(
      ([, meta]) => meta.enabled && !meta.error,
    );
    if (entries.length === 0) return;

    const newData = data.map((row) => [...row]);
    const headerPatterns = headers.map(
      (header) => new RegExp(`\\b${escapeRegExp(header)}\\b`, "gi"),
    );
    entries.forEach(([colStr, meta]) => {
      const colIdx = Number(colStr);
      const expr = meta.expression;

      for (let r = 0; r < newData.length; r++) {
        let substituted = expr;
        headers.forEach((h, hIdx) => {
          if (hIdx === colIdx) return;
          const cellRaw = data[r]?.[hIdx] ?? "";
          const numeric =
            cellRaw !== "" && !isNaN(Number(cellRaw))
              ? String(Number(cellRaw))
              : "NaN";
          const pattern = headerPatterns[hIdx];
          if (pattern) substituted = substituted.replace(pattern, numeric);
        });

        if (
          /\bNaN\b/.test(substituted) ||
          !hasBalancedParentheses(substituted)
        ) {
          (newData[r] ?? [])[colIdx] = "";
          continue;
        }
        if (
          !/^[0-9eE+\-*/().\s]*$/.test(normalizeMathExpression(substituted))
        ) {
          (newData[r] ?? [])[colIdx] = "";
          continue;
        }

        try {
          const val = safeEval(normalizeMathExpression(substituted), {});
          (newData[r] ?? [])[colIdx] = val !== null ? String(val) : "";
        } catch {
          (newData[r] ?? [])[colIdx] = "";
        }
      }
    });

    const isSame =
      newData.length === data.length &&
      newData.every(
        (row, rowIndex) =>
          row.length === data[rowIndex]?.length &&
          row.every((cell, colIndex) => cell === (data[rowIndex]?.[colIndex] ?? "")),
      );
    if (!isSame) {
      updateTableData(headers, newData);
    }
  }, [
    parsed?.formulaInTable,
    parsed?.columnExpressions,
    headers,
    data,
    updateTableData,
  ]);

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

  const averageResult = useMemo(() => {
    if (!parsed?.averageAllResults) return null;
    const valid = results
      .map((r) => r.result)
      .filter((x): x is number => x !== null);
    if (!valid.length) return null;
    return valid.reduce((s, v) => s + v, 0) / valid.length;
  }, [results, parsed?.averageAllResults]);
  return (
    <div onBlurCapture={flushEmit}>
      {showMetaPanels || testMode ? (
        <div className="mb-4 flex items-center gap-2">
          {testMode ? (
            <Button variant="outline" className="gap-1" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : null}
          {!testMode ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={concludeEmit}
            >
              Conclude
            </Button>
          ) : null}
        </div>
      ) : null}
      {parsed ? (
        <Worksheet
          averageResult={averageResult}
          data={data}
          formatNumber={formatNumber}
          headers={headers}
          manualVarKeys={manualVarKeys}
          manualVars={manualVars}
          onCellChange={(row, column, value_) => {
            if (value_ === "" || /^-?\d*\.?\d*(e[+-]?\d+)?$/i.test(value_)) {
              updateCell(row, column, value_);
            }
          }}
          onManualVarChange={handleManualVarChange}
          onSampleInputChange={handleSampleInputChange}
          onStandardInputChange={handleStandardInputChange}
          parsed={parsed}
          results={results}
          sampleInputs={sampleInputs}
          standardInputs={standardInputs}
          stats={stats}
        />
      ) : null}
    </div>
  );
};
