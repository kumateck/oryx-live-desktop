import React, { useMemo } from "react";
import { evaluateExpression as safeEval } from "@/shared/formula/ui/types/expression/universal/engine/expressionEngine";
import { sanitizeForEval } from "@/shared/formula/ui/types/utils";
import { FormulaCard } from "../formula-card";
import {
  extractFormulaVariables,
  parseSimpleFormulaResponse,
  parseSimpleFormulaSettings,
  substituteFormulaValues,
} from "@/shared/formula/compute/simple-formula";

interface Props {
  settings: string;
  response: string;
}

export const SimplePreview: React.FC<Props> = ({ settings, response }) => {
  const parsed = useMemo(
    () => parseSimpleFormulaSettings(settings),
    [settings],
  );

  const expression = parsed?.expression ?? "";
  const percent = parsed?.percent ?? false;
  const decimalPlaces = parsed?.decimalPlaces ?? 2;

  const constants = useMemo<Record<string, number>>(
    () => parsed?.constants ?? {},
    [parsed?.constants],
  );

  const varKeys = useMemo(() => {
    try {
      return extractFormulaVariables(expression, constants);
    } catch {
      return [];
    }
  }, [expression, constants]);

  const varInputs = useMemo<Record<string, string>>(() => {
    const parsedValues = parseSimpleFormulaResponse(response);
    return varKeys.reduce(
      (acc, key) => {
        const raw = parsedValues[key];
        acc[key] = raw === "" || raw === undefined ? "" : String(raw);
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [response, varKeys]);

  const substitutedExpression = useMemo(() => {
    try {
      return substituteFormulaValues(expression, varInputs, constants);
    } catch {
      return expression;
    }
  }, [expression, varInputs, constants]);

  const displayResult = useMemo(() => {
    try {
      if (
        !substitutedExpression ||
        /:([A-Za-z0-9_]+)/.test(substitutedExpression)
      ) {
        return null;
      }

      if (!sanitizeForEval(substitutedExpression)) {
        return null;
      }

      const rawResult = safeEval(substitutedExpression, {});
      const numericResult = Number(rawResult);
      if (!Number.isFinite(numericResult)) {
        return null;
      }

      const digits =
        decimalPlaces === "" || decimalPlaces === undefined
          ? undefined
          : decimalPlaces;

      if (percent) {
        const percentageValue = numericResult * 100;
        const formatted = percentageValue.toLocaleString(undefined, {
          maximumFractionDigits: digits ?? 6,
          minimumFractionDigits: 0,
        });
        return `${formatted.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")}%`;
      }

      const formatted = numericResult.toLocaleString(undefined, {
        maximumFractionDigits: digits ?? 6,
        minimumFractionDigits: 0,
      });
      return formatted.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    } catch {
      return null;
    }
  }, [decimalPlaces, percent, substitutedExpression]);

  if (!parsed || !expression) {
    return (
      <div className="bg-muted border border-border text-warning rounded p-2 text-xs">
        Unable to load preview. Invalid or empty settings payload.
      </div>
    );
  }

  return (
    <FormulaCard
      title="Formula"
      expression={substitutedExpression}
      result={displayResult}
      showPercentage={!!percent}
      className="bg-transparent border-0 p-0"
    />
  );
};
