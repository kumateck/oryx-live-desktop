import { memo, useMemo, type ReactNode } from "react";
import { create, parseDependencies, type MathNode } from "mathjs";
import { cn } from "cn";

// Typeset formula rendering without MathJax: Oryx Next loaded MathJax from a CDN, which the desktop's content policy
// does not allow. The expression is parsed with mathjs (the same parser the evaluator uses) and drawn as nested spans:
// stacked fractions, radicals, superscripts, subscripted variable numbers and the multiplication sign.

// Only the parser is needed to draw a formula; the full library stays with the evaluators.
const parse = parseDependencies ? create({ parseDependencies }).parse : null;

export interface ExpressionViewProps {
  expression: string; className?: string | undefined; print?: boolean | undefined;
  /** Accepted for compatibility with the ported callers; the renderer always falls back to the raw text. */
  fallbackToText?: boolean | undefined; inline?: boolean | undefined;
  option?: { append100?: boolean | undefined; result?: number | string | null | undefined } | undefined;
}

const greek: Record<string, string> = { alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", theta: "θ", lambda: "λ", mu: "μ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", phi: "φ", omega: "ω", Delta: "Δ", Sigma: "Σ", Omega: "Ω" };
const symbols: Record<string, string> = { add: "+", subtract: "−", multiply: "×", divide: "÷", mod: "mod", unaryMinus: "−", unaryPlus: "+", larger: ">", smaller: "<", largerEq: "≥", smallerEq: "≤", equal: "=", unequal: "≠" };

/** ":wt1" and "Weight2" as written by the formula builders, shown as a name with its number subscripted. */
function normalize(raw: string): string {
  let pipes = false;
  return raw.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/√/g, "sqrt")
    .replace(/:([A-Za-z_][A-Za-z0-9_.]*)/g, (_match, name: string) => name.replace(/\./g, "_"))
    .split("").map((character) => { if (character !== "|") return character; pipes = !pipes; return pipes ? "abs(" : ")"; }).join("") + (pipes ? ")" : "");
}
function variable(name: string): ReactNode {
  const match = /^([A-Za-z]+?)_?(\d+)$/.exec(name);
  const base = match?.[1] ?? name;
  const shown = greek[base] ?? base.replace(/_/g, " ");
  return <span className="italic">{shown}{match?.[2] ? <sub>{match[2]}</sub> : null}</span>;
}
const isNode = (value: object): value is MathNode => "type" in value;

function render(node: MathNode, key: string): ReactNode {
  switch (node.type) {
    case "ConstantNode": return <span key={key}>{String((node as unknown as { value: unknown }).value)}</span>;
    case "SymbolNode": return <span key={key}>{variable((node as unknown as { name: string }).name)}</span>;
    case "ParenthesisNode": return <span key={key} className="inline-flex items-center"><span className="text-[1.15em]">(</span>{render((node as unknown as { content: MathNode }).content, `${key}c`)}<span className="text-[1.15em]">)</span></span>;
    case "OperatorNode": {
      const operator = node as unknown as { fn: string; args: MathNode[] };
      const [left, right] = operator.args;
      if (operator.fn === "divide" && left && right) return <span key={key} className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.92em] leading-tight">
        <span className="px-1">{render(left, `${key}n`)}</span><span className="w-full border-t border-current" /><span className="px-1">{render(right, `${key}d`)}</span></span>;
      if (operator.fn === "pow" && left && right) return <span key={key}>{render(left, `${key}b`)}<sup>{render(right, `${key}e`)}</sup></span>;
      if (operator.args.length === 1 && left) return <span key={key}>{symbols[operator.fn] ?? operator.fn}{render(left, `${key}u`)}</span>;
      return <span key={key}>{operator.args.map((arg, index) => <span key={index}>{index > 0 ? <span className="mx-1">{symbols[operator.fn] ?? operator.fn}</span> : null}{render(arg, `${key}${index}`)}</span>)}</span>;
    }
    case "FunctionNode": {
      const call = node as unknown as { fn: { name?: string }; args: MathNode[] };
      const name = call.fn.name ?? "f";
      const [first] = call.args;
      if (name === "sqrt" && first) return <span key={key} className="inline-flex items-start"><span>√</span><span className="border-t border-current px-0.5">{render(first, `${key}r`)}</span></span>;
      if (name === "abs" && first) return <span key={key}>|{render(first, `${key}a`)}|</span>;
      return <span key={key}><span className="not-italic">{name}</span>({call.args.map((arg, index) => <span key={index}>{index > 0 ? ", " : null}{render(arg, `${key}${index}`)}</span>)})</span>;
    }
    default: {
      const children: MathNode[] = [];
      node.forEach((child) => { if (isNode(child)) children.push(child); });
      return children.length ? <span key={key}>{children.map((child, index) => render(child, `${key}${index}`))}</span> : <span key={key}>{node.toString()}</span>;
    }
  }
}

/** A formula as it is written on a worksheet, with "= result" when a result is given. Falls back to the raw text when it does not parse. */
export const ExpressionView = memo(function ExpressionView({ expression, className, print = false, option }: ExpressionViewProps) {
  const tree = useMemo(() => { try { if (!parse) return null; const source = normalize(expression); return parse(option?.append100 ? `(${source}) * 100` : source); } catch { return null; } }, [expression, option?.append100]);
  const result = option?.result;
  return <div className={cn("flex flex-wrap items-center justify-center gap-1 p-3 text-lg", print && "p-1 text-sm", className)} aria-label={`Formula: ${expression}`}>
    {tree ? render(tree, "root") : <span className="font-mono text-sm">{expression}</span>}
    <span className="mx-1">=</span>{result !== null && result !== undefined ? <span className="font-semibold">{String(result)}</span> : null}
  </div>;
});
export default ExpressionView;
