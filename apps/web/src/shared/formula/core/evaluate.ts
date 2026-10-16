import type { CompiledFormulaDefinitionV1 } from "./compiled-definition";
import {
  FORMULA_EVALUATOR_VERSION,
  type FormulaCalculationTraceStep,
  type FormulaEvaluation,
  type FormulaEvaluationLimits,
  FormulaEvaluationStatus,
} from "./evaluation-contracts";
import { EvaluationFault } from "./evaluation-fault";
import { resolveFormulaInputs } from "./evaluation-inputs";
import {
  BinaryOperator,
  type ExpressionNode,
  ExpressionNodeKind,
  UnaryOperator,
} from "./expression-model";
import {
  addRational,
  divideRational,
  multiplyRational,
  negateRational,
  parseRationalDecimal,
  type Rational,
  rationalEvidence,
  roundRationalHalfUp,
  subtractRational,
} from "./rational";
import { FormulaRoundingKind } from "./contracts";

const failure = (
  fault: EvaluationFault,
  trace: FormulaCalculationTraceStep[],
  operationCount: number,
  traceTruncated: boolean,
): FormulaEvaluation => ({
  evaluatorVersion: FORMULA_EVALUATOR_VERSION,
  status: fault.status,
  results: [],
  errors: [
    {
      status: fault.status,
      path: fault.path,
      message: fault.message,
      variableKey: fault.variableKey,
    },
  ],
  trace,
  traceTruncated,
  operationCount,
});

export const evaluateCompiledFormulaV1 = (
  definition: CompiledFormulaDefinitionV1,
  rawInputs: Readonly<Record<string, unknown>>,
  limits: FormulaEvaluationLimits,
): FormulaEvaluation => {
  const trace: FormulaCalculationTraceStep[] = [];
  let operations = 0;
  let traceTruncated = false;

  const record = (
    operation: string,
    operands: Rational[],
    result: Rational,
  ) => {
    operations += 1;
    if (operations > limits.maxOperations) {
      throw new EvaluationFault(
        FormulaEvaluationStatus.ResourceLimit,
        "Operation limit exceeded.",
        "expression",
      );
    }
    if (trace.length >= limits.maxTraceSteps) {
      traceTruncated = true;
      return;
    }
    trace.push({
      sequence: operations,
      operation,
      operands: operands.map(rationalEvidence),
      result: rationalEvidence(result),
    });
  };

  try {
    const values = resolveFormulaInputs(definition, rawInputs, limits);

    const visit = (node: ExpressionNode): Rational => {
      if (node.kind === ExpressionNodeKind.DecimalLiteral) {
        return parseRationalDecimal(node.value, limits.maxInputDigits)!;
      }
      if (node.kind === ExpressionNodeKind.Variable) {
        const value = values.get(node.key);
        if (!value)
          throw new EvaluationFault(
            FormulaEvaluationStatus.MissingInput,
            `Input ${node.key} is unavailable.`,
            `inputs.${node.key}`,
            node.key,
          );
        return value;
      }
      if (node.kind === ExpressionNodeKind.Unary) {
        const operand = visit(node.operand);
        const result =
          node.operator === UnaryOperator.Minus
            ? negateRational(operand)
            : operand;
        record(
          node.operator === UnaryOperator.Minus ? "NEGATE" : "PLUS",
          [operand],
          result,
        );
        return result;
      }
      const left = visit(node.left);
      const right = visit(node.right);
      let result: Rational;
      if (node.operator === BinaryOperator.Add)
        result = addRational(left, right);
      else if (node.operator === BinaryOperator.Subtract)
        result = subtractRational(left, right);
      else if (node.operator === BinaryOperator.Multiply)
        result = multiplyRational(left, right);
      else {
        try {
          result = divideRational(left, right);
        } catch {
          throw new EvaluationFault(
            FormulaEvaluationStatus.DivideByZero,
            "Division by zero.",
            "expression",
          );
        }
      }
      record(
        BinaryOperator[node.operator].toUpperCase(),
        [left, right],
        result,
      );
      return result;
    };

    for (const derived of definition.derivedExpressions ?? []) {
      const value = visit(derived.expression);
      values.set(derived.key, value);
      record(`DERIVED:${derived.key}`, [], value);
    }

    const results = definition.results.map((result) => {
      if (result.rounding.kind !== FormulaRoundingKind.DecimalPlaces) {
        throw new EvaluationFault(
          FormulaEvaluationStatus.UnsupportedPolicy,
          "Only the governed decimal-place rounding policy is supported.",
          `results.${result.key}.rounding`,
        );
      }
      const value = visit(result.expression);
      const exactResult = rationalEvidence(value);
      if (exactResult.replaceAll(/[-/]/g, "").length > limits.maxResultDigits) {
        throw new EvaluationFault(
          FormulaEvaluationStatus.ResourceLimit,
          "Result digit limit exceeded.",
          `results.${result.key}`,
        );
      }
      const roundedResult = roundRationalHalfUp(value, result.rounding.digits);
      return {
        key: result.key,
        exactResult,
        roundedResult,
        displayedResult: roundedResult,
        unit: result.unit,
      };
    });
    return {
      evaluatorVersion: FORMULA_EVALUATOR_VERSION,
      status: FormulaEvaluationStatus.Valid,
      results,
      errors: [],
      trace,
      traceTruncated,
      operationCount: operations,
    };
  } catch (caught) {
    const fault =
      caught instanceof EvaluationFault
        ? caught
        : new EvaluationFault(
            FormulaEvaluationStatus.InvalidDefinition,
            "Formula evaluation failed.",
            "definition",
          );
    return failure(fault, trace, operations, traceTruncated);
  }
};
