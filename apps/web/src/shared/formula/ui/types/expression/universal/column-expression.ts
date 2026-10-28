import { evaluateExpression } from "./engine/expressionEngine";
import type { CellData, ColumnExpressionMap } from "./types";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const patternFor = (header: string) =>
  new RegExp(`(?<![A-Za-z0-9_]):?${escapeRegex(header)}(?![A-Za-z0-9_])`, "gi");

export const validateColumnExpression = (
  expression: string,
  targetColumn: number,
  headers: string[],
): string | null => {
  if (!expression.trim()) return null;
  const referenced = headers.flatMap((header, index) =>
    header.trim() && patternFor(header.trim()).test(expression) ? [index] : [],
  );
  if (referenced.includes(targetColumn))
    return "Column cannot reference itself";
  return referenced.length > 0
    ? null
    : "Expression must reference at least one other column";
};

export const evaluateDerivedColumns = (
  source: CellData,
  headers: string[],
  definitions: ColumnExpressionMap,
): CellData => {
  const output = source.map((row) => [...row]);
  const orderedHeaders = headers
    .map((header, index) => ({ header: header.trim(), index }))
    .filter(({ header }) => header.length > 0)
    .sort((left, right) => right.header.length - left.header.length);

  const resolve = (row: number, column: number, path: Set<number>): string => {
    const definition = definitions[column];
    if (!definition?.enabled || definition.error)
      return source[row]?.[column] ?? "";
    if (path.has(column)) return "";
    const nextPath = new Set(path).add(column);
    let expression = definition.expression;
    for (const item of orderedHeaders) {
      if (item.index === column) continue;
      const raw = resolve(row, item.index, nextPath);
      const numeric =
        raw !== "" && Number.isFinite(Number(raw))
          ? String(Number(raw))
          : "NaN";
      expression = expression.replace(patternFor(item.header), numeric);
    }
    if (/\bNaN\b/.test(expression) || !/^[0-9eE+\-*/().\s]*$/.test(expression))
      return "";
    const value = evaluateExpression(expression, {});
    return value === null ? "" : String(value);
  };

  Object.entries(definitions).forEach(([column, definition]) => {
    if (!definition.enabled || definition.error) return;
    const index = Number(column);
    output.forEach((row, rowIndex) => {
      row[index] = resolve(rowIndex, index, new Set());
    });
  });
  return output;
};
