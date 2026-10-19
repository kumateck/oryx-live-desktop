import type { ArdResultField } from "../schemas/ard-result-schema";

/** A recorded answer on analytical raw data: its text, and whether the analyst marked it as complying. */
export interface RecordedAnswer { responseId?: string | null | undefined; value: string | null; complies?: boolean | null | undefined; formField?: ArdResultField | null | undefined; formulaGoverned?: boolean | null | undefined; formulaResultFinalized?: boolean | null | undefined; formulaExecutionId?: string | null | undefined; formulaDisplayResultsJson?: string | null | undefined }

/** The answer recorded for each field. Where a field was answered more than once, the last answer with a value stands. */
export function answersByField<T extends RecordedAnswer>(responses: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const response of responses) { const field = response.formField?.id; if (field && (response.value !== null || !map.has(field))) map.set(field, response); }
  return map;
}

/** Analysts sometimes write the verdict as text instead of ticking it. */
export const saysFails = (value: string | null | undefined) => /does not comply|not compl/i.test(value ?? "");

export function answerFails(answer: RecordedAnswer | undefined): boolean {
  return answer?.complies === false || saysFails(answer?.value);
}

export type Compliance = "complies" | "fails" | "not-recorded";

/**
 * Whether one test complies: it fails if any of its results is marked or written as failing, complies when
 * at least one result is recorded and none fails, and is not recorded when nothing was entered. Oryx Next
 * printed "Complies" for a test with no result at all.
 */
export function testCompliance(fieldIds: readonly (string | null | undefined)[], recorded: ReadonlyMap<string, RecordedAnswer>): Compliance {
  const answers = fieldIds.flatMap((id) => { const answer = id ? recorded.get(id) : undefined; return answer ? [answer] : []; });
  if (answers.some(answerFails)) return "fails";
  return answers.some((answer) => answer.value !== null || answer.complies === true) ? "complies" : "not-recorded";
}

export const complianceLabels: Record<Compliance, string> = { complies: "Complies", fails: "Does not comply", "not-recorded": "Not recorded" };
