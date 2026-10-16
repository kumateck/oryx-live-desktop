import { z } from "zod";

import {
  FORMULA_LANGUAGE_V1,
  type FormulaDefinitionV1,
  FormulaDataType,
  type FormulaIssue,
  FormulaIssueCode,
  FormulaIssueSeverity,
  type FormulaLimits,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaScope,
  FormulaValueShape,
} from "./contracts";
import {
  type CompileDefinitionResult,
  compileFormulaDefinitionV1,
} from "./definition";

const variableSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    dataType: z.literal(FormulaDataType.Decimal),
    valueShape: z.union([
      z.literal(FormulaValueShape.Scalar),
      z.literal(FormulaValueShape.TableColumn),
      z.literal(FormulaValueShape.Table),
    ]),
    scope: z.union([
      z.literal(FormulaScope.Placement),
      z.literal(FormulaScope.Form),
      z.literal(FormulaScope.ResponseContext),
    ]),
    unit: z.string().nullable(),
    required: z.boolean(),
    validation: z
      .object({
        minimum: z.string().optional(),
        maximum: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const resultSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    expression: z.string(),
    unit: z.string().nullable(),
    numericScale: z.union([
      z.literal(FormulaNumericScale.Absolute),
      z.literal(FormulaNumericScale.Ratio),
      z.literal(FormulaNumericScale.PercentagePoints),
    ]),
    rounding: z
      .object({
        kind: z.union([
          z.literal(FormulaRoundingKind.DecimalPlaces),
          z.literal(FormulaRoundingKind.SignificantFigures),
        ]),
        digits: z.number().int(),
      })
      .strict(),
  })
  .strict();

const derivedExpressionSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    expression: z.string(),
    unit: z.string().nullable(),
  })
  .strict();

export const formulaDefinitionV1Schema = z
  .object({
    formulaLanguageVersion: z.literal(FORMULA_LANGUAGE_V1),
    numericPolicyVersion: z.string(),
    precisionPolicy: z
      .object({
        inputDecimalPlaces: z.number().int().min(0).max(12),
        tableCalculationDecimalPlaces: z.number().int().min(0).max(12),
      })
      .strict()
      .optional(),
    worksheetPolicy: z
      .object({
        standardInTable: z.boolean(),
        preprocessor: z
          .object({
            definitionHash: z.string().regex(/^[a-f0-9]{64}$/),
            definition: z.unknown(),
            validationCaseHash: z.string().regex(/^[a-f0-9]{64}$/),
            configurationHash: z.string().regex(/^[a-f0-9]{64}$/),
            configuration: z.unknown(),
            inputs: z
              .array(
                z
                  .object({
                    variableKey: z.string(),
                    row: z.number().int().min(0),
                    column: z.number().int().min(0),
                  })
                  .strict(),
              )
              .max(200),
            outputs: z
              .array(
                z
                  .object({
                    resultKey: z.string(),
                    row: z.number().int().min(0),
                    column: z.number().int().min(0),
                  })
                  .strict(),
              )
              .max(20),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    variables: z.array(variableSchema),
    derivedExpressions: z.array(derivedExpressionSchema).optional(),
    results: z.array(resultSchema),
  })
  .strict();

const mapDecodeIssue = (item: z.core.$ZodIssue): FormulaIssue => ({
  code: FormulaIssueCode.InvalidDefinition,
  severity: FormulaIssueSeverity.Error,
  path: item.path.map(String).join("."),
  message: item.message,
});

export const decodeFormulaDefinitionV1 = (
  input: unknown,
  limits: FormulaLimits,
): CompileDefinitionResult => {
  const decoded = formulaDefinitionV1Schema.safeParse(input);
  if (!decoded.success) {
    return { ok: false, issues: decoded.error.issues.map(mapDecodeIssue) };
  }
  return compileFormulaDefinitionV1(
    decoded.data as FormulaDefinitionV1,
    limits,
  );
};
