import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { countOccurrences } from "../../utils";
import {
  TheAduseiFormulaProps,
  VarMapWithLabels,
  ExpressionExtract,
} from "../../type";
import { FormulaTypes } from "@/shared/formula/ui/legacy";
import {
  useFormulaState,
  useVariableExtraction,
  useExpressionEvaluation,
} from "../../hooks";
import { ExpressionInput, FormulaCard, ControlsPanel } from "../../components";
import { Button } from "@/components/ui/button";
import { Beaker, Trash2, Undo2 } from "lucide-react";
import { sanitizeForEval } from "../../utils";
import { SimpleEvaluate } from "./evaluate";
import { evaluateExpression as safeEval } from "../universal/engine/expressionEngine";

/**
 * SimpleFormula
 *
 * Adds "Constants" support (extracted from AdvancedFormula):
 * - Users can define named constants with numeric values or expressions.
 * - Constants can be inserted into the expression as :CONST_NAME.
 * - Constants are included in expression evaluation and emitted to parent.
 * - Manual variable inputs exclude keys that are defined in constants.
 */

// Helper function to check if an expression has balanced parentheses
const hasBalancedParentheses = (expr: string): boolean => {
  let count = 0;
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === "(") count++;
    if (expr[i] === ")") count--;
    if (count < 0) return false;
  }
  return count === 0;
};

// Safely evaluate a mathematical expression (single value, not sample-based)
const evaluateExpression = (expr: string): number | null => {
  try {
    const trimmed = expr.trim();
    if (!trimmed) return null;

    if (!hasBalancedParentheses(trimmed)) return null;
    if (!sanitizeForEval(trimmed)) return null;

    const result = safeEval(trimmed, {});
    return result;
  } catch {
    return null;
  }
};

