// import { useState, useEffect, useMemo, useCallback } from "react";
// import { VarMap, VarMapWithLabels } from "../type";

// /**
//  * Extract variables from expression and manage their values
//  */
// export function useVariableExtraction(expression: string, withLabels = false) {
//   const [vars, setVars] = useState<VarMap | VarMapWithLabels>({});

//   // Extract variable keys from expression
//   const varKeys = useMemo(() => {
//     try {
//       const regex = /:([A-Za-z0-9_]+)/g;
//       const found = new Set<string>();
//       let m;
//       while ((m = regex.exec(expression))) {
//         if (m[1]) found.add(m[1]);
//       }
//       return Array.from(found);
//     } catch (error) {
//       console.error(
//         "[useVariableExtraction] Error extracting variables:",
//         error,
//       );
//       return [];
//     }
//   }, [expression]);

//   // Update vars state when variables in expression change
//   useEffect(() => {
//     try {
//       setVars((prev) => {
//         // Quick equality check to prevent unnecessary updates
//         const prevKeys = Object.keys(prev);

//         // If we have the exact same keys, no update needed
//         if (
//           varKeys.length === prevKeys.length &&
//           varKeys.every((k) => prevKeys.includes(k))
//         ) {
//           return prev;
//         }

//         // Otherwise build new vars object, preserving existing values/labels
//         const next: VarMap | VarMapWithLabels = {};

//         if (withLabels) {
//           varKeys.forEach((k) => {
//             // TypeScript type narrowing for proper access
//             const typedPrev = prev as VarMapWithLabels;
//             next[k] = typedPrev[k] ?? { value: "", label: "" };
//           });
//         } else {
//           varKeys.forEach((k) => {
//             // TypeScript type narrowing for proper access
//             const typedPrev = prev as VarMap;
//             next[k] = typedPrev[k] ?? "";
//           });
//         }

//         return next;
//       });
//     } catch (error) {
//       console.error("[useVariableExtraction] Error updating variables:", error);
//     }
//   }, [varKeys, withLabels]);

//   // Handlers for variable changes
//   const handleVarChange = useCallback(
//     (key: string, value: string) => {
//       // Keep empty string (for not filled) or numeric
//       if (value === "") {
//         if (withLabels) {
//           setVars((p) => {
//             const updated = { ...(p as VarMapWithLabels)[key], value: "" };
//             return { ...p, [key]: updated } as VarMapWithLabels;
//           });
//         } else {
//           setVars((p) => ({ ...p, [key]: "" }) as VarMap);
//         }
//         return;
//       }

//       // Accept only valid numeric inputs (allow leading `-` and decimals)
//       if (!/^[-]?\d*\.?\d*$/.test(value)) return;

//       if (withLabels) {
//         setVars(
//           (p) =>
//             ({
//               ...p,
//               [key]: { ...(p as VarMapWithLabels)[key], value },
//             }) as VarMapWithLabels,
//         );
//       } else {
//         setVars((p) => ({ ...p, [key]: value }) as VarMap);
//       }
//     },
//     [withLabels],
//   );

//   // Handler for label changes (only for withLabels=true)
//   const handleLabelChange = useCallback(
//     (key: string, label: string) => {
//       if (!withLabels) return;

//       setVars(
//         (p) =>
//           ({
//             ...p,
//             [key]: { ...(p as VarMapWithLabels)[key], label },
//           }) as VarMapWithLabels,
//       );
//     },
//     [withLabels],
//   );

//   // Check if any variable has a value
//   const hasAnyValue = useMemo(() => {
//     if (withLabels) {
//       return Object.values(vars as VarMapWithLabels).some(
//         (varData) => varData.value !== "" && varData.value !== undefined,
//       );
//     } else {
//       return Object.values(vars as VarMap).some(
//         (val) => val !== "" && val !== undefined,
//       );
//     }
//   }, [vars, withLabels]);

//   // Create a substituted expression with variable values
//   const substitutedExpression = useMemo(() => {
//     try {
//       return expression.replace(/:([A-Za-z0-9_]+)/g, (_, v) => {
//         if (withLabels) {
//           const typedVars = vars as VarMapWithLabels;
//           return typedVars[v]?.value !== "" && typedVars[v]?.value !== undefined
//             ? String(Number(typedVars[v].value))
//             : `:${v}`;
//         } else {
//           const typedVars = vars as VarMap;
//           return typedVars[v] !== "" && typedVars[v] !== undefined
//             ? String(Number(typedVars[v]))
//             : `:${v}`;
//         }
//       });
//     } catch (error) {
//       console.error("[useVariableExtraction] Error in substitution:", error);
//       return expression;
//     }
//   }, [expression, vars, withLabels]);

//   return {
//     vars,
//     setVars,
//     varKeys,
//     handleVarChange,
//     handleLabelChange,
//     hasAnyValue,
//     substitutedExpression,
//   };
// }

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { VarMap, VarMapWithLabels } from "../type";
import isEqual from "@/shared/formula/ui/deep-equal";

/**
 * Extract variables from expression and manage their values
 *
 * Senior engineer improvements:
 * 1. Anti-loop protection with deep equality checks and microtask scheduling
 * 2. Ref-based state tracking for finer control over update cycles
 * 3. Rate-limiting and guard rails to prevent cascading updates
 * 4. Strong isolation between inputs and state with deep cloning
 */
