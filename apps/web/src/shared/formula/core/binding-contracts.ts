import type { CompiledFormulaDefinitionV1 } from "./compiled-definition";
import { FormulaDataType, FormulaScope, FormulaValueShape } from "./contracts";

export enum FormulaSourceType {
  LocalInput = 0,
  Constant = 1,
  LocalTableColumn = 2,
  LocalTableColumnStat = 3,
  QuestionValue = 4,
  QuestionTableColumn = 5,
  QuestionTableColumnStat = 6,
  ResponseContext = 7,
  FormulaResult = 8,
  Expression = 9,
}

export enum FormulaStatistic {
  Average = 0,
  SampleStandardDeviation = 1,
  PopulationStandardDeviation = 2,
  RelativeStandardDeviation = 3,
  Minimum = 4,
  Maximum = 5,
  Count = 6,
}

export interface FormulaSourceDependency {
  placementKey: string;
  resultKey: string;
}

export interface ResolvedFormulaSource {
  sourceType: FormulaSourceType;
  reference: string;
  dataType: FormulaDataType;
  valueShape: FormulaValueShape;
  scope: FormulaScope;
  unit: string | null;
  statistic?: FormulaStatistic;
  inputDecimalPlaces?: number;
  tableCalculationDecimalPlaces?: number;
  dependencies?: FormulaSourceDependency[];
}

export interface ResolvedFormulaVariableBinding {
  variableKey: string;
  source: ResolvedFormulaSource;
}

export interface ResolvedFormulaResultTarget {
  resultKey: string;
  targetKey: string;
  dataType: FormulaDataType;
  valueShape: FormulaValueShape;
  unit: string | null;
}

export interface FormulaDisplayPolicyV1 {
  policyVersion: "oryx-formula-display-v1";
  showResult: boolean;
  showUnit: boolean;
  showTrace: boolean;
}

export interface ResolvedFormulaPlacement {
  placementKey: string;
  definitionHash: string;
  definition: CompiledFormulaDefinitionV1;
  methodReference: string | null;
  displayPolicy: FormulaDisplayPolicyV1;
  bindings: ResolvedFormulaVariableBinding[];
  resultTargets: ResolvedFormulaResultTarget[];
}

export interface PlacementValidationOptions {
  requireMethodReference: (placementKey: string) => boolean;
  maxPlacements: number;
  maxDependencyEdges: number;
  maxPlacementKeyLength: number;
  maxBindingsPerPlacement: number;
  maxTargetsPerPlacement: number;
  maxReferenceLength: number;
  maxMethodReferenceLength: number;
}
