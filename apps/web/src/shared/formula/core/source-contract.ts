import {
  FormulaDataType,
  FormulaScope,
  FormulaValueShape,
  type FormulaIssue,
  FormulaIssueCode,
} from "./contracts";
import type { ResolvedFormulaSource } from "./binding-contracts";
import { FormulaSourceType, FormulaStatistic } from "./binding-contracts";
import {
  definitionError as error,
  isNumericEnumValue,
} from "./definition-helpers";

const expectedScope = (sourceType: FormulaSourceType): FormulaScope | null => {
  switch (sourceType) {
    case FormulaSourceType.LocalInput:
    case FormulaSourceType.LocalTableColumn:
    case FormulaSourceType.LocalTableColumnStat:
      return FormulaScope.Placement;
    case FormulaSourceType.QuestionValue:
    case FormulaSourceType.QuestionTableColumn:
    case FormulaSourceType.QuestionTableColumnStat:
    case FormulaSourceType.FormulaResult:
      return FormulaScope.Form;
    case FormulaSourceType.ResponseContext:
      return FormulaScope.ResponseContext;
    case FormulaSourceType.Constant:
    case FormulaSourceType.Expression:
      return null;
  }
};

const expectedShape = (sourceType: FormulaSourceType): FormulaValueShape => {
  switch (sourceType) {
    case FormulaSourceType.LocalTableColumn:
    case FormulaSourceType.QuestionTableColumn:
      return FormulaValueShape.TableColumn;
    default:
      return FormulaValueShape.Scalar;
  }
};

const isStatistic = (sourceType: FormulaSourceType): boolean =>
  sourceType === FormulaSourceType.LocalTableColumnStat ||
  sourceType === FormulaSourceType.QuestionTableColumnStat;

export const validateResolvedSourceContract = (
  source: ResolvedFormulaSource,
  path: string,
  issues: FormulaIssue[],
): void => {
  if (!isNumericEnumValue(FormulaSourceType, source.sourceType)) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        `${path}.sourceType`,
        "Resolved source type is unsupported.",
      ),
    );
    return;
  }
  const enumChecks = [
    [FormulaDataType, source.dataType, "dataType"],
    [FormulaValueShape, source.valueShape, "valueShape"],
    [FormulaScope, source.scope, "scope"],
  ] as const;
  for (const [enumeration, value, field] of enumChecks) {
    if (!isNumericEnumValue(enumeration, value)) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.${field}`,
          `Resolved source ${field} is unsupported.`,
        ),
      );
    }
  }
  if (
    source.statistic !== undefined &&
    !isNumericEnumValue(FormulaStatistic, source.statistic)
  ) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        `${path}.statistic`,
        "Resolved source statistic is unsupported.",
      ),
    );
  }
  for (const [field, value] of [
    ["inputDecimalPlaces", source.inputDecimalPlaces],
    ["tableCalculationDecimalPlaces", source.tableCalculationDecimalPlaces],
  ] as const) {
    if (
      value !== undefined &&
      (!Number.isInteger(value) || value < 0 || value > 12)
    ) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.${field}`,
          "Decimal places must be a whole number from 0 to 12.",
        ),
      );
    }
  }
  const scope = expectedScope(source.sourceType);
  if (scope !== null && source.scope !== scope) {
    issues.push(
      error(
        FormulaIssueCode.ScopeMismatch,
        `${path}.scope`,
        "Resolved source scope does not match its source type.",
      ),
    );
  }
  if (source.valueShape !== expectedShape(source.sourceType)) {
    issues.push(
      error(
        FormulaIssueCode.ShapeMismatch,
        `${path}.valueShape`,
        "Resolved source shape does not match its source type.",
      ),
    );
  }
  if (isStatistic(source.sourceType) !== (source.statistic !== undefined)) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        `${path}.statistic`,
        "Statistic metadata must appear only on statistic sources.",
      ),
    );
  }
  const dependencyCount = source.dependencies?.length ?? 0;
  if (
    source.sourceType === FormulaSourceType.FormulaResult &&
    dependencyCount !== 1
  ) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        `${path}.dependencies`,
        "A formula-result source requires exactly one dependency.",
      ),
    );
  } else if (
    source.sourceType !== FormulaSourceType.FormulaResult &&
    source.sourceType !== FormulaSourceType.Expression &&
    dependencyCount > 0
  ) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        `${path}.dependencies`,
        "This source type cannot declare formula dependencies.",
      ),
    );
  }
};
