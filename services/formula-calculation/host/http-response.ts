import type { FormulaHostResponse } from "./contracts";

const headers = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
} as const;

export const jsonResponse = (
  status: number,
  value: object,
): FormulaHostResponse => ({ status, headers, body: JSON.stringify(value) });

export const errorResponse = (
  status: number,
  code: string,
): FormulaHostResponse =>
  jsonResponse(status, {
    schemaVersion: "oryx-formula-host-error-v1",
    code,
  });
