import type { FormulaInput } from "../input";
import type {
  FormulaCalculationServiceConfig,
  FormulaServiceResponseV1,
} from "../service";
import type { FormulaHostOperation } from "./contracts";

export interface FormulaWorkerData {
  serviceConfig: FormulaCalculationServiceConfig;
}

export interface FormulaWorkerRequest {
  id: number;
  operation: FormulaHostOperation;
  input: FormulaInput;
}

export interface FormulaWorkerResponse {
  id: number;
  response?: FormulaServiceResponseV1;
  failed?: true;
}
