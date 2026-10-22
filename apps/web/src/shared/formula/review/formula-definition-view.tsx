import { useMemo } from "react";
import { FormulaRoundingKind } from "../core/contracts";
import { formulaDefinitionV1Schema } from "../core/decode";
import { ExpressionView } from "../ui/math/expression-view";

const unitText = (unit: string | null | undefined) => unit ? ` · ${unit}` : "";

/** The formula a revision governs: its results, intermediate expressions and inputs, and the exact stored definition. */
export function FormulaDefinitionView({ definition }: { definition: unknown }) {
  const decoded = useMemo(() => formulaDefinitionV1Schema.safeParse(definition), [definition]);
  const evidence = <details className="rounded-md border bg-muted/30 p-3">
    <summary className="cursor-pointer text-sm font-medium">Exact stored definition (JSON)</summary>
    <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(definition ?? null, null, 2)}</pre>
  </details>;
  if (!decoded.success) return <section aria-label="Formula definition" className="space-y-3">
    <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">This revision's definition could not be read, so it cannot be shown as a formula. Check the stored definition below.</p>
    {evidence}</section>;
  const { results, derivedExpressions = [], variables, precisionPolicy } = decoded.data;
  return <section aria-label="Formula definition" className="space-y-4">
    <div className="space-y-3"><h2 className="font-semibold">Formula under review</h2>
      {results.map((result) => <div key={result.key} className="rounded-md border bg-background p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{result.label || result.key}</p>
          <p className="font-mono text-xs text-muted-foreground">Result key: {result.key}</p></div>
          <span className="text-xs text-muted-foreground">{result.rounding.digits} {result.rounding.kind === FormulaRoundingKind.SignificantFigures ? "significant figures" : "decimal places"}{unitText(result.unit)}</span></div>
        <div className="overflow-x-auto rounded bg-muted/50 px-3 py-4"><ExpressionView expression={result.expression} /></div>
        <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{result.expression}</p>
      </div>)}</div>
    {derivedExpressions.length ? <div className="space-y-2"><h3 className="font-semibold">Intermediate expressions</h3>
      <div className="grid gap-2 md:grid-cols-2">{derivedExpressions.map((item) => <div key={item.key} className="rounded-md border bg-background p-3">
        <p className="font-medium">{item.label || item.key}</p><p className="mb-2 font-mono text-xs text-muted-foreground">{item.key}{unitText(item.unit)}</p>
        <div className="overflow-x-auto rounded bg-muted/50 px-2 py-3"><ExpressionView expression={item.expression} inline /></div></div>)}</div></div> : null}
    <div className="space-y-2"><h3 className="font-semibold">Inputs</h3>
      <div className="grid gap-2 md:grid-cols-2">{variables.map((variable) => <div key={variable.key} className="rounded-md border bg-background p-3 text-sm">
        <div className="flex items-center justify-between gap-2"><span>{variable.label || variable.key}</span><span className="font-mono text-xs text-muted-foreground">{variable.key}</span></div>
        <p className="text-xs text-muted-foreground">{variable.required ? "Required" : "Optional"}{unitText(variable.unit)}</p></div>)}</div>
      {precisionPolicy ? <p className="text-xs text-muted-foreground">Inputs are taken to {precisionPolicy.inputDecimalPlaces} decimal places; table calculations to {precisionPolicy.tableCalculationDecimalPlaces}.</p> : null}</div>
    {evidence}
  </section>;
}
