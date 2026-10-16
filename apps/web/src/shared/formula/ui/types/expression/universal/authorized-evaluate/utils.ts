// import { ColumnStats } from "./type";

import { ColumnStats } from "./types";

export const normalizeMathExpression = (value: string) =>
  value
    .replace(/\u2212/g, "-")
    .replace(/\u00d7/g, "*")
    .replace(/\u00f7/g, "/");

export const sanitizeForEval = (s: string) => {
  // Allow digits, whitespace, parentheses, decimal point, and +-*/ operators
  // Disallow any letters (should already be replaced)
  return /^[0-9eE+\-*/().\s]+$/.test(normalizeMathExpression(s));
};

export const countOccurrences = (expr: string, key: string) => {
  const re = new RegExp(`:${key}\\b`, "g");
  const m = expr.match(re);
  return m ? m.length : 0;
};

export const calculateStats = (values: number[]): ColumnStats => {
  if (values.length === 0) return { avg: null, sd: null, rsd: null };

  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

  if (values.length === 1) {
    return { avg, sd: 0, rsd: 0 };
  }

  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
    (values.length - 1);
  const sd = Math.sqrt(variance);
  const rsd = avg !== 0 ? (sd / Math.abs(avg)) * 100 : null;

  return { avg, sd, rsd };
};
