import type { FormulaInput } from "../input";
import { z } from "zod";

import {
  FORMULA_LANGUAGE_V1,
  FORMULA_TEST_CASES_V1,
  FormulaEvaluationStatus,
  FormulaTestCategory,
} from "../../../apps/web/src/shared/formula/core";
import {
  FORMULA_EVALUATE_REQUEST_V1,
  FORMULA_VALIDATE_REQUEST_V1,
  type FormulaEvaluateRequestV1,
  type FormulaServiceRequestIssue,
  type FormulaValidateRequestV1,
} from "./contracts";

const HASH_PATTERN = /^[a-f0-9]{64}$/;
const POLICY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

const baseShape = {
  requestId: z.string().trim().min(1).max(120),
  formulaLanguageVersion: z.literal(FORMULA_LANGUAGE_V1),
  numericPolicyVersion: z.string().regex(POLICY_PATTERN),
  definitionHash: z.string().regex(HASH_PATTERN),
  definition: z
    .json()
    .refine((value) => value !== undefined, "Definition is required."),
};

const testCaseSchema = z
  .object({
    schemaVersion: z.literal(FORMULA_TEST_CASES_V1),
    id: z.string().trim().min(1).max(120),
    name: z.string().trim().min(1).max(250),
    category: z.nativeEnum(FormulaTestCategory),
    resolvedInputs: z.record(
      z.string().min(1).max(120),
      z.string().max(1_002).nullable(),
    ),
    expectedStatus: z.nativeEnum(FormulaEvaluationStatus),
    expectedResults: z.record(
      z.string().min(1).max(120),
      z.string().min(1).max(10_000),
    ),
  })
  .strict();

const mapIssues = (issues: z.core.$ZodIssue[]): FormulaServiceRequestIssue[] =>
  issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));

export type RequestDecodeResult<T> =
  | { ok: true; request: T }
  | { ok: false; issues: FormulaServiceRequestIssue[] };

export const decodeValidateRequestV1 = (
  input: FormulaInput,
): RequestDecodeResult<FormulaValidateRequestV1> => {
  const result = z
    .object({
      schemaVersion: z.literal(FORMULA_VALIDATE_REQUEST_V1),
      ...baseShape,
      testCases: z.array(testCaseSchema).max(50),
    })
    .strict()
    .safeParse(input);
  return result.success
    ? { ok: true, request: result.data }
    : { ok: false, issues: mapIssues(result.error.issues) };
};

export const decodeEvaluateRequestV1 = (
  input: FormulaInput,
  maxInputs: number,
  maxInputLength: number,
): RequestDecodeResult<FormulaEvaluateRequestV1> => {
  const result = z
    .object({
      schemaVersion: z.literal(FORMULA_EVALUATE_REQUEST_V1),
      ...baseShape,
      configurationHash: z.string().regex(HASH_PATTERN),
      configuration: z
        .json()
        .refine((value) => value !== undefined, "Configuration is required."),
      resolvedInputs: z.record(
        z.string().min(1).max(80),
        z.string().max(maxInputLength).nullable(),
      ),
    })
    .strict()
    .superRefine((request, context) => {
      if (Object.keys(request.resolvedInputs).length > maxInputs) {
        context.addIssue({
          code: "custom",
          path: ["resolvedInputs"],
          message: "Resolved input count exceeds the service limit.",
        });
      }
    })
    .safeParse(input);
  return result.success
    ? { ok: true, request: result.data }
    : { ok: false, issues: mapIssues(result.error.issues) };
};
