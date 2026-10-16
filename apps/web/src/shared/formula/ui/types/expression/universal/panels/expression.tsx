import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { evaluateExpression as safeEval } from "../engine/expressionEngine";
import isEqual from "@/shared/formula/ui/deep-equal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DialogBody,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  FunctionSquare,
  Trash2,
  Beaker,
  Calculator,
  Plus,
  MousePointerSquareDashed,
  Undo2,
} from "lucide-react";
import ExpressionRenderer from "@/shared/formula/ui/math/expression-view";
import { countOccurrences, sanitizeForEval } from "../../../utils";
import { UNIVERSAL_FORMULA_FLUSH_EVENT } from "@/shared/formula/ui/events";
import { useTableData, useVariableExtraction } from "../hooks";
import { headerToSlug } from "../hooks";
import { expandAutoSampleTemplates } from "../token";
import { validateColumnExpression } from "../column-expression";
import {
  inlineUniversalNamedExpressions,
  parseUniversalNamedExpressions,
} from "@/shared/formula/builder/universal-named-expressions";
import NamedExpressionEditor from "../named-expression-editor";
import { buildInputVariables } from "@/shared/formula/compute/formula-compute-helpers";
import {
  sampleInputTemplateVariableKey,
  standardInputVariableKey,
  UniversalVariableKeyFormat,
} from "@/shared/formula/builder/universal-variable-keys";
import type {
  VarMapWithLabels,
  FirstColumnPurpose,
  FrozenSnapshot,
  CellData,
} from "../types";

const TABLE_CONTENT_DISABLED = true;

const PURPOSE_LABEL: Record<FirstColumnPurpose, string> = {
  standard: "Standard",
  blank: "Blank",
  titre: "Titre",
  control: "Control",
};

const hasBalancedParentheses = (expr: string): boolean => {
  let count = 0;
  for (const char of expr) {
    if (char === "(") count++;
    if (char === ")") count--;
    if (count < 0) return false;
  }
  return count === 0;
};

const evaluateExpression = (expr: string): number | null => {
  try {
    if (!hasBalancedParentheses(expr) || !sanitizeForEval(expr)) return null;
    return safeEval(expr, {});
  } catch {
    return null;
  }
};

/** What the expression stage reports to the builder: the whole Universal definition, merged with its settings before saving. */
export type EmitPayload = { [key: string]: unknown; expression?: unknown; percentageResults?: unknown };

type Props = {
  disabled?: boolean | undefined;
  expression: string;
  onExpressionChange: (v: string) => void;

  snapshot: FrozenSnapshot;
  onUpdateSnapshot: (next: FrozenSnapshot) => void;

  constants: Record<string, number>;
  onConstantsChange: (next: Record<string, number>) => void;

  columnExpressions: FrozenSnapshot["columnExpressions"];
  onColumnExpressionsChange: (
    next: FrozenSnapshot["columnExpressions"],
  ) => void;

  onEmit: (payload: EmitPayload) => void;
  onBackToSettings: () => void;
};

