import React, { useEffect, useMemo, useState } from "react";
import { ExpressionExtract, TheAduseiFormulaProps, VarMap } from "../../type";
import { useExpressionEvaluation } from "../../hooks";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  extractFormulaVariables,
  parseSimpleFormulaResponse,
  parseSimpleFormulaSettings,
  substituteFormulaValues,
} from "@/shared/formula/compute/simple-formula";
import { PreviewPanel, VariablesPanel } from "./evaluate-panels";

interface Props extends TheAduseiFormulaProps {
  settings: string; // Serialized ExpressionExtract from the builder
}

/**
 * SimpleEvaluate
 * - Read-only evaluator for a previously built simple formula.
 * - Renders a computed result and inputs for required variables.
 * - Percent and decimalPlaces are taken from `option` and are not editable.
 * - Emits controlled values back to parent as a JSON string (Record<string, number | "">).
 */
export const SimpleEvaluate: React.FC<Props> = ({
  settings,
  value,
  onChange,
  testMode,
  onBack,
}) => {
  // Parse the saved builder output
  const parsed = useMemo<ExpressionExtract | null>(() => {
    return parseSimpleFormulaSettings(settings);
  }, [settings]);

  // Derive expression and settings from option
  const expression = parsed?.expression ?? "";
  const percent = parsed?.percent ?? false;
  const decimalPlaces = parsed?.decimalPlaces ?? 2;

  // New: constants (read-only, from builder)
  const constants = useMemo<Record<string, number>>(() => {
    return parsed?.constants ?? {};
  }, [parsed?.constants]);
  // const constants: Record<string, number> = parsed?.constants ?? {};
  // const constantKeys = useMemo(() => Object.keys(constants), [constants]);

  // Extract variable keys from expression (excluding constants)
  const varKeys = useMemo(() => {
    try {
      return extractFormulaVariables(expression, constants);
    } catch (error) {
      console.error("[SimpleEvaluate] Error extracting variables:", error);
      return [];
    }
  }, [expression, constants]);

  // Map of labels to show next to inputs (read-only), if provided by option
  const labels = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    try {
      if (parsed?.variables) {
        for (const [k, v] of Object.entries(parsed.variables)) {
          map[k] = v?.label ?? "";
        }
      }
    } catch (e) {
      console.error("[SimpleEvaluate] Failed to extract labels:", e);
      // Ignore label issues gracefully
    }
    return map;
  }, [parsed]);

  // Local controlled input state for variable values as strings (for the inputs)
  const [varInputs, setVarInputs] = useState<Record<string, string>>({});

  // Hydrate from incoming value prop (JSON of Record<string, number | "">)
  useEffect(() => {
    try {
      // Build a fresh map for current varKeys
      const next: Record<string, string> = {};
      const parsedValues = parseSimpleFormulaResponse(value ?? "");

      varKeys.forEach((k) => {
        const raw = parsedValues[k];
        next[k] = raw === "" || raw === undefined ? "" : String(raw);
      });
      setVarInputs(next);
    } catch (e) {
      console.error("[SimpleEvaluate] Failed to hydrate from value:", e);
      // If value is invalid, ensure inputs exist for keys
      const fallback: Record<string, string> = {};
      varKeys.forEach((k) => (fallback[k] = ""));
      setVarInputs(fallback);
    }
  }, [value, varKeys]);

  // Convert varInputs + constants -> VarMap for evaluation hook
  const evalVars = useMemo<VarMap>(() => {
    const map: VarMap = {};
    // include constants
    Object.entries(constants).forEach(([k, v]) => {
      map[k] = Number(v);
    });
    // include editable variables
    varKeys.forEach((k) => {
      const v = varInputs[k];
      map[k] = v === "" ? "" : Number(v);
    });
    return map;
  }, [constants, varInputs, varKeys]);

  // Result and formatted display (percent/decimals from option)
  const { displayResult } = useExpressionEvaluation(
    expression,
    evalVars,
    false, // not using labels for evaluation
    percent,
    decimalPlaces,
  );

  // Substituted expression preview (constants + inputs)
  const substitutedExpression = useMemo(() => {
    try {
      return substituteFormulaValues(expression, varInputs, constants);
    } catch (error) {
      console.error("[SimpleEvaluate] Error substituting expression:", error);
      return expression;
    }
  }, [expression, varInputs, constants]);

  // Input change handler (numeric-like or empty)
  const handleVarChange = (key: string, val: string) => {
    if (!(val === "" || /^-?\d*\.?\d*$/.test(val))) return;

    setVarInputs((prev) => {
      const next = { ...prev, [key]: val };
      // Emit controlled JSON if parent wants it
      if (onChange) {
        const out: VarMap = {};
        // include constants in the outbound map? Keep only editable inputs to mirror prior contract.
        varKeys.forEach((k) => {
          const raw = next[k];
          out[k] = raw === "" ? "" : Number(raw);
        });
        onChange(JSON.stringify(out));
      }
      return next;
    });
  };

  // UI rendering
  if (!parsed || !expression) {
    return (
      <div className="bg-muted border border-border text-warning rounded-md p-3 text-sm">
        Unable to load evaluation. Invalid or empty option payload.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {testMode ? (
        <div>
          <Button variant="outline" className="gap-1" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      ) : null}
      <VariablesPanel
        labels={labels}
        onVarChange={handleVarChange}
        varInputs={varInputs}
        varKeys={varKeys}
      />

      <PreviewPanel
        displayResult={displayResult}
        percent={!!percent}
        substitutedExpression={substitutedExpression}
      />
    </div>
  );
};
