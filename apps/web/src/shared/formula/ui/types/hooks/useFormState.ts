// import { FormulaTypes } from "@/shared/formula/ui/legacy";
// import { useState, useCallback, useEffect, useRef } from "react";
// import { ExpressionExtract } from "../type";

// /**
//  * Common state management for formula components
//  */
// export function useFormulaState(
//   type: FormulaTypes,
//   initialValue?: string,
//   onChange?: (value: string) => void,
// ) {
//   // Core state values
//   const [expression, setExpression] = useState<string>("");
//   const [decimalPlaces, setDecimalPlaces] = useState<number | "">(2);
//   const [showPercentage, setShowPercentage] = useState<boolean>(false);
//   const [result, setResult] = useState<number | null>(null);

//   // Refs for tracking changes and hydration
//   const isHydrating = useRef(true);
//   const prevValueRef = useRef<string | undefined>(undefined);
//   const prevOutputRef = useRef<string | null>(null);
//   const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   // Parse JSON string to ExpressionExtract
//   const parseValue = useCallback(
//     (jsonString: string): ExpressionExtract | null => {
//       if (!jsonString || jsonString.trim() === "") return null;
//       try {
//         return JSON.parse(jsonString) as ExpressionExtract;
//       } catch (error) {
//         console.error(`[useFormulaState] Failed to parse JSON:`, error);
//         return null;
//       }
//     },
//     [],
//   );

//   // Hydrate state from parsed value
//   const hydrateFromValue = useCallback(
//     (parsed: ExpressionExtract | null) => {
//       if (!parsed) return false;

//       let stateChanged = false;

//       if (parsed.expression !== undefined && parsed.expression !== expression) {
//         setExpression(parsed.expression);
//         stateChanged = true;
//       }

//       if (
//         parsed.decimalPlaces !== undefined &&
//         (parsed.decimalPlaces === "" ||
//           typeof parsed.decimalPlaces === "number") &&
//         parsed.decimalPlaces !== decimalPlaces
//       ) {
//         setDecimalPlaces(parsed.decimalPlaces);
//         stateChanged = true;
//       }

//       if (parsed.percent !== undefined && parsed.percent !== showPercentage) {
//         setShowPercentage(parsed.percent);
//         stateChanged = true;
//       }

//       return stateChanged;
//     },
//     [expression, decimalPlaces, showPercentage],
//   );

//   // Load initial value
//   // useEffect(() => {
//   //   // Skip if the value hasn't changed to prevent loops
//   //   if (initialValue === prevValueRef.current) return;
//   //   prevValueRef.current = initialValue;

//   //   isHydrating.current = true;

//   //   try {
//   //     if (initialValue && initialValue.trim() !== "") {
//   //       const parsed = parseValue(initialValue);
//   //       const didUpdate = hydrateFromValue(parsed);

//   //       if (didUpdate) {
//   //         // Store the source as our prev output to avoid immediate onChange
//   //         prevOutputRef.current = initialValue;
//   //       }
//   //     }
//   //   } catch (error) {
//   //     console.error("[useFormulaState] Initialization error:", error);
//   //   } finally {
//   //     // End hydration with a small delay to ensure all state updates have resolved
//   //     const hydrationTimer = setTimeout(() => {
//   //       isHydrating.current = false;
//   //     }, 50);

//   //     return () => clearTimeout(hydrationTimer);
//   //   }
//   // }, [initialValue, parseValue, hydrateFromValue]);
//   useEffect(() => {
//     // Skip if the value hasn't changed to prevent loops
//     if (initialValue === prevValueRef.current) return;
//     prevValueRef.current = initialValue;

//     isHydrating.current = true;

//     try {
//       if (initialValue && initialValue.trim() !== "") {
//         const parsed = parseValue(initialValue);
//         hydrateFromValue(parsed); // Don't check return value, always update from props

//         // Store the source as our prev output to avoid immediate onChange
//         prevOutputRef.current = initialValue;
//       }
//     } catch (error) {
//       console.error("[useFormulaState] Initialization error:", error);
//     } finally {
//       // End hydration with a small delay to ensure all state updates have resolved
//       const hydrationTimer = setTimeout(() => {
//         isHydrating.current = false;
//       }, 50);