export const SimpleConfig = ({
  value,
  onChange,
  disabled,
}: TheAduseiFormulaProps) => {
  const {
    expression,
    setExpression,
    decimalPlaces,
    handleDecimalPlacesChange,
    showPercentage,
    setShowPercentage,
    emitOnChange,
    isHydratingRef,
  } = useFormulaState(FormulaTypes.Simple, value, onChange);

  const {
    vars,
    setVars,
    varKeys,

    handleLabelChange,

    // substitutedExpression,
  } = useVariableExtraction(expression, true);

  // Test routing (single page toggle)
  const [showTest, setShowTest] = useState<boolean>(false);

  // Constants state (extracted from AdvancedFormula)
  const [constants, setConstants] = useState<Record<string, number>>({});
  const [newConstantName, setNewConstantName] = useState("");
  const [newConstantValue, setNewConstantValue] = useState("");

  // Hydrate variables and constants from incoming value (controlled)
  useEffect(() => {
    try {
      if (!value || value.trim() === "") return;
      const parsed = JSON.parse(value) as ExpressionExtract & {
        constants?: Record<string, number> | undefined;
      };
      if (parsed?.variables) {
        setVars(parsed.variables as VarMapWithLabels);
      }
      if (parsed?.constants) {
        setConstants(parsed.constants);
      }
    } catch (e) {
      console.error("[SimpleFormula] Failed to hydrate from value:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Merge constants into variables for evaluation (constants take precedence for value)
  const composedVars: VarMapWithLabels = useMemo(() => {
    const merged: VarMapWithLabels = { ...(vars as VarMapWithLabels) };
    for (const [key, val] of Object.entries(constants)) {
      merged[key] = {
        label: merged[key]?.label ?? key,
        ...(merged[key] || {}),
        value: val.toString(),
      };
    }
    return merged;
  }, [vars, constants]);

  // Evaluate with merged variables (so constants are substituted)
  const { result } = useExpressionEvaluation(
    expression,
    composedVars,
    true,
    showPercentage,
    decimalPlaces,
  );

  // // Substituted expression that also replaces constants
  // const substitutedWithConstants = useMemo(() => {
  //   if (!substitutedExpression) return substitutedExpression;
  //   try {
  //     return substitutedExpression.replace(
  //       /:([A-Za-z0-9_\.]+)/g,
  //       (match, key) => {
  //         if (key in constants) return String(constants[key]);
  //         return match;
  //       },
  //     );
  //   } catch {
  //     return substitutedExpression;
  //   }
  // }, [substitutedExpression, constants]);

  // Exclude constants from manual variable inputs
  const manualVarKeys = useMemo(
    () => varKeys.filter((k) => !(k in constants)),
    [varKeys, constants],
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleKeyButton = (key: string) => {
    const ta = textareaRef.current;
    const insertion = `:${key}`;
    if (!ta) {
      setExpression((s) => s + insertion);
      return;
    }
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    const before = ta.value.substring(0, start);
    const after = ta.value.substring(end);
    const newValue = before + insertion + after;
    setExpression(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + insertion.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleDeleteLastKey = () => {
    const re = /:([A-Za-z0-9_\.]+)\b/g;
    let lastMatch: RegExpExecArray | null = null;
    let m;
    while ((m = re.exec(expression))) {
      lastMatch = m;
    }
    if (!lastMatch) return;
    const idx = lastMatch.index;
    const len = lastMatch[0].length;
    const newExpr = expression.slice(0, idx) + expression.slice(idx + len);
    setExpression(newExpr);
  };

  // Constants handlers (extracted logic)
  const handleAddConstant = useCallback(() => {
    if (!newConstantName || !newConstantValue) return;
    const val = evaluateExpression(newConstantValue);
    if (val !== null) {
      setConstants((prev) => ({ ...prev, [newConstantName]: val }));
      setNewConstantName("");
      setNewConstantValue("");
    } else {
      alert("Invalid expression. Please check your constant's formula.");
    }
  }, [newConstantName, newConstantValue]);

  const handleDeleteConstant = useCallback((key: string) => {
    setConstants((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Emit to parent whenever relevant controlled state changes
  useEffect(() => {
    if (!isHydratingRef.current) {
      emitOnChange({ variables: vars, constants });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emitOnChange, vars, constants]);

  const onReset = () => {
    setExpression("");
    setConstants({});
    setVars({});
    setNewConstantName("");
    setNewConstantValue("");
  };

  // Guard: when test is opened, render test component (single page)
  if (showTest) {
    return (
      <SimpleEvaluate
        settings={
          value && value.trim()
            ? value
            : JSON.stringify({
                expression,
                variables: vars,
                percent: showPercentage,
                decimalPlaces,
                constants,
              })
        }
        onBack={() => setShowTest(false)}
        testMode
        value={""}
        onChange={() => {}}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Input panel */}
      <div className="bg-background border border-border rounded-lg p-4 flex flex-col gap-3 shadow-sm">
        <ExpressionInput
          value={expression}
          onChange={setExpression}
          onDeleteLastKey={handleDeleteLastKey}
          disabled={disabled}
          textareaRef={textareaRef}
        />

        <div className="grid grid-cols-1 gap-3">
          <FormulaCard
            title="Formula"
            expression={expression}
            result={result}
            showPercentage={showPercentage}
            className="bg-muted"
          />
        </div>
      </div>

      {/* Right: Preview panel */}
      <div className="bg-background border border-border rounded-lg p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Config
            </h3>
          </div>
          <ControlsPanel
            showPercentage={showPercentage}
            onTogglePercentage={setShowPercentage}
            decimalPlaces={decimalPlaces}
            onDecimalPlacesChange={handleDecimalPlacesChange}
            disabled={disabled}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="gap-1"
            >
              <Undo2 className="w-4 h-4" />
              Reset
            </Button>
            <Button
              type="button"
              onClick={() => setShowTest(true)}
              className="gap-2 bg-muted text-foreground hover:bg-muted"
              title="Open a single-page tester with these settings"
            >
              <Beaker className="w-4 h-4" />
              Test Formula
            </Button>
          </div>
          {/* <ResultDisplay result={displayResult} /> */}
        </div>

        {/* Constants Panel (new) */}
        <div className="mt-1">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            Constants
          </h4>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newConstantName}
              onChange={(e) => setNewConstantName(e.target.value)}
              placeholder="Name"
              className="w-1/4 bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-info/40"
              disabled={disabled}
            />
            <input
              type="text"
              value={newConstantValue}
              onChange={(e) => setNewConstantValue(e.target.value)}
              placeholder="Value or expression"
              className="w-3/4 bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-info/40"
              disabled={disabled}
            />
            <Button
              type="button"
              onClick={handleAddConstant}
              disabled={disabled || !newConstantName || !newConstantValue}
            >
              Add
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {Object.entries(constants).map(([key, val]) => (
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
                  <span className="text-xs font-semibold">= {val}</span>
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

        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 block">
            Variables
          </label>

          <div className="grid  grid-cols-1 sm:grid-cols-2 gap-2">
            {manualVarKeys.length === 0 && (
              <div className="text-xs text-muted-foreground italic py-1 col-span-2">
                No manual variables detected. Type{" "}
                <code className="bg-muted border border-border px-1 rounded text-foreground">
                  :x
                </code>{" "}
                to create one, or add constants above.
              </div>
            )}

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
                    Label (Description)
                  </label>
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => handleKeyButton(k)}
                      className="text-sm font-semibold text-info hover:text-info hover:underline transition-colors"
                      aria-label={`Insert :${k} at cursor`}
                      title="Click to insert into expression"
                      disabled={disabled}
                    >
                      :{k}
                    </button>

                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
                      ×{countOccurrences(expression, k)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <input
                    id={`label-${k}`}
                    type="text"
                    value={(vars as VarMapWithLabels)[k]?.label || ""}
                    onChange={(e) => handleLabelChange(k, e.target.value)}
                    placeholder={`e.g., "Total Sales", "Tax Rate"`}
                    className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-info/40 focus:border-border transition-all"
                    aria-label={`Label for ${k}`}
                    disabled={disabled}
                  />
                </div>

                {(vars as VarMapWithLabels)[k]?.label && (
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted border border-border rounded px-2 py-1.5">
                    <svg
                      className="w-3 h-3 text-info flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <span className="leading-tight italic">
                      {(vars as VarMapWithLabels)[k]?.label}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
