import { describe, expect, it } from "vitest";

import { FormulaIssueCode } from "../contracts";
import {
  BinaryOperator,
  ExpressionNodeKind,
  parseExpressionV1,
} from "../expression";

const limits = {
  maxTokens: 100,
  maxAstNodes: 100,
  maxDepth: 20,
  maxVariableReferences: 20,
  maxVariables: 20,
  maxResults: 10,
  maxKeyLength: 80,
  maxExpressionLength: 1_000,
};

describe("parseExpressionV1", () => {
  it("parses the production arithmetic subset and dotted keys", () => {
    const parsed = parseExpressionV1(
      "(:sampleAvg / :standardAvg) * (:standardInput.wt / :sampleInput.wt)",
      limits,
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.variables).toEqual([
      "sampleAvg",
      "standardAvg",
      "standardInput.wt",
      "sampleInput.wt",
    ]);
    expect(parsed.ast).toMatchObject({
      kind: ExpressionNodeKind.Binary,
      operator: BinaryOperator.Multiply,
    });
  });

  it("normalizes literals and applies multiplication before addition", () => {
    const parsed = parseExpressionV1("001.2300 + 2 * 3", limits);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.ast).toEqual({
      kind: ExpressionNodeKind.Binary,
      operator: BinaryOperator.Add,
      left: { kind: ExpressionNodeKind.DecimalLiteral, value: "1.23" },
      right: {
        kind: ExpressionNodeKind.Binary,
        operator: BinaryOperator.Multiply,
        left: { kind: ExpressionNodeKind.DecimalLiteral, value: "2" },
        right: { kind: ExpressionNodeKind.DecimalLiteral, value: "3" },
      },
    });
  });

  it.each(["sqrt(:a)", "2^3", "2(:a)", ":a.", ":a:b", "1e3"])(
    "rejects syntax outside language v1: %s",
    (expression) => {
      const parsed = parseExpressionV1(expression, limits);
      expect(parsed.ok).toBe(false);
      if (parsed.ok) return;
      expect(parsed.issues[0]?.code).toBeDefined();
    },
  );

  it("returns a typed token limit error", () => {
    const parsed = parseExpressionV1(":a + :b", { ...limits, maxTokens: 2 });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues[0]?.code).toBe(FormulaIssueCode.ResourceLimit);
  });

  it("enforces AST depth rather than only parenthesis nesting", () => {
    const parsed = parseExpressionV1("1 + 2 + 3", { ...limits, maxDepth: 2 });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues[0]?.code).toBe(FormulaIssueCode.ResourceLimit);
  });
});
