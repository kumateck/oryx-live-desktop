import type {
  FormulaSourceDependency,
  ResolvedFormulaPlacement,
  ResolvedFormulaSource,
} from "./binding-contracts";
import { sha256CanonicalJson } from "./canonical-json";

const compareAscii = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const dependencyProjection = (dependency: FormulaSourceDependency) => ({
  placementKey: dependency.placementKey,
  resultKey: dependency.resultKey,
});

const sourceProjection = (source: ResolvedFormulaSource) => ({
  sourceType: source.sourceType,
  reference: source.reference,
  dataType: source.dataType,
  valueShape: source.valueShape,
  scope: source.scope,
  unit: source.unit,
  ...(source.statistic === undefined ? {} : { statistic: source.statistic }),
  ...(source.inputDecimalPlaces === undefined
    ? {}
    : { inputDecimalPlaces: source.inputDecimalPlaces }),
  ...(source.tableCalculationDecimalPlaces === undefined
    ? {}
    : { tableCalculationDecimalPlaces: source.tableCalculationDecimalPlaces }),
  ...(source.dependencies === undefined
    ? {}
    : {
        dependencies: source.dependencies
          .map(dependencyProjection)
          .sort((left, right) => {
            const placementOrder = compareAscii(
              left.placementKey,
              right.placementKey,
            );
            return (
              placementOrder || compareAscii(left.resultKey, right.resultKey)
            );
          }),
      }),
});

export const toFormulaConfigurationProjection = (
  placement: ResolvedFormulaPlacement,
) => ({
  configurationVersion: "oryx-formula-configuration-v1",
  placementKey: placement.placementKey,
  definitionHash: placement.definitionHash,
  methodReference: placement.methodReference,
  displayPolicy: placement.displayPolicy,
  bindings: placement.bindings
    .map((binding) => ({
      variableKey: binding.variableKey,
      source: sourceProjection(binding.source),
    }))
    .sort((left, right) => compareAscii(left.variableKey, right.variableKey)),
  resultTargets: placement.resultTargets
    .map((target) => ({ ...target }))
    .sort((left, right) => compareAscii(left.resultKey, right.resultKey)),
});

export const hashResolvedFormulaConfiguration = (
  placement: ResolvedFormulaPlacement,
): Promise<string> =>
  sha256CanonicalJson(
    "oryx:formula-configuration:v1",
    toFormulaConfigurationProjection(placement),
  );
