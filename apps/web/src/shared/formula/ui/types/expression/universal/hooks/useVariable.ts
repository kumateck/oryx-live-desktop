import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { VarMap, VarMapWithLabels } from "../types";
import isEqual from "@/shared/formula/ui/deep-equal";

/**
 * Extract variables from expression and manage their values.
 * Extended: Works seamlessly with auto variable tokens (they are discovered like normal tokens).
 */
export function useVariableExtraction(expression: string, withLabels = false) {
  const [vars, setVarsState] = useState<VarMap | VarMapWithLabels>(
    withLabels ? ({} as VarMapWithLabels) : ({} as VarMap),
  );
  const prevVarsRef = useRef(
    withLabels ? ({} as VarMapWithLabels) : ({} as VarMap),
  );
  const prevVarKeysRef = useRef<string[]>([]);
  const isUpdatingRef = useRef(false);

  const stateRef = useRef({
    expression: "",
    vars: withLabels ? ({} as VarMapWithLabels) : ({} as VarMap),
    withLabels,
    lastVarKeys: [] as string[],
    pendingUpdate: false,
    updateCount: 0,
    lastUpdateTime: 0,
  });

  const varKeys = useMemo(() => {
    try {
      const regex = /:([A-Za-z0-9_\.]+)/g;
      const found = new Set<string>();
      let m;
      while ((m = regex.exec(expression))) {
        if (m[1]) found.add(m[1]);
      }
      return Array.from(found);
    } catch (error) {
      console.error(
        "[useVariableExtraction] Error extracting variables:",
        error,
      );
      return [];
    }
  }, [expression]);

  const updateVarsIfChanged = useCallback(
    (newVars: VarMap | VarMapWithLabels) => {
      if (isEqual(stateRef.current.vars, newVars)) return;
      const now = Date.now();
      if (now - stateRef.current.lastUpdateTime < 100) {
        stateRef.current.updateCount++;
        if (stateRef.current.updateCount > 5) {
          console.warn("[useVariableExtraction] Rate limiting updates");
          return;
        }
      } else {
        stateRef.current.updateCount = 0;
        stateRef.current.lastUpdateTime = now;
      }
      stateRef.current.vars = structuredClone(newVars);
      setVarsState(newVars);
    },
    [],
  );

  const setVars = useCallback(
    (
      value:
        | VarMap
        | VarMapWithLabels
        | ((prev: VarMap | VarMapWithLabels) => VarMap | VarMapWithLabels),
    ) => {
      if (typeof value === "function") {
        const updater = value as (
          prev: VarMap | VarMapWithLabels,
        ) => VarMap | VarMapWithLabels;
        const newVars = updater(stateRef.current.vars);
        updateVarsIfChanged(newVars);
      } else {
        updateVarsIfChanged(value);
      }
    },
    [updateVarsIfChanged],
  );

  useEffect(() => {
    if (
      isUpdatingRef.current ||
      (isEqual(varKeys, prevVarKeysRef.current) && prevVarsRef.current === vars)
    )
      return;

    isUpdatingRef.current = true;
    prevVarKeysRef.current = [...varKeys];

    try {
      setVars((prev) => {
        const prevKeys = Object.keys(prev);
        if (
          varKeys.length === prevKeys.length &&
          varKeys.every((k) => prevKeys.includes(k))
        ) {
          return prev;
        }
        const next = withLabels ? ({} as VarMapWithLabels) : ({} as VarMap);
        if (withLabels) {
          varKeys.forEach((k) => {
            const typedPrev = prev as VarMapWithLabels;
            next[k] = typedPrev[k] ?? { value: "", label: "" };
          });
        } else {
          varKeys.forEach((k) => {
            const typedPrev = prev as VarMap;
            next[k] = typedPrev[k] ?? "";
          });
        }
        prevVarsRef.current = next;
        return next;
      });
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [varKeys, withLabels, vars, setVars]);

  const handleVarChange = useCallback(
    (key: string, value: string) => {
      // Allow empty, decimals, and scientific notation (still numeric-only here)
      if (value !== "" && !/^-?\d*\.?\d*(e[+-]?\d+)?$/i.test(value)) return;
      setVars((prev) => {
        if (stateRef.current.withLabels) {
          const typedPrev = prev as VarMapWithLabels;
          return {
            ...prev,
            [key]: { ...(typedPrev[key] || { label: "" }), value },
          } as VarMapWithLabels;
        } else {
          return { ...prev, [key]: value } as VarMap;
        }
      });
    },
    [setVars],
  );

  const handleLabelChange = useCallback(
    (key: string, label: string) => {
      if (!stateRef.current.withLabels) return;
      setVars((prev) => {
        const typedPrev = prev as VarMapWithLabels;
        return {
          ...prev,
          [key]: {
            ...(typedPrev[key] || { value: "" }),
            label,
          },
        } as VarMapWithLabels;
      });
    },
    [setVars],
  );

  const hasAnyValue = useMemo(() => {
    if (withLabels) {
      return Object.values(vars as VarMapWithLabels).some(
        (varData) => varData.value !== "" && varData.value !== undefined,
      );
    } else {
      return Object.values(vars as VarMap).some(
        (val) => val !== "" && val !== undefined,
      );
    }
  }, [vars, withLabels]);

  const substitutedExpression = useMemo(() => {
    try {
      return expression.replace(/:([A-Za-z0-9_\.]+)/g, (_, v) => {
        if (withLabels) {
          const typedVars = vars as VarMapWithLabels;
          return typedVars[v]?.value !== "" && typedVars[v]?.value !== undefined
            ? String(Number(typedVars[v].value))
            : `:${v}`;
        } else {
          const typedVars = vars as VarMap;
          return typedVars[v] !== "" && typedVars[v] !== undefined
            ? String(Number(typedVars[v]))
            : `:${v}`;
        }
      });
    } catch (error) {
      console.error("[useVariableExtraction] Error in substitution:", error);
      return expression;
    }
  }, [expression, vars, withLabels]);

  return {
    vars,
    setVars,
    varKeys,
    handleVarChange,
    handleLabelChange,
    hasAnyValue,
    substitutedExpression,
  };
}
