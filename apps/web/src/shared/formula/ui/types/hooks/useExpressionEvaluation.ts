import { useMemo } from "react";
import { evaluateExpression as safeEval } from "../expression/universal/engine/expressionEngine";
import { VarMap, VarMapWithLabels } from "../type";
import { normalizeMathExpression, sanitizeForEval } from "../utils";

export function useExpressionEvaluation(
  expression: string,
  vars: VarMap | VarMapWithLabels,
  withLabels = false,
  showPercentage = false,
  decimalPlaces: number | "" = 2,
) {
  const result = useMemo(() => {
    try {
      const replaced = expression.replace(
        /:([A-Za-z0-9_]+)/g,
        (_, variable: string) => {
          if (withLabels) {
            const value = (vars as VarMapWithLabels)[variable]?.value;
            return value !== "" && value !== undefined
              ? String(Number(value))
              : "NaN";
          }

          const value = (vars as VarMap)[variable];
          return value !== "" && value !== undefined
            ? String(Number(value))
            : "NaN";
        },
      );
      const normalized = normalizeMathExpression(replaced);
      if (normalized.includes("NaN") || !sanitizeForEval(normalized)) {
        return null;
      }

      const value = safeEval(normalized, {});
      return value === null ? null : Number(value);
    } catch (error) {
      console.error("[useExpressionEvaluation] Evaluation failed:", error);
      return null;
    }
  }, [expression, vars, withLabels]);

  const displayResult = useMemo(() => {
    if (result === null) return "—";

    try {
      const digits =
        decimalPlaces === "" || decimalPlaces === undefined
          ? undefined
          : decimalPlaces;
      const displayedValue = showPercentage ? result * 100 : result;
      const formatted = displayedValue.toLocaleString(undefined, {
        maximumFractionDigits: digits ?? 6,
        minimumFractionDigits: 0,
      });
      const cleaned = formatted.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
      return showPercentage ? `${cleaned}%` : cleaned;
    } catch (error) {
      console.error("[useExpressionEvaluation] Formatting failed:", error);
      return "Error";
    }
  }, [decimalPlaces, result, showPercentage]);

  return { result, displayResult };
}
