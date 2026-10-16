import {
  type ExpressionLimits,
  type FormulaIssue,
  FormulaIssueCode,
  FormulaIssueSeverity,
} from "./contracts";

export enum TokenKind {
  Number = 0,
  Variable = 1,
  Plus = 2,
  Minus = 3,
  Star = 4,
  Slash = 5,
  LeftParenthesis = 6,
  RightParenthesis = 7,
  End = 8,
}

export interface ExpressionToken {
  kind: TokenKind;
  text: string;
  position: number;
}

const issue = (
  code: FormulaIssueCode,
  message: string,
  position?: number,
): FormulaIssue => ({
  code,
  severity: FormulaIssueSeverity.Error,
  path: "expression",
  message,
  position,
});

const isDigit = (value: string | undefined): boolean =>
  value !== undefined && value >= "0" && value <= "9";

const isKeyStart = (value: string | undefined): boolean =>
  value !== undefined && /[A-Za-z_]/.test(value);

const isKeyPart = (value: string | undefined): boolean =>
  value !== undefined && /[A-Za-z0-9_]/.test(value);

export type TokenizeResult =
  | { ok: true; tokens: ExpressionToken[] }
  | { ok: false; issues: FormulaIssue[] };

export const tokenizeExpressionV1 = (
  source: string,
  limits: ExpressionLimits,
): TokenizeResult => {
  const tokens: ExpressionToken[] = [];
  let position = 0;
  const push = (kind: TokenKind, start: number, end: number) => {
    tokens.push({ kind, text: source.slice(start, end), position: start });
  };

  while (position < source.length) {
    const current = source[position];
    if (/\s/.test(current ?? "")) {
      position += 1;
      continue;
    }

    if (
      isDigit(current) ||
      (current === "." && isDigit(source[position + 1]))
    ) {
      const start = position;
      while (isDigit(source[position])) position += 1;
      if (source[position] === ".") {
        position += 1;
        while (isDigit(source[position])) position += 1;
      }
      push(TokenKind.Number, start, position);
    } else if (current === ":") {
      const start = position;
      position += 1;
      if (!isKeyStart(source[position])) {
        return {
          ok: false,
          issues: [
            issue(
              FormulaIssueCode.UnknownToken,
              "Invalid variable token.",
              start,
            ),
          ],
        };
      }
      position += 1;
      while (isKeyPart(source[position])) position += 1;
      while (source[position] === "." && isKeyStart(source[position + 1])) {
        position += 2;
        while (isKeyPart(source[position])) position += 1;
      }
      push(TokenKind.Variable, start, position);
    } else {
      const tokenKind = {
        "+": TokenKind.Plus,
        "-": TokenKind.Minus,
        "*": TokenKind.Star,
        "/": TokenKind.Slash,
        "(": TokenKind.LeftParenthesis,
        ")": TokenKind.RightParenthesis,
      }[current ?? ""];
      if (tokenKind === undefined) {
        return {
          ok: false,
          issues: [
            issue(
              FormulaIssueCode.UnknownToken,
              `Unknown token "${current}".`,
              position,
            ),
          ],
        };
      }
      push(tokenKind, position, position + 1);
      position += 1;
    }

    if (tokens.length > limits.maxTokens) {
      return {
        ok: false,
        issues: [
          issue(
            FormulaIssueCode.ResourceLimit,
            "Expression token limit exceeded.",
          ),
        ],
      };
    }
  }

  tokens.push({ kind: TokenKind.End, text: "", position: source.length });
  return { ok: true, tokens };
};
