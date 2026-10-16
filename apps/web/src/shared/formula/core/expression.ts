import {
  type ExpressionLimits,
  type FormulaIssue,
  FormulaIssueCode,
  FormulaIssueSeverity,
} from "./contracts";
import { normalizeDecimalLiteral } from "./decimal";
import {
  BinaryOperator,
  type ExpressionNode,
  ExpressionNodeKind,
  UnaryOperator,
  exceedsExpressionDepth,
} from "./expression-model";
import {
  type ExpressionToken,
  TokenKind,
  tokenizeExpressionV1,
} from "./expression-tokens";

export * from "./expression-model";

export type ParseExpressionResult =
  | { ok: true; ast: ExpressionNode; variables: string[]; nodeCount: number }
  | { ok: false; issues: FormulaIssue[] };

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

class Parser {
  private cursor = 0;
  private nodes = 0;
  private depth = 0;
  private readonly variables: string[] = [];

  constructor(
    private readonly tokens: ExpressionToken[],
    private readonly limits: ExpressionLimits,
  ) {}

  parse(): ParseExpressionResult {
    try {
      const ast = this.parseAdditive();
      const trailing = this.peek();
      if (trailing.kind !== TokenKind.End) {
        throw issue(
          FormulaIssueCode.InvalidDefinition,
          `Unexpected token "${trailing.text}".`,
          trailing.position,
        );
      }
      if (exceedsExpressionDepth(ast, this.limits.maxDepth)) {
        throw issue(
          FormulaIssueCode.ResourceLimit,
          "Expression depth limit exceeded.",
        );
      }
      return {
        ok: true,
        ast,
        variables: [...new Set(this.variables)],
        nodeCount: this.nodes,
      };
    } catch (caught) {
      return { ok: false, issues: [caught as FormulaIssue] };
    }
  }

  private parseAdditive(): ExpressionNode {
    let left = this.parseMultiplicative();
    while (
      this.peek().kind === TokenKind.Plus ||
      this.peek().kind === TokenKind.Minus
    ) {
      const operator =
        this.take().kind === TokenKind.Plus
          ? BinaryOperator.Add
          : BinaryOperator.Subtract;
      left = this.node({
        kind: ExpressionNodeKind.Binary,
        operator,
        left,
        right: this.parseMultiplicative(),
      });
    }
    return left;
  }

  private parseMultiplicative(): ExpressionNode {
    let left = this.parseUnary();
    while (
      this.peek().kind === TokenKind.Star ||
      this.peek().kind === TokenKind.Slash
    ) {
      const operator =
        this.take().kind === TokenKind.Star
          ? BinaryOperator.Multiply
          : BinaryOperator.Divide;
      left = this.node({
        kind: ExpressionNodeKind.Binary,
        operator,
        left,
        right: this.parseUnary(),
      });
    }
    return left;
  }

  private parseUnary(): ExpressionNode {
    const current = this.peek();
    if (current.kind !== TokenKind.Plus && current.kind !== TokenKind.Minus) {
      return this.parsePrimary();
    }
    this.take();
    return this.node({
      kind: ExpressionNodeKind.Unary,
      operator:
        current.kind === TokenKind.Plus
          ? UnaryOperator.Plus
          : UnaryOperator.Minus,
      operand: this.withDepth(() => this.parseUnary()),
    });
  }

  private parsePrimary(): ExpressionNode {
    const current = this.take();
    if (current.kind === TokenKind.Number) {
      const value = normalizeDecimalLiteral(current.text);
      if (value === null)
        throw issue(
          FormulaIssueCode.InvalidDefinition,
          "Invalid number.",
          current.position,
        );
      return this.node({ kind: ExpressionNodeKind.DecimalLiteral, value });
    }
    if (current.kind === TokenKind.Variable) {
      const key = current.text.slice(1);
      this.variables.push(key);
      if (this.variables.length > this.limits.maxVariableReferences) {
        throw issue(
          FormulaIssueCode.ResourceLimit,
          "Variable reference limit exceeded.",
        );
      }
      return this.node({ kind: ExpressionNodeKind.Variable, key });
    }
    if (current.kind === TokenKind.LeftParenthesis) {
      const nested = this.withDepth(() => this.parseAdditive());
      const closing = this.take();
      if (closing.kind !== TokenKind.RightParenthesis) {
        throw issue(
          FormulaIssueCode.InvalidDefinition,
          "Missing closing parenthesis.",
          closing.position,
        );
      }
      return nested;
    }
    throw issue(
      FormulaIssueCode.InvalidDefinition,
      "Expected a number, variable, or parenthesis.",
      current.position,
    );
  }

  private node<T extends ExpressionNode>(value: T): T {
    this.nodes += 1;
    if (this.nodes > this.limits.maxAstNodes) {
      throw issue(
        FormulaIssueCode.ResourceLimit,
        "Expression AST node limit exceeded.",
      );
    }
    return value;
  }

  private withDepth<T>(read: () => T): T {
    this.depth += 1;
    if (this.depth > this.limits.maxDepth) {
      throw issue(
        FormulaIssueCode.ResourceLimit,
        "Expression depth limit exceeded.",
      );
    }
    try {
      return read();
    } finally {
      this.depth -= 1;
    }
  }

  private peek(): ExpressionToken {
    return this.tokens[this.cursor] ?? this.tokens[this.tokens.length - 1]!;
  }

  private take(): ExpressionToken {
    const token = this.peek();
    this.cursor += 1;
    return token;
  }
}

export const parseExpressionV1 = (
  source: string,
  limits: ExpressionLimits,
): ParseExpressionResult => {
  if (!source.trim()) {
    return {
      ok: false,
      issues: [
        issue(FormulaIssueCode.InvalidDefinition, "Expression is required."),
      ],
    };
  }
  const tokenized = tokenizeExpressionV1(source, limits);
  return tokenized.ok
    ? new Parser(tokenized.tokens, limits).parse()
    : tokenized;
};
