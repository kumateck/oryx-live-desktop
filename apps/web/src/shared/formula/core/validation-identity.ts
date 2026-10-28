import type { FormulaTestCaseV1 } from "./test-contracts";

export interface FormulaValidationIdentity {
  id: string;
  definitionHash: string;
  testCases: readonly FormulaTestCaseV1[];
}

// An in-memory display identity, not a persisted evidence hash or release signature.
export const formulaValidationIdentity = (
  revision: FormulaValidationIdentity,
): string =>
  JSON.stringify([revision.id, revision.definitionHash, revision.testCases]);
