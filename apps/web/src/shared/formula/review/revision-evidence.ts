import { useEffect, useState } from "react";
import { hashCompiledFormulaDefinitionV1 } from "../core/definition";
import { decodeFormulaDefinitionV1 } from "../core/decode";
import { FORMULA_V1_EVALUATION_LIMITS, FORMULA_V1_RUNTIME_LIMITS } from "../core/runtime-limits";
import type { FormulaTestOutcomeV1 } from "../core/test-contracts";
import { runFormulaTestCasesV1 } from "../core/test-suite";
import type { FormulaRevision } from "../governance-api";

/**
 * What a reviewer can confirm in the app without the author's Validate action: that the definition shown
 * produces the hash the revision was submitted under, and how its saved calculation checks come out here.
 * The server's validation remains the record; this is a provisional cross-check.
 */
export type RevisionEvidence =
  | { state: "checking" }
  | { state: "unreadable"; problem: string }
  | { state: "checked"; computedHash: string; hashMatches: boolean; outcomes: FormulaTestOutcomeV1[] };

export async function checkRevisionEvidence(revision: Pick<FormulaRevision, "definition" | "definitionHash" | "testCases">): Promise<RevisionEvidence> {
  const compiled = decodeFormulaDefinitionV1(revision.definition, FORMULA_V1_RUNTIME_LIMITS);
  if (!compiled.ok) {
    const issue = compiled.issues[0];
    return { state: "unreadable", problem: issue ? `Definition "${issue.path || "root"}": ${issue.message}` : "The revision's definition could not be read." };
  }
  const computedHash = await hashCompiledFormulaDefinitionV1(compiled.definition);
  const result = runFormulaTestCasesV1(compiled.definition, revision.testCases, FORMULA_V1_EVALUATION_LIMITS);
  return { state: "checked", computedHash, hashMatches: computedHash.toLowerCase() === revision.definitionHash.toLowerCase(), outcomes: result.outcomes };
}

/** Checks the shown revision whenever a different revision or definition is shown. */
export function useRevisionEvidence(revision: FormulaRevision | null): RevisionEvidence | null {
  const identity = revision ? `${revision.id}|${revision.definitionHash}` : "";
  const [evidence, setEvidence] = useState<{ identity: string; value: RevisionEvidence } | null>(null);
  useEffect(() => {
    if (!revision) return;
    let active = true;
    checkRevisionEvidence(revision)
      .catch((error: unknown): RevisionEvidence => ({ state: "unreadable", problem: error instanceof Error ? error.message : "The revision could not be checked." }))
      .then((value) => { if (active) setEvidence({ identity, value }); }, () => undefined);
    return () => { active = false; };
    // The identity covers everything the check reads that can change for one revision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);
  if (!revision) return null;
  return evidence?.identity === identity ? evidence.value : { state: "checking" };
}
