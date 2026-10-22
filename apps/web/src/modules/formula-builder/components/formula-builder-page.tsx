import { useState } from "react";
import { Delete, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculate, canAddOperator, canClose, expectsValue, functionLabels, functions, keyProblem, operatorLabels, operators, preview, source, type Operand, type Token,
} from "../lib/expression";

const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 10 });

/** A calculation scratchpad: build an expression from named values, then try values in it. Nothing is saved. */
export function FormulaBuilderPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [operands, setOperands] = useState<Operand[]>([]);
  const [draft, setDraft] = useState({ key: "", label: "", value: "" });
  const [message, setMessage] = useState("");
  const push = (token: Token) => { setTokens((t) => [...t, token]); setMessage(""); };
  const addOperand = () => {
    const key = draft.key.trim();
    const existing = operands.find((o) => o.key === key);
    const problem = keyProblem(key);
    if (problem) { setMessage(problem); return; }
    if (!existing && (!draft.label.trim() || !draft.value.trim() || !Number.isFinite(Number(draft.value)))) { setMessage("Give the value a label and a number."); return; }
    if (!expectsValue(tokens)) { setMessage("Add an operator before the next value."); return; }
    if (!existing) setOperands((all) => [...all, { key, label: draft.label.trim(), value: draft.value.trim() }]);
    push({ kind: "operand", key });
    setDraft({ key: "", label: "", value: "" });
  };
  const undo = () => {
    const removed = tokens[tokens.length - 1];
    const rest = tokens.slice(0, -1);
    setTokens(rest);
    // A value no longer used in the expression is dropped with it.
    if (removed?.kind === "operand" && !rest.some((t) => t.kind === "operand" && t.key === removed.key)) setOperands((all) => all.filter((o) => o.key !== removed.key));
    setMessage("");
  };
  const reset = () => { setTokens([]); setOperands([]); setDraft({ key: "", label: "", value: "" }); setMessage(""); };
  const outcome = calculate(tokens, operands);
  const valueNext = expectsValue(tokens);
  return <section className="mx-auto w-full max-w-3xl space-y-4">
    <header><p className="eyebrow">R&amp;D</p><h1 className="text-xl font-semibold">Formula builder</h1>
      <p className="text-sm text-muted-foreground">Build a calculation from named values and try different numbers in it. Nothing here is saved.</p></header>

    <section aria-label="Build" className="space-y-3 rounded-lg border bg-card p-4">
      <form noValidate className="grid gap-2 sm:grid-cols-[8rem_1fr_8rem_auto] sm:items-end" onSubmit={(event) => { event.preventDefault(); addOperand(); }}>
        <div className="space-y-1.5"><Label htmlFor="fb-key">Key</Label><Input id="fb-key" placeholder="a" value={draft.key} onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))} /></div>
        <div className="space-y-1.5"><Label htmlFor="fb-label">Label</Label><Input id="fb-label" placeholder="Concentration" value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} /></div>
        <div className="space-y-1.5"><Label htmlFor="fb-value">Value</Label><Input id="fb-value" inputMode="decimal" placeholder="5" value={draft.value} onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))} /></div>
        <Button type="submit" disabled={!valueNext}><Plus />Add value</Button>
      </form>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Operators">
        {operators.map((symbol) => <Button key={symbol} type="button" size="sm" variant="outline" aria-label={operatorLabels[symbol]} title={operatorLabels[symbol]} disabled={!canAddOperator(tokens)}
          onClick={() => push({ kind: "operator", symbol })}>{symbol}</Button>)}
        {functions.map((name) => <Button key={name} type="button" size="sm" variant="outline" title={functionLabels[name]} disabled={!valueNext} onClick={() => push({ kind: "function", name })}>{name}(</Button>)}
        <Button type="button" size="sm" variant="outline" aria-label="Open bracket" disabled={!valueNext} onClick={() => push({ kind: "open" })}>(</Button>
        <Button type="button" size="sm" variant="outline" aria-label="Close bracket" disabled={!canClose(tokens)} onClick={() => push({ kind: "close" })}>)</Button>
        <Button type="button" size="sm" variant="ghost" disabled={!tokens.length} onClick={undo}><Delete />Undo</Button>
        <Button type="button" size="sm" variant="ghost" disabled={!tokens.length && !operands.length} onClick={reset}><RotateCcw />Reset</Button>
      </div>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <p className="text-xs text-muted-foreground">^ raises to a power, % gives the remainder, and log is the natural logarithm.</p>
    </section>

    <section aria-label="Expression" className="space-y-2 rounded-lg border bg-card p-4 text-sm">
      <div><span className="text-muted-foreground">Expression: </span><code aria-label="Expression source">{source(tokens) || "–"}</code></div>
      <div><span className="text-muted-foreground">With values: </span><code aria-label="Expression preview">{preview(tokens, operands) || "–"}</code></div>
      <div aria-live="polite" className="text-base">
        {outcome.state === "result" ? <><span className="text-muted-foreground">Result: </span><output aria-label="Result" className="font-semibold">{format(outcome.value)}</output></>
          : outcome.state === "empty" ? <span className="text-muted-foreground">Add a value to start.</span>
          : <span className={outcome.state === "invalid" ? "text-destructive" : "text-muted-foreground"}>{outcome.reason}</span>}
      </div>
    </section>

    {operands.length ? <section aria-label="Values" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">Values</h2>
      {operands.map((o) => <div key={o.key} className="flex items-center gap-2 text-sm"><Label htmlFor={`fb-v-${o.key}`} className="min-w-0 flex-1">{o.label} <span className="text-muted-foreground">({o.key})</span></Label>
        <Input id={`fb-v-${o.key}`} inputMode="decimal" className="w-40" value={o.value} onChange={(e) => setOperands((all) => all.map((x) => x.key === o.key ? { ...x, value: e.target.value } : x))} /></div>)}
    </section> : null}
  </section>;
}
