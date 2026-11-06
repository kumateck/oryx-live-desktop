import type { FormulaInput } from "../input";
import type { FormulaServiceResponseV1 } from "../service";

export enum FormulaHostOperation {
  Validate = 0,
  Evaluate = 1,
}

export interface FormulaHostRequest {
  method: string;
  path: string;
  authorization: string | undefined;
  contentType: string | undefined;
  body: Uint8Array;
}

export interface FormulaHostResponse {
  status: number;
  headers: Readonly<Record<string, string>>;
  body: string;
}

export interface FormulaHostExecutor {
  execute(
    operation: FormulaHostOperation,
    input: FormulaInput,
    signal: AbortSignal,
  ): Promise<FormulaServiceResponseV1>;
  isReady(): boolean;
  metrics(): { active: number; capacity: number };
  close(): Promise<void>;
}

export interface FormulaHostAuditEvent {
  method: string;
  path: string;
  httpStatus: number;
  durationMs: number;
  requestId: string | null;
  serviceStatus: string | null;
  engineBuildHash: string | null;
}
