import { z } from "zod";

import type {
  PlacementValidationOptions,
  ResolvedFormulaPlacement,
} from "./binding-contracts";
import { FormulaSourceType, FormulaStatistic } from "./binding-contracts";
import type { CompiledFormulaDefinitionV1 } from "./compiled-definition";
import {
  FormulaDataType,
  type FormulaIssue,
  FormulaIssueCode,
  FormulaIssueSeverity,
  FormulaScope,
  FormulaValueShape,
} from "./contracts";
import { validateResolvedFormulaPlacements } from "./placement-validation";

export type DecodePlacementsResult =
  | { ok: true; placements: ResolvedFormulaPlacement[] }
  | { ok: false; issues: FormulaIssue[] };

const dataTypeSchema = z.literal(FormulaDataType.Decimal);
const shapeSchema = z.union([
  z.literal(FormulaValueShape.Scalar),
  z.literal(FormulaValueShape.TableColumn),
  z.literal(FormulaValueShape.Table),
]);
const scopeSchema = z.union([
  z.literal(FormulaScope.Placement),
  z.literal(FormulaScope.Form),
  z.literal(FormulaScope.ResponseContext),
]);
const sourceTypeSchema = z.union([
  z.literal(FormulaSourceType.LocalInput),
  z.literal(FormulaSourceType.Constant),
  z.literal(FormulaSourceType.LocalTableColumn),
  z.literal(FormulaSourceType.LocalTableColumnStat),
  z.literal(FormulaSourceType.QuestionValue),
  z.literal(FormulaSourceType.QuestionTableColumn),
  z.literal(FormulaSourceType.QuestionTableColumnStat),
  z.literal(FormulaSourceType.ResponseContext),
  z.literal(FormulaSourceType.FormulaResult),
  z.literal(FormulaSourceType.Expression),
]);
const statisticSchema = z.union([
  z.literal(FormulaStatistic.Average),
  z.literal(FormulaStatistic.SampleStandardDeviation),
  z.literal(FormulaStatistic.PopulationStandardDeviation),
  z.literal(FormulaStatistic.RelativeStandardDeviation),
  z.literal(FormulaStatistic.Minimum),
  z.literal(FormulaStatistic.Maximum),
  z.literal(FormulaStatistic.Count),
]);

const placementSchema = (options: PlacementValidationOptions) => {
  const reference = z.string().max(options.maxReferenceLength);
  const dependency = z
    .object({ placementKey: reference, resultKey: reference })
    .strict();
  const source = z
    .object({
      sourceType: sourceTypeSchema,
      reference,
      dataType: dataTypeSchema,
      valueShape: shapeSchema,
      scope: scopeSchema,
      unit: reference.nullable(),
      statistic: statisticSchema.optional(),
      inputDecimalPlaces: z.number().int().min(0).max(12).optional(),
      tableCalculationDecimalPlaces: z.number().int().min(0).max(12).optional(),
      dependencies: z
        .array(dependency)
        .max(options.maxDependencyEdges)
        .optional(),
    })
    .strict();
  return z
    .object({
      placementKey: z.string().max(options.maxPlacementKeyLength),
      definitionHash: z.string().regex(/^[a-f0-9]{64}$/),
      methodReference: z
        .string()
        .max(options.maxMethodReferenceLength)
        .nullable(),
      displayPolicy: z
        .object({
          policyVersion: z.literal("oryx-formula-display-v1"),
          showResult: z.boolean(),
          showUnit: z.boolean(),
          showTrace: z.boolean(),
        })
        .strict(),
      bindings: z
        .array(z.object({ variableKey: reference, source }).strict())
        .max(options.maxBindingsPerPlacement),
      resultTargets: z
        .array(
          z
            .object({
              resultKey: reference,
              targetKey: reference,
              dataType: dataTypeSchema,
              valueShape: shapeSchema,
              unit: reference.nullable(),
            })
            .strict(),
        )
        .max(options.maxTargetsPerPlacement),
    })
    .strict();
};

const decodeError = (item: z.core.$ZodIssue): FormulaIssue => ({
  code: FormulaIssueCode.InvalidDefinition,
  severity: FormulaIssueSeverity.Error,
  path: item.path.map(String).join("."),
  message: item.message,
});

export const decodeResolvedFormulaPlacements = (
  input: unknown,
  definitionsByHash: ReadonlyMap<string, CompiledFormulaDefinitionV1>,
  options: PlacementValidationOptions,
): DecodePlacementsResult => {
  const decoded = z
    .array(placementSchema(options))
    .max(options.maxPlacements)
    .safeParse(input);
  if (!decoded.success) {
    return { ok: false, issues: decoded.error.issues.map(decodeError) };
  }
  const issues: FormulaIssue[] = [];
  const placements: ResolvedFormulaPlacement[] = [];
  decoded.data.forEach((item, index) => {
    const definition = definitionsByHash.get(item.definitionHash);
    if (!definition) {
      issues.push({
        code: FormulaIssueCode.UnknownDefinition,
        severity: FormulaIssueSeverity.Error,
        path: `placements[${index}].definitionHash`,
        message: "Definition hash is not available in the validated registry.",
      });
      return;
    }
    placements.push({ ...item, definition } as ResolvedFormulaPlacement);
  });
  if (issues.length > 0) return { ok: false, issues };
  issues.push(...validateResolvedFormulaPlacements(placements, options));
  return issues.length > 0 ? { ok: false, issues } : { ok: true, placements };
};
