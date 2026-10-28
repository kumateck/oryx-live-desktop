import { evaluateExpression } from "@/shared/formula/ui/types/expression/universal/engine/expressionEngine";

/** One piece of the expression being built. Values live with the operand, not in the token. */
export type Token =
  | { kind: "operand"; key: string }
  | { kind: "operator"; symbol: Operator }
  | { kind: "function"; name: FunctionName }
  | { kind: "open" }
  | { kind: "close" };
export interface Operand { key: string; label: string; value: string }

export const operators = ["+", "-", "*", "/", "%", "^"] as const;
export type Operator = (typeof operators)[number];
export const operatorLabels: Record<Operator, string> = { "+": "Add", "-": "Subtract", "*": "Multiply", "/": "Divide", "%": "Remainder", "^": "Power" };
export const functions = ["sqrt", "abs", "log", "exp"] as const;
export type FunctionName = (typeof functions)[number];
export const functionLabels: Record<FunctionName, string> = { sqrt: "Square root", abs: "Absolute value", log: "Natural logarithm", exp: "e to the power" };

// Names the evaluator already gives a meaning to.
const reserved = new Set<string>([...functions, "e", "E", "pi", "PI", "i", "tau", "phi", "Infinity", "NaN", "true", "false", "null", "mod", "to", "in", "not", "and", "or", "xor"]);

/** Why a key cannot name an operand, or null when it can. */
export function keyProblem(key: string): string | null {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return "A key starts with a letter and has only letters, digits and underscores.";
  if (reserved.has(key)) return `"${key}" already means something in a formula; choose another key.`;
  return null;
}

const last = (tokens: readonly Token[]) => tokens[tokens.length - 1];
/** True when the next token may be a value: an operand, a function or an opening bracket. */
export const expectsValue = (tokens: readonly Token[]) => { const t = last(tokens); return !t || t.kind === "operator" || t.kind === "open" || t.kind === "function"; };
const openCount = (tokens: readonly Token[]) => tokens.reduce((n, t) => n + (t.kind === "open" || t.kind === "function" ? 1 : t.kind === "close" ? -1 : 0), 0);

export const canAddOperator = (tokens: readonly Token[]) => !expectsValue(tokens);
export const canClose = (tokens: readonly Token[]) => !expectsValue(tokens) && openCount(tokens) > 0;

/** The expression as typed, with operand keys. */
export function source(tokens: readonly Token[]): string {
  return tokens.map((t) => t.kind === "operand" ? t.key : t.kind === "operator" ? ` ${t.symbol} ` : t.kind === "function" ? `${t.name}(` : t.kind === "open" ? "(" : ")").join("");
}

/** The expression with each operand's value in place of its key. */
export function preview(tokens: readonly Token[], operands: readonly Operand[]): string {
  const values = new Map(operands.map((o) => [o.key, o.value.trim()]));
  return tokens.map((t) => t.kind === "operand" ? (values.get(t.key) || "?") : source([t])).join("");
}

export type Outcome = { state: "empty" } | { state: "incomplete"; reason: string } | { state: "invalid"; reason: string } | { state: "result"; value: number };

/** Evaluates the finished expression safely; never runs it as code. */
export function calculate(tokens: readonly Token[], operands: readonly Operand[]): Outcome {
  if (!tokens.length) return { state: "empty" };
  if (expectsValue(tokens)) return { state: "incomplete", reason: "The expression ends with an operator or an open bracket." };
  if (openCount(tokens) > 0) return { state: "incomplete", reason: "Close every bracket." };
  const context: Record<string, number> = {};
  for (const operand of operands) {
    const value = Number(operand.value);
    if (!operand.value.trim() || !Number.isFinite(value)) return { state: "incomplete", reason: `Enter a number for ${operand.label || operand.key}.` };
    context[operand.key] = value;
  }
  const value = evaluateExpression(source(tokens), context);
  return value === null ? { state: "invalid", reason: "The expression has no numeric result (for example, it divides by zero or takes the square root of a negative number)." } : { state: "result", value };
}
