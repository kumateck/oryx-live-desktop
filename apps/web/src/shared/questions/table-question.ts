import { z } from "zod";

// A table question is a grid configured cell by cell ("2-3" is row 2, column 3, from zero). Its answer is the text or
// option value entered in each input and select cell, keyed the same way. Both are stored as JSON strings, as in Oryx Next.

export type CellType = "empty" | "label" | "input" | "select" | "linked";
export type AsyncSource = "equipments" | "reagents";
/** What a linked cell shows from the record chosen in its source cell. */
export type LinkProperty = "code" | "name";
export interface CellOption { value: string; label: string }
export interface CellConfig {
  type: CellType; label?: string; placeholder?: string; options?: CellOption[];
  dataSource?: "sync" | "async"; asyncSource?: AsyncSource; colspan?: number; rowspan?: number; isMerged?: boolean;
  /** A linked cell: the column (same row) whose record-list choice it follows, and which property of that record it shows. */
  linkSource?: number; linkProperty?: LinkProperty;
}
export interface TableConfig { rows: number; cols: number; cellConfigs: Record<string, CellConfig> }
export type TableAnswer = Record<string, string>;
export type ApplyScope = "single" | "range" | "column";

export const maxTableSize = 20;
export const emptyTable = (): TableConfig => ({ rows: 5, cols: 4, cellConfigs: {} });
export const cellKey = (row: number, col: number) => `${row}-${col}`;
const keyPattern = /^(\d+)-(\d+)$/;
export function parseCellKey(key: string): { row: number; col: number } | null {
  const match = keyPattern.exec(key);
  return match ? { row: Number(match[1]), col: Number(match[2]) } : null;
}

const cellSchema = z.object({
  type: z.enum(["empty", "label", "input", "select", "linked"]).catch("empty"), label: z.string().optional().catch(undefined), placeholder: z.string().optional().catch(undefined),
  options: z.array(z.object({ value: z.coerce.string(), label: z.coerce.string() })).optional().catch(undefined),
  dataSource: z.enum(["sync", "async"]).optional().catch(undefined), asyncSource: z.enum(["equipments", "reagents"]).optional().catch(undefined),
  colspan: z.number().int().positive().optional().catch(undefined), rowspan: z.number().int().positive().optional().catch(undefined), isMerged: z.boolean().optional().catch(undefined),
  linkSource: z.number().int().min(0).optional().catch(undefined), linkProperty: z.enum(["code", "name"]).optional().catch(undefined),
});
const configSchema = z.object({ rows: z.number().int().min(1).max(maxTableSize), cols: z.number().int().min(1).max(maxTableSize), cellConfigs: z.record(z.string(), cellSchema).catch({}) });

function json(value: string | null | undefined): unknown {
  if (!value?.trim()) return null;
  try { return JSON.parse(value) as unknown; } catch { return null; }
}
/** Drops the keys zod set to undefined, so a cell round-trips without phantom fields. */
function compact(cell: z.infer<typeof cellSchema>): CellConfig {
  const result: CellConfig = { type: cell.type };
  if (cell.label !== undefined) result.label = cell.label;
  if (cell.placeholder !== undefined) result.placeholder = cell.placeholder;
  if (cell.options !== undefined) result.options = cell.options;
  if (cell.dataSource !== undefined) result.dataSource = cell.dataSource;
  if (cell.asyncSource !== undefined) result.asyncSource = cell.asyncSource;
  if (cell.colspan !== undefined) result.colspan = cell.colspan;
  if (cell.rowspan !== undefined) result.rowspan = cell.rowspan;
  if (cell.isMerged !== undefined) result.isMerged = cell.isMerged;
  if (cell.linkSource !== undefined) result.linkSource = cell.linkSource;
  if (cell.linkProperty !== undefined) result.linkProperty = cell.linkProperty;
  return result;
}
/** The table a question defines, or null when the stored text is not a table. */
export function parseTableConfig(value: string | null | undefined): TableConfig | null {
  const parsed = configSchema.safeParse(json(value));
  if (!parsed.success) return null;
  return { rows: parsed.data.rows, cols: parsed.data.cols, cellConfigs: Object.fromEntries(Object.entries(parsed.data.cellConfigs).map(([key, cell]) => [key, compact(cell)])) };
}
export const serializeTableConfig = (config: TableConfig) => JSON.stringify(config);

