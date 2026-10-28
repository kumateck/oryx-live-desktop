import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buildFormulaRevisionDraft } from "@/shared/formula/builder/definition-adapter";
import { compileFormulaDefinitionV1 } from "@/shared/formula/core/definition";
import { FormulaEvaluationStatus, formulaEvaluationStatusNames } from "@/shared/formula/core/evaluation-contracts";
import { FORMULA_V1_EVALUATION_LIMITS, FORMULA_V1_RUNTIME_LIMITS } from "@/shared/formula/core/runtime-limits";
import type { FormulaTestCaseV1, FormulaTestOutcomeV1, FormulaTestSuiteResultV1 } from "@/shared/formula/core/test-contracts";
import { runFormulaTestCasesV1 } from "@/shared/formula/core/test-suite";

const pairs = (values: Readonly<Record<string, string | null>>) => Object.entries(values).map(([key, value]) => `${key}=${value ?? "null"}`).join(", ") || "–";

/** The calculation checks of a formula and, once run, whether each one gave the expected result. */
export function FormulaChecks({ cases, outcomes = [], evaluatorVersion, engineBuildHash, authority = "authoritative" }: {
  cases: readonly FormulaTestCaseV1[]; outcomes?: readonly FormulaTestOutcomeV1[] | undefined; evaluatorVersion?: string | undefined; engineBuildHash?: string | undefined; authority?: "provisional" | "authoritative";
}) {
  const byId = new Map(outcomes.map((outcome) => [outcome.id, outcome]));
  const passed = outcomes.filter((outcome) => outcome.passed).length;
  return <section aria-label="Calculation checks" className="space-y-3 rounded-md border p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">Calculation checks</h3>
      <p className="text-xs text-muted-foreground">{outcomes.length ? `${String(passed)} of ${String(outcomes.length)} ${authority} cases passed` : `${String(cases.length)} saved cases. Run Validate to get the server's results.`}</p>
      <p className="text-xs text-muted-foreground">Generated checks do not on their own show the method is correct or approve it for release.</p></div>
      {outcomes.length ? <Badge variant={passed === outcomes.length ? "default" : "destructive"}>{passed === outcomes.length ? "Passed" : "Failed"}</Badge> : null}</div>
    <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[56rem] text-left text-xs"><thead className="border-b text-muted-foreground"><tr>{["Case", "Inputs", "Expected", "Actual", "Result"].map((head) => <th key={head} scope="col" className="p-2">{head}</th>)}</tr></thead>
      <tbody>{cases.map((testCase) => { const outcome = byId.get(testCase.id); const error = outcome?.errors[0]?.message;
        return <tr key={testCase.id} className="border-b last:border-0"><td className="p-2 font-medium">{testCase.name}</td><td className="max-w-64 break-all p-2 font-mono">{pairs(outcome?.resolvedInputs ?? testCase.resolvedInputs)}</td>
          <td className="p-2">{formulaEvaluationStatusNames[testCase.expectedStatus]}{testCase.expectedStatus === FormulaEvaluationStatus.Valid ? ` · ${pairs(testCase.expectedResults)}` : ""}</td>
          <td className="p-2">{outcome ? `${formulaEvaluationStatusNames[outcome.actualStatus]} · ${error || pairs(outcome.actualResults)}` : "Not run"}</td>
          <td className="p-2">{outcome ? (outcome.passed ? "Pass" : "Fail") : "Pending"}</td></tr>; })}</tbody></table></div>
    {evaluatorVersion ? <p className="break-all text-xs text-muted-foreground">{evaluatorVersion} · engine {engineBuildHash}</p> : null}
  </section>;
}

/** Runs the generated checks in the app as the formula is built. A browser check is provisional; the server's validation is the record. */
export function DraftFormulaChecks({ definition, preset, onProblem }: { definition: string; preset: string; onProblem: (message: string) => void }) {
  const identity = JSON.stringify([preset, definition]);
  const [state, setState] = useState<{ identity: string; cases: FormulaTestCaseV1[]; result: FormulaTestSuiteResultV1 } | { identity: string; problem: string } | null>(null);
  useEffect(() => {
    if (!definition.trim()) { setState(null); return; }
    let active = true;
    const timer = window.setTimeout(() => {
      void buildFormulaRevisionDraft(definition, preset).then((draft) => {
        if (!active) return;
        const compiled = compileFormulaDefinitionV1(draft.definition, FORMULA_V1_RUNTIME_LIMITS);
        if (!compiled.ok) { const issue = compiled.issues[0]; const problem = issue ? `Input "${issue.path}": ${issue.message}` : "The formula definition is invalid."; setState({ identity, problem }); onProblem(problem); return; }
        setState({ identity, cases: draft.testCases, result: runFormulaTestCasesV1(compiled.definition, draft.testCases, FORMULA_V1_EVALUATION_LIMITS) });
      }).catch((error: unknown) => { if (!active) return; const problem = error instanceof Error ? error.message : "This formula could not be checked."; setState({ identity, problem }); onProblem(problem); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [definition, identity, onProblem, preset]);
  if (!state || state.identity !== identity) return null;
  if ("problem" in state) return <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{state.problem}</p>;
  return <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Provisional check in the app</Badge>
    <span className="text-xs text-muted-foreground">Generated smoke checks. Passing them does not verify the formula or replace controlled release evidence.</span></div>
    <FormulaChecks cases={state.cases} outcomes={state.result.outcomes} authority="provisional" /></div>;
}
