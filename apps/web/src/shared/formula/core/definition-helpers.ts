import {
  type FormulaIssue,
  FormulaIssueCode,
  FormulaIssueSeverity,
} from "./contracts";

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.]*$/;

export const definitionError = (
  code: FormulaIssueCode,
  path: string,
  message: string,
  variableKey?: string,
): FormulaIssue => ({
  code,
  severity: FormulaIssueSeverity.Error,
  path,
  message,
  variableKey,
});

export const validateFormulaKey = (
  key: string,
  path: string,
  maxLength: number,
  issues: FormulaIssue[],
): void => {
  if (
    key.length > maxLength ||
    !KEY_PATTERN.test(key) ||
    key.endsWith(".") ||
    key.includes("..")
  ) {
    issues.push(
      definitionError(
        FormulaIssueCode.InvalidDefinition,
        path,
        "Key has an invalid format or exceeds the configured limit.",
      ),
    );
  }
};

export const isNumericEnumValue = (
  enumeration: Record<string, string | number>,
  value: number,
): boolean =>
  typeof value === "number" && Number.isInteger(value) && value in enumeration;
