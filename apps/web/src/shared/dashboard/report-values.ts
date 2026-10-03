import { z } from "zod";

// Reports are read leniently: a missing or malformed figure counts as zero, a missing list as empty.
export const count = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
export const text = z.string().nullish().transform((value) => value?.trim() || null);
export const list = <T extends z.ZodType>(item: T) => z.array(item).nullish().transform((value) => value ?? []);
/** Parses a report, falling back to the parse of `empty` when the server sent an unexpected shape. */
export function readReport<T extends z.ZodType>(schema: T, data: unknown, empty: unknown): z.infer<T> { const parsed = schema.safeParse(data ?? empty); return parsed.success ? parsed.data : schema.parse(empty); }
export const sumOf = <T,>(items: readonly T[], pick: (item: T) => number) => items.reduce((total, item) => total + pick(item), 0);
export const averageOf = <T,>(items: readonly T[], pick: (item: T) => number) => items.length === 0 ? 0 : sumOf(items, pick) / items.length;
export const percentText = (value: number) => `${value.toFixed(1)}%`;
/** "3 departments", "1 department". */
export const plural = (amount: number, one: string, many = `${one}s`) => `${amount.toLocaleString()} ${amount === 1 ? one : many}`;
/** Numbers from a million upwards are shortened (1.2M); smaller ones are written out. */
export const compactNumber = (value: number) => Math.abs(value) >= 1_000_000 ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value) : value.toLocaleString();
