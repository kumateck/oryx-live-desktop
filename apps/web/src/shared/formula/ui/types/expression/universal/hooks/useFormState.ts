import { useState, useCallback, useEffect, useRef } from "react";
import { ExpressionExtract } from "../types";
import isEqual from "@/shared/formula/ui/deep-equal";
import { FormulaTypes } from "@/shared/formula/ui/legacy";
import { normalizeExpressionPayload } from "../normalizer";

export function useFormulaState(
  type: FormulaTypes,
  initialValue?: string,
  onChange?: (value: string) => void,
) {
  const [expression, setExpression] = useState<string>("");
  const [decimalPlaces, setDecimalPlaces] = useState<number | "">(2);
  const [showPercentage, setShowPercentage] = useState<boolean>(false);
  const [result, setResult] = useState<number | null>(null);

  const isHydrating = useRef<boolean>(true);
  const prevValueRef = useRef<string | undefined>(undefined);
  const prevEmittedValueRef = useRef<string | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInternalEmissionRef = useRef<boolean>(false);

  const parseValue = useCallback(
    (jsonString: string): ExpressionExtract | null => {
      if (!jsonString || jsonString.trim() === "") return null;
      const trimmedValue = jsonString.trim();
      try {
        return normalizeExpressionPayload(
          JSON.parse(trimmedValue) as ExpressionExtract,
        );
      } catch (error) {
        const looksLikeJson =
          trimmedValue.startsWith("{") || trimmedValue.startsWith("[");
        if (looksLikeJson) {
          console.error(`[useFormulaState] Failed to parse JSON:`, error);
          return null;
        }
        // Backward compatibility: some persisted formula values are raw expression strings.
        return { expression: jsonString };
      }
    },
    [],
  );

  const hydrateFromValue = useCallback(
    (parsed: ExpressionExtract | null) => {
      if (!parsed) return false;
      let stateChanged = false;

      if (parsed.expression !== undefined && parsed.expression !== expression) {
        setExpression(parsed.expression);
        stateChanged = true;
      }
      if (
        parsed.decimalPlaces !== undefined &&
        (parsed.decimalPlaces === "" ||
          typeof parsed.decimalPlaces === "number") &&
        parsed.decimalPlaces !== decimalPlaces
      ) {
        setDecimalPlaces(parsed.decimalPlaces);
        stateChanged = true;
      }

      // Accept either "percent" (legacy) or "percentageResults" (canonical)
      const hasCanonical =
        typeof parsed?.percentageResults === "boolean";
      const nextPercent = hasCanonical
        ? parsed.percentageResults
        : parsed.percent;

      if (typeof nextPercent === "boolean" && nextPercent !== showPercentage) {
        setShowPercentage(nextPercent);
        stateChanged = true;
      }

      return stateChanged;
    },
    [expression, decimalPlaces, showPercentage],
  );

  useEffect(() => {
    // Skip if value hasn't changed
    if (initialValue === prevValueRef.current) return;

    // Skip if this is our own emission (prevent re-hydration loop)
    if (
      isInternalEmissionRef.current &&
      initialValue === prevEmittedValueRef.current
    ) {
      isInternalEmissionRef.current = false;
      prevValueRef.current = initialValue;
      return;
    }

    prevValueRef.current = initialValue;
    isHydrating.current = true;

    try {
      if (initialValue && initialValue.trim() !== "") {
        const parsed = parseValue(initialValue);
        if (parsed) {
          const didUpdate = hydrateFromValue(parsed);
          if (didUpdate) {
            prevEmittedValueRef.current = initialValue;
          }
        }
      }
    } catch (error) {
      console.error("[useFormulaState] Initialization error:", error);
    }
    const hydrationTimer = window.setTimeout(() => {
      Promise.resolve().then(() => {
        isHydrating.current = false;
      });
    }, 50);

    return () => window.clearTimeout(hydrationTimer);
  }, [initialValue, parseValue, hydrateFromValue]);

  const createOutput = useCallback(
    (additionalData = {}) => {
      const outputData = {
        expression,
        decimalPlaces,
        // include both for compatibility; additionalData (if provided) will override
        percent: showPercentage,
        percentageResults: showPercentage,
        type,
        ...additionalData,
      };
      return JSON.stringify(outputData);
    },
    [expression, decimalPlaces, showPercentage, type],
  );

  const emitOnChange = useCallback(
    (additionalData = {}) => {
      if (isHydrating.current || !onChange) return;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        const serialized = createOutput(additionalData);
        // Only emit if the value actually changed
        if (!isEqual(serialized, prevEmittedValueRef.current)) {
          prevEmittedValueRef.current = serialized;
          isInternalEmissionRef.current = true;
          onChange(serialized);
          // Reset flag after a short delay
          setTimeout(() => {
            isInternalEmissionRef.current = false;
          }, 100);
        }
      }, 50);
    },
    [onChange, createOutput],
  );

  useEffect(
    () => () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    },
    [],
  );

  const handleDecimalPlacesChange = useCallback((value: string) => {
    if (value === "") {
      setDecimalPlaces("");
      return;
    }
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return;
    const clamped = Math.max(0, Math.min(12, n)); // widen to 12
    setDecimalPlaces(clamped);
  }, []);

  return {
    expression,
    setExpression,
    decimalPlaces,
    setDecimalPlaces,
    showPercentage,
    setShowPercentage,
    result,
    setResult,
    handleDecimalPlacesChange,
    isHydratingRef: isHydrating,
    emitOnChange,
    createOutput,
  };
}