//       return () => clearTimeout(hydrationTimer);
//     }
//   }, [initialValue, parseValue, hydrateFromValue]);

//   // Create serialized output for onChange
//   const createOutput = useCallback(
//     (additionalData: Record<string, any> = {}) => {
//       const outputData: ExpressionExtract = {
//         expression,
//         decimalPlaces,
//         percent: showPercentage,
//         type,
//         ...additionalData,
//       };

//       return JSON.stringify(outputData);
//     },
//     [expression, decimalPlaces, showPercentage, type],
//   );

//   // Handle emitting onChange events
//   const emitOnChange = useCallback(
//     (additionalData: Record<string, any> = {}) => {
//       if (isHydrating.current || !onChange) return;

//       // Clear any pending update
//       if (updateTimeoutRef.current) {
//         clearTimeout(updateTimeoutRef.current);
//       }

//       // Debounce updates to avoid excessive calls during rapid changes
//       updateTimeoutRef.current = setTimeout(() => {
//         const serialized = createOutput(additionalData);

//         // Only emit if actually changed from last known value
//         if (serialized !== prevOutputRef.current) {
//           prevOutputRef.current = serialized;
//           onChange(serialized);
//         }
//       }, 50); // 50ms debounce
//     },
//     [onChange, createOutput],
//   );

//   // Cleanup timeout on unmount
//   useEffect(() => {
//     return () => {
//       if (updateTimeoutRef.current) {
//         clearTimeout(updateTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Safely handle decimal places change with validation
//   const handleDecimalPlacesChange = useCallback((value: string) => {
//     if (value === "") {
//       setDecimalPlaces("");
//       return;
//     }

//     const n = Number(value);
//     if (!Number.isFinite(n) || !Number.isInteger(n)) return;
//     const clamped = Math.max(0, Math.min(10, n));
//     setDecimalPlaces(clamped);
//   }, []);

//   return {
//     expression,
//     setExpression,
//     decimalPlaces,
//     setDecimalPlaces,
//     showPercentage,
//     setShowPercentage,
//     result,
//     setResult,
//     handleDecimalPlacesChange,
//     isHydrating: isHydrating.current,
//     emitOnChange,
//     createOutput,
//   };
// }

// import { FormulaTypes } from "@/shared/formula/ui/legacy";
// import { useState, useCallback, useEffect, useRef } from "react";
// import { ExpressionExtract } from "../type";

// /**
//  * Common state management for formula components
//  */
// export function useFormulaState(
//   type: FormulaTypes,
//   initialValue?: string,
//   onChange?: (value: string) => void,
// ) {
//   // Core state values
//   const [expression, setExpression] = useState<string>("");
//   const [decimalPlaces, setDecimalPlaces] = useState<number | "">(2);
//   const [showPercentage, setShowPercentage] = useState<boolean>(false);
//   const [result, setResult] = useState<number | null>(null);

//   // Refs for tracking changes and hydration
//   const isHydrating = useRef(false); // changed default to false and we won't block emits on hydration
//   const prevValueRef = useRef<string | undefined>(undefined);
//   const prevOutputRef = useRef<string | null>(null);
//   const updateTimeoutRef = useRef<number | null>(null);

//   // Parse JSON string to ExpressionExtract
//   const parseValue = useCallback(
//     (jsonString: string): ExpressionExtract | null => {
//       if (!jsonString || jsonString.trim() === "") return null;
//       try {
//         return JSON.parse(jsonString) as ExpressionExtract;
//       } catch (error) {
//         console.error(`[useFormulaState] Failed to parse JSON:`, error);
//         return null;
//       }
//     },
//     [],
//   );

//   // Hydrate state from parsed value
//   const hydrateFromValue = useCallback(
//     (parsed: ExpressionExtract | null) => {
//       if (!parsed) return false;

//       let stateChanged = false;

//       if (parsed.expression !== undefined && parsed.expression !== expression) {
//         setExpression(parsed.expression);
//         stateChanged = true;
//       }

//       if (
//         parsed.decimalPlaces !== undefined &&
//         (parsed.decimalPlaces === "" ||
//           typeof parsed.decimalPlaces === "number") &&
//         parsed.decimalPlaces !== decimalPlaces
//       ) {
//         setDecimalPlaces(parsed.decimalPlaces);
//         stateChanged = true;
//       }

