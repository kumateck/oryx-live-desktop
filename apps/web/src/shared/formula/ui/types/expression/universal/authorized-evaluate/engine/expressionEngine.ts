// Safe expression evaluation engine using mathjs.
// NEVER use eval() or new Function() here.
import { evaluate as mathjsEvaluate } from "mathjs";

/**
 * Safely evaluate a mathematical expression with a variable context.
 * Returns null on any error (invalid expression, undefined variable, division by zero, etc.)
 */
export function evaluateExpression(
  expression: string,
  context: Record<string, number>,
): number | null {
  if (!expression || !expression.trim()) return null;
  try {
    // Pass context directly — mathjs does not mutate the scope object.
    // mathjs handles ^ (exponentiation), sqrt(), and other math functions natively.
    const result = mathjsEvaluate(expression, context);
    if (typeof result === "number" && Number.isFinite(result)) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}
