export enum ExpressionNodeKind {
  DecimalLiteral = 0,
  Variable = 1,
  Unary = 2,
  Binary = 3,
}

export enum UnaryOperator {
  Plus = 0,
  Minus = 1,
}

export enum BinaryOperator {
  Add = 0,
  Subtract = 1,
  Multiply = 2,
  Divide = 3,
}

export type ExpressionNode =
  | { kind: ExpressionNodeKind.DecimalLiteral; value: string }
  | { kind: ExpressionNodeKind.Variable; key: string }
  | {
      kind: ExpressionNodeKind.Unary;
      operator: UnaryOperator;
      operand: ExpressionNode;
    }
  | {
      kind: ExpressionNodeKind.Binary;
      operator: BinaryOperator;
      left: ExpressionNode;
      right: ExpressionNode;
    };

export const exceedsExpressionDepth = (
  root: ExpressionNode,
  maxDepth: number,
): boolean => {
  const pending: Array<{ node: ExpressionNode; depth: number }> = [
    { node: root, depth: 1 },
  ];
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (current.depth > maxDepth) return true;
    if (current.node.kind === ExpressionNodeKind.Unary) {
      pending.push({ node: current.node.operand, depth: current.depth + 1 });
    } else if (current.node.kind === ExpressionNodeKind.Binary) {
      pending.push({ node: current.node.left, depth: current.depth + 1 });
      pending.push({ node: current.node.right, depth: current.depth + 1 });
    }
  }
  return false;
};