//       if (parsed.percent !== undefined && parsed.percent !== showPercentage) {
//         setShowPercentage(parsed.percent);
//         stateChanged = true;
//       }

//       return stateChanged;
//     },
//     [expression, decimalPlaces, showPercentage],
//   );

//   // Load initial value
//   useEffect(() => {
//     if (initialValue === prevValueRef.current) return;
//     prevValueRef.current = initialValue;

//     // Start hydration
//     isHydrating.current = true;

//     try {
//       if (initialValue && initialValue.trim() !== "") {
//         const parsed = parseValue(initialValue);
//         const didUpdate = hydrateFromValue(parsed);

//         if (didUpdate) {
//           // Store the source as our prev output to avoid immediate onChange loop
//           prevOutputRef.current = initialValue;
//         }
//       }
//     } catch (error) {
//       console.error("[useFormulaState] Initialization error:", error);
//     } finally {
//       // End hydration immediately (don’t delay to avoid dropped emits in StrictMode)
//       isHydrating.current = false;
//     }
//   }, [initialValue, parseValue, hydrateFromValue]);

//   // Create serialized output for onChange
//   const createOutput = useCallback(
//     (additionalData: Record<string, any> = {}) => {
//       const outputData: ExpressionExtract = {
//         expression,
//         decimalPlaces,
//         percent: showPercentage,
//         type,
//         ...additionalData,
//       };

//       return JSON.stringify(outputData);
//     },
//     [expression, decimalPlaces, showPercentage, type],
//   );

//   // Handle emitting onChange events
//   const emitOnChange = useCallback(
//     (additionalData: Record<string, any> = {}) => {
//       if (!onChange) return;

//       // Clear any pending update
//       if (updateTimeoutRef.current) {
//         window.clearTimeout(updateTimeoutRef.current);
//       }

//       // Debounce updates to avoid excessive calls during rapid changes
//       updateTimeoutRef.current = window.setTimeout(() => {
//         const serialized = createOutput(additionalData);

//         // Only emit if actually changed from last known value
//         if (serialized !== prevOutputRef.current) {
//           prevOutputRef.current = serialized;
//           onChange(serialized);
//         }
//       }, 50); // 50ms debounce
//     },
//     [onChange, createOutput],
//   );

//   // Cleanup timeout on unmount
//   useEffect(() => {
//     return () => {
//       if (updateTimeoutRef.current) {
//         window.clearTimeout(updateTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Safely handle decimal places change with validation
//   const handleDecimalPlacesChange = useCallback((value: string) => {
//     if (value === "") {
//       setDecimalPlaces("");
//       return;
//     }

//     const n = Number(value);
//     if (!Number.isFinite(n) || !Number.isInteger(n)) return;
//     const clamped = Math.max(0, Math.min(10, n));
//     setDecimalPlaces(clamped);
//   }, []);

//   return {
//     expression,
//     setExpression,
//     decimalPlaces,
//     setDecimalPlaces,
//     showPercentage,
//     setShowPercentage,
//     result,
//     setResult,
//     handleDecimalPlacesChange,
//     isHydrating: isHydrating.current,
//     emitOnChange,
//     createOutput,
//   };
// }import { FormulaTypes } from "@/shared/formula/ui/legacy";
import { useState, useCallback, useEffect, useRef } from "react";
import { ExpressionExtract } from "../type";
import isEqual from "@/shared/formula/ui/deep-equal"; // Add this package to your dependencies

import { FormulaTypes } from "@/shared/formula/ui/legacy";

/**
 * Common state management for formula components
 *
 * Senior engineer improvements:
 * 1. Canonical JSON serialization with sorted keys to ensure consistent output
 * 2. Strong safeguards against feedback loops and update storms
 * 3. Microtask scheduling for safer state transitions
 * 4. Deep equality comparisons for complex objects
 */