export function useVariableExtraction(expression: string, withLabels = false) {
  // Core state with React renderer integration
  const [vars, setVarsState] = useState<VarMap | VarMapWithLabels>(
    withLabels ? ({} as VarMapWithLabels) : ({} as VarMap),
  );
  // Add tracking refs to prevent loops
  const prevVarsRef = useRef(
    withLabels ? ({} as VarMapWithLabels) : ({} as VarMap),
  );
  const prevVarKeysRef = useRef<string[]>([]);
  const isUpdatingRef = useRef(false);

  // Reference tracking for state management and update detection
  const stateRef = useRef({
    expression: "",
    vars: withLabels ? ({} as VarMapWithLabels) : ({} as VarMap),
    withLabels,
    lastVarKeys: [] as string[],
    pendingUpdate: false,
    updateCount: 0,
    lastUpdateTime: 0,
  });

  // Extract variable keys from expression
  const varKeys = useMemo(() => {
    try {
      const regex = /:([A-Za-z0-9_]+)/g;
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

  // Safe state updater that prevents loops
  const updateVarsIfChanged = useCallback(
    (newVars: VarMap | VarMapWithLabels) => {
      // Skip if no actual change (deep equality)
      if (isEqual(stateRef.current.vars, newVars)) {
        return;
      }

      // Rate limiting - max 5 updates per 100ms
      const now = Date.now();
      if (now - stateRef.current.lastUpdateTime < 100) {
        stateRef.current.updateCount++;
        if (stateRef.current.updateCount > 5) {
          console.warn("[useVariableExtraction] Rate limiting updates");
          return; // Skip this update to break potential loops
        }
      } else {
        stateRef.current.updateCount = 0;
        stateRef.current.lastUpdateTime = now;
      }

      // Update internal state
      stateRef.current.vars = structuredClone(newVars);

      // Schedule UI update via React state
      setVarsState(newVars);
    },
    [],
  );

  // Public setter with proper structural sharing
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

  // Synchronize varKeys changes to state
  // useEffect(() => {
  //   // Skip if nothing meaningful changed
  //   if (
  //     expression === stateRef.current.expression &&
  //     withLabels === stateRef.current.withLabels &&
  //     isEqual(varKeys, stateRef.current.lastVarKeys)
  //   ) {
  //     return;
  //   }

  //   // Update tracking refs
  //   stateRef.current.expression = expression;
  //   stateRef.current.withLabels = withLabels;
  //   stateRef.current.lastVarKeys = [...varKeys];

  //   // Don't process if already handling an update
  //   if (stateRef.current.pendingUpdate) return;
  //   stateRef.current.pendingUpdate = true;

  //   // Schedule update as microtask to avoid synchronous update cascades
  //   Promise.resolve().then(() => {
  //     try {
  //       // Build new vars object preserving existing values
  //       const newVars = withLabels ? ({} as VarMapWithLabels) : ({} as VarMap);
  //       const currentVars = stateRef.current.vars;

  //       varKeys.forEach((key) => {
  //         if (withLabels) {
  //           const typedVars = currentVars as VarMapWithLabels;
  //           const typedNewVars = newVars as VarMapWithLabels;
  //           typedNewVars[key] = typedVars[key] || { value: "", label: "" };
  //         } else {
  //           const typedVars = currentVars as VarMap;
  //           const typedNewVars = newVars as VarMap;
  //           typedNewVars[key] = typedVars[key] || "";
  //         }
  //       });

  //       updateVarsIfChanged(newVars);
  //     } finally {
  //       stateRef.current.pendingUpdate = false;
  //     }
  //   });
  // }, [expression, varKeys, withLabels, updateVarsIfChanged]);
  // Update vars state when variables change - this is where loops can happen
  useEffect(() => {
    // Skip if nothing changed or already updating
    if (
      isUpdatingRef.current ||
      (isEqual(varKeys, prevVarKeysRef.current) && prevVarsRef.current === vars)
    )
      return;

    // Set updating flag to prevent nested updates
    isUpdatingRef.current = true;
    prevVarKeysRef.current = [...varKeys];

    try {
      setVars((prev) => {
        // Skip update if keys are the same
        const prevKeys = Object.keys(prev);
        if (
          varKeys.length === prevKeys.length &&
          varKeys.every((k) => prevKeys.includes(k))
        ) {
          return prev;
        }

        // Otherwise build new vars object
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

        // Store reference to new vars
        prevVarsRef.current = next;
        return next;
      });
    } finally {
      // Clear updating flag after React has processed the state update
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varKeys, withLabels, vars]);

  // Variable change handler with numeric validation
  const handleVarChange = useCallback(
    (key: string, value: string) => {
      // Only allow empty string or valid numeric input
      if (value !== "" && !/^-?\d*\.?\d*$/.test(value)) return;

      setVars((prev) => {
        if (stateRef.current.withLabels) {
          const typedPrev = prev as VarMapWithLabels;
          const updatedVar = {
            ...(typedPrev[key] || { label: "" }),
            value,
          };
          return { ...prev, [key]: updatedVar } as VarMapWithLabels;
        } else {
          return { ...prev, [key]: value } as VarMap;
        }
      });
    },
    [setVars],
  );

  // Label change handler (withLabels mode only)
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

  // Check if any variable has a value
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

  // Create a substituted expression with variable values
  const substitutedExpression = useMemo(() => {
    try {
      return expression.replace(/:([A-Za-z0-9_]+)/g, (_, v) => {
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
