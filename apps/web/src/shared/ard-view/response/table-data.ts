import { sanitizeString } from "@/shared/ard-view/legacy";
import type { FormResponseDto } from "@/shared/ard-view/dto";

export const getHeadersFromQuestion = (
  response?: FormResponseDto,
): string[] => {
  const normalize = (value: unknown) => sanitizeString(value);
  const options = response?.formField?.question?.options ?? [];
  const headers = options.flatMap((opt) => {
    const label = normalize((opt as { label?: unknown })?.label);
    const value = normalize((opt as { value?: unknown })?.value);
    const name = normalize((opt as { name?: unknown })?.name);

    if (label && value && label !== value) return [label, value];
    if (label) return [label];
    if (value) return [value];
    if (name) return [name];
    return [];
  });

  return Array.from(new Set(headers));
};

export const buildGridFromCellMap = (
  raw: Record<string, unknown>,
  headerCount: number,
): string[][] => {
  const keyedCells = Object.entries(raw)
    .map(([key, value]) => {
      const match = key.match(/^(\d+)-(\d+)$/);
      if (!match) return null;
      const row = Number(match[1]);
      const col = Number(match[2]);
      if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
      return { row, col, value: String(value ?? "") };
    })
    .filter((item): item is { row: number; col: number; value: string } =>
      Boolean(item),
    );

  if (!keyedCells.length) return [];

  const maxRow = Math.max(...keyedCells.map((c) => c.row));
  const maxCol = Math.max(...keyedCells.map((c) => c.col));
  const colCount = Math.max(headerCount, maxCol + 1);
  const rows = Array.from({ length: maxRow + 1 }, () =>
    Array.from({ length: colCount }, () => ""),
  );

  keyedCells.forEach(({ row, col, value }) => {
    const target = rows[row];
    if (target) target[col] = value;
  });

  return rows;
};
