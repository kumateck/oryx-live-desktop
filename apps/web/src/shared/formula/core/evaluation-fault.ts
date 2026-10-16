import { FormulaEvaluationStatus } from "./evaluation-contracts";

export class EvaluationFault extends Error {
  constructor(
    readonly status: FormulaEvaluationStatus,
    message: string,
    readonly path: string,
    readonly variableKey?: string,
  ) {
    super(message);
  }
}
