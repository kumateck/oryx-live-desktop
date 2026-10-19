import { lazy, Suspense, useMemo } from "react";
import { FormulaType } from "@/shared/questions/question-types";
import type { TheAduseiEvaluateProps } from "../type";
import { evaluationSettings } from "./settings";

// Import the evaluator directly: opening an answer must not also load the formula builders.
const Simple = lazy(() => import("../expression/simple/evaluate").then((module) => ({ default: module.SimpleEvaluate })));
const Uniformity = lazy(() => import("../expression/uniformity/evaluate").then((module) => ({ default: module.UniformityOfWeightEvaluate })));
const Universal = lazy(() => import("../expression/universal/authorized-evaluate/evaluate").then((module) => ({ default: module.AuthorizedUniversalEvaluate })));

export function TheAduseiEvaluation({ option, showMetaPanels = true, ...props }: TheAduseiEvaluateProps) {
  const definition = useMemo(() => evaluationSettings(option), [option]);
  if (!definition) return <p role="alert" className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">
    This formula definition could not be loaded. Ask the template owner to check its configuration before entering results.
  </p>;
  return <Suspense fallback={<div role="status" className="rounded-md border p-4 text-sm text-muted-foreground">Loading calculation fields…</div>}>
    {definition.type === FormulaType.Simple ? <Simple {...props} settings={definition.settings} />
      : definition.type === FormulaType.Uniformity ? <Uniformity {...props} settings={definition.settings} />
        : <Universal {...props} settings={definition.settings} showMetaPanels={showMetaPanels} />}
  </Suspense>;
}