/** The cells an answer filled in. Anything that is not a cell map reads as an empty answer. */
export function parseTableAnswer(value: string | null | undefined): TableAnswer {
  const parsed = json(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return Object.fromEntries(Object.entries(parsed).flatMap(([key, entry]) => parseCellKey(key) && (typeof entry === "string" || typeof entry === "number") ? [[key, String(entry)]] : []));
}
export const tableAnswerFilled = (answer: TableAnswer) => Object.values(answer).some((entry) => entry.trim().length > 0);

/** A fresh grid of the given size. Configuration and answers of the old grid are dropped, as in Oryx Next. */
export function resizeTable(rows: number, cols: number): TableConfig | null {
  return rows >= 1 && rows <= maxTableSize && cols >= 1 && cols <= maxTableSize ? { rows, cols, cellConfigs: {} } : null;
}

/** Writes a cell's configuration to the chosen cells. Merging applies to a single cell only; bulk scopes reset spans. */
export function applyCellConfig(config: TableConfig, key: string, cell: CellConfig, scope: ApplyScope, range: { start: number; end: number } = { start: 1, end: 1 }): TableConfig {
  const at = parseCellKey(key);
  if (!at) return config;
  const next = { ...config.cellConfigs };
  if (scope === "single") {
    next[key] = cell;
    const colspan = cell.colspan ?? 1;
    const rowspan = cell.rowspan ?? 1;
    for (let row = at.row; row < at.row + rowspan; row++) for (let col = at.col; col < at.col + colspan; col++)
      if (row !== at.row || col !== at.col) next[cellKey(row, col)] = { type: "empty", isMerged: true };
    return { ...config, cellConfigs: next };
  }
  const low = Math.max(1, Math.min(config.rows, Math.min(range.start || 1, range.end || 1)));
  const high = Math.max(1, Math.min(config.rows, Math.max(range.start || 1, range.end || 1)));
  const [first, last] = scope === "column" ? [0, config.rows - 1] : [low - 1, high - 1];
  for (let row = first; row <= last; row++) next[cellKey(row, at.col)] = { ...cell, colspan: 1, rowspan: 1, isMerged: false };
  return { ...config, cellConfigs: next };
}

function remap<T>(source: Record<string, T>, move: (row: number, col: number) => string | null): Record<string, T> {
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(source)) { const at = parseCellKey(key); const target = at ? move(at.row, at.col) : null; if (target) result[target] = value; }
  return result;
}
/** Removes a row or column, shifting later cells and shrinking any span that crossed it. The answer moves with its cells. */
export function removeLine(config: TableConfig, answer: TableAnswer, line: { kind: "row" | "column"; index: number }): { config: TableConfig; answer: TableAnswer } | null {
  const isRow = line.kind === "row";
  if ((isRow ? config.rows : config.cols) <= 1) return null;
  const move = (row: number, col: number) => {
    const position = isRow ? row : col;
    if (position === line.index) return null;
    const shifted = position > line.index ? position - 1 : position;
    return isRow ? cellKey(shifted, col) : cellKey(row, shifted);
  };
  const cells: Record<string, CellConfig> = {};
  for (const [key, cell] of Object.entries(config.cellConfigs)) {
    const at = parseCellKey(key);
    const target = at ? move(at.row, at.col) : null;
    if (!at || !target) continue;
    const start = isRow ? at.row : at.col;
    const span = (isRow ? cell.rowspan : cell.colspan) ?? 1;
    const crosses = !cell.isMerged && start < line.index && line.index <= start + span - 1;
    cells[target] = crosses ? { ...cell, ...(isRow ? { rowspan: Math.max(1, span - 1) } : { colspan: Math.max(1, span - 1) }) } : cell;
  }
  return { config: { rows: config.rows - (isRow ? 1 : 0), cols: config.cols - (isRow ? 0 : 1), cellConfigs: cells }, answer: remap(answer, move) };
}

/** A filled table as headings and rows of text, for reading an answer back: only input and select columns, only rows with something in them. */
export function answerGrid(config: TableConfig | null, answer: TableAnswer): { headers: string[]; rows: string[][] } {
  const keyed = Object.keys(answer).flatMap((key) => { const at = parseCellKey(key); return at ? [at] : []; });
  if (keyed.length === 0) return { headers: [], rows: [] };
  const answerCols = Math.max(...keyed.map((at) => at.col)) + 1;
  const inputCols = new Set<number>();
  const headings = new Map<number, string>();
  for (const [key, cell] of Object.entries(config?.cellConfigs ?? {})) {
    const at = parseCellKey(key);
    if (!at) continue;
    if (cell.type === "input" || cell.type === "select" || cell.type === "linked") inputCols.add(at.col);
    if (cell.type === "label" && at.row === 0 && cell.label?.trim()) headings.set(at.col, cell.label.trim());
  }
  const cols = inputCols.size > 0 ? [...inputCols].sort((a, b) => a - b) : Array.from({ length: Math.max(config?.cols ?? 0, answerCols) }, (_, index) => index);
  const rowIndexes = [...new Set(keyed.map((at) => at.row))].sort((a, b) => a - b);
  const rows = rowIndexes.map((row) => cols.map((col) => (answer[cellKey(row, col)] ?? "").trim())).filter((row) => row.some((cell) => cell.length > 0));
  return { headers: cols.map((col) => headings.get(col) ?? `Column ${col + 1}`), rows };
}

/** A record chosen from a record list, with the properties a linked cell can show. */
export interface LinkedRecord { name: string | null; code: string | null }
/** Whether a cell is a record-list choice that linked cells can follow. */
export const isRecordCell = (cell: CellConfig | undefined) => cell?.type === "select" && cell.dataSource === "async" && Boolean(cell.asyncSource);

/**
 * The answer after a record-list cell changed: the cell itself, then every linked cell in the same row that follows that
 * column, set from the chosen record (or cleared when the record is unknown or the choice was cleared).
 */
export function withLinkedValues(config: TableConfig, answer: TableAnswer, key: string, value: string, record: LinkedRecord | null): TableAnswer {
  const next: TableAnswer = { ...answer, [key]: value };
  const at = parseCellKey(key);
  if (!at || !isRecordCell(config.cellConfigs[key])) return next;
  for (let col = 0; col < config.cols; col++) {
    const cell = config.cellConfigs[cellKey(at.row, col)];
    if (cell?.type !== "linked" || cell.isMerged || cell.linkSource !== at.col) continue;
    next[cellKey(at.row, col)] = (value && record ? record[cell.linkProperty ?? "code"] : null)?.trim() ?? "";
  }
  return next;
}

/** The columns a linked cell at this position can follow: record-list cells in the same row. */
export function linkSourceColumns(config: TableConfig, key: string): number[] {
  const at = parseCellKey(key);
  if (!at) return [];
  return Array.from({ length: config.cols }, (_, col) => col).filter((col) => col !== at.col && isRecordCell(config.cellConfigs[cellKey(at.row, col)]));
}