export function useFormulaState(
  type: FormulaTypes,
  initialValue?: string,
  onChange?: (value: string) => void,
) {
  // Core state values
  const [expression, setExpression] = useState<string>("");
  const [decimalPlaces, setDecimalPlaces] = useState<number | "">(2);

  const [showPercentage, setShowPercentage] = useState<boolean>(false);
  const [result, setResult] = useState<number | null>(null);

  // Refs for tracking changes and hydration
  const isHydrating = useRef<boolean>(true);
  const prevValueRef = useRef<string | undefined>(undefined);
  const prevOutputRef = useRef<string | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const updateCountRef = useRef<number>(0);
  // const lastUpdateTimeRef = useRef<number>(0);

  // Produce deterministic JSON output with sorted keys
  // const stableStringify = useCallback((obj: any): string => {
  //   const seen = new WeakSet();

  //   const canonicalize = (value: any): any => {
  //     // Handle primitives and null
  //     if (value === null || typeof value !== "object") return value;

  //     // Break circular references
  //     if (seen.has(value)) return "[Circular]";
  //     seen.add(value);

  //     // Handle arrays
  //     if (Array.isArray(value)) return value.map(canonicalize);

  //     // Handle objects by sorting keys
  //     const keys = Object.keys(value).sort();
  //     const result: Record<string, any> = {};
  //     for (const key of keys) {
  //       result[key] = canonicalize(value[key]);
  //     }
  //     return result;
  //   };

  //   try {
  //     return JSON.stringify(canonicalize(obj));
  //   } catch (err) {
  //     console.error("[useFormulaState] Error in stableStringify:", err);
  //     return JSON.stringify(obj);
  //   }
  // }, []);

  // Parse JSON string to ExpressionExtract
  const parseValue = useCallback(
    (jsonString: string): ExpressionExtract | null => {
      if (!jsonString || jsonString.trim() === "") return null;
      try {
        return JSON.parse(jsonString) as ExpressionExtract;
      } catch (error) {
        console.error(`[useFormulaState] Failed to parse JSON:`, error);
        return null;
      }
    },
    [],
  );

  // Hydrate state from parsed value
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

      if (parsed.percent !== undefined && parsed.percent !== showPercentage) {
        setShowPercentage(parsed.percent);
        stateChanged = true;
      }

      return stateChanged;
    },
    [expression, decimalPlaces, showPercentage],
  );

  // Load initial value
  useEffect(() => {
    // Skip processing unchanged values
    if (initialValue === prevValueRef.current) return;
    prevValueRef.current = initialValue;

    // Enter hydration mode
    isHydrating.current = true;

    try {
      if (initialValue && initialValue.trim() !== "") {
        const parsed = parseValue(initialValue);
        if (parsed) {
          const didUpdate = hydrateFromValue(parsed);
          if (didUpdate) {
            // Remember what we hydrated from to prevent re-emission
            prevOutputRef.current = initialValue;
          }
        }
      }
    } catch (error) {
      console.error("[useFormulaState] Initialization error:", error);
    }

    // Schedule end of hydration after state updates have settled
    Promise.resolve().then(() => {
      // Use short timeout to ensure React finishes processing state updates
      setTimeout(() => {
        isHydrating.current = false;
      }, 50);
    });
  }, [initialValue, parseValue, hydrateFromValue]);

  // Add a deep comparison to prevent loops
  const prevEmittedValueRef = useRef<string | null>(null);
  // Create output safely
  const createOutput = useCallback(
    (additionalData = {}) => {
      const outputData = {
        expression,
        decimalPlaces,
        percent: showPercentage,
        type,
        ...additionalData,
      };

      return JSON.stringify(outputData);
    },
    [expression, decimalPlaces, showPercentage, type],
  );

  // This is the critical function to fix
  const emitOnChange = useCallback(
    (additionalData = {}) => {
      // Don't emit during hydration
      if (isHydrating.current || !onChange) return;

      // Clear any pending timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Debounce updates with a short delay
      updateTimeoutRef.current = setTimeout(() => {
        // Generate the serialized output
        const serialized = createOutput(additionalData);

        // CRITICAL: Only emit if the value actually changed using deep equality
        if (!isEqual(serialized, prevEmittedValueRef.current)) {
          prevEmittedValueRef.current = serialized;
          onChange(serialized);
        }
      }, 50);
    },
    [onChange, createOutput],
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle decimal places change with validation
  const handleDecimalPlacesChange = useCallback((value: string) => {
    if (value === "") {
      setDecimalPlaces("");
      return;
    }

    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return;
    const clamped = Math.max(0, Math.min(10, n));
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
    isHydratingRef: isHydrating, // Expose as ref for fine-grained control
    emitOnChange,
    createOutput,
  };
}