const ExpressionPanel: React.FC<Props> = ({
  disabled,
  expression,
  onExpressionChange,
  snapshot,
  onUpdateSnapshot,
  constants,
  onConstantsChange,
  columnExpressions,
  onColumnExpressionsChange,
  onEmit,
  onBackToSettings,
}) => {
  // Local table state strictly based on the frozen snapshot
  const {
    headers,
    data,
    stats,
    tableVars,
    updateHeader,
    updateCell,
    updateTableData,
  } = useTableData(
    snapshot.headers,
    undefined,
    snapshot.settings.standardInTable,
    snapshot.settings.inputDecimalPlaces,
    snapshot.settings.tableCalculationDecimalPlaces,
  );

  const tableShapeKey = `${snapshot.settings.noOfReadings}:${snapshot.headers.length}`;

  // Reset table only when the table shape changes, not on header text edits.
  useEffect(() => {
    const hasSameShape =
      data.length === snapshot.settings.noOfReadings &&
      (data[0]?.length ?? snapshot.headers.length) === snapshot.headers.length;
    if (hasSameShape) return;

    const cols = snapshot.headers;
    const rows = Array(snapshot.settings.noOfReadings)
      .fill(null)
      .map(() => Array(cols.length).fill(""));
    updateTableData(cols, rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableShapeKey]);

  // Row headers (editable)
  const [rowHeaders, setRowHeaders] = useState(snapshot.rowHeaders);
  const prevRowHeadersRef = useRef(snapshot.rowHeaders);
  useEffect(() => {
    if (isEqual(prevRowHeadersRef.current, snapshot.rowHeaders)) return;
    prevRowHeadersRef.current = snapshot.rowHeaders;
    setRowHeaders(snapshot.rowHeaders);
  }, [snapshot.rowHeaders]);

  const updateRowHeader = useCallback((index: number, newLabel: string) => {
    setRowHeaders((prev) => {
      const next = [...prev];
      const current = next[index];
      if (current) next[index] = { ...current, label: newLabel };
      return next;
    });
  }, []);

  // Track previous values to prevent unnecessary snapshot updates
  const prevHeadersRef = useRef<string[]>(snapshot.headers);
  const prevDataRef = useRef<CellData>(snapshot.tableData || []);

  // Push updated headers back into snapshot (persist across stage switches)
  useEffect(() => {
    if (!isEqual(headers, prevHeadersRef.current)) {
      prevHeadersRef.current = headers;
      onUpdateSnapshot({ ...snapshot, headers: [...headers] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers]);

  // Keep table cells inside snapshot so Test Formula gets realistic data
  useEffect(() => {
    if (!isEqual(data, prevDataRef.current)) {
      prevDataRef.current = data;
      onUpdateSnapshot({ ...snapshot, tableData: data });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Push updated rowHeaders back into snapshot
  useEffect(() => {
    if (!isEqual(rowHeaders, prevRowHeadersRef.current)) {
      prevRowHeadersRef.current = rowHeaders;
      onUpdateSnapshot({ ...snapshot, rowHeaders: [...rowHeaders] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowHeaders]);

  // Column expression dialog
  const [expressionDialogOpen, setExpressionDialogOpen] = useState(false);
  const [activeColumnIndex, setActiveColumnIndex] = useState<number | null>(
    null,
  );
  const [draftExpression, setDraftExpression] = useState("");

  const handleOpenExpressionDialog = (colIdx: number) => {
    setActiveColumnIndex(colIdx);
    setDraftExpression(columnExpressions[colIdx]?.expression || "");
    setExpressionDialogOpen(true);
  };

  const handleSaveExpression = () => {
    if (activeColumnIndex === null) return;
    const error = validateColumnExpression(
      draftExpression,
      activeColumnIndex,
      headers,
    );
    onColumnExpressionsChange({
      ...columnExpressions,
      [activeColumnIndex]: {
        enabled: Boolean(draftExpression),
        expression: draftExpression,
        error,
      },
    });
    setExpressionDialogOpen(false);
  };

  // Constants
  const [newConstantName, setNewConstantName] = useState("");
  const [newConstantValue, setNewConstantValue] = useState("");

  const handleAddConstant = useCallback(() => {
    if (!newConstantName || !newConstantValue) return;
    const v = evaluateExpression(newConstantValue);
    if (v !== null) {
      onConstantsChange({ ...constants, [newConstantName]: v });
      setNewConstantName("");
      setNewConstantValue("");
    } else {
      alert("Invalid expression for constant.");
    }
  }, [newConstantName, newConstantValue, constants, onConstantsChange]);

  const handleDeleteConstant = useCallback(
    (key: string) => {
      const next = { ...constants };
      delete next[key];
      onConstantsChange(next);
    },
    [constants, onConstantsChange],
  );

  // Insert token helpers
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertAtCursor = useCallback(
    (text: string) => {
      const ta = textareaRef.current;
      if (!ta) {
        onExpressionChange(expression + text);
        return;
      }
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? start;
      const before = ta.value.slice(0, start);
      const after = ta.value.slice(end);
      const next = before + text + after;
      onExpressionChange(next);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + text.length;
        ta.setSelectionRange(pos, pos);
      });
    },
    [expression, onExpressionChange],
  );
  const handleKeyButton = useCallback(
    (key: string) => insertAtCursor(`:${key}`),
    [insertAtCursor],
  );

  const handleInsertCellVariable = useCallback(
    (rowIdx: number, colIdx: number) => {
      const isSampleCol = colIdx >= (snapshot.settings.standardInTable ? 1 : 0);
      if (isSampleCol) {
        insertAtCursor(`:R${rowIdx + 1}sample`);
      } else {
        const slug = headerToSlug(headers[colIdx] || `Col${colIdx + 1}`);
        insertAtCursor(`:R${rowIdx + 1}${slug}`);
      }
    },
    [headers, insertAtCursor, snapshot.settings.standardInTable],
  );

  // Inputs as variables derived from frozen snapshot
  const inputVariables = useMemo(() => {
    return buildInputVariables(
      snapshot.settings,
      snapshot.standardInputs,
      snapshot.sampleInputs,
    );
  }, [snapshot]);

  // Variable extraction for manual variable labels
  const { vars, varKeys, handleLabelChange } = useVariableExtraction(
    expression,
    true,
  );

  const manualVarKeys = useMemo(() => {
    const namedKeys = new Set(
      snapshot.settings.namedExpressions.map(({ key }) => key),
    );
    const canonicalInputKeys = new Set([
      ...snapshot.standardInputs.map(({ key }) =>
        standardInputVariableKey(key),
      ),
      ...(snapshot.sampleInputs[0] ?? []).map(({ key }) =>
        sampleInputTemplateVariableKey(key),
      ),
    ]);
    return varKeys.filter((key) => {
      if (
        key === "sampleAvg" ||
        key === "sampleSD" ||
        key === "sampleRSD" ||
        key === "sampleInput" ||
        key.startsWith("sampleInput.") ||
        key === "standardAvg" ||
        key === "standardInput" ||
        key.startsWith("standardInput.")
      )
        return false;
      if (key in tableVars || key in constants) return false;
      if (canonicalInputKeys.has(key)) return false;
      if (namedKeys.has(key)) return false;
      if (/^R\d+[A-Za-z0-9]+$/.test(key)) return false; // cell token pattern
      return true;
    });
  }, [
    varKeys,
    tableVars,
    constants,
    snapshot.settings.namedExpressions,
    snapshot.sampleInputs,
    snapshot.standardInputs,
  ]);

  // Number formatting using FROZEN settings
  const formatNumber = useCallback(
    (
      n: number | null | string | undefined,
      asPercentage = snapshot.settings.percentageResults,
      digitsOverride?: number,
    ) => {
      if (n === null || n === undefined || n === "") return "—";
      try {
        const num = typeof n === "string" ? Number(n) : n;
        if (!Number.isFinite(num)) return "—";
        const display = asPercentage ? num * 100 : num;
        const digits =
          digitsOverride ?? snapshot.settings.finalResultDecimalPlaces;
        const formatted =
          digits !== undefined
            ? display.toLocaleString(undefined, {
                maximumFractionDigits: digits,
                minimumFractionDigits: digits,
              })
            : display.toLocaleString(undefined, { maximumFractionDigits: 6 });
        return asPercentage ? `${formatted}%` : formatted;
      } catch {
        return "—";
      }
    },
    [
      snapshot.settings.percentageResults,
      snapshot.settings.finalResultDecimalPlaces,
    ],
  );

  // Results (strictly using frozen snapshot)
  const results = useMemo(() => {
    try {
      const out: Array<{
        sample: string;
        result: number | null;
        expression: string;
        substitutedExpression: string;
      }> = [];
      const startIdx = snapshot.settings.standardInTable ? 1 : 0;
      if (headers.length <= startIdx) return [];
      for (let sampleIdx = startIdx; sampleIdx < headers.length; sampleIdx++) {
        const sampleNumber = snapshot.settings.standardInTable
          ? sampleIdx
          : sampleIdx + 1;
        let expr = expression;

        expr = inlineUniversalNamedExpressions(
          expr,
          parseUniversalNamedExpressions(
            snapshot.settings as unknown as Record<string, unknown>,
          ),
          sampleNumber,
          snapshot.settings as unknown as Record<string, unknown>,
        );
        expr = expandAutoSampleTemplates(
          expr,
          sampleNumber,
          (snapshot.sampleInputs[sampleNumber - 1] ?? []).map(({ key }) => key),
        );

        const displayExpr = expr.replace(
          /:R(\d+)sample\b/gi,
          (_m, r: string) => `:R${r}sample${sampleNumber}`,
        );

        const finalExpr = expr.replace(
          /:([A-Za-z0-9\.]+)/g,
          (match, varName) => {
            // Auto sample cell
            let m = varName.match(/^R(\d+)sample$/i);
            if (m) {
              const rowIndex = Number(m[1]) - 1;
              const currentColIdx = sampleIdx;
              if (
                rowIndex >= 0 &&
                rowIndex < data.length &&
                currentColIdx >= 0 &&
                currentColIdx < headers.length
              ) {
                const raw = data[rowIndex]?.[currentColIdx] ?? "";
                if (raw !== "" && !isNaN(Number(raw)))
                  return String(Number(raw));
              }
              return match;
            }
            // Explicit cell reference: R{row}{slug}
            m = varName.match(/^R(\d+)([a-z0-9]+)$/i);
            if (m) {
              const rowIndex = Number(m[1]) - 1;
              const slug = (m[2] ?? "").toLowerCase();
              const colIndex = headers.findIndex(
                (h) => headerToSlug(h) === slug,
              );
              if (
                rowIndex >= 0 &&
                rowIndex < data.length &&
                colIndex >= 0 &&
                colIndex < headers.length
              ) {
                const raw = data[rowIndex]?.[colIndex] ?? "";
                if (raw !== "" && !isNaN(Number(raw)))
                  return String(Number(raw));
              }
              return match;
            }
            if (varName in constants) return String(constants[varName]);
            if (varName in inputVariables) {
              const v = inputVariables[varName];
              if (v !== "")
                return String(typeof v === "string" ? Number(v) : v);
              return match;
            }
            if (varName in tableVars) {
              const tv = tableVars[varName];
              return tv !== null ? String(tv) : match;
            }
            return match;
          },
        );

        if (/:([A-Za-z0-9\.]+)/.test(finalExpr)) {
          out.push({
            sample: headers[sampleIdx] ?? "",
            result: null,
            expression: displayExpr,
            substitutedExpression: finalExpr,
          });
          continue;
        }
        if (!hasBalancedParentheses(finalExpr) || !sanitizeForEval(finalExpr)) {
          out.push({
            sample: headers[sampleIdx] ?? "",
            result: null,
            expression: displayExpr,
            substitutedExpression: finalExpr,
          });
          continue;
        }
        try {
          const val = safeEval(finalExpr, {});
          const numeric = val !== null ? Number(val) : null;
          out.push({
            sample: headers[sampleIdx] ?? "",
            result: numeric,
            expression: displayExpr,
            substitutedExpression: finalExpr,
          });
        } catch {
          out.push({
            sample: headers[sampleIdx] ?? "",
            result: null,
            expression: displayExpr,
            substitutedExpression: finalExpr,
          });
        }
      }
      return out;
    } catch {
      return [];
    }
  }, [
    expression,
    headers,
    data,
    constants,
    inputVariables,
    snapshot.settings,
    snapshot.sampleInputs,
    tableVars,
  ]);

  const averageResult = useMemo(() => {
    if (!snapshot.settings.averageAllResults) return null;
    const valid = results
      .map((r) => r.result)
      .filter((x): x is number => x !== null);
    if (!valid.length) return null;
    return valid.reduce((s, v) => s + v, 0) / valid.length;
  }, [results, snapshot.settings.averageAllResults]);

  // Track previous emit payload to prevent unnecessary emissions
  const prevEmitPayloadRef = useRef<EmitPayload | null>(null);
  const emitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const buildPayload = useCallback(
    (nextExpression: string) => ({
      ...snapshot.settings,
      constants,
      expression: nextExpression,
      headers,
      standardInputs: snapshot.standardInputs,
      sampleInputs: snapshot.sampleInputs,
      data,
      rowHeaders,
      columnExpressions,
      manualVarLabels: manualVarKeys.reduce(
        (acc, k) => {
          acc[k] = (vars as VarMapWithLabels)[k]?.label || "";
          return acc;
        },
        {} as Record<string, string>,
      ),
      // Keeping placeholders for compatibility
      manualVarExpressions: snapshot.settings.manualVarExpressions || {},
      manualVars: snapshot.settings.manualVars || {},
      numberOfSamples:
        headers.length - (snapshot.settings.standardInTable ? 1 : 0),
      numberOfReadings: data.length,
      firstColumnPurpose: snapshot.settings.firstColumnPurpose,
    }),
    [
      snapshot,
      constants,
      headers,
      data,
      rowHeaders,
      columnExpressions,
      manualVarKeys,
      vars,
    ],
  );

  const handleMainExpressionChange = useCallback(
    (nextExpression: string) => {
      onExpressionChange(nextExpression);
      onEmit(buildPayload(nextExpression));
    },
    [buildPayload, onEmit, onExpressionChange],
  );

  // Emit up full payload (only happens in Expression stage; container ensures emit)
  useEffect(() => {
    const payload = buildPayload(expression);

    // Deep compare to prevent unnecessary emissions
    if (isEqual(payload, prevEmitPayloadRef.current)) {
      return;
    }

    prevEmitPayloadRef.current = payload;

    // Debounce emissions to prevent rapid-fire updates
    if (emitTimeoutRef.current) {
      clearTimeout(emitTimeoutRef.current);
    }

    emitTimeoutRef.current = setTimeout(() => {
      onEmit(payload);
    }, 100);

    return () => {
      if (emitTimeoutRef.current) {
        clearTimeout(emitTimeoutRef.current);
      }
    };
  }, [buildPayload, expression, onEmit]);

  useEffect(() => {
    const flush = () => onEmit(buildPayload(expression));
    window.addEventListener(UNIVERSAL_FORMULA_FLUSH_EVENT, flush);
    return () =>
      window.removeEventListener(UNIVERSAL_FORMULA_FLUSH_EVENT, flush);
  }, [buildPayload, expression, onEmit]);

  const onReset = useCallback(() => {
    // Reset expression-side artifacts but keep snapshot shape
    onExpressionChange("");
    onConstantsChange({});
    onColumnExpressionsChange({});
    onUpdateSnapshot({
      ...snapshot,
      settings: { ...snapshot.settings, namedExpressions: [] },
    });
    // Reset headers back to frozen snapshot.settings defaults
    const defaultHeaders = [...snapshot.headers];
    const rows = Array(snapshot.settings.noOfReadings)
      .fill(null)
      .map(() => Array(defaultHeaders.length).fill(""));
    updateTableData(defaultHeaders, rows);
    setRowHeaders(
      Array(snapshot.settings.noOfReadings)
        .fill(null)
        .map((_, i) => ({ id: `row-${i + 1}`, label: `Reading ${i + 1}` })),
    );
  }, [
    onExpressionChange,
    onConstantsChange,
    onColumnExpressionsChange,
    onUpdateSnapshot,
    updateTableData,
    snapshot,
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between bg-background border-b border-border py-3 mb-6 px-2">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-foreground" />
          <span className="text-lg font-semibold text-foreground">
            Expression
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={onBackToSettings}
            disabled={disabled}
            type="button"
          >
            Back to Settings
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            disabled={disabled}
            type="button"
          >
            <Undo2 className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>
      </header>

      {/* Settings Summary */}
      <section className="bg-background border border-border rounded-lg px-5 py-4 mb-6">
        <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">
          Settings Summary
        </h3>
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {[
            {
              label: "First Column",
              value: snapshot.settings.standardInTable
                ? PURPOSE_LABEL[snapshot.settings.firstColumnPurpose]
                : "Disabled",
              icon: <Settings className="w-4 h-4 text-info" />,
              active: snapshot.settings.standardInTable,
            },
            {
              label: "Standard Inputs",
              value: snapshot.settings.standardInput ? "Enabled" : "Disabled",
              icon: <FunctionSquare className="w-4 h-4 text-info" />,
              active: snapshot.settings.standardInput,
            },
            {
              label: "Sample Inputs",
              value: snapshot.settings.sampleInput ? "Enabled" : "Disabled",
              icon: <Plus className="w-4 h-4 text-success" />,
              active: snapshot.settings.sampleInput,
            },
            {
              label: "Formula in Table",
              value: snapshot.settings.formulaInTable ? "Enabled" : "Disabled",
              icon: <Calculator className="w-4 h-4 text-warning" />,
              active: snapshot.settings.formulaInTable,
            },
            {
              label: "Average in Table",
              value: snapshot.settings.calculateAvgInTable ? "Yes" : "No",
              icon: <Beaker className="w-4 h-4 text-info" />,
              active: snapshot.settings.calculateAvgInTable,
            },
            {
              label: "SD in Table",
              value: snapshot.settings.calculateSdInTable ? "Yes" : "No",
              icon: <Beaker className="w-4 h-4 text-info" />,
              active: snapshot.settings.calculateSdInTable,
            },
            {
              label: "RSD in Table",
              value: snapshot.settings.calculateRsdInTable ? "Yes" : "No",
              icon: <Beaker className="w-4 h-4 text-info" />,
              active: snapshot.settings.calculateRsdInTable,
            },
            {
              label: "Percentage",
              value: snapshot.settings.percentageResults ? "Yes" : "No",
              icon: <Calculator className="w-4 h-4 text-warning" />,
              active: snapshot.settings.percentageResults,
            },
            {
              label: "Avg All Results",
              value: snapshot.settings.averageAllResults ? "Yes" : "No",
              icon: <Calculator className="w-4 h-4 text-warning" />,
              active: snapshot.settings.averageAllResults,
            },
            {
              label: "Input / Table / Result Decimals",
              value: `${snapshot.settings.inputDecimalPlaces} / ${snapshot.settings.tableCalculationDecimalPlaces} / ${snapshot.settings.finalResultDecimalPlaces}`,
              icon: <FunctionSquare className="w-4 h-4 text-info" />,
              active: true,
            },
            {
              label: "Samples",
              value:
                headers.length - (snapshot.settings.standardInTable ? 1 : 0),
              icon: <Plus className="w-4 h-4 text-success" />,
              active: true,
            },
            {
              label: "Readings",
              value: rowHeaders.length,
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
                  className={`text-sm font-bold ${item.active ? "text-info" : "text-muted-foreground/80"}`}
                >
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {snapshot.settings.namedExpressionsEnabled && (
        <NamedExpressionEditor
          disabled={disabled}
          expressions={snapshot.settings.namedExpressions}
          onInsert={handleKeyButton}
          onChange={(namedExpressions) =>
            onUpdateSnapshot({
              ...snapshot,
              settings: { ...snapshot.settings, namedExpressions },
            })
          }
        />
      )}

      {/* Expression Builder */}
      <div className="bg-background border border-border rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Expression Builder
          </h3>
        </div>
        <div className="flex justify-between gap-4">
          <div className="w-full">
            <textarea
              ref={textareaRef}
              value={expression}
              onChange={(e) => handleMainExpressionChange(e.target.value)}
              className="w-full h-24 p-2 bg-muted/30 text-foreground border border-border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-info/40 resize-none"
              spellCheck={false}
              disabled={disabled}
              placeholder="Use :variables (e.g., :sampleAvg, :R4sample, :R4blank)"
            />
            <div className=" bg-muted border border-border rounded p-2 mt-2">
              <p className="text-xs text-foreground leading-relaxed">
                Auto sample cells:{" "}
                <code className="bg-background border px-1 rounded text-info font-bold">
                  :R4sample
                </code>{" "}
                expands per sample. Direct cells:{" "}
                <code className="bg-background border px-1 rounded text-info font-bold">
                  :R4blank
                </code>{" "}
                (no underscores). Templates:{" "}
                <code className="bg-background border px-1 rounded text-info font-bold">
                  :sampleAvg :sampleSD :sampleRSD
                </code>
                .
              </p>
            </div>
          </div>

          <div className="mt-4 w-full">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Constants
            </h4>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newConstantName}
                onChange={(e) => setNewConstantName(e.target.value)}
                placeholder="Name"
                className="w-1/3 bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-info/40"
                disabled={disabled}
              />
              <input
                type="text"
                value={newConstantValue}
                onChange={(e) => setNewConstantValue(e.target.value)}
                placeholder="Value / expression"
                className="w-1/2 bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-info/40"
                disabled={disabled}
              />
              <Button
                onClick={handleAddConstant}
                disabled={disabled || !newConstantName || !newConstantValue}
              >
                Add
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(constants).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-muted/30 border border-border rounded px-2.5 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => handleKeyButton(key)}
                    className="text-xs font-semibold text-info hover:underline"
                    disabled={disabled}
                  >
                    :{key}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">= {value}</span>
                    <button
                      onClick={() => handleDeleteConstant(key)}
                      className="text-destructive hover:text-destructive"
                      disabled={disabled}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Manual Variables (labels only) */}
        {(() => {
          if (manualVarKeys.length === 0) return null;
          return (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Manual Variables
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {manualVarKeys.map((k) => (
                  <div
                    key={k}
                    className="flex flex-col gap-2 bg-muted/30 border border-border rounded-md p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-4 justify-between">
                      <label
                        htmlFor={`label-${k}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Label
                      </label>
                      <div className="flex-1">
                        <input
                          id={`label-${k}`}
                          type="text"
                          value={(vars as VarMapWithLabels)[k]?.label || ""}
                          onChange={(e) => handleLabelChange(k, e.target.value)}
                          placeholder={`Description for ${k}`}
                          className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-info/40 focus:border-border transition-all"
                          disabled={disabled}
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => handleKeyButton(k)}
                          className="text-sm font-semibold text-info hover:text-info hover:underline transition-colors"
                          disabled={disabled}
                        >
                          :{k}
                        </button>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
                          ×{countOccurrences(expression, k)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Expressions and Available Variables */}
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
        <div className="w-full col-span-2">
          <div className="flex items-center justify-between pb-2 mt-4 mb-2 border-b border-border/60">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Expressions
            </h3>
          </div>

          {snapshot.settings.averageAllResults && averageResult !== null && (
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
                No results. Add samples and build the formula.
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
                  <div className="bg-background border border-border rounded p-2 mb-2">
                    <div className="text-[10px] text-muted-foreground font-semibold mb-1">
                      Formula:
                    </div>
                    <div className="text-xs font-mono bg-muted/30 p-1.5 rounded-sm border border-border/60">
                      <ExpressionRenderer
                        className="text-xs font-mono"
                        expression={res.expression}
                        option={{
                          append100: snapshot.settings.percentageResults,
                          result: res.result,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border/60">
              Available Variables
            </h3>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {headers.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-2 text-center">
                  No table variables available.
                </div>
              ) : (
                (() => {
                  const items: Array<{
                    key: string;
                    label: string;
                    value: number | string | null;
                    isTemplate: boolean;
                  }> = [];

                  // Templates
                  if (snapshot.settings.calculateAvgInTable) {
                    items.push({
                      key: "sampleAvg",
                      label: "Sample Average (auto)",
                      value: null,
                      isTemplate: true,
                    });
                  }
                  if (snapshot.settings.calculateSdInTable) {
                    items.push({
                      key: "sampleSD",
                      label: "Sample SD (auto)",
                      value: null,
                      isTemplate: true,
                    });
                  }
                  if (snapshot.settings.calculateRsdInTable) {
                    items.push({
                      key: "sampleRSD",
                      label: "Sample RSD (auto)",
                      value: null,
                      isTemplate: true,
                    });
                  }

                  // Auto sampleInput templates
                  if (
                    snapshot.settings.sampleInput &&
                    snapshot.sampleInputs?.[0]
                  ) {
                    snapshot.sampleInputs[0].forEach((input) => {
                      items.push({
                        key:
                          snapshot.settings.variableKeyFormat ===
                          UniversalVariableKeyFormat.CanonicalAlphanumeric
                            ? sampleInputTemplateVariableKey(input.key)
                            : `sampleInput.${input.key}`,
                        label: `Sample ${input.label} (auto)`,
                        value: null,
                        isTemplate: true,
                      });
                    });
                  }

                  // Standard inputs
                  if (
                    snapshot.settings.standardInput &&
                    snapshot.settings.standardInTable
                  ) {
                    snapshot.standardInputs.forEach((input) => {
                      items.push({
                        key:
                          snapshot.settings.variableKeyFormat ===
                          UniversalVariableKeyFormat.CanonicalAlphanumeric
                            ? standardInputVariableKey(input.key)
                            : `standardInput.${input.key}`,
                        label: `${PURPOSE_LABEL[snapshot.settings.firstColumnPurpose]} ${input.label}`,
                        value: input.value === "" ? "" : Number(input.value),
                        isTemplate: false,
                      });
                    });
                  }

                  // Standard stats
                  if (snapshot.settings.standardInTable) {
                    if (snapshot.settings.calculateAvgInTable) {
                      items.push({
                        key: "standardAvg",
                        label: `${PURPOSE_LABEL[snapshot.settings.firstColumnPurpose]} Average`,
                        value: tableVars.standardAvg ?? null,
                        isTemplate: false,
                      });
                    }
                    if (snapshot.settings.calculateSdInTable) {
                      items.push({
                        key: "standardSD",
                        label: `${PURPOSE_LABEL[snapshot.settings.firstColumnPurpose]} SD`,
                        value: tableVars.standardSD ?? null,
                        isTemplate: false,
                      });
                    }
                    if (snapshot.settings.calculateRsdInTable) {
                      items.push({
                        key: "standardRSD",
                        label: `${PURPOSE_LABEL[snapshot.settings.firstColumnPurpose]} RSD`,
                        value: tableVars.standardRSD ?? null,
                        isTemplate: false,
                      });
                    }
                  }

                  return items.map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => insertAtCursor(`:${item.key}`)}
                      className="w-full flex items-center justify-between bg-muted/30 hover:bg-muted border border-border hover:border-border rounded px-2.5 py-1.5 transition-colors group"
                      disabled={disabled}
                    >
                      <span className="text-xs font-semibold text-foreground group-hover:text-info">
                        :{item.key}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground group-hover:text-info">
                          {item.label}
                        </span>
                        {item.isTemplate && (
                          <span className="text-xs font-bold text-info bg-muted border border-border rounded px-2 py-0.5">
                            auto
                          </span>
                        )}
                        {!item.isTemplate && (
                          <span className="text-xs font-bold text-foreground bg-background border border-border rounded px-2 py-0.5 min-w-[60px] text-center">
                            {formatNumber(item.value, false)}
                          </span>
                        )}
                      </div>
                    </button>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table: headers editable, cells disabled */}
      <div className="grid grid-cols-1 gap-4">
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
                  No data table yet.
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
                          className="border-r border-border p-1.5 bg-muted/30 min-w-[160px]"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-[10px] text-muted-foreground font-semibold">
                              {String.fromCharCode(65 + c)}
                            </div>
                            <div className="flex gap-1">
                              {c >
                                (snapshot.settings.standardInTable ? 0 : -1) &&
                                snapshot.settings.formulaInTable && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenExpressionDialog(c)
                                    }
                                    className={`p-0.5 rounded ${
                                      columnExpressions[c]?.enabled
                                        ? "bg-muted/70 hover:bg-muted"
                                        : "bg-muted/70 hover:bg-muted"
                                    } transition-colors`}
                                    title={
                                      columnExpressions[c]?.enabled
                                        ? "Edit column expression"
                                        : "Add column expression"
                                    }
                                    disabled={disabled}
                                  >
                                    <FunctionSquare
                                      className={`w-3 h-3 ${
                                        columnExpressions[c]?.enabled
                                          ? "text-info"
                                          : "text-foreground"
                                      }`}
                                    />
                                  </button>
                                )}
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              className={`w-full text-center font-bold text-xs bg-background border ${
                                columnExpressions[c]?.enabled
                                  ? "border-border ring-1 ring-info/40"
                                  : "border-border"
                              } rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-info/40`}
                              value={h}
                              onChange={(e) => updateHeader(c, e.target.value)}
                              disabled={disabled}
                            />
                            {columnExpressions[c]?.enabled && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-muted rounded-full" />
                            )}
                          </div>
                          {columnExpressions[c]?.error && (
                            <div className="text-[9px] text-destructive mt-0.5 truncate">
                              {columnExpressions[c].error}
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
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              className="w-full text-xs font-semibold text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-info/40 focus:bg-background"
                              value={rowHeaders[r]?.label || `Reading ${r + 1}`}
                              onChange={(e) =>
                                updateRowHeader(r, e.target.value)
                              }
                              disabled={disabled}
                            />
                          </div>
                        </td>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className="border-r border-b border-border p-0.5 group relative"
                          >
                            <div className="flex items-center">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => {
                                  if (
                                    e.target.value === "" ||
                                    /^-?\d*\.?\d*$/.test(e.target.value)
                                  ) {
                                    updateCell(r, c, e.target.value);
                                  }
                                }}
                                className={`w-full text-center p-1.5 bg-background border rounded text-xs focus:outline-none focus:ring-1 focus:ring-info/40 focus:border-border ${
                                  columnExpressions[c]?.enabled
                                    ? "bg-muted/30 border-border text-muted-foreground"
                                    : "border-border"
                                }`}
                                placeholder="0"
                                disabled={
                                  disabled ||
                                  columnExpressions[c]?.enabled ||
                                  TABLE_CONTENT_DISABLED
                                }
                              />
                              <button
                                type="button"
                                onClick={() => handleInsertCellVariable(r, c)}
                                className="absolute top-0 right-0 mt-0.5 mr-0.5 p-0.5 rounded bg-muted/70 hover:bg-muted border border-border hover:border-border hidden group-hover:inline-flex"
                                title="Insert cell variable"
                                disabled={disabled}
                              >
                                <MousePointerSquareDashed className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                    {snapshot.settings.calculateAvgInTable &&
                      stats.length > 0 && (
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
                                snapshot.settings.tableCalculationDecimalPlaces,
                              )}
                            </td>
                          ))}
                        </tr>
                      )}
                    {snapshot.settings.calculateSdInTable &&
                      stats.length > 0 && (
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
                                snapshot.settings.tableCalculationDecimalPlaces,
                              )}
                            </td>
                          ))}
                        </tr>
                      )}
                    {snapshot.settings.calculateRsdInTable &&
                      stats.length > 0 && (
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
                                snapshot.settings.tableCalculationDecimalPlaces,
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

      {/* Column Expression Dialog */}
      <Dialog
        open={expressionDialogOpen}
        onOpenChange={setExpressionDialogOpen}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {columnExpressions[activeColumnIndex as number]?.enabled
                ? "Edit Column Expression"
                : "Create Column Expression"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Reference other columns (e.g., <code>Sample 1 + Sample 2</code>
                ). Column becomes read-only when expression is saved.
              </p>
              <div className="space-y-2">
                <label
                  htmlFor="expression"
                  className="text-sm font-medium text-foreground"
                >
                  Expression
                </label>
                <Input
                  id="expression"
                  value={draftExpression}
                  onChange={(e) => setDraftExpression(e.target.value)}
                  placeholder="Example: Sample 1 + Sample 2"
                  className="font-mono"
                />
              </div>
              <div className="bg-muted border border-border rounded-md p-2.5">
                <p className="text-xs text-warning">
                  This overrides manual cell entries for the column.
                </p>
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (
                  activeColumnIndex !== null &&
                  columnExpressions[activeColumnIndex]?.enabled
                ) {
                  const next = { ...columnExpressions };
                  delete next[activeColumnIndex];
                  onColumnExpressionsChange(next);
                }
                setExpressionDialogOpen(false);
              }}
              className={
                activeColumnIndex !== null &&
                columnExpressions[activeColumnIndex as number]?.enabled
                  ? "text-destructive border-border hover:bg-muted"
                  : ""
              }
            >
              {activeColumnIndex !== null &&
              columnExpressions[activeColumnIndex]?.enabled
                ? "Remove Expression"
                : "Cancel"}
            </Button>
            <Button type="button" onClick={handleSaveExpression}>
              Save Expression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpressionPanel;
